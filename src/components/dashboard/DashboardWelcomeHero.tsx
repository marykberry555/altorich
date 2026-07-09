import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/company";
import { getGreeting, getInitials } from "@/lib/utils/avatar";

type Props = {
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
  announcement?: string;
  className?: string;
};

export function DashboardWelcomeHero({ fullName, email, avatarUrl, announcement, className }: Props) {
  const initials = getInitials(fullName);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow-sm)]",
        className
      )}
      aria-label="Welcome"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--emerald)_0%,transparent_42%),linear-gradient(225deg,rgba(212,168,83,0.12)_0%,transparent_55%)] opacity-[0.15]"
        aria-hidden
      />
      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="relative shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-[var(--emerald)]/20 sm:h-[4.5rem] sm:w-[4.5rem]" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--emerald-soft)] text-base font-semibold text-[var(--emerald)] ring-2 ring-[var(--emerald)]/20 sm:h-[4.5rem] sm:w-[4.5rem]">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
            {COMPANY.brand} · Member
          </p>
          <p className="mt-1 truncate text-xl font-semibold tracking-tight text-[var(--heading)] sm:text-2xl">{fullName}</p>
          {email ? <p className="mt-0.5 truncate text-sm text-[var(--text-muted)]">{email}</p> : null}
          <p className="mt-2 text-sm font-medium text-[var(--text-muted)]">{getGreeting()}</p>
          {announcement ? (
            <p className="mt-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--gray-50)]/80 px-3 py-2 text-sm text-[var(--text-muted)]">
              {announcement}
            </p>
          ) : null}
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[var(--gold-light)]/80 to-transparent" aria-hidden />
    </section>
  );
}
