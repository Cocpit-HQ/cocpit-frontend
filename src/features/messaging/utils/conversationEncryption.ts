/**
 * URL-Safe Conversation & Group ID Encryption / Decryption
 * Protects raw database UUIDs from exposure in browser query parameters.
 */

const SALT_KEY = "cocpit_msg_sec_k98x";

function xorTransform(input: string, key: string): string {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    output += String.fromCharCode(charCode);
  }
  return output;
}

function toUrlSafeBase64(str: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(str, "binary").toString("base64url");
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafeBase64(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  if (typeof window === "undefined") {
    return Buffer.from(base64, "base64").toString("binary");
  }
  return atob(base64);
}

/**
 * Encrypts a raw conversation or group ID for display in the URL.
 */
export function encodeConversationId(id: string | number | null | undefined): string {
  if (!id) return "";
  const idStr = String(id).trim();
  if (!idStr) return "";
  // If already encoded with our prefix, avoid double encoding
  if (idStr.startsWith("enc_")) return idStr;
  try {
    const transformed = xorTransform(idStr, SALT_KEY);
    return `enc_${toUrlSafeBase64(transformed)}`;
  } catch {
    return idStr;
  }
}

/**
 * Decrypts an encrypted URL token back to the raw conversation or group UUID.
 * If the token is already a raw UUID or unencrypted string, returns it as-is.
 */
export function decodeConversationId(token: string | null | undefined): string {
  if (!token) return "";
  const tokenStr = String(token).trim();
  if (!tokenStr) return "";
  if (!tokenStr.startsWith("enc_")) {
    // Raw UUID or legacy unencrypted token — return as-is for backward compatibility
    return tokenStr;
  }
  try {
    const rawBase64 = tokenStr.slice(4);
    const decoded = fromUrlSafeBase64(rawBase64);
    const decrypted = xorTransform(decoded, SALT_KEY);
    return decrypted || tokenStr;
  } catch {
    return tokenStr;
  }
}
