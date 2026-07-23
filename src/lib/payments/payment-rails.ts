import { z } from "zod";
import {
  DEFAULT_PAYMENT_RAILS,
  type CryptoAssetCode,
  type CryptoNetworkCode,
  type PaymentDirection,
  type PaymentRailId,
  type PaymentRailsDefaults,
  type PaymentRailsLiveState,
  type PlatformCryptoAddress,
  type RailDirectionConfig,
  type ResolvedPaymentRails
} from "@/config/payment-rails";

export const paymentRailIdSchema = z.enum(["bank", "crypto"]);
export const paymentDirectionSchema = z.enum(["deposit", "withdrawal"]);
export const cryptoAssetSchema = z.enum(["USDT", "USDC", "BTC", "ETH"]);
export const cryptoNetworkSchema = z.enum(["TRC20", "ERC20", "BEP20", "POLYGON", "BITCOIN"]);

const railDirectionSchema = z.object({
  enabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  temporarilyUnavailable: z.boolean().optional(),
  displayMessage: z.string().max(500).optional()
});

export const paymentRailsPatchSchema = z.object({
  rails: z
    .object({
      bank: z
        .object({
          displayName: z.string().max(80).optional(),
          priority: z.number().int().min(0).max(100).optional(),
          deposit: railDirectionSchema.optional(),
          withdrawal: railDirectionSchema.optional(),
          processingInstructions: z.string().max(1000).optional()
        })
        .optional(),
      crypto: z
        .object({
          displayName: z.string().max(80).optional(),
          priority: z.number().int().min(0).max(100).optional(),
          deposit: railDirectionSchema.optional(),
          withdrawal: railDirectionSchema.optional(),
          processingInstructions: z.string().max(1000).optional()
        })
        .optional()
    })
    .optional(),
  cryptoAssets: z
    .array(
      z.object({
        code: cryptoAssetSchema,
        displayName: z.string().max(80).optional(),
        enabled: z.boolean().optional(),
        networks: z.array(cryptoNetworkSchema).optional(),
        decimals: z.number().int().min(0).max(18).optional()
      })
    )
    .optional(),
  cryptoNetworks: z
    .array(
      z.object({
        code: cryptoNetworkSchema,
        displayName: z.string().max(80).optional(),
        enabled: z.boolean().optional(),
        warning: z.string().max(500).optional()
      })
    )
    .optional(),
  platformAddresses: z
    .array(
      z.object({
        asset: cryptoAssetSchema,
        network: cryptoNetworkSchema,
        address: z.string().min(1).max(200),
        label: z.string().max(80).optional()
      })
    )
    .optional(),
  bothDepositsDisabledMessage: z.string().max(500).optional(),
  bothWithdrawalsDisabledMessage: z.string().max(500).optional(),
  cryptoOnlyWithdrawalMessage: z.string().max(500).optional(),
  bankOnlyWithdrawalMessage: z.string().max(500).optional(),
  lastChangeReason: z.string().max(500).nullable().optional()
});

export type PaymentRailsPatch = z.infer<typeof paymentRailsPatchSchema>;

function mergeDirection(base: RailDirectionConfig, overlay?: Partial<RailDirectionConfig>): RailDirectionConfig {
  if (!overlay) return { ...base };
  return {
    enabled: overlay.enabled ?? base.enabled,
    maintenanceMode: overlay.maintenanceMode ?? base.maintenanceMode,
    temporarilyUnavailable: overlay.temporarilyUnavailable ?? base.temporarilyUnavailable,
    displayMessage: overlay.displayMessage ?? base.displayMessage
  };
}

function directionOpen(dir: RailDirectionConfig): boolean {
  return dir.enabled && !dir.maintenanceMode && !dir.temporarilyUnavailable;
}

/** Legacy crypto_wallets settings shape → platformAddresses */
export function legacyCryptoWalletsToAddresses(raw: unknown): PlatformCryptoAddress[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  const out: PlatformCryptoAddress[] = [];

  const usdt = obj.usdt as { network?: string; address?: string } | undefined;
  if (usdt?.address) {
    const network = (usdt.network?.toUpperCase() || "TRC20") as CryptoNetworkCode;
    out.push({ asset: "USDT", network: network === "TRC20" || network === "ERC20" || network === "BEP20" ? network : "TRC20", address: usdt.address });
  }
  const usdc = obj.usdc as { network?: string; address?: string } | undefined;
  if (usdc?.address) {
    const network = (usdc.network?.toUpperCase() || "ERC20") as CryptoNetworkCode;
    out.push({
      asset: "USDC",
      network: network === "ERC20" || network === "BEP20" || network === "POLYGON" ? network : "ERC20",
      address: usdc.address
    });
  }
  const btc = obj.btc as { address?: string } | undefined;
  if (btc?.address) {
    out.push({ asset: "BTC", network: "BITCOIN", address: btc.address });
  }

  if (Array.isArray(obj.addresses)) {
    for (const row of obj.addresses) {
      if (!row || typeof row !== "object") continue;
      const r = row as PlatformCryptoAddress;
      if (r.asset && r.network && r.address) out.push(r);
    }
  }

  return out;
}

export function addressesToLegacyCryptoWallets(addresses: PlatformCryptoAddress[]) {
  const usdt = addresses.find((a) => a.asset === "USDT");
  const usdc = addresses.find((a) => a.asset === "USDC");
  const btc = addresses.find((a) => a.asset === "BTC");
  return {
    usdt: { network: usdt?.network ?? "TRC20", address: usdt?.address ?? "" },
    usdc: { network: usdc?.network ?? "ERC20", address: usdc?.address ?? "" },
    btc: { address: btc?.address ?? "" },
    addresses
  };
}

export type LegacyRailsHints = {
  enableCryptoFunding?: boolean;
  enableCryptoPayouts?: boolean;
  enableUsdt?: boolean;
  enableUsdc?: boolean;
  enableBitcoin?: boolean;
  bankContributionsEnabled?: boolean;
};

/**
 * Merge code defaults + DB live state + optional legacy feature-flag hints.
 * Payment Rails live state wins over legacy flags when present.
 */
export function mergePaymentRails(
  live: PaymentRailsLiveState | null | undefined,
  legacy?: LegacyRailsHints,
  legacyAddresses?: PlatformCryptoAddress[]
): ResolvedPaymentRails {
  const base: PaymentRailsDefaults = structuredClone(DEFAULT_PAYMENT_RAILS);

  // Apply legacy hints only as soft defaults before live overlay.
  if (legacy) {
    if (typeof legacy.bankContributionsEnabled === "boolean") {
      base.rails.bank.deposit.enabled = legacy.bankContributionsEnabled;
    }
    if (typeof legacy.enableCryptoFunding === "boolean") {
      base.rails.crypto.deposit.enabled = legacy.enableCryptoFunding;
    }
    if (typeof legacy.enableCryptoPayouts === "boolean") {
      base.rails.crypto.withdrawal.enabled = legacy.enableCryptoPayouts;
    }
    for (const asset of base.cryptoAssets) {
      if (asset.code === "USDT" && typeof legacy.enableUsdt === "boolean") asset.enabled = legacy.enableUsdt;
      if (asset.code === "USDC" && typeof legacy.enableUsdc === "boolean") asset.enabled = legacy.enableUsdc;
      if (asset.code === "BTC" && typeof legacy.enableBitcoin === "boolean") asset.enabled = legacy.enableBitcoin;
    }
  }

  if (legacyAddresses?.length) {
    base.platformAddresses = legacyAddresses;
  }

  if (live) {
    for (const id of ["bank", "crypto"] as PaymentRailId[]) {
      const overlay = live.rails?.[id];
      if (!overlay) continue;
      const rail = base.rails[id];
      if (overlay.displayName) rail.displayName = overlay.displayName;
      if (typeof overlay.priority === "number") rail.priority = overlay.priority;
      if (overlay.processingInstructions) rail.processingInstructions = overlay.processingInstructions;
      rail.deposit = mergeDirection(rail.deposit, overlay.deposit);
      rail.withdrawal = mergeDirection(rail.withdrawal, overlay.withdrawal);
    }

    if (live.cryptoAssets?.length) {
      for (const patch of live.cryptoAssets) {
        const idx = base.cryptoAssets.findIndex((a) => a.code === patch.code);
        if (idx < 0) continue;
        base.cryptoAssets[idx] = { ...base.cryptoAssets[idx]!, ...patch, code: patch.code };
      }
    }

    if (live.cryptoNetworks?.length) {
      for (const patch of live.cryptoNetworks) {
        const idx = base.cryptoNetworks.findIndex((n) => n.code === patch.code);
        if (idx < 0) continue;
        base.cryptoNetworks[idx] = { ...base.cryptoNetworks[idx]!, ...patch, code: patch.code };
      }
    }

    // Empty [] must not wipe legacy/default addresses — only apply when addresses are published.
    if (Array.isArray(live.platformAddresses) && live.platformAddresses.length > 0) {
      base.platformAddresses = live.platformAddresses;
    }
    if (live.bothDepositsDisabledMessage) base.bothDepositsDisabledMessage = live.bothDepositsDisabledMessage;
    if (live.bothWithdrawalsDisabledMessage) {
      base.bothWithdrawalsDisabledMessage = live.bothWithdrawalsDisabledMessage;
    }
    if (live.cryptoOnlyWithdrawalMessage) base.cryptoOnlyWithdrawalMessage = live.cryptoOnlyWithdrawalMessage;
    if (live.bankOnlyWithdrawalMessage) base.bankOnlyWithdrawalMessage = live.bankOnlyWithdrawalMessage;
  }

  const bankDepositOpen = directionOpen(base.rails.bank.deposit);
  const bankWithdrawalOpen = directionOpen(base.rails.bank.withdrawal);
  const cryptoDepositOpen = directionOpen(base.rails.crypto.deposit);
  const cryptoWithdrawalOpen = directionOpen(base.rails.crypto.withdrawal);

  return {
    ...base,
    bankDepositOpen,
    bankWithdrawalOpen,
    cryptoDepositOpen,
    cryptoWithdrawalOpen,
    anyDepositOpen: bankDepositOpen || cryptoDepositOpen,
    anyWithdrawalOpen: bankWithdrawalOpen || cryptoWithdrawalOpen
  };
}

export function applyPaymentRailsPatch(
  current: PaymentRailsLiveState,
  patch: PaymentRailsPatch
): PaymentRailsLiveState {
  const next: PaymentRailsLiveState = {
    version: 1,
    rails: { ...(current.rails ?? {}) },
    cryptoAssets: current.cryptoAssets ? [...current.cryptoAssets] : undefined,
    cryptoNetworks: current.cryptoNetworks ? [...current.cryptoNetworks] : undefined,
    platformAddresses: current.platformAddresses ? [...current.platformAddresses] : undefined,
    bothDepositsDisabledMessage: current.bothDepositsDisabledMessage,
    bothWithdrawalsDisabledMessage: current.bothWithdrawalsDisabledMessage,
    cryptoOnlyWithdrawalMessage: current.cryptoOnlyWithdrawalMessage,
    bankOnlyWithdrawalMessage: current.bankOnlyWithdrawalMessage,
    lastChangeReason: patch.lastChangeReason !== undefined ? patch.lastChangeReason : current.lastChangeReason
  };

  if (patch.rails) {
    for (const id of ["bank", "crypto"] as PaymentRailId[]) {
      const p = patch.rails[id];
      if (!p) continue;
      next.rails![id] = {
        ...(next.rails![id] ?? {}),
        ...p,
        deposit: p.deposit ? { ...(next.rails![id]?.deposit ?? {}), ...p.deposit } : next.rails![id]?.deposit,
        withdrawal: p.withdrawal
          ? { ...(next.rails![id]?.withdrawal ?? {}), ...p.withdrawal }
          : next.rails![id]?.withdrawal
      };
    }
  }

  if (patch.cryptoAssets) next.cryptoAssets = patch.cryptoAssets;
  if (patch.cryptoNetworks) next.cryptoNetworks = patch.cryptoNetworks;
  if (patch.platformAddresses) next.platformAddresses = patch.platformAddresses;
  if (patch.bothDepositsDisabledMessage !== undefined) {
    next.bothDepositsDisabledMessage = patch.bothDepositsDisabledMessage;
  }
  if (patch.bothWithdrawalsDisabledMessage !== undefined) {
    next.bothWithdrawalsDisabledMessage = patch.bothWithdrawalsDisabledMessage;
  }
  if (patch.cryptoOnlyWithdrawalMessage !== undefined) {
    next.cryptoOnlyWithdrawalMessage = patch.cryptoOnlyWithdrawalMessage;
  }
  if (patch.bankOnlyWithdrawalMessage !== undefined) {
    next.bankOnlyWithdrawalMessage = patch.bankOnlyWithdrawalMessage;
  }

  return next;
}

export function isRailOpen(resolved: ResolvedPaymentRails, rail: PaymentRailId, direction: PaymentDirection): boolean {
  const dir = resolved.rails[rail][direction];
  return directionOpen(dir);
}

export function listActiveDepositMethods(resolved: ResolvedPaymentRails): PaymentRailId[] {
  return (["bank", "crypto"] as PaymentRailId[])
    .filter((id) => isRailOpen(resolved, id, "deposit"))
    .sort((a, b) => resolved.rails[a].priority - resolved.rails[b].priority);
}

export function listActiveWithdrawalMethods(resolved: ResolvedPaymentRails): PaymentRailId[] {
  return (["bank", "crypto"] as PaymentRailId[])
    .filter((id) => isRailOpen(resolved, id, "withdrawal"))
    .sort((a, b) => resolved.rails[a].priority - resolved.rails[b].priority);
}

export type SettlementMethod = "bank" | "crypto";

/** Route settlement/payout method from enabled rails + member preference. */
export function routeSettlementMethod(
  resolved: ResolvedPaymentRails,
  memberPreference?: SettlementMethod | null
): { method: SettlementMethod | null; reason: string } {
  const open = listActiveWithdrawalMethods(resolved);
  if (open.length === 0) {
    return { method: null, reason: "No withdrawal rails are currently enabled." };
  }
  if (memberPreference && open.includes(memberPreference)) {
    return { method: memberPreference, reason: "Matched member preferred payout method." };
  }
  if (open.length === 1) {
    return { method: open[0]!, reason: `Only ${open[0]} withdrawals are enabled.` };
  }
  // Prefer bank when both open and no preference (Naira-first ops).
  if (open.includes("bank")) {
    return { method: "bank", reason: "Defaulting to bank while multiple rails are open." };
  }
  return { method: open[0]!, reason: "Selected first available withdrawal rail." };
}

export function findPlatformAddress(
  resolved: ResolvedPaymentRails,
  asset: CryptoAssetCode,
  network: CryptoNetworkCode
): PlatformCryptoAddress | null {
  return (
    resolved.platformAddresses.find((a) => a.asset === asset && a.network === network && a.address.trim()) ?? null
  );
}

export function activeCryptoAssets(resolved: ResolvedPaymentRails) {
  return resolved.cryptoAssets.filter((a) => a.enabled);
}

export function activeNetworksForAsset(resolved: ResolvedPaymentRails, asset: CryptoAssetCode) {
  const assetCfg = resolved.cryptoAssets.find((a) => a.code === asset && a.enabled);
  if (!assetCfg) return [];
  return resolved.cryptoNetworks.filter((n) => n.enabled && assetCfg.networks.includes(n.code));
}

/** Member-safe public snapshot (omit unused provider internals). */
export function toPublicPaymentRailsSnapshot(resolved: ResolvedPaymentRails) {
  const depositMethods = listActiveDepositMethods(resolved);
  const withdrawalMethods = listActiveWithdrawalMethods(resolved);

  return {
    version: resolved.version,
    bankDepositOpen: resolved.bankDepositOpen,
    bankWithdrawalOpen: resolved.bankWithdrawalOpen,
    cryptoDepositOpen: resolved.cryptoDepositOpen,
    cryptoWithdrawalOpen: resolved.cryptoWithdrawalOpen,
    anyDepositOpen: resolved.anyDepositOpen,
    anyWithdrawalOpen: resolved.anyWithdrawalOpen,
    depositMethods,
    withdrawalMethods,
    rails: {
      bank: {
        displayName: resolved.rails.bank.displayName,
        priority: resolved.rails.bank.priority,
        deposit: resolved.rails.bank.deposit,
        withdrawal: resolved.rails.bank.withdrawal,
        processingInstructions: resolved.rails.bank.processingInstructions
      },
      crypto: {
        displayName: resolved.rails.crypto.displayName,
        priority: resolved.rails.crypto.priority,
        deposit: resolved.rails.crypto.deposit,
        withdrawal: resolved.rails.crypto.withdrawal,
        processingInstructions: resolved.rails.crypto.processingInstructions
      }
    },
    cryptoAssets: activeCryptoAssets(resolved).map((a) => ({
      code: a.code,
      displayName: a.displayName,
      networks: activeNetworksForAsset(resolved, a.code).map((n) => n.code)
    })),
    cryptoNetworks: resolved.cryptoNetworks
      .filter((n) => n.enabled)
      .map((n) => ({ code: n.code, displayName: n.displayName, warning: n.warning })),
    /** Only expose receive addresses when crypto deposits are open. */
    platformAddresses: resolved.cryptoDepositOpen
      ? resolved.platformAddresses.filter((a) => a.address.trim())
      : [],
    messages: {
      bothDepositsDisabled: resolved.bothDepositsDisabledMessage,
      bothWithdrawalsDisabled: resolved.bothWithdrawalsDisabledMessage,
      cryptoOnlyWithdrawal: resolved.cryptoOnlyWithdrawalMessage,
      bankOnlyWithdrawal: resolved.bankOnlyWithdrawalMessage
    }
  };
}

export type PublicPaymentRailsSnapshot = ReturnType<typeof toPublicPaymentRailsSnapshot>;
