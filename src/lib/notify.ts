import "server-only";
import nodemailer from "nodemailer";

// Order notifications by email, over Gmail SMTP.
//
// Gmail allows ~500 messages a day on a normal account, which is far
// more than this business will send, and costs nothing.
//
// Requires an App Password, not the account password: Google Account →
// Security → 2-Step Verification (must be on) → App passwords. The
// password lives only in .env.local and is read here on the server —
// it is never sent to the browser.
//
// Every function here is deliberately failure-tolerant. A notification
// is a side effect of an order, never a precondition for one: if Gmail
// is down or the credentials are wrong, the order must still be saved
// and the customer must still see their confirmation.

type OrderEmailData = {
  orderNo: string;
  productName: string;
  variantLabel: string | null;
  quantity: number;
  estimatedTotal: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fulfillmentType: string;
  preferredDate: string;
  preferredTime: string | null;
  cakeMessage: string | null;
  specialInstructions: string | null;
  address: string | null;
  mapsLink: string | null;
};

function getTransport() {
  const user = process.env.SMTP_USER;
  // Google shows app passwords as four groups of four ("abcd efgh ijkl
  // mnop"), so that's how they get pasted — but the spaces are display
  // formatting and Gmail expects the bare 16 characters. Stripping
  // whitespace here means it works however it was copied.
  const pass = process.env.SMTP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );

/**
 * Tell the owner a new order has come in.
 * Returns true on success; never throws.
 */
export async function sendNewOrderEmail(data: OrderEmailData): Promise<boolean> {
  const transport = getTransport();
  const to = process.env.NOTIFY_EMAIL_TO || process.env.SMTP_USER;

  if (!transport || !to) {
    // Not configured yet — that's a valid state, not an error.
    return false;
  }

  const rows: Array<[string, string | null]> = [
    ["Order", data.orderNo],
    ["Cake", `${data.productName}${data.variantLabel ? ` (${data.variantLabel})` : ""}`],
    ["Quantity", String(data.quantity)],
    ["Estimated total", money(data.estimatedTotal)],
    ["Customer", data.customerName],
    ["Phone", data.customerPhone],
    ["Email", data.customerEmail],
    ["Collection", data.fulfillmentType === "delivery" ? "Delivery" : "Pickup"],
    ["Needed by", `${data.preferredDate}${data.preferredTime ? ` · ${data.preferredTime}` : ""}`],
    ["Message on cake", data.cakeMessage],
    ["Notes", data.specialInstructions],
    ["Address", data.address],
  ];

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px">
      <h2 style="margin:0 0 4px">New cake order</h2>
      <p style="margin:0 0 20px;color:#666">${escapeHtml(data.orderNo)} — please confirm with the customer.</p>
      <table style="border-collapse:collapse;width:100%">
        ${rows
          .filter(([, v]) => v)
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:8px 12px 8px 0;color:#666;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>
            <td style="padding:8px 0;font-weight:500">${escapeHtml(String(value))}</td>
          </tr>`
          )
          .join("")}
      </table>
      ${
        data.mapsLink
          ? `<p style="margin:20px 0 0"><a href="${data.mapsLink}" style="color:#b0532e">Open exact delivery location →</a></p>`
          : ""
      }
      <p style="margin:24px 0 0;color:#666;font-size:13px">
        Open Leo Billing → Website → Orders to confirm and raise the bill.
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: `"Annie's Homemade Cakes" <${process.env.SMTP_USER}>`,
      to,
      // So replying goes to the customer, not to yourself.
      replyTo: data.customerEmail ?? undefined,
      subject: `New order ${data.orderNo} — ${data.productName}`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[notify] owner email failed:", err);
    return false;
  }
}

// What the customer is told at each stage. Statuses not listed here
// (received, out_for_delivery) don't trigger a mail — "received" is
// already covered by the confirmation email, and nobody needs an alert
// for every internal step. Over-emailing gets you marked as spam.
const STATUS_EMAILS: Record<
  string,
  { subject: string; heading: string; body: string }
> = {
  confirmed: {
    subject: "Your order is confirmed",
    heading: "We've confirmed your order",
    body: "Everything's agreed and we've got it in the diary. We'll start baking closer to your date so it's as fresh as possible.",
  },
  ready: {
    subject: "Your cake is ready",
    heading: "Your cake is ready",
    body: "It's baked, decorated, and waiting for you. If you're collecting, come by whenever suits — if we're delivering, we'll be in touch about timing.",
  },
  completed: {
    subject: "Thank you from Annie's Cakes",
    heading: "Hope it was lovely",
    body: "Thanks for ordering with us. If the cake made someone's day, we'd really appreciate a quick review — it genuinely helps a small home bakery.",
  },
  cancelled: {
    subject: "Your order has been cancelled",
    heading: "Your order has been cancelled",
    body: "If that's unexpected, please get in touch and we'll sort it out.",
  },
};

/**
 * Tell the customer their order has moved on.
 * Returns false when the status has no customer-facing mail, or when
 * email isn't configured. Never throws.
 */
export async function sendOrderStatusEmail(params: {
  status: string;
  orderNo: string;
  productName: string;
  customerName: string;
  customerEmail: string | null;
  reviewUrl?: string;
}): Promise<boolean> {
  const copy = STATUS_EMAILS[params.status];
  const transport = getTransport();
  if (!copy || !transport || !params.customerEmail) return false;

  const showReview = params.status === "completed" && params.reviewUrl;

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px">
      <h2 style="margin:0 0 4px">${escapeHtml(copy.heading)}</h2>
      <p style="margin:0 0 20px;color:#666">
        Order <strong>${escapeHtml(params.orderNo)}</strong> — ${escapeHtml(params.productName)}
      </p>
      <p>Hi ${escapeHtml(params.customerName)},</p>
      <p>${escapeHtml(copy.body)}</p>
      ${
        showReview
          ? `<p style="margin:24px 0">
               <a href="${params.reviewUrl}"
                  style="display:inline-block;background:#e05c78;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">
                 Leave a review
               </a>
             </p>`
          : ""
      }
      <p style="margin-top:24px;color:#666;font-size:13px">
        Annie's Homemade Cakes
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: `"Annie's Homemade Cakes" <${process.env.SMTP_USER}>`,
      to: params.customerEmail,
      subject: `${copy.subject} — ${params.orderNo}`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[notify] status email failed:", err);
    return false;
  }
}

/** Confirmation to the customer. Also never throws. */
export async function sendOrderConfirmationEmail(
  data: OrderEmailData
): Promise<boolean> {
  const transport = getTransport();
  if (!transport || !data.customerEmail) return false;

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px">
      <h2 style="margin:0 0 4px">Thanks — we've got your request</h2>
      <p style="margin:0 0 20px;color:#666">
        Order <strong>${escapeHtml(data.orderNo)}</strong>
      </p>
      <p>Hi ${escapeHtml(data.customerName)},</p>
      <p>
        We've received your request for
        <strong>${escapeHtml(data.productName)}</strong>${
          data.variantLabel ? ` (${escapeHtml(data.variantLabel)})` : ""
        } for ${escapeHtml(data.preferredDate)}.
      </p>
      <p>
        We'll call or message you shortly to confirm the details.
        <strong>Nothing is charged until we've both agreed on everything.</strong>
      </p>
      <p style="color:#666;font-size:13px;margin-top:24px">
        Estimated total: ${money(data.estimatedTotal)} — the final price may
        change with delivery or custom decoration.
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from: `"Annie's Homemade Cakes" <${process.env.SMTP_USER}>`,
      to: data.customerEmail,
      subject: `We've got your order ${data.orderNo}`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[notify] customer email failed:", err);
    return false;
  }
}
