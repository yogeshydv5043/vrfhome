const MAX_BODY_BYTES = 8192;
const FIELD_RULES = {
  name: { min: 3, max: 30 },
  comment: { min: 10, max: 3000 },
  location: { min: 10, max: 40 },
} as const;
const MAX_REVIEW_WORDS = 50;
const DEVICE_TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000;

type ReviewInput = {
  name: string;
  rating: number;
  comment: string;
  location: string;
  turnstileToken: string;
};
type FieldErrors = Record<string, string>;

type Runtime = {
  env: (name: string) => string | undefined;
  fetch: typeof fetch;
  now: () => number;
};

const runtime: Runtime = {
  env: (name) => Deno.env.get(name),
  fetch: (...args) => fetch(...args),
  now: () => Date.now(),
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/gu, " ") : "";
}
function chars(value: string): number { return Array.from(value).length; }
function wordCount(value: string): number { return value ? value.split(/\s+/u).length : 0; }
function fieldErrors(body: Record<string, unknown>): FieldErrors {
  const errors: FieldErrors = {};
  for (const [name, rule] of Object.entries(FIELD_RULES)) {
    const value = clean(body[name]);
    const count = chars(value);
    if (!value) errors[name] = `Please enter your ${name === "comment" ? "review" : name}.`;
    else if (count < rule.min) errors[name] = `Your ${name === "comment" ? "review" : name} must be at least ${rule.min} characters.`;
    else if (name === "comment" && wordCount(value) > MAX_REVIEW_WORDS) errors[name] = `Your review must be ${MAX_REVIEW_WORDS} words or fewer.`;
    else if (count > rule.max) errors[name] = name === "comment" ? "Your review must be 3000 characters or fewer." : `Your ${name} must be ${rule.max} characters or fewer.`;
  }
  const rating = body.rating;
  if (!Number.isInteger(rating) || Number(rating) < 1 || Number(rating) > 5) {
    errors.rating = "Please choose a rating from 1 to 5.";
  }
  return errors;
}
function allowedOrigins(env: Runtime): Set<string> {
  const configured = (env.env("ALLOWED_ORIGINS") || "https://vrfhomeinteriors.com,https://www.vrfhomeinteriors.com")
    .split(",").map((origin) => origin.trim()).filter(Boolean);
  const origins = new Set<string>();
  for (const candidate of configured) {
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === "https:" && parsed.origin === candidate.replace(/\/$/, "")) origins.add(parsed.origin);
    } catch { /* Ignore malformed allowlist entries. */ }
  }
  return origins;
}
function headersFor(origin: string | null, allow: Set<string>): Headers {
  const headers = new Headers({
    "Cache-Control": "no-store, private",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin",
  });
  if (origin && allow.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info");
    headers.set("Access-Control-Expose-Headers", "Retry-After, Server-Timing");
    headers.set("Access-Control-Max-Age", "600");
  }
  return headers;
}
function response(status: number, payload: Record<string, unknown> | null, origin: string | null, allow: Set<string>, extras: Record<string, string> = {}): Response {
  const headers = headersFor(origin, allow);
  for (const [name, value] of Object.entries(extras)) headers.set(name, value);
  return new Response(payload === null ? null : JSON.stringify(payload), { status, headers });
}
function serverTiming(startedAt: number, stages: Record<string, number>): string {
  const parts = Object.entries(stages)
    .filter(([, duration]) => Number.isFinite(duration) && duration >= 0)
    .map(([name, duration]) => `${name};dur=${duration.toFixed(1)}`);
  parts.push(`edge;dur=${(performance.now() - startedAt).toFixed(1)}`);
  return parts.join(", ");
}
function timingHeaders(enabled: boolean, timing: string): Record<string, string> {
  return enabled ? { "Server-Timing": timing } : {};
}
async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function hmac(secret: string, message: string): Promise<{ key: CryptoKey; signature: Uint8Array }> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
  return { key, signature };
}
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function fromHex(value: string): Uint8Array {
  return new Uint8Array(value.match(/.{2}/g)?.map((part) => Number.parseInt(part, 16)) || []);
}
/* The browser only persists this opaque token. It cannot invent or alter a
   device nonce accepted by the write path without the server-held HMAC key. */
async function issueDeviceToken(secret: string, now: number): Promise<string> {
  const nonce = crypto.randomUUID().toLowerCase();
  const expires = now + DEVICE_TOKEN_TTL_MS;
  const signed = await hmac(secret, `review-device:v1:${nonce}:${expires}`);
  return `${nonce}.${expires}.${toHex(signed.signature)}`;
}
async function verifyDeviceToken(token: string, secret: string, now: number): Promise<string> {
  const match = token.match(/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(\d{10,13})\.([0-9a-f]{64})$/i);
  if (!match) return "";
  const [, nonce, expiryText, signatureText] = match;
  const expires = Number(expiryText);
  if (!Number.isSafeInteger(expires) || expires < now || expires > now + DEVICE_TOKEN_TTL_MS + 60_000) return "";
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const signatureBytes = fromHex(signatureText);
    const signatureBuffer = new ArrayBuffer(signatureBytes.length);
    new Uint8Array(signatureBuffer).set(signatureBytes);
    const valid = await crypto.subtle.verify("HMAC", key, signatureBuffer, new TextEncoder().encode(`review-device:v1:${nonce.toLowerCase()}:${expires}`));
    return valid ? nonce.toLowerCase() : "";
  } catch { return ""; }
}
function clientAddress(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf && validIp(cf)) return cf;
  const real = request.headers.get("x-real-ip")?.trim();
  if (real && validIp(real)) return real;
  const chain = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean) || [];
  const hops = Math.max(0, Math.min(10, Number.parseInt(runtime.env("TRUSTED_PROXY_HOPS") || "0", 10) || 0));
  const index = chain.length - 1 - hops;
  if (index >= 0 && validIp(chain[index])) return chain[index];
  return "";
}
function validIp(value: string): boolean {
  // Deno's standard URL parser does not expose an IP validator. This accepts
  // canonical IPv4 and IPv6 shapes and rejects header text/port suffixes.
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return value.split(".").every((part) => Number(part) <= 255);
  return value.includes(":") && /^[0-9a-f:.]+$/i.test(value) && value.split(":").length >= 3;
}
function acceptedHostname(origin: string | null, allow: Set<string>): string[] {
  if (!origin || !allow.has(origin)) return [];
  try { return [new URL(origin).hostname.toLowerCase()]; } catch { return []; }
}
async function verifyTurnstile(token: string, address: string, origin: string | null, env: Runtime): Promise<"ok" | "failed" | "unavailable"> {
  const secret = env.env("TURNSTILE_SECRET_KEY") || "";
  if (!secret) return "unavailable";
  if (!token || token.length > 2048) return "failed";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const form = new URLSearchParams({ secret, response: token, remoteip: address });
    const result = await env.fetch(env.env("TURNSTILE_VERIFY_URL") || "https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form, signal: controller.signal,
    });
    if (!result.ok) return "unavailable";
    const data = await result.json();
    const expected = acceptedHostname(origin, allowedOrigins(env));
    return data?.success === true && typeof data.hostname === "string" && expected.includes(data.hostname.toLowerCase()) ? "ok" : "failed";
  } catch { return "unavailable"; }
  finally { clearTimeout(timer); }
}

export async function handle(request: Request, env: Runtime = runtime): Promise<Response> {
  const startedAt = performance.now();
  const timingEnabled = new URL(request.url).searchParams.get("reviewTiming") === "1";
  const origin = request.headers.get("origin");
  const allow = allowedOrigins(env);
  if (origin && !allow.has(origin)) return response(403, { error: { code: "origin_not_allowed" } }, null, allow);
  if (!origin && request.method !== "OPTIONS") return response(403, { error: { code: "origin_required" } }, null, allow);
  if (request.method === "OPTIONS") {
    if (!origin || !allow.has(origin)) return response(403, { error: { code: "origin_not_allowed" } }, null, allow);
    return response(204, null, origin, allow);
  }
  if (request.method !== "POST") return response(405, { error: { code: "method_not_allowed" } }, origin, allow, { Allow: "POST, OPTIONS" });

  const supabaseUrl = env.env("SUPABASE_URL") || "";
  const serviceKey = env.env("SUPABASE_SERVICE_ROLE_KEY") || "";
  const salt = env.env("IP_HASH_SALT") || "";
  const captchaSecret = env.env("TURNSTILE_SECRET_KEY") || "";
  if (!supabaseUrl || !serviceKey || salt.length < 32 || !captchaSecret) {
    return response(503, { error: { code: "not_configured" } }, origin, allow);
  }
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  if (!contentType.startsWith("application/json")) return response(415, { error: { code: "unsupported_media_type" } }, origin, allow);
  const announced = Number(request.headers.get("content-length") || 0);
  if (announced > MAX_BODY_BYTES) return response(413, { error: { code: "payload_too_large" } }, origin, allow);
  let bytes: Uint8Array;
  try { bytes = new Uint8Array(await request.arrayBuffer()); }
  catch { return response(400, { error: { code: "bad_request" } }, origin, allow); }
  if (bytes.byteLength > MAX_BODY_BYTES) return response(413, { error: { code: "payload_too_large" } }, origin, allow);
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not_object");
    body = parsed as Record<string, unknown>;
  } catch { return response(400, { error: { code: "bad_request" } }, origin, allow); }

  const address = clientAddress(request);
  if (!address) return response(400, { error: { code: "client_unidentified" } }, origin, allow);
  if (body.action === "device-token") {
    const deviceTokenStartedAt = performance.now();
    try {
      const deviceToken = await issueDeviceToken(salt, env.now());
      const timing = serverTiming(startedAt, { device_token: performance.now() - deviceTokenStartedAt });
      return response(200, { deviceToken }, origin, allow, timingHeaders(timingEnabled, timing));
    } catch { return response(503, { error: { code: "not_configured" } }, origin, allow); }
  }
  const deviceCheckStartedAt = performance.now();
  const deviceToken = typeof body.deviceToken === "string" ? body.deviceToken.trim() : "";
  const deviceNonce = await verifyDeviceToken(deviceToken, salt, env.now());
  const deviceCheckMs = performance.now() - deviceCheckStartedAt;
  if (!deviceNonce) return response(400, { error: { code: "device_identifier_required" } }, origin, allow);
  const validationStartedAt = performance.now();
  const errors = fieldErrors(body);
  const validationMs = performance.now() - validationStartedAt;
  if (Object.keys(errors).length) return response(422, { error: { code: "validation_failed" }, fields: errors }, origin, allow);
  const captchaStartedAt = performance.now();
  const captcha = await verifyTurnstile(clean(body.turnstileToken), address, origin, env);
  const captchaMs = performance.now() - captchaStartedAt;
  const captchaTiming = serverTiming(startedAt, { device: deviceCheckMs, validation: validationMs, siteverify: captchaMs });
  if (captcha === "failed") return response(403, { error: { code: "captcha_failed" } }, origin, allow, timingHeaders(timingEnabled, captchaTiming));
  if (captcha === "unavailable") return response(503, { error: { code: "captcha_unavailable" } }, origin, allow, timingHeaders(timingEnabled, captchaTiming));

  const cooldown = 300;
  let clientHash: string;
  let deviceHash: string;
  try {
    clientHash = await sha256(`ip:${address}:${salt}`);
    deviceHash = await sha256(`device:${deviceNonce}:${salt}`);
  } catch { return response(503, { error: { code: "not_configured" } }, origin, allow); }

  const rpcUrl = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/rpc/submit_review`;
  const databaseStartedAt = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const rpc = await env.fetch(rpcUrl, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        p_client_hash: clientHash,
        p_device_hash: deviceHash,
        p_name: clean(body.name),
        p_rating: body.rating,
        p_comment: clean(body.comment),
        p_location: clean(body.location),
        p_cooldown_seconds: cooldown,
      }),
      signal: controller.signal,
    });
    if (!rpc.ok) {
      const timing = serverTiming(startedAt, {
        device: deviceCheckMs,
        validation: validationMs,
        siteverify: captchaMs,
        db_rpc: performance.now() - databaseStartedAt,
      });
      return response(rpc.status === 429 ? 429 : 502, { error: { code: rpc.status === 429 ? "rate_limited" : "storage_failed" } }, origin, allow, timingHeaders(timingEnabled, timing));
    }
    const result = await rpc.json();
    const databaseMs = performance.now() - databaseStartedAt;
    const timingStages: Record<string, number> = {
      device: deviceCheckMs,
      validation: validationMs,
      siteverify: captchaMs,
      db_rpc: databaseMs,
    };
    const databaseInsertMs = Number(result?.timing?.db_insert_ms);
    if (Number.isFinite(databaseInsertMs) && databaseInsertMs >= 0) timingStages.db_insert = databaseInsertMs;
    const timing = serverTiming(startedAt, timingStages);
    if (result?.status === "rate_limited") {
      const retry = Math.max(1, Math.min(Number(result.retry_after) || cooldown, 86400));
      return response(429, { error: { code: "rate_limited" }, retry_after: retry }, origin, allow, { "Retry-After": String(retry), ...timingHeaders(timingEnabled, timing) });
    }
    if (result?.status !== "created" || !result.review) return response(502, { error: { code: "storage_failed" } }, origin, allow, timingHeaders(timingEnabled, timing));
    return response(201, { status: "created", review: result.review, cooldown_seconds: cooldown }, origin, allow, timingHeaders(timingEnabled, timing));
  } catch {
    const timing = serverTiming(startedAt, {
      device: deviceCheckMs,
      validation: validationMs,
      siteverify: captchaMs,
      db_rpc: performance.now() - databaseStartedAt,
    });
    return response(502, { error: { code: "storage_unavailable" } }, origin, allow, timingHeaders(timingEnabled, timing));
  } finally { clearTimeout(timer); }
}

if (typeof Deno !== "undefined") Deno.serve((request: Request) => handle(request));
