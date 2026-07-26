/**
 * Cloudflare Pages Function: POST /api/contact
 *
 * Delivers form submissions as a Telegram message (no Resend / Gmail SMTP).
 *
 * Secrets (Cloudflare dashboard → project → Settings → Variables and Secrets,
 * or local .dev.vars):
 *   TELEGRAM_BOT_TOKEN  – from @BotFather
 *   TELEGRAM_CHAT_ID    – your chat id (user or group)
 *
 * Body JSON: { name, subject, message, replyTo? }
 * Response:  { ok: true } | { ok: false, error: string }
 *
 * Why Telegram (not personal Gmail from Workers)?
 * Workers cannot open raw SMTP. Gmail needs OAuth/App Passwords + a relay.
 * Telegram is a single HTTPS call — simple and free on Pages Functions.
 */

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
}

interface ContactBody {
  name?: unknown;
  subject?: unknown;
  message?: unknown;
  replyTo?: unknown;
}

const LIMITS = {
  name: 100,
  subject: 200,
  message: 5000,
  replyTo: 254,
} as const;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim();
}

function isValidEmail(email: string): boolean {
  if (email.length > LIMITS.replyTo) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Strip CR/LF so fields cannot inject weird multi-line control chars. */
function sanitizeOneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

/** Escape text for Telegram HTML parse mode. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function validate(body: ContactBody):
  | { ok: true; name: string; subject: string; message: string; replyTo?: string }
  | { ok: false; error: string } {
  const name = asTrimmedString(body.name);
  const subject = asTrimmedString(body.subject);
  const message = asTrimmedString(body.message);
  const replyToRaw = asTrimmedString(body.replyTo);

  if (!name) return { ok: false, error: "Name is required." };
  if (!subject) return { ok: false, error: "Subject is required." };
  if (!message) return { ok: false, error: "Message is required." };

  if (name.length > LIMITS.name) {
    return { ok: false, error: `Name must be at most ${LIMITS.name} characters.` };
  }
  if (subject.length > LIMITS.subject) {
    return {
      ok: false,
      error: `Subject must be at most ${LIMITS.subject} characters.`,
    };
  }
  if (message.length > LIMITS.message) {
    return {
      ok: false,
      error: `Message must be at most ${LIMITS.message} characters.`,
    };
  }

  let replyTo: string | undefined;
  if (replyToRaw) {
    if (!isValidEmail(replyToRaw)) {
      return { ok: false, error: "Reply-to email looks invalid." };
    }
    replyTo = replyToRaw;
  }

  return {
    ok: true,
    name: sanitizeOneLine(name),
    subject: sanitizeOneLine(subject),
    message,
    replyTo,
  };
}

function formatTelegramHtml(fields: {
  name: string;
  subject: string;
  message: string;
  replyTo?: string;
}): string {
  const lines = [
    "<b>Portfolio contact</b>",
    "",
    `<b>Name:</b> ${escapeHtml(fields.name)}`,
    fields.replyTo
      ? `<b>Reply-to:</b> ${escapeHtml(fields.replyTo)}`
      : null,
    `<b>Subject:</b> ${escapeHtml(fields.subject)}`,
    "",
    escapeHtml(fields.message),
  ].filter((line): line is string => line !== null);
  return lines.join("\n");
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { env, request } = context;

  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return json(
      { ok: false, error: "Contact service is not configured." },
      503,
    );
  }

  let body: ContactBody;
  try {
    body = (await request.json()) as ContactBody;
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const parsed = validate(body);
  if (!parsed.ok) {
    return json({ ok: false, error: parsed.error }, 400);
  }

  const text = formatTelegramHtml(parsed);
  const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;

  let tgRes: Response;
  try {
    tgRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    return json(
      { ok: false, error: "Failed to reach notification service." },
      502,
    );
  }

  if (!tgRes.ok) {
    // Do not forward Telegram error bodies (may leak config).
    return json(
      { ok: false, error: "Could not send message. Try again later." },
      502,
    );
  }

  let tgJson: { ok?: boolean } = {};
  try {
    tgJson = (await tgRes.json()) as { ok?: boolean };
  } catch {
    /* ignore */
  }
  if (tgJson.ok === false) {
    return json(
      { ok: false, error: "Could not send message. Try again later." },
      502,
    );
  }

  return json({ ok: true });
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  if (context.request.method === "POST") {
    return onRequestPost(context);
  }
  return json({ ok: false, error: "Method not allowed." }, 405);
}
