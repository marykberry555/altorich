import type { SettingsService } from "@/services/admin/settings.service";
import {
  PAYMENT_RAILS_SETTINGS_KEY,
  type PaymentDirection,
  type PaymentRailId,
  type PaymentRailsLiveState,
  type ResolvedPaymentRails
} from "@/config/payment-rails";
import {
  applyPaymentRailsPatch,
  findPlatformAddress,
  isRailOpen,
  legacyCryptoWalletsToAddresses,
  listActiveDepositMethods,
  listActiveWithdrawalMethods,
  mergePaymentRails,
  routeSettlementMethod,
  toPublicPaymentRailsSnapshot,
  type PaymentRailsPatch,
  type SettlementMethod
} from "@/lib/payments/payment-rails";
import { Errors } from "@/lib/errors";

export class PaymentRailsService {
  constructor(private readonly settings: SettingsService) {}

  async getLiveState(): Promise<PaymentRailsLiveState> {
    return (await this.settings.getPaymentRailsLive()) ?? { version: 1 };
  }

  async getResolved(): Promise<ResolvedPaymentRails> {
    const [live, flags, bank, cryptoWallets] = await Promise.all([
      this.settings.getPaymentRailsLive(),
      this.settings.getFeatureFlags().catch(() => null),
      this.settings.getBankSwitchboard().catch(() => null),
      this.settings.getCryptoWallets().catch(() => null)
    ]);

    return mergePaymentRails(
      live,
      {
        enableCryptoFunding: flags?.enable_crypto_funding,
        enableCryptoPayouts: flags?.enable_crypto_payouts,
        enableUsdt: flags?.enable_usdt,
        enableUsdc: flags?.enable_usdc,
        enableBitcoin: flags?.enable_bitcoin,
        bankContributionsEnabled: bank?.contributions_enabled
      },
      legacyCryptoWalletsToAddresses(cryptoWallets)
    );
  }

  async getPublicSnapshot() {
    const resolved = await this.getResolved();
    return toPublicPaymentRailsSnapshot(resolved);
  }

  async updateLiveState(patch: PaymentRailsPatch, updatedBy?: string) {
    const current = await this.getLiveState();
    const next = applyPaymentRailsPatch(current, patch);
    await this.settings.updatePaymentRailsLive(next, updatedBy);

    // Keep legacy surfaces in sync so old feature-flag UI / bank switchboard stay consistent.
    if (patch.rails?.crypto?.deposit?.enabled !== undefined || patch.rails?.crypto?.withdrawal?.enabled !== undefined) {
      const resolved = mergePaymentRails(next);
      await this.settings.updateFeatureFlags(
        {
          enable_crypto_funding: resolved.rails.crypto.deposit.enabled,
          enable_crypto_payouts: resolved.rails.crypto.withdrawal.enabled
        },
        updatedBy
      );
    }

    if (patch.rails?.bank?.deposit?.enabled !== undefined) {
      await this.settings.updateBankSwitchboard(
        { contributions_enabled: patch.rails.bank.deposit.enabled },
        updatedBy
      );
    }

    if (patch.platformAddresses) {
      const { addressesToLegacyCryptoWallets } = await import("@/lib/payments/payment-rails");
      await this.settings.updateCryptoWallets(addressesToLegacyCryptoWallets(patch.platformAddresses), updatedBy);
    }

    return this.getResolved();
  }

  async assertDepositAllowed(rail: PaymentRailId) {
    const resolved = await this.getResolved();
    if (!isRailOpen(resolved, rail, "deposit")) {
      const msg =
        resolved.rails[rail].deposit.displayMessage ||
        (!resolved.anyDepositOpen ? resolved.bothDepositsDisabledMessage : `${resolved.rails[rail].displayName} deposits are unavailable.`);
      throw Errors.business(msg);
    }
    return resolved;
  }

  async assertWithdrawalAllowed(rail: PaymentRailId) {
    const resolved = await this.getResolved();
    if (!isRailOpen(resolved, rail, "withdrawal")) {
      const msg =
        resolved.rails[rail].withdrawal.displayMessage ||
        (!resolved.anyWithdrawalOpen
          ? resolved.bothWithdrawalsDisabledMessage
          : `${resolved.rails[rail].displayName} withdrawals are unavailable.`);
      throw Errors.business(msg);
    }
    return resolved;
  }

  async listDepositMethods() {
    return listActiveDepositMethods(await this.getResolved());
  }

  async listWithdrawalMethods() {
    return listActiveWithdrawalMethods(await this.getResolved());
  }

  async routeSettlement(memberPreference?: SettlementMethod | null) {
    return routeSettlementMethod(await this.getResolved(), memberPreference);
  }

  async resolveDepositAddress(asset: Parameters<typeof findPlatformAddress>[1], network: Parameters<typeof findPlatformAddress>[2]) {
    const resolved = await this.assertDepositAllowed("crypto");
    const address = findPlatformAddress(resolved, asset, network);
    if (!address) {
      throw Errors.business("No receive address is configured for that asset and network. Contact support.");
    }
    return { resolved, address };
  }

  isOpen(resolved: ResolvedPaymentRails, rail: PaymentRailId, direction: PaymentDirection) {
    return isRailOpen(resolved, rail, direction);
  }
}
