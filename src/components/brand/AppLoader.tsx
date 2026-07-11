import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

export function AppLoader({ className, compact = false }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-3 px-6 py-8" : "min-h-screen gap-5 px-6 py-12",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative">
        <div
          className="absolute inset-0 animate-[loader-ring_2.4s_ease-in-out_infinite] rounded-full bg-[var(--emerald)]/10"
          aria-hidden
        />
        <span className="brand-plate relative inline-flex items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-md)] ring-1 ring-[var(--border)]">
          <Image
            src={BRAND.icon.light}
            alt=""
            width={72}
            height={72}
            priority
            className="brand-logo-light h-16 w-16 object-contain sm:h-[4.5rem] sm:w-[4.5rem]"
          />
          <Image
            src={BRAND.icon.dark}
            alt=""
            width={72}
            height={72}
            aria-hidden
            className="brand-logo-dark h-16 w-16 object-contain sm:h-[4.5rem] sm:w-[4.5rem]"
          />
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-xl font-bold tracking-tight text-[var(--heading)] sm:text-2xl">Alto Rich</p>
        <p className="text-sm font-semibold text-[var(--emerald)]">Hold On...</p>
        <p className="max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
          Loading your secure investment dashboard.
        </p>
      </div>

      <div className="flex items-center gap-1.5 pt-1" aria-hidden>
        <span className="h-2 w-2 animate-[loader-dot_1.2s_ease-in-out_infinite] rounded-full bg-[var(--emerald)]" />
        <span className="h-2 w-2 animate-[loader-dot_1.2s_ease-in-out_0.15s_infinite] rounded-full bg-[var(--emerald-mid)]" />
        <span className="h-2 w-2 animate-[loader-dot_1.2s_ease-in-out_0.3s_infinite] rounded-full bg-[var(--gold)]" />
      </div>
    </div>
  );
}
