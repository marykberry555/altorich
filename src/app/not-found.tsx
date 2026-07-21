import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { COMPANY } from "@/lib/company";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">404</p>
      <h1 className="text-2xl font-bold text-[var(--heading)]">Page not found</h1>
      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
        We couldn&apos;t find that page. Your account and funds are unaffected. Try the dashboard or return home.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/dashboard">
          <Button type="button">Dashboard</Button>
        </Link>
        <Link href="/">
          <Button type="button" variant="outline">
            Home
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
