import { PAUSED_BANNER_MESSAGE } from "@/lib/account-status/policy";

export function AccountPausedBanner({ status }: { status?: string | null }) {
  if (String(status ?? "").toLowerCase() !== "paused") return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
    >
      {PAUSED_BANNER_MESSAGE}
    </div>
  );
}
