import { BrandLogoStatic } from "@/components/brand/BrandLogoStatic";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--surface)]">
      <BrandLogoStatic variant="icon" priority />
      <p className="text-sm text-[var(--text-muted)]">Loading…</p>
    </div>
  );
}
