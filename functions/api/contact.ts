/**
 * Cloudflare Pages Function: POST /api/contact
 *
 * Secrets (Cloudflare dashboard → Settings → Variables and Secrets, or .dev.vars locally):
 *   RESEND_API_KEY  – Resend API key
 *   TO_EMAIL        – inbox that receives form submissions
 *   FROM_EMAIL      – optional; defaults to Resend test sender
 *
 * Body JSON: { name, subject, message, replyTo? }
 * Response:  { ok: true } | { ok: false, error: string }
 */

interface Env {
  RESEND_API_KEY: string;
  TO_EMAIL: string;
  FROM_EMAIL?: string;
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

const DEFAULT_FROM = "Portfolio Contact <onboarding@resend.dev>";

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
  // Practical check; not full RFC compliance.
  if (email.length > LIMITS.replyTo) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Strip CR/LF so name/subject cannot inject extra email headers. */
function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
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
    name: sanitizeHeader(name),
    subject: sanitizeHeader(subject),
    message,
    replyTo,
  };
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { env, request } = context;

  if (!env.RESEND_API_KEY || !env.TO_EMAIL) {
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

  const { name, subject, message, replyTo } = parsed;
  const from = (env.FROM_EMAIL && env.FROM_EMAIL.trim()) || DEFAULT_FROM;

  const textLines = [
    `Name: ${name}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${subject}`,
    "",
    message,
  ].filter((line): line is string => line !== null);

  const payload: Record<string, unknown> = {
    from,
    to: [env.TO_EMAIL],
    subject: `[Portfolio] ${subject}`,
    text: textLines.join("\n"),
  };
  if (replyTo) {
    payload.reply_to = replyTo;
  }

  let resendRes: Response;
  try {
    resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return json(
      { ok: false, error: "Failed to reach email provider." },
      502,
    );
  }

  if (!resendRes.ok) {
    // Do not forward provider error bodies (may leak config).
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
