import { createHmac, timingSafeEqual } from "node:crypto";

const ACCESS_TTL_MS = 365 * 24 * 60 * 60 * 1000;

function base64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function secret(): string {
  const s = process.env.ACCESS_TOKEN_SECRET;
  if (!s) {
    throw new Error("ACCESS_TOKEN_SECRET no configurado");
  }
  return s;
}

export function signAccessToken(email: string): string {
  const payload = base64url(
    JSON.stringify({ email, exp: Date.now() + ACCESS_TTL_MS })
  );
  const signature = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAccessToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;

  const expected = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email?: string;
      exp?: number;
    };
    if (!data.email || !data.exp || data.exp < Date.now()) return null;
    return data.email.toLowerCase();
  } catch {
    return null;
  }
}

export function emailFromRequest(request: Request): string | null {
  const header =
    request.headers.get("authorization") ?? request.headers.get("x-access-token") ?? "";
  if (!header) return null;
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  return verifyAccessToken(token);
}
