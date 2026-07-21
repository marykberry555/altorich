import Link from "next/link";
import { Lock, Shield, Eye, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { COMPANY } from "@/lib/company";

export function PublicSecurityCenterContent() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Lock, title: "Encrypted connections", body: "HTTPS/TLS protects data in transit across the platform." },
          { icon: Shield, title: "Account protection", body: "Secure credentials, trusted devices, and activity monitoring." },
          { icon: Eye, title: "Transparency", body: "Status updates and clear communication during incidents." },
          { icon: FileText, title: "Compliance", body: "Policies and disclosures published in our Compliance Hub." }
        ].map((item) => (
          <Card key={item.title} variant="elevated" padding="md" className="h-full">
            <item.icon size={20} className="text-[var(--emerald)]" aria-hidden />
            <h2 className="mt-3 font-semibold text-[var(--heading)]">{item.title}</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{item.body}</p>
          </Card>
        ))}
      </div>

      <Card variant="elevated" padding="md">
        <h2 className="font-semibold text-[var(--heading)]">For members</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Signed-in members can review email verification status, login history, trusted devices, and a full account
          activity timeline in the member Security Center.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/login">
            <Button>Sign in to Security Center</Button>
          </Link>
          <Link href="/security">
            <Button variant="outline">Member Security Center</Button>
          </Link>
        </div>
      </Card>

      <Card variant="elevated" padding="md">
        <h2 className="font-semibold text-[var(--heading)]">Report a concern</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Email {COMPANY.supportEmail} with subject &quot;Security Report&quot; for suspicious activity, phishing attempts, or
          vulnerability disclosures. Read our{" "}
          <Link href="/legal/security" className="font-semibold text-[var(--emerald)] hover:underline">
            Security Policy
          </Link>{" "}
          for responsible disclosure guidelines.
        </p>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/compliance">
          <Button variant="outline">Compliance Hub</Button>
        </Link>
        <Link href="/business-continuity">
          <Button variant="ghost">Business continuity</Button>
        </Link>
        <Link href="/status">
          <Button variant="ghost">System status</Button>
        </Link>
      </div>
    </div>
  );
}
