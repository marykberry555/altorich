export type WelcomeBonusConfig = {
  enabled: boolean;
  amount_ngn: number;
  max_allocations: number;
  qualification_days: number;
};

export type WelcomeBonusDisplayConfig = {
  programmeName: string;
  walletCurrency: string;
  unlockDay: string;
  unlockTime: string;
  unlockTimezone: string;
  display: {
    cardTitle: string;
    slotCounterOpen: string;
    slotCounterFull: string;
    slotCounterClosed: string;
    progressLabel: string;
    qualificationLabel: string;
  };
  marketing: {
    headline: string;
    subheadline: string;
  };
  dashboard: {
    awardedTitle: string;
    unlockedTitle: string;
    paidTitle: string;
  };
  member: {
    awardedNotification: string;
    unlockedNotification: string;
    qualificationComplete: string;
  };
  admin: {
    panelTitle: string;
    emptyState: string;
  };
};

export const WELCOME_BONUS_DISPLAY: WelcomeBonusDisplayConfig = {
  programmeName: "Welcome Bonus",
  walletCurrency: "WB",
  unlockDay: "Monday",
  unlockTime: "09:00",
  unlockTimezone: "Africa/Lagos",
  display: {
    cardTitle: "Welcome Bonus",
    slotCounterOpen: "slots remaining",
    slotCounterFull: "All slots claimed",
    slotCounterClosed: "Programme closed",
    progressLabel: "Qualification progress",
    qualificationLabel: "Qualification period"
  },
  marketing: {
    headline: "Welcome Bonus Programme",
    subheadline: "Register, verify, and qualify to receive a welcome bonus on your first settlement cycle."
  },
  dashboard: {
    awardedTitle: "Welcome bonus slot reserved",
    unlockedTitle: "Welcome bonus unlocked",
    paidTitle: "Welcome bonus paid"
  },
  member: {
    awardedNotification:
      "Welcome Bonus reserved. It unlocks on the first eligible Monday settlement.",
    unlockedNotification: "Your Welcome Bonus is available for Monday withdrawal.",
    qualificationComplete: "Welcome Bonus ready — awaiting unlock on the next Monday settlement."
  },
  admin: {
    panelTitle: "Welcome Bonus programme",
    emptyState: "No Welcome Bonus allocations yet"
  }
};

export const DEFAULT_WELCOME_BONUS_CONFIG: WelcomeBonusConfig = {
  enabled: true,
  amount_ngn: 10_000,
  max_allocations: 200,
  qualification_days: 35
};

export const WELCOME_BONUS_SETTINGS_KEY = "welcome_bonus";
/** @deprecated Use WELCOME_BONUS_DISPLAY.walletCurrency */
export const WELCOME_BONUS_WALLET_CURRENCY = WELCOME_BONUS_DISPLAY.walletCurrency;

export function mergeWelcomeBonusConfig(
  partial: Partial<WelcomeBonusConfig> | null | undefined
): WelcomeBonusConfig {
  return {
    ...DEFAULT_WELCOME_BONUS_CONFIG,
    ...(partial ?? {}),
    amount_ngn: Math.max(0, Number(partial?.amount_ngn ?? DEFAULT_WELCOME_BONUS_CONFIG.amount_ngn)),
    max_allocations: Math.max(
      1,
      Math.floor(Number(partial?.max_allocations ?? DEFAULT_WELCOME_BONUS_CONFIG.max_allocations))
    ),
    qualification_days: Math.max(
      1,
      Math.floor(Number(partial?.qualification_days ?? DEFAULT_WELCOME_BONUS_CONFIG.qualification_days))
    ),
    enabled: partial?.enabled ?? DEFAULT_WELCOME_BONUS_CONFIG.enabled
  };
}

export function isWelcomeBonusEnabled(config: WelcomeBonusConfig = DEFAULT_WELCOME_BONUS_CONFIG): boolean {
  return config.enabled;
}

export function formatWelcomeBonusAwardMessage(amountNgn: number, qualificationDays: number): string {
  return WELCOME_BONUS_DISPLAY.member.awardedNotification
    .replace("{qualificationDays}", String(qualificationDays))
    .replace("{amount}", amountNgn.toLocaleString("en-NG"));
}
