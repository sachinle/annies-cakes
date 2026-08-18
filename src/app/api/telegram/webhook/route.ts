import { timingSafeEqual } from "node:crypto";
import {
  answerCallback,
  editMessage,
  formatOrder,
  allowedChatIds,
  isAllowedChat,
  orderKeyboard,
  sendMessage,
  esc,
} from "@/lib/telegram";
import {
  getOpenOrders,
  getOrderByNo,
  getOrderForBot,
  getOrdersForDate,
  setOrderStatus,
} from "@/lib/order-admin";

// Telegram webhook.
//
// Category: ADMIN (owner-only, called by Telegram's servers).
//   auth   — shared secret in X-Telegram-Bot-Api-Secret-Token, set when
//            the webhook is registered. Telegram sends it on every
//            request; nobody else knows it.
//   authz  — the chat ID must be in TELEGRAM_ALLOWED_CHAT_IDS.
//   errors — always 200 to Telegram, so a rejected update is not retried
//            forever, and nothing about why is echoed back.
//
// Both checks matter. The secret stops anyone POSTing forged updates to
// this URL; the allowlist stops a real Telegram user who found the bot
// from driving it. Either alone would be a hole.

export const runtime = "nodejs";
// Order state must be read fresh on every tap.
export const dynamic = "force-dynamic";

function secretMatches(received: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  // Fail closed: an unconfigured secret disables the webhook rather
  // than leaving it open.
  if (!expected || !received) return false;

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Telegram retries any non-2xx, so even refusals answer 200.
const done = () => new Response("ok", { status: 200 });

/**
 * Configuration check, so a misconfigured deployment is visible instead
 * of silent. Telegram only ever POSTs here; a GET is a human debugging.
 *
 * Deliberately booleans only — never the token, the secret, or the chat
 * IDs. Knowing that a bot exists and is configured gets an attacker
 * nowhere without the secret, but a leaked secret would let them drive
 * the whole thing.
 */
export async function GET() {
  const allowed = allowedChatIds();
  const ready =
    Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()) &&
    Boolean(process.env.TELEGRAM_WEBHOOK_SECRET?.trim()) &&
    allowed.length > 0;

  return Response.json({
    ready,
    botToken: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
    webhookSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET?.trim()),
    allowedChatCount: allowed.length,
    billingLink: Boolean(process.env.LEO_BILLING_URL),
    hint: ready
      ? "Environment looks complete. If buttons still spin, the webhook URL is not registered — run scripts/telegram-setup.mjs."
      : "Set the missing variables in your hosting environment, then redeploy.",
  });
}

export async function POST(req: Request) {
  if (!secretMatches(req.headers.get("x-telegram-bot-api-secret-token"))) {
    return done();
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return done();
  }

  try {
    if (update.callback_query) await handleCallback(update.callback_query);
    else if (update.message?.text) await handleCommand(update.message);
  } catch (err) {
    console.error("[telegram/webhook]", err);
  }

  return done();
}

// ── Button taps ───────────────────────────────────────────────

async function handleCallback(cq: CallbackQuery) {
  const chatId = cq.message?.chat?.id;
  if (chatId == null || !isAllowedChat(chatId)) {
    await answerCallback(cq.id, "Not authorised.");
    return;
  }

  const [kind, orderId, status] = (cq.data ?? "").split(":");
  if (kind !== "s" || !orderId || !status) {
    await answerCallback(cq.id);
    return;
  }

  const result = await setOrderStatus(orderId, status);
  if (!result.ok) {
    await answerCallback(cq.id, result.reason);
    return;
  }

  await answerCallback(
    cq.id,
    result.emailed ? `${result.orderNo} updated · customer emailed` : `${result.orderNo} updated`
  );

  // Rewrite the original message so the card always shows the truth,
  // rather than leaving a stale status sitting in the chat history.
  const fresh = await getOrderForBot(orderId);
  if (fresh && cq.message) {
    const note = result.emailed ? "\n\n<i>Customer notified by email.</i>" : "";
    await editMessage(
      chatId,
      cq.message.message_id,
      formatOrder(fresh) + note,
      orderKeyboard(fresh)
    );
  }
}

// ── Commands ──────────────────────────────────────────────────

const HELP = [
  "<b>Annie's order bot</b>",
  "",
  "/orders — orders still open",
  "/today — due today",
  "/tomorrow — due tomorrow",
  "/order AC1001 — look up one order",
  "/id — show this chat's ID",
  "",
  "Tap the buttons on an order to change its status. The customer is emailed automatically.",
].join("\n");

// Days are interpreted in IST, which is where the kitchen is. Using the
// server's clock would put "today" on the wrong date for most of the
// evening, since Vercel runs in UTC.
function istDate(offsetDays = 0): string {
  const now = new Date(Date.now() + 5.5 * 3600 * 1000 + offsetDays * 86400 * 1000);
  return now.toISOString().slice(0, 10);
}

async function handleCommand(msg: Message) {
  const chatId = msg.chat.id;
  const text = (msg.text ?? "").trim();
  // Group chats address bots as /command@botname.
  const [rawCmd, ...args] = text.split(/\s+/);
  const cmd = rawCmd.split("@")[0].toLowerCase();

  // /id is answered for anyone, because it is how you find the number
  // to put in the allowlist in the first place. It reveals only the
  // caller's own chat ID — something they can already look up — and no
  // business data.
  if (cmd === "/id") {
    await sendMessage(
      chatId,
      `Chat ID: <code>${chatId}</code>\n\nAdd it to <code>TELEGRAM_ALLOWED_CHAT_IDS</code> to use this bot.`
    );
    return;
  }

  if (!isAllowedChat(chatId)) {
    await sendMessage(
      chatId,
      "This bot is private. Ask Annie's to add you.\n\nSend /id to see your chat ID."
    );
    return;
  }

  switch (cmd) {
    case "/start":
    case "/help":
      await sendMessage(chatId, HELP);
      return;

    case "/orders":
      await sendList(chatId, await getOpenOrders(), "No open orders right now. 🎉");
      return;

    case "/today":
      await sendList(chatId, await getOrdersForDate(istDate(0)), "Nothing due today.");
      return;

    case "/tomorrow":
      await sendList(chatId, await getOrdersForDate(istDate(1)), "Nothing due tomorrow.");
      return;

    case "/order": {
      const no = args[0];
      if (!no) {
        await sendMessage(chatId, "Which order? Example: <code>/order AC1001</code>");
        return;
      }
      const order = await getOrderByNo(no);
      if (!order) {
        await sendMessage(chatId, `No order called <b>${esc(no)}</b>.`);
        return;
      }
      await sendMessage(chatId, formatOrder(order), orderKeyboard(order));
      return;
    }

    default:
      await sendMessage(chatId, HELP);
  }
}

// Each order goes out as its own message so it carries its own buttons.
async function sendList(
  chatId: number,
  orders: Awaited<ReturnType<typeof getOpenOrders>>,
  emptyText: string
) {
  if (orders.length === 0) {
    await sendMessage(chatId, emptyText);
    return;
  }
  for (const o of orders) {
    await sendMessage(chatId, formatOrder(o), orderKeyboard(o));
  }
}

// ── Telegram payload shapes (only the fields we use) ──────────

type Chat = { id: number };
type Message = { message_id: number; chat: Chat; text?: string };
type CallbackQuery = { id: string; data?: string; message?: Message };
type TelegramUpdate = { message?: Message; callback_query?: CallbackQuery };
