/**
 * Configuration-driven rate limits for auth and financial endpoints.
 * Window values are milliseconds.
 */
export const RATE_LIMITS = {
  authLogin: { limit: 20, windowMs: 15 * 60_000, message: "Too many sign-in attempts. Please try again shortly." },
  authRegister: { limit: 8, windowMs: 60 * 60_000, message: "Too many registration attempts. Try again later." },
  authOtp: { limit: 20, windowMs: 15 * 60_000, message: "Too many verification attempts. Try again shortly." },
  authOtpEmail: { limit: 10, windowMs: 15 * 60_000, message: "Too many verification attempts for this email." },
  authRecover: { limit: 10, windowMs: 15 * 60_000, message: "Too many recovery attempts. Try again shortly." },
  authChangePin: { limit: 10, windowMs: 15 * 60_000, message: "Too many PIN change attempts. Try again shortly." },
  depositCreate: { limit: 15, windowMs: 60 * 60_000, message: "Too many deposit submissions. Please wait before trying again." },
  withdrawalCreate: { limit: 10, windowMs: 60 * 60_000, message: "Too many withdrawal requests. Please wait before trying again." },
  investmentCreate: { limit: 20, windowMs: 60 * 60_000, message: "Too many investment requests. Please wait before trying again." },
  referralLookup: { limit: 30, windowMs: 15 * 60_000, message: "Too many referral lookups. Try again shortly." },
  adminFinanceAction: { limit: 60, windowMs: 15 * 60_000, message: "Too many admin financial actions. Please slow down." },
  adminLogin: { limit: 15, windowMs: 15 * 60_000, message: "Too many admin sign-in attempts. Please try again shortly." },
  profileUpdate: { limit: 30, windowMs: 15 * 60_000, message: "Too many profile updates. Please try again shortly." },
  upload: { limit: 20, windowMs: 60 * 60_000, message: "Too many uploads. Please wait before trying again." }
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;
