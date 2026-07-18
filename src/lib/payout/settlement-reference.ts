import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

/**
 * Generate ALT-YYYYMMDD-NNNNNN via DB function (atomic per WAT day).
 * Falls back to a timestamp-based reference if the RPC is unavailable.
 */
export async function nextSettlementReference(supabase: Client): Promise<string> {
  const { data, error } = await supabase.rpc("next_settlement_reference");
  if (!error && typeof data === "string" && data.startsWith("ALT-")) {
    return data;
  }

  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .format(new Date())
    .replace(/-/g, "");
  const seq = String(Date.now() % 1_000_000).padStart(6, "0");
  return `ALT-${day}-${seq}`;
}
