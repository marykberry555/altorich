/** Edge-safe request ID (Web Crypto). Safe for Next.js middleware. */
export function createRequestId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return `req_${hex}`;
}
