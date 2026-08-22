import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET belum diset. Tambahkan di .env.local (mis. hasil `openssl rand -base64 32`)."
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Signed, stateless session token — carries only an expiry, no personal data. */
export function createSessionToken(): string {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString(
    "base64url"
  );
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!timingSafeStringEqual(signature, sign(payload))) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

function hashWithSalt(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

/** Generates a `salt:hash` string suitable for the AUTH_PASSWORD_HASH env var. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${hashWithSalt(password, salt)}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = hashWithSalt(password, salt);
  return timingSafeStringEqual(candidate, hash);
}

export function verifyCredentials(email: string, password: string): boolean {
  const validEmail = process.env.AUTH_EMAIL;
  const validHash = process.env.AUTH_PASSWORD_HASH;
  if (!validEmail || !validHash) {
    throw new Error(
      "AUTH_EMAIL / AUTH_PASSWORD_HASH belum diset di .env.local. Jalankan `npm run auth:hash -- <password>` untuk membuat hash-nya."
    );
  }
  const emailMatches = email.trim().toLowerCase() === validEmail.trim().toLowerCase();
  return emailMatches && verifyPassword(password, validHash);
}
