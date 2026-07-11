/** Strip grouping commas and parse a user-entered number. */
export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/** Keep digits and at most one decimal point. */
export function sanitizeNumericInput(value: string, allowDecimal = true): string {
  let raw = value.replace(/,/g, "");
  if (!allowDecimal) return raw.replace(/\D/g, "");
  raw = raw.replace(/[^\d.]/g, "");
  const parts = raw.split(".");
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts[0]}.${parts.slice(1).join("").replace(/\./g, "")}`;
}

/** Format integer part with en-NG grouping; preserve optional decimal tail. */
export function formatIntegerWithCommas(value: string): string {
  const sanitized = sanitizeNumericInput(value, true);
  if (!sanitized) return "";

  const [whole, ...rest] = sanitized.split(".");
  const fraction = rest.join("");
  const digits = whole.replace(/^0+(?=\d)/, "") || (whole === "0" ? "0" : "");
  if (!digits && !fraction) return sanitized.startsWith("0") ? "0" : "";

  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (sanitized.includes(".")) {
    return fraction.length > 0 ? `${grouped}.${fraction}` : `${grouped}.`;
  }
  return grouped;
}

export function formatWholeNumberWithCommas(value: number | string): string {
  const n = typeof value === "number" ? value : parseFormattedNumber(String(value));
  if (!Number.isFinite(n)) return "";
  return Math.trunc(n).toLocaleString("en-NG");
}
