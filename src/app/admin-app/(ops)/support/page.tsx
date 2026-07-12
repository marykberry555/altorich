import { COMPANY } from "@/lib/company";

export default function AdminAppSupportPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Monitoring</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Support requests</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Member contact submissions are delivered to {COMPANY.supportEmail}. Monitor your operations inbox for new messages.
        </p>
      </header>
      <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-5 text-sm text-zinc-300">
        <p>
          Public contact form messages route to <strong className="text-white">{COMPANY.supportEmail}</strong> via the existing `/api/contact` pipeline.
        </p>
      </div>
    </div>
  );
}
