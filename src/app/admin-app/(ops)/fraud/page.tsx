import { FraudDetectionCenter } from "@/components/admin-ops/FraudDetectionCenter";

export const dynamic = "force-dynamic";

export default function AdminFraudPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Compliance</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Fraud detection center</h1>
        <p className="mt-2 text-sm text-zinc-400">Surface intelligence for administrator review. No automatic enforcement.</p>
      </header>
      <FraudDetectionCenter />
    </div>
  );
}
