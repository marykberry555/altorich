import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isServiceRoleConfigured } from "@/lib/env";
import type { Database } from "@/types/database";
import { DepositService } from "@/services/deposit/deposit.service";
import { SettingsService } from "@/services/admin/settings.service";
import { PaymentRailsService } from "@/services/payments/payment-rails.service";
import { InvestmentService } from "@/services/investment/investment.service";
import { SettlementService } from "@/services/investment/settlement.service";
import { WalletService } from "@/services/wallet/wallet.service";
import { WithdrawalService } from "@/services/withdrawal/withdrawal.service";
import { NotificationService } from "@/services/notification/notification.service";
import { StorageService } from "@/services/storage/storage.service";
import { AuditService } from "@/services/audit/audit.service";
import { DashboardService } from "@/services/dashboard/dashboard.service";
import { ProfileService } from "@/services/profile/profile.service";
import { PaymentOrchestratorService } from "@/services/payment/payment-orchestrator.service";
import { KycService } from "@/services/kyc/kyc.service";
import { AnalyticsService } from "@/services/admin/analytics.service";
import { RoiService } from "@/services/roi/roi.service";
import { ReferralService } from "@/services/referral/referral.service";
import { FundingAccountService } from "@/services/funding/funding-account.service";
import { MemberAdminService } from "@/services/admin/member-admin.service";
import { CapitalLiquidationService } from "@/services/investment/capital-liquidation.service";
import { FinancialOpsService } from "@/services/admin/financial-ops.service";
import { WelcomeBonusService } from "@/services/welcome-bonus/welcome-bonus.service";
import { requireAdmin } from "@/lib/auth/session";

export type ServiceBundle = {
  supabase: SupabaseClient<Database>;
  deposits: DepositService;
  settings: SettingsService;
  paymentRails: PaymentRailsService;
  investments: InvestmentService;
  settlements: SettlementService;
  wallet: WalletService;
  withdrawals: WithdrawalService;
  notifications: NotificationService;
  storage: StorageService;
  audit: AuditService;
  dashboard: DashboardService;
  profile: ProfileService;
  payments: PaymentOrchestratorService;
  kyc: KycService;
  analytics: AnalyticsService;
  roi: RoiService;
  referrals: ReferralService;
  fundingAccounts: FundingAccountService;
  members: MemberAdminService;
  liquidations: CapitalLiquidationService;
  financialOps: FinancialOpsService;
  welcomeBonus: WelcomeBonusService;
};

async function getBankConfig(settings: SettingsService) {
  const bank = await settings.getBankSwitchboard();
  return {
    bankName: bank.active_bank_name,
    accountName: bank.active_account_name,
    accountNumber: bank.active_account_number,
    narration: bank.transfer_narration
  };
}

function buildBundle(supabase: SupabaseClient<Database>, bankConfig?: {
  bankName: string;
  accountName: string;
  accountNumber: string;
  narration: string;
}): ServiceBundle {
  const settings = new SettingsService(supabase);
  return {
    supabase,
    deposits: new DepositService(supabase),
    settings,
    paymentRails: new PaymentRailsService(settings),
    investments: new InvestmentService(supabase),
    settlements: new SettlementService(supabase),
    wallet: new WalletService(supabase),
    withdrawals: new WithdrawalService(supabase),
    notifications: new NotificationService(supabase),
    storage: new StorageService(supabase),
    audit: new AuditService(supabase),
    dashboard: new DashboardService(supabase, settings),
    profile: new ProfileService(supabase),
    payments: new PaymentOrchestratorService(supabase, bankConfig),
    kyc: new KycService(supabase),
    analytics: new AnalyticsService(supabase),
    roi: new RoiService(supabase),
    referrals: new ReferralService(supabase),
    fundingAccounts: new FundingAccountService(supabase),
    members: new MemberAdminService(supabase),
    liquidations: new CapitalLiquidationService(supabase),
    financialOps: new FinancialOpsService(supabase),
    welcomeBonus: new WelcomeBonusService(supabase)
  };
}

/** User-scoped Supabase client — respects RLS */
export async function getUserServices(): Promise<ServiceBundle | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const settings = new SettingsService(supabase);
  const bankConfig = await getBankConfig(settings).catch(() => undefined);
  return buildBundle(supabase, bankConfig);
}

/** Public read client for marketing pages (settings, plans) */
export async function getPublicServices(): Promise<ServiceBundle | null> {
  return getUserServices();
}

/** Service-role client for privileged server operations */
export async function getServiceRoleServices(): Promise<ServiceBundle | null> {
  if (!isServiceRoleConfigured()) return null;
  const supabase = await createServiceClient();
  if (!supabase) return null;
  const settings = new SettingsService(supabase);
  const bankConfig = await getBankConfig(settings).catch(() => undefined);
  return buildBundle(supabase, bankConfig);
}

/** Admin operations — verifies role then uses service-role client */
export async function getAdminServices(): Promise<ServiceBundle | null> {
  try {
    await requireAdmin();
  } catch {
    return null;
  }
  return getServiceRoleServices();
}

/** @deprecated Use getUserServices, getAdminServices, or getServiceRoleServices */
export async function getServices(): Promise<ServiceBundle | null> {
  return getServiceRoleServices() ?? getUserServices();
}
