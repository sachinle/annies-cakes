#!/usr/bin/env node
/**
 * Register (or remove) the Telegram webhook.
 *
 *   node scripts/telegram-setup.mjs                 # uses NEXT_PUBLIC_SITE_URL
 *   node scripts/telegram-setup.mjs https://xyz.app # explicit base URL
 *   node scripts/telegram-setup.mjs --info          # what is registered now
 *   node scripts/telegram-setup.mjs --delete        # unregister
 *   node scripts/telegram-setup.mjs --chats         # find your chat ID
 *
 * Telegram will only deliver updates to an HTTPS URL, so this cannot
 * point at localhost. For local testing, run a tunnel (ngrok, cloudflared)
 * and pass the tunnel URL.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Read .env.local directly — this is a standalone script, not Next.js.
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const value = m[2].replace(/^["']|["']$/g, "");
        if (!(m[1] in process.env)) process.env[m[1]] = value;
      }
    } catch {
      // Missing file is fine; the var may come from the real environment.
    }
  }
}

loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

if (!token) {
  console.error("✗ TELEGRAM_BOT_TOKEN is not set (check .env.local)");
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json());

const arg = process.argv[2];

if (arg === "--chats") {
  // getUpdates is the queue Telegram keeps when no webhook is set. Send
  // the bot a message first, then this reads it back and shows who sent
  // it. Works before anything is deployed, which is the point — the
  // in-bot /id command needs a live webhook, and this doesn't.
  const res = await api("getUpdates", { timeout: 0 });

  if (!res.ok) {
    console.error(`✗ ${res.description}`);
    process.exit(1);
  }

  const seen = new Map();
  for (const u of res.result) {
    const m = u.message ?? u.edited_message ?? u.callback_query?.message;
    if (!m?.chat) continue;
    const c = m.chat;
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ") ||
      c.title || c.username || "(no name)";
    seen.set(c.id, `${name}${c.username ? ` (@${c.username})` : ""} — ${c.type}`);
  }

  if (seen.size === 0) {
    const me = await api("getMe");
    console.log("No messages yet.");
    console.log("");
    console.log(`1. Open Telegram and find @${me.result?.username ?? "your bot"}`);
    console.log("2. Send it any message (tap Start, or type hello)");
    console.log("3. Run this again");
    console.log("");
    console.log("Note: this only works while no webhook is registered.");
    console.log("If you already registered one, run --delete first.");
    process.exit(0);
  }

  console.log("Chats that have messaged this bot:");
  console.log("");
  for (const [id, who] of seen) console.log(`  ${id}   ${who}`);
  console.log("");
  console.log("Put the ID(s) in .env.local, comma-separated for more than one:");
  console.log(`  TELEGRAM_ALLOWED_CHAT_IDS=${[...seen.keys()].join(",")}`);
  process.exit(0);
}

if (arg === "--info") {
  const info = await api("getWebhookInfo");
  console.log(JSON.stringify(info.result ?? info, null, 2));
  process.exit(0);
}

if (arg === "--delete") {
  const res = await api("deleteWebhook", { drop_pending_updates: true });
  console.log(res.ok ? "✓ Webhook removed" : `✗ ${res.description}`);
  process.exit(res.ok ? 0 : 1);
}

if (!secret) {
  console.error("✗ TELEGRAM_WEBHOOK_SECRET is not set.");
  console.error("  Generate one:  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
  process.exit(1);
}

const base = (arg || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

if (!base.startsWith("https://")) {
  console.error(`✗ Need an https:// base URL, got: ${base || "(empty)"}`);
  console.error("  Pass it explicitly:  node scripts/telegram-setup.mjs https://your-site.vercel.app");
  process.exit(1);
}

const url = `${base}/api/telegram/webhook`;

const res = await api("setWebhook", {
  url,
  secret_token: secret,
  // We only handle these two; not receiving the rest keeps the endpoint quiet.
  allowed_updates: ["message", "callback_query"],
  drop_pending_updates: true,
});

if (!res.ok) {
  console.error(`✗ ${res.description}`);
  process.exit(1);
}

const me = await api("getMe");
console.log(`✓ Webhook set for @${me.result?.username ?? "bot"}`);
console.log(`  ${url}`);

const allowed = (process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? "").split(",").filter(Boolean);
if (allowed.length === 0) {
  console.log("");
  console.log("⚠ TELEGRAM_ALLOWED_CHAT_IDS is empty, so the bot will answer nobody.");
  console.log("  Send /id to the bot, then put the number it replies with into that variable.");
} else {
  console.log(`  ${allowed.length} chat ID(s) allowed`);
}
