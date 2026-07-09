import { randomInt } from "node:crypto";

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export function otpExpiresAt(minutes = 10): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}
