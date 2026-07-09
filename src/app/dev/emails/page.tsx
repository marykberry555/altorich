import { notFound } from "next/navigation";
import Link from "next/link";
import { getEmailSamples } from "@/lib/email/templates";
import { COMPANY } from "@/lib/company";

export default function EmailSamplesPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const samples = getEmailSamples();

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="container-ar flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Development</p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--heading)]">Email samples</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              From / reply-to: {COMPANY.supportEmail} · {samples.length} templates
            </p>
          </div>
          <Link
            href="/contact"
            className="text-sm font-medium text-[var(--emerald)] hover:underline"
          >
            ← Back to contact form
          </Link>
        </div>
      </header>

      <main className="container-ar space-y-10 py-10">
        {samples.map((sample) => (
          <section key={sample.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            <div className="border-b border-[var(--border)] px-6 py-4">
              <h2 className="font-semibold text-[var(--heading)]">{sample.name}</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Subject: {sample.subject}</p>
            </div>
            <iframe
              title={sample.name}
              srcDoc={sample.html}
              className="h-[640px] w-full border-0 bg-white"
              sandbox=""
            />
          </section>
        ))}
      </main>
    </div>
  );
}
