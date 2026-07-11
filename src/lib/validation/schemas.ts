import { z } from "zod";
import { isValidAccountNumber, isValidNigerianPhone, normalizeAccountNumber, normalizePhone } from "@/lib/validation/identity";

export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .refine(isValidNigerianPhone, "Enter a valid 11-digit Nigerian phone number.");

export const accountNumberSchema = z
  .string()
  .transform(normalizeAccountNumber)
  .refine(isValidAccountNumber, "Account number must be exactly 10 digits.");
