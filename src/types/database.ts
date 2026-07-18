export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TableRelationships = [];

type TableStub = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: TableRelationships;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          invite_code: string;
          referred_by: string | null;
          vip_level: number;
          avatar_url: string | null;
          notification_preferences: Json;
          kyc_status: "pending" | "approved" | "rejected" | "requires_update";
          kyc_reviewed_at: string | null;
          kyc_rejection_reason: string | null;
          bvn_reference: string | null;
          nin_reference: string | null;
          username: string | null;
          pin_hash: string | null;
          email_verified_at: string | null;
          must_change_pin: boolean;
          must_change_password: boolean;
          preferred_package_slug: string | null;
          location_state_code: string | null;
          location_city_area: string | null;
          account_status: "active" | "paused" | "disabled" | "deactivated";
          auto_weekly_payout: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string | null;
          invite_code: string;
          referred_by?: string | null;
          vip_level?: number;
          avatar_url?: string | null;
          notification_preferences?: Json;
          kyc_status?: "pending" | "approved" | "rejected" | "requires_update";
          username?: string | null;
          pin_hash?: string | null;
          email_verified_at?: string | null;
          must_change_pin?: boolean;
          must_change_password?: boolean;
          preferred_package_slug?: string | null;
          location_state_code?: string | null;
          location_city_area?: string | null;
          account_status?: "active" | "paused" | "disabled" | "deactivated";
          auto_weekly_payout?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]> & {
          notification_preferences?: Json;
          kyc_reviewed_at?: string | null;
          kyc_rejection_reason?: string | null;
          bvn_reference?: string | null;
          nin_reference?: string | null;
          username?: string | null;
          pin_hash?: string | null;
          email_verified_at?: string | null;
          must_change_pin?: boolean;
          must_change_password?: boolean;
          preferred_package_slug?: string | null;
          location_state_code?: string | null;
          location_city_area?: string | null;
          auto_weekly_payout?: boolean;
        };
        Relationships: TableRelationships;
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallets"]["Insert"]>;
        Relationships: TableRelationships;
      };
      wallet_transactions: {
        Row: {
          id: string;
          wallet_id: string;
          type: "credit" | "debit";
          amount: number;
          reference: string;
          reason: string;
          status: "pending" | "completed" | "failed" | "reversed";
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          wallet_id: string;
          type: "credit" | "debit";
          amount: number;
          reference: string;
          reason: string;
          status?: "pending" | "completed" | "failed" | "reversed";
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_transactions"]["Insert"]>;
        Relationships: TableRelationships;
      };
      investment_plans: {
        Row: {
          id: string;
          slug: string;
          name: string;
          tier: string;
          category: string;
          price: number;
          min_investment: number;
          max_investment: number;
          currency: string;
          cycle_days: number;
          projected_daily: number;
          first_bonus: number;
          description: string;
          settlement_frequency: "daily" | "weekly" | "monthly" | "maturity";
          plan_status: "draft" | "active" | "paused" | "archived";
          risk_disclosure: string;
          weekly_roi_bps: number | null;
          visibility: "public" | "members" | "hidden";
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: TableRelationships;
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          amount: number;
          status: "pending" | "active" | "stopping" | "stopped" | "completed" | "cancelled" | "matured" | "closed";
          reference: string | null;
          settlement_frequency: "daily" | "weekly" | "monthly" | "maturity" | null;
          total_earned: number;
          auto_reinvest: boolean;
          stop_requested_at: string | null;
          weekly_roi_bps: number | null;
          last_weekly_settlement_at: string | null;
          started_at: string;
          ends_at: string;
          matured_at: string | null;
          closed_at: string | null;
          wallet_transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: TableRelationships;
      };
      deposits: {
        Row: {
          id: string;
          user_id: string | null;
          member_name: string;
          phone: string;
          amount: number;
          reference: string;
          receipt_note: string;
          proof_url: string | null;
          status: "pending" | "approved" | "rejected" | "completed";
          rejection_reason: string | null;
          reviewed_by: string | null;
          wallet_transaction_id: string | null;
          payment_provider: "bank_transfer" | "paystack" | "flutterwave" | "monnify" | null;
          payment_transaction_id: string | null;
          provider_reference: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          member_name: string;
          phone: string;
          amount: number;
          reference: string;
          receipt_note?: string;
          proof_url?: string | null;
          status?: "pending" | "approved" | "rejected" | "completed";
          payment_provider?: "bank_transfer" | "paystack" | "flutterwave" | "monnify";
        };
        Update: Partial<Database["public"]["Tables"]["deposits"]["Insert"]> & {
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          wallet_transaction_id?: string | null;
          rejection_reason?: string | null;
          payment_transaction_id?: string | null;
          provider_reference?: string | null;
        };
        Relationships: TableRelationships;
      };
      withdrawals: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          bank_account_id: string | null;
          bank_name: string;
          account_name: string;
          account_number: string;
          status: "scheduled" | "pending" | "approved" | "paid" | "rejected" | "cancelled";
          rejection_reason: string | null;
          reviewed_by: string | null;
          wallet_transaction_id: string | null;
          request_type: "manual" | "automatic";
          scheduled_at: string | null;
          note: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          user_id: string;
          amount: number;
          bank_name: string;
          account_name: string;
          account_number: string;
          bank_account_id?: string | null;
          status?: "scheduled" | "pending" | "approved" | "paid" | "rejected" | "cancelled";
          request_type?: "manual" | "automatic";
          scheduled_at?: string | null;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["withdrawals"]["Insert"]> & {
          status?: "pending" | "approved" | "paid" | "rejected" | "cancelled";
        };
        Relationships: TableRelationships;
      };
      settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>;
        Relationships: TableRelationships;
      };
      vip_levels: TableStub;
      referrals: TableStub;
      referral_rewards: TableStub;
      referral_payouts: TableStub;
      funding_accounts: {
        Row: {
          id: string;
          bank_name: string;
          account_name: string;
          account_number: string;
          sort_code: string | null;
          display_name: string | null;
          funding_instructions: string | null;
          display_order: number;
          status: "active" | "inactive" | "maintenance";
          is_preferred: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bank_name: string;
          account_name: string;
          account_number: string;
          sort_code?: string | null;
          display_name?: string | null;
          funding_instructions?: string | null;
          display_order?: number;
          status?: "active" | "inactive" | "maintenance";
          is_preferred?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["funding_accounts"]["Insert"]>;
        Relationships: TableRelationships;
      };
      bank_accounts: {
        Row: {
          id: string;
          user_id: string;
          bank_name: string;
          account_name: string;
          account_number: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          bank_name: string;
          account_name: string;
          account_number: string;
          is_default?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["bank_accounts"]["Insert"]>;
        Relationships: TableRelationships;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          channel: "in_app" | "email" | "sms" | "whatsapp" | "push";
          metadata: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          channel?: "in_app" | "email" | "sms" | "whatsapp" | "push";
          metadata?: Json;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: TableRelationships;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
        };
        Update: never;
        Relationships: TableRelationships;
      };
      login_activity: {
        Row: {
          id: string;
          user_id: string;
          ip_address: string | null;
          user_agent: string | null;
          device_type: string | null;
          browser: string | null;
          operating_system: string | null;
          city: string | null;
          region: string | null;
          country: string | null;
          isp: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ip_address?: string | null;
          user_agent?: string | null;
          device_type?: string | null;
          browser?: string | null;
          operating_system?: string | null;
          city?: string | null;
          region?: string | null;
          country?: string | null;
          isp?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["login_activity"]["Insert"]>;
        Relationships: TableRelationships;
      };
      admin_notifications: {
        Row: {
          id: string;
          event_type: string;
          title: string;
          body: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          title: string;
          body: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["admin_notifications"]["Insert"]>;
        Relationships: TableRelationships;
      };
      admin_push_subscriptions: {
        Row: {
          id: string;
          admin_user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["admin_push_subscriptions"]["Insert"]>;
        Relationships: TableRelationships;
      };
      admin_notes: {
        Row: {
          id: string;
          member_id: string;
          author_id: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          author_id: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_notes"]["Insert"]>;
        Relationships: TableRelationships;
      };
      security_events: {
        Row: {
          id: string;
          event_type: string;
          user_id: string | null;
          ip_address: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          user_id?: string | null;
          ip_address?: string | null;
          metadata?: Json;
        };
        Update: never;
        Relationships: TableRelationships;
      };
      application_errors: {
        Row: {
          id: string;
          reference_id: string;
          category: string;
          status: "open" | "investigating" | "resolved" | "ignored";
          message: string;
          user_message: string | null;
          code: string | null;
          user_id: string | null;
          route: string | null;
          action: string | null;
          request_id: string | null;
          correlation_id: string | null;
          environment: string | null;
          browser: string | null;
          device: string | null;
          user_agent: string | null;
          stack: string | null;
          metadata: Json;
          resolved_at: string | null;
          resolved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reference_id: string;
          category?: string;
          status?: "open" | "investigating" | "resolved" | "ignored";
          message: string;
          user_message?: string | null;
          code?: string | null;
          user_id?: string | null;
          route?: string | null;
          action?: string | null;
          request_id?: string | null;
          correlation_id?: string | null;
          environment?: string | null;
          browser?: string | null;
          device?: string | null;
          user_agent?: string | null;
          stack?: string | null;
          metadata?: Json;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          status?: "open" | "investigating" | "resolved" | "ignored";
          resolved_at?: string | null;
          resolved_by?: string | null;
          metadata?: Json;
        };
        Relationships: TableRelationships;
      };
      activity_logs: TableStub;
      admin_roles: TableStub;
      investment_settlements: {
        Row: {
          id: string;
          investment_id: string;
          amount: number;
          scheduled_for: string;
          status: "scheduled" | "paid" | "skipped";
          wallet_transaction_id: string | null;
          created_at: string;
          settled_at: string | null;
        };
        Insert: {
          investment_id: string;
          amount: number;
          scheduled_for: string;
          status?: "scheduled" | "paid" | "skipped";
        };
        Update: Partial<Database["public"]["Tables"]["investment_settlements"]["Insert"]> & {
          wallet_transaction_id?: string | null;
          settled_at?: string | null;
        };
        Relationships: TableRelationships;
      };
      kyc_documents: {
        Row: {
          id: string;
          user_id: string;
          document_type: "government_id" | "selfie" | "proof_of_address";
          storage_path: string;
          status: "pending" | "approved" | "rejected";
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          document_type: "government_id" | "selfie" | "proof_of_address";
          storage_path: string;
          status?: "pending" | "approved" | "rejected";
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["kyc_documents"]["Insert"]> & {
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
        };
        Relationships: TableRelationships;
      };
      payment_transactions: {
        Row: {
          id: string;
          user_id: string;
          deposit_id: string | null;
          provider: "bank_transfer" | "paystack" | "flutterwave" | "monnify";
          reference: string;
          provider_reference: string | null;
          amount: number;
          currency: string;
          status: "initialized" | "pending" | "success" | "failed" | "cancelled" | "abandoned";
          checkout_url: string | null;
          metadata: Json;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          deposit_id?: string | null;
          provider: "bank_transfer" | "paystack" | "flutterwave" | "monnify";
          reference: string;
          amount: number;
          currency?: string;
          status?: "initialized" | "pending" | "success" | "failed" | "cancelled" | "abandoned";
          checkout_url?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["payment_transactions"]["Insert"]> & {
          provider_reference?: string | null;
          verified_at?: string | null;
        };
        Relationships: TableRelationships;
      };
      webhook_events: {
        Row: {
          id: string;
          provider: "bank_transfer" | "paystack" | "flutterwave" | "monnify";
          event_id: string;
          event_type: string;
          reference: string | null;
          payload: Json;
          signature_valid: boolean;
          processed: boolean;
          processed_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          provider: "bank_transfer" | "paystack" | "flutterwave" | "monnify";
          event_id: string;
          event_type: string;
          reference?: string | null;
          payload?: Json;
          signature_valid?: boolean;
          processed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["webhook_events"]["Insert"]> & {
          processed_at?: string | null;
          error_message?: string | null;
        };
        Relationships: TableRelationships;
      };
      roi_tiers: {
        Row: {
          id: string;
          name: string;
          min_ngn: number;
          max_ngn: number;
          weekly_roi_bps: number;
          payout_weekday: number;
          payout_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          min_ngn: number;
          max_ngn: number;
          weekly_roi_bps: number;
          payout_weekday?: number;
          payout_time?: string;
        };
        Update: Partial<Database["public"]["Tables"]["roi_tiers"]["Insert"]>;
        Relationships: TableRelationships;
      };
      roi_investments: {
        Row: {
          id: string;
          user_id: string;
          tier_id: string;
          principal_ngn: number;
          currency: "ngn" | "usdt" | "btc";
          principal_usd: number | null;
          exchange_rate_ngn_per_usd: number | null;
          payout_method: "bank" | "crypto";
          payout_destination: Json;
          status: "active" | "paused" | "closed";
          cycle_started_at: string;
          cycle_ends_at: string;
          accrued_ngn: number;
          last_ticker_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier_id: string;
          principal_ngn: number;
          currency?: "ngn" | "usdt" | "btc";
          principal_usd?: number | null;
          exchange_rate_ngn_per_usd?: number | null;
          payout_method?: "bank" | "crypto";
          payout_destination?: Json;
          status?: "active" | "paused" | "closed";
          cycle_started_at?: string;
          cycle_ends_at: string;
          accrued_ngn?: number;
          last_ticker_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["roi_investments"]["Insert"]>;
        Relationships: TableRelationships;
      };
      roi_payouts: {
        Row: {
          id: string;
          user_id: string;
          investment_id: string;
          amount_ngn: number;
          amount_usd: number | null;
          method: "bank" | "crypto";
          destination_snapshot: Json;
          status: "pending" | "approved" | "rejected" | "paid";
          reviewer_id: string | null;
          rejection_reason: string | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          investment_id: string;
          amount_ngn: number;
          amount_usd?: number | null;
          method: "bank" | "crypto";
          destination_snapshot?: Json;
          status?: "pending" | "approved" | "rejected" | "paid";
          reviewer_id?: string | null;
          rejection_reason?: string | null;
          processed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["roi_payouts"]["Insert"]>;
        Relationships: TableRelationships;
      };
      auth_otps: {
        Row: {
          id: string;
          email: string;
          code: string;
          purpose: "register" | "login_device" | "recover_pin" | "recover_username";
          user_id: string | null;
          expires_at: string;
          consumed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          code: string;
          purpose: "register" | "login_device" | "recover_pin" | "recover_username";
          user_id?: string | null;
          expires_at: string;
          consumed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["auth_otps"]["Insert"]>;
        Relationships: TableRelationships;
      };
      trusted_devices: {
        Row: {
          id: string;
          user_id: string;
          device_fingerprint: string;
          user_agent: string;
          last_seen_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_fingerprint: string;
          user_agent?: string;
          last_seen_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trusted_devices"]["Insert"]>;
        Relationships: TableRelationships;
      };
    };
    Views: Record<string, never>;
    Enums: {
      admin_role: "super_admin" | "admin" | "finance" | "support";
      transaction_type: "credit" | "debit";
      transaction_status: "pending" | "completed" | "failed" | "reversed";
      deposit_status: "pending" | "approved" | "rejected" | "completed";
      withdrawal_status: "pending" | "approved" | "paid" | "rejected" | "cancelled";
      investment_status: "pending" | "active" | "stopping" | "stopped" | "completed" | "cancelled" | "matured" | "closed";
      settlement_frequency: "daily" | "weekly" | "monthly" | "maturity";
      notification_channel: "in_app" | "email" | "sms" | "whatsapp" | "push";
      kyc_status: "pending" | "approved" | "rejected" | "requires_update";
      payment_provider: "bank_transfer" | "paystack" | "flutterwave" | "monnify";
      payment_status: "initialized" | "pending" | "success" | "failed" | "cancelled" | "abandoned";
      investment_currency: "ngn" | "usdt" | "btc";
      payout_method: "bank" | "crypto";
      auth_otp_purpose: "register" | "login_device" | "recover_pin" | "recover_username";
      funding_account_status: "active" | "inactive" | "maintenance";
      member_account_status: "active" | "paused" | "disabled" | "deactivated";
    };
    CompositeTypes: Record<string, never>;
    Functions: {
      wallet_balance: { Args: { p_wallet_id: string }; Returns: number };
      has_admin_role: { Args: { check_role?: string }; Returns: boolean };
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Deposit = Database["public"]["Tables"]["deposits"]["Row"];
export type Withdrawal = Database["public"]["Tables"]["withdrawals"]["Row"];
export type InvestmentPlan = Database["public"]["Tables"]["investment_plans"]["Row"];
export type WalletTransaction = Database["public"]["Tables"]["wallet_transactions"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
