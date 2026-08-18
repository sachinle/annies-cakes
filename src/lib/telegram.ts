import "server-only";

// Telegram bot integration.
//
// Two directions:
//   * push  — a new order arrives, the bot messages the owner
//   * pull  — the owner taps a button, Telegram calls our webhook
//
// Access is restricted to chat IDs listed in TELEGRAM_ALLOWED_CHAT_IDS.
// A Telegram bot will happily talk to anyone who finds its @username,
// so without that allowlist a stranger could read every order and
// change its status. The allowlist is checked on every single update,
// not just the first.
//
// Nothing here throws. A messaging failure must never stop an order
// being saved.

const API = "https://api.telegram.org/bot";

function token(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

/** Chat IDs permitted to use the bot. Everyone else is ignored. */
export function allowedChatIds(): string[] {
  return (process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAllowedChat(chatId: number | string): boolean {
  const allowed = allowedChatIds();
  // Fail closed: no allowlist configured means the bot answers nobody.
  if (allowed.length === 0) return false;
  return allowed.includes(String(chatId));
}

async function call(method: string, body: unknown): Promise<boolean> {
  const t = token();
  if (!t) return false;

  try {
    const res = await fetch(`${API}${t}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // Telegram is a side channel; don't let it hang a request.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[telegram] ${method} failed:`, res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[telegram] ${method} error:`, err);
    return false;
  }
}

// Telegram's MarkdownV2 needs a lot of characters escaped, and an
// unescaped one makes the whole message fail to send. HTML mode only
// needs three, so we use that.
export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type OrderForTelegram = {
  id: string;
  orderNo: string;
  contactName: string;
  contactPhone: string;
  status: string;
  fulfillmentType: string;
  preferredDate: string | null;
  preferredTime: string | null;
  estimatedTotal: number | null;
  specialInstructions: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  items: Array<{
    name: string;
    variantLabel: string | null;
    quantity: number;
    colour: string | null;
    cakeMessage: string | null;
  }>;
};

const STATUS_LABEL: Record<string, string> = {
  received: "Request received",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * Digits-only phone number with country code, for wa.me links.
 *
 * Customers type their number every which way — "98765 43210",
 * "+91 98765-43210", "098765 43210". WhatsApp needs bare digits with
 * the country code, so a plain number gets India's 91 prefixed and a
 * leading trunk 0 is dropped.
 */
function waNumber(raw: string): string | null {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  // Below 11 digits it can't carry a country code, so we'd be guessing.
  return d.length >= 11 && d.length <= 15 ? d : null;
}

/** Plain +number, which Telegram auto-links into a tap-to-call. */
function dialable(raw: string): string {
  const d = waNumber(raw);
  return d ? `+${d}` : String(raw ?? "");
}

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export function formatOrder(o: OrderForTelegram): string {
  const lines = o.items
    .map((i) => {
      const bits = [i.variantLabel, i.colour].filter(Boolean).join(", ");
      const msg = i.cakeMessage ? `\n     ✍️ “${esc(i.cakeMessage)}”` : "";
      return `  • <b>${i.quantity} ×</b> ${esc(i.name)}${bits ? ` <i>(${esc(bits)})</i>` : ""}${msg}`;
    })
    .join("\n");

  const when = [
    o.preferredDate
      ? new Date(o.preferredDate).toLocaleDateString("en-IN", {
          weekday: "short", day: "numeric", month: "short",
        })
      : null,
    o.preferredTime,
  ].filter(Boolean).join(" · ");

  return [
    `🎂 <b>${esc(o.orderNo)}</b> — ${esc(STATUS_LABEL[o.status] ?? o.status)}`,
    ``,
    lines,
    ``,
    o.estimatedTotal != null ? `💰 <b>${money(Number(o.estimatedTotal))}</b>` : null,
    // Left as plain text on purpose: Telegram auto-links a +number into
    // a tap-to-call. Wrapping it in <code> would make it copyable but
    // kill the link, and calling is the more common need.
    `👤 ${esc(o.contactName)} — ${esc(dialable(o.contactPhone))}`,
    `📦 ${o.fulfillmentType === "delivery" ? "Delivery" : "Pickup"}${when ? ` · ${esc(when)}` : ""}`,
    o.address ? `📍 ${esc(o.address)}` : null,
    o.specialInstructions ? `📝 ${esc(o.specialInstructions)}` : null,
  ].filter((l) => l !== null).join("\n");
}

/** Action buttons. The current status is omitted — no point offering it. */
export function orderKeyboard(o: OrderForTelegram) {
  const billingUrl = process.env.LEO_BILLING_URL || "";

  const step = (label: string, status: string) =>
    o.status === status
      ? null
      : { text: label, callback_data: `s:${o.id}:${status}` };

  const rows = [
    [step("✅ Confirm", "confirmed"), step("👩‍🍳 Preparing", "preparing")],
    [step("🎂 Ready", "ready"), step("🏁 Completed", "completed")],
    [step("❌ Cancel", "cancelled")],
  ]
    .map((row) => row.filter((b) => b !== null))
    .filter((row) => row.length > 0);

  // One tap to the customer. Telegram inline buttons only accept http(s)
  // and tg:// URLs — a tel: link is rejected outright and the whole
  // keyboard fails to send — so calling is handled by the auto-linked
  // number in the message body instead, and the button does WhatsApp.
  const wa = waNumber(o.contactPhone);
  if (wa) {
    const greeting =
      `Hi ${o.contactName.split(" ")[0]}, this is Annie's Homemade Cakes ` +
      `about your order ${o.orderNo}.`;
    rows.push([{
      text: `💬 WhatsApp ${o.contactName.split(" ")[0]}`,
      url: `https://wa.me/${wa}?text=${encodeURIComponent(greeting)}`,
    } as never]);
  }

  if (o.latitude && o.longitude) {
    rows.push([{
      text: "🗺 Open location",
      url: `https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`,
    } as never]);
  }

  if (billingUrl) {
    rows.push([{
      text: "🧾 Make bill in Leo Billing",
      url: `${billingUrl.replace(/\/$/, "")}/website`,
    } as never]);
  }

  return { inline_keyboard: rows };
}

/** Announce a new order to every allowed chat. Never throws. */
export async function pushNewOrder(o: OrderForTelegram): Promise<boolean> {
  const chats = allowedChatIds();
  if (chats.length === 0 || !token()) return false;

  const text = `🔔 <b>New order</b>\n\n${formatOrder(o)}`;

  const results = await Promise.allSettled(
    chats.map((chat_id) =>
      call("sendMessage", {
        chat_id,
        text,
        parse_mode: "HTML",
        reply_markup: orderKeyboard(o),
      })
    )
  );

  return results.some((r) => r.status === "fulfilled" && r.value);
}

export async function sendMessage(chatId: string | number, text: string, keyboard?: unknown) {
  return call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

export async function editMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  keyboard?: unknown
) {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

/** Clears the spinner on a tapped inline button. */
export async function answerCallback(id: string, text?: string) {
  return call("answerCallbackQuery", { callback_query_id: id, text: text ?? "" });
}
