import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
  /** Member-facing status line — keep calm and intentional. */
  message?: string;
};

export function AppLoader({
  className,
  compact = false,
  message = "Loading your account…"
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-3 px-6 py-8" : "min-h-screen gap-4 px-6 py-12",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Image
        src={BRAND.icon.light}
        alt=""
        width={64}
        height={64}
        priority
        className="brand-logo-light h-16 w-16 object-contain"
      />
      <Image
        src={BRAND.icon.dark}
        alt=""
        width={64}
        height={64}
        aria-hidden
        className="brand-logo-dark h-16 w-16 object-contain"
      />

      <p className="text-xl font-bold tracking-tight text-[var(--heading)]">Alto Rich</p>
      <p className="sr-only">Loading</p>
      <p className="text-sm text-[var(--text-muted)]" aria-hidden>
        {message}
      </p>
    </div>
  );
}
