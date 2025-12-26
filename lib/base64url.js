/* base64url.js (browser-first, ES module) */

const hasBuffer = typeof Buffer !== "undefined" && typeof Buffer.from === "function";

function padBase64(b64) {
  const pad = b64.length % 4;
  if (pad === 0) return b64;
  return b64 + "=".repeat(4 - pad);
}

function fromBase64(base64) {
  return base64.replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function toBase64(base64url) {
  const s = String(base64url).replace(/-/g, "+").replace(/_/g, "/");
  return padBase64(s);
}

function bytesToBase64(bytes) {
  if (hasBuffer) return Buffer.from(bytes).toString("base64");
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  if (hasBuffer) return new Uint8Array(Buffer.from(base64, "base64"));
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function encode(input, encoding = "utf8") {
  if (typeof input === "string") {
    if (hasBuffer) return fromBase64(Buffer.from(input, encoding).toString("base64"));
    const bytes = new TextEncoder().encode(input);
    return fromBase64(bytesToBase64(bytes));
  }
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input);
  return fromBase64(bytesToBase64(bytes));
}

function decode(base64url, encoding = "utf8") {
  const b64 = toBase64(base64url);
  if (hasBuffer) return Buffer.from(b64, "base64").toString(encoding);
  const bytes = base64ToBytes(b64);
  return new TextDecoder().decode(bytes);
}

function toBytes(base64url) {
  return base64ToBytes(toBase64(base64url));
}

const base64url = (input, encoding) => encode(input, encoding);
base64url.encode = encode;
base64url.decode = decode;
base64url.fromBase64 = fromBase64;
base64url.toBase64 = toBase64;
base64url.toBytes = toBytes;

export default base64url;
