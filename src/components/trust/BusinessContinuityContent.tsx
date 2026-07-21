import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { COMPANY } from "@/lib/company";

export function BusinessContinuityContent() {
  return (
    <div className="prose-ar space-y-8">
      <section>
        <h2>Our commitment</h2>
        <p>
          {COMPANY.legalName} operates {COMPANY.brand} with professional controls designed to keep member services
          available, recoverable, and clearly communicated during disruptions. This page explains our approach without
          exposing sensitive infrastructure details.
        </p>
      </section>

      <div className="not-prose grid gap-4 sm:grid-cols-2">
        <Card variant="elevated" padding="md">
          <h3 className="font-semibold text-[var(--heading)]">Platform monitoring</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Core services are monitored for availability and error rates. Public status is published on the{" "}
            <Link href="/status" className="font-semibold text-[var(--emerald)] hover:underline">
              system status page
            </Link>
            .
          </p>
        </Card>
        <Card variant="elevated" padding="md">
          <h3 className="font-semibold text-[var(--heading)]">Backups</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Member and financial records are backed up on a scheduled basis using enterprise cloud infrastructure.
            Recovery procedures are tested as part of operational readiness.
          </p>
        </Card>
        <Card variant="elevated" padding="md">
          <h3 className="font-semibold text-[var(--heading)]">Operational continuity</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Critical workflows — authentication, wallet ledger, deposit review, and settlement — are designed with
            redundancy and auditability. Manual fallback procedures exist for exceptional circumstances.
          </p>
        </Card>
        <Card variant="elevated" padding="md">
          <h3 className="font-semibold text-[var(--heading)]">Incident response</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Security and service incidents follow a documented response plan including containment, member
            communication, and post-incident review.
          </p>
        </Card>
        <Card variant="elevated" padding="md">
          <h3 className="font-semibold text-[var(--heading)]">Recovery procedures</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Service restoration prioritises authentication, read-only account access, and settlement integrity before
            non-essential features.
          </p>
        </Card>
        <Card variant="elevated" padding="md">
          <h3 className="font-semibold text-[var(--heading)]">Service availability</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Scheduled maintenance is communicated in advance where practicable. Unplanned outages are posted to the status
            page and member announcements when they affect core services.
          </p>
        </Card>
      </div>

      <section>
        <h2>Communication during incidents</h2>
        <p>
          Members may receive in-app announcements, email updates, or banner notices on the website depending on severity.
          For security advisories affecting your account, check the Security Center and contact {COMPANY.supportEmail}{" "}
          if you notice unauthorised activity.
        </p>
      </section>
    </div>
  );
}
