import { AppError } from "@/lib/errors";

export const DUPLICATE_IDENTITY_MESSAGE =
  "Email, number or username already exists on the system. Please use another.";

export const WEAK_PASSWORD_MESSAGE = "Password is not strong.";

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function capAccountNumberInput(value: string) {
  return digitsOnly(value).slice(0, 10);
}

export function capPhoneInput(value: string) {
  let d = digitsOnly(value);
  if (d.startsWith("234")) d = `0${d.slice(3)}`;
  return d.slice(0, 11);
}

export function normalizePhone(phone: string) {
  let d = digitsOnly(phone);
  if (d.startsWith("234")) d = `0${d.slice(3)}`;
  return d;
}

export function normalizeAccountNumber(value: string) {
  return digitsOnly(value).slice(0, 10);
}

/** 11 digits, Nigerian mobile prefixes (070/080/081/090/091). */
export function isValidNigerianPhone(phone: string) {
  return /^0[789]\d{9}$/.test(normalizePhone(phone));
}

export function isValidAccountNumber(value: string) {
  return /^\d{10}$/.test(normalizeAccountNumber(value));
}

export function isStrongPassword(password: string) {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

export function assertStrongPassword(password: string) {
  if (!isStrongPassword(password)) {
    throw new AppError(WEAK_PASSWORD_MESSAGE, 400, "WEAK_PASSWORD", WEAK_PASSWORD_MESSAGE);
  }
}

export function assertValidPhone(phone: string) {
  if (!isValidNigerianPhone(phone)) {
    throw new AppError("Enter a valid 11-digit Nigerian phone number.", 400, "INVALID_PHONE");
  }
}

export function assertValidAccountNumber(value: string) {
  if (!isValidAccountNumber(value)) {
    throw new AppError("Account number must be exactly 10 digits.", 400, "INVALID_ACCOUNT_NUMBER");
  }
}
