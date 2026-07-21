import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { COMPANY } from "@/lib/company";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <BrandLogo variant="icon" href="/" />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Alto Rich</p>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)]">This page isn&apos;t available</h1>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          That link may have moved. Return to your dashboard, or continue from the home page.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/dashboard">
          <Button type="button">Return to dashboard</Button>
        </Link>
        <Link href="/">
          <Button type="button" variant="outline">
            Go home
          </Button>
        </Link>
        <a href={`mailto:${COMPANY.supportEmail}`}>
          <Button type="button" variant="ghost">
            Contact support
          </Button>
        </a>
      </div>
    </main>
  );
}
