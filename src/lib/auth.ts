import { cookies } from "next/headers";

export interface AdminSessionPayload {
  userId: string;
  name: string;
  username: string;
  email: string | null;
  role: string;
  exp: number; // timestamp in seconds
}

export const ADMIN_COOKIE_NAME = "kantin_admin_session";
const DEFAULT_SECRET = "kantin-mini-super-secret-auth-key-2026-secure";

function getSecretKey(): string {
  return process.env.AUTH_SECRET || process.env.ADMIN_JWT_SECRET || DEFAULT_SECRET;
}

// Convert string to BufferSource
function textToBuffer(str: string): BufferSource {
  return new TextEncoder().encode(str) as unknown as BufferSource;
}

// Base64Url encode/decode safe for Web Crypto & URLs
function base64UrlEncode(buffer: BufferSource | ArrayBuffer | Uint8Array): string {
  const bytes =
    buffer instanceof Uint8Array
      ? buffer
      : new Uint8Array(
          buffer instanceof ArrayBuffer
            ? buffer
            : (buffer as ArrayBufferView).buffer
        );
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

// Get CryptoKey for HMAC-SHA256
async function getCryptoKey(): Promise<CryptoKey> {
  const keyBuffer = textToBuffer(getSecretKey());
  return await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Sign session payload into a compact JWT-like token
 */
export async function createSessionToken(
  user: Omit<AdminSessionPayload, "exp">,
  expiresInSeconds: number = 7 * 24 * 60 * 60 // 7 days
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload: AdminSessionPayload = { ...user, exp };

  const encodedHeader = base64UrlEncode(textToBuffer(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(textToBuffer(JSON.stringify(payload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    textToBuffer(dataToSign)
  );
  const encodedSignature = base64UrlEncode(signatureBuffer);

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verify and decode session token. Returns null if invalid or expired.
 */
export async function verifySessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    // Decode signature
    const signatureBinary = base64UrlDecode(encodedSignature);
    const signatureBytes = new Uint8Array(signatureBinary.length) as unknown as BufferSource;
    for (let i = 0; i < signatureBinary.length; i++) {
      (signatureBytes as unknown as Uint8Array)[i] = signatureBinary.charCodeAt(i);
    }

    const key = await getCryptoKey();
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      textToBuffer(dataToSign)
    );

    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: AdminSessionPayload = JSON.parse(payloadJson);

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Read current admin session from incoming cookies (Server Component / Route Handler)
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Hash password with SHA-256 and random salt
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const data = textToBuffer(`${salt}:${plainPassword}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${salt}:${hashHex}`;
}

/**
 * Verify plaintext password against stored hash (supports salt hash and plaintext fallback for initial seed)
 */
export async function verifyPassword(
  plainPassword: string,
  storedHash: string | null
): Promise<boolean> {
  if (!storedHash) return false;

  // 1. Plaintext fallback (seperti seed default "admin123")
  if (storedHash === plainPassword) {
    return true;
  }

  // 2. Salted SHA-256: sha256:<salt>:<hashHex>
  if (storedHash.startsWith("sha256:")) {
    const parts = storedHash.split(":");
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedHash = parts[2];
      const data = textToBuffer(`${salt}:${plainPassword}`);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const computedHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return computedHash === expectedHash;
    }
  }

  return false;
}
