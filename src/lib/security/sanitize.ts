const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export function sanitizeText(input: string, maxLength = 500): string {
  return input.replace(CONTROL_CHARS, "").trim().slice(0, maxLength);
}

export function sanitizePhone(input: string): string {
  return input.replace(/[^\d+\s-]/g, "").trim().slice(0, 20);
}

export function sanitizeFilename(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}
