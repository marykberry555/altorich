import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError } from "@/lib/errors";
import { assertValidAccountNumber, normalizeAccountNumber } from "@/lib/validation/identity";

type Client = SupabaseClient<Database>;
export type FundingAccount = Database["public"]["Tables"]["funding_accounts"]["Row"];
export type FundingAccountStatus = Database["public"]["Enums"]["funding_account_status"];

export type FundingAccountInput = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  sortCode?: string | null;
  displayName?: string | null;
  fundingInstructions?: string | null;
  displayOrder?: number;
  status?: FundingAccountStatus;
  isPreferred?: boolean;
};

export class FundingAccountService {
  constructor(private readonly supabase: Client) {}

  async listActive(): Promise<FundingAccount[]> {
    const { data, error } = await this.supabase
      .from("funding_accounts")
      .select("*")
      .eq("status", "active")
      .order("is_preferred", { ascending: false })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async listAll(): Promise<FundingAccount[]> {
    const { data, error } = await this.supabase
      .from("funding_accounts")
      .select("*")
      .order("is_preferred", { ascending: false })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async getPreferred(): Promise<FundingAccount | null> {
    const { data, error } = await this.supabase
      .from("funding_accounts")
      .select("*")
      .eq("status", "active")
      .order("is_preferred", { ascending: false })
      .order("display_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(input: FundingAccountInput): Promise<FundingAccount> {
    const accountNumber = normalizeAccountNumber(input.accountNumber);
    assertValidAccountNumber(accountNumber);

    if (input.isPreferred) {
      await this.clearPreferred();
    }

    const { data, error } = await this.supabase
      .from("funding_accounts")
      .insert({
        bank_name: input.bankName.trim(),
        account_name: input.accountName.trim(),
        account_number: accountNumber,
        sort_code: input.sortCode?.trim() || null,
        display_name: input.displayName?.trim() || null,
        funding_instructions: input.fundingInstructions?.trim() || null,
        display_order: input.displayOrder ?? 0,
        status: input.status ?? "active",
        is_preferred: input.isPreferred ?? false,
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, input: Partial<FundingAccountInput>): Promise<FundingAccount> {
    if (input.isPreferred) {
      await this.clearPreferred(id);
    }

    const patch: Database["public"]["Tables"]["funding_accounts"]["Update"] = {
      updated_at: new Date().toISOString()
    };

    if (input.bankName !== undefined) patch.bank_name = input.bankName.trim();
    if (input.accountName !== undefined) patch.account_name = input.accountName.trim();
    if (input.accountNumber !== undefined) {
      const accountNumber = normalizeAccountNumber(input.accountNumber);
      assertValidAccountNumber(accountNumber);
      patch.account_number = accountNumber;
    }
    if (input.sortCode !== undefined) patch.sort_code = input.sortCode?.trim() || null;
    if (input.displayName !== undefined) patch.display_name = input.displayName?.trim() || null;
    if (input.fundingInstructions !== undefined) {
      patch.funding_instructions = input.fundingInstructions?.trim() || null;
    }
    if (input.displayOrder !== undefined) patch.display_order = input.displayOrder;
    if (input.status !== undefined) patch.status = input.status;
    if (input.isPreferred !== undefined) patch.is_preferred = input.isPreferred;

    const { data, error } = await this.supabase.from("funding_accounts").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return data;
  }

  async setPreferred(id: string): Promise<FundingAccount> {
    await this.clearPreferred(id);
    return this.update(id, { isPreferred: true, status: "active" });
  }

  async delete(id: string): Promise<void> {
    const { count, error: countError } = await this.supabase
      .from("funding_accounts")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;
    if ((count ?? 0) <= 1) {
      throw new AppError("At least one funding account must remain.", 400, "LAST_ACCOUNT");
    }

    const { error } = await this.supabase.from("funding_accounts").delete().eq("id", id);
    if (error) throw error;
  }

  private async clearPreferred(exceptId?: string) {
    let query = this.supabase.from("funding_accounts").update({ is_preferred: false, updated_at: new Date().toISOString() });
    if (exceptId) query = query.neq("id", exceptId);
    const { error } = await query.eq("is_preferred", true);
    if (error) throw error;
  }
}
