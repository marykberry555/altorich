import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  const services = await getUserServices();
  const notifications =
    user && services ? await services.notifications.listForUser(user.id, 50).catch(() => []) : [];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHero eyebrow="Notifications" title="Alerts & updates" description="Funding approvals, withdrawal status, and platform announcements." />

      {notifications.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="You're all caught up"
            description="When your funding is verified or withdrawals are processed, alerts will appear here."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} variant="elevated">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[var(--heading)]">{n.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{n.body}</p>
                  <p className="mt-2 text-xs text-[var(--text-subtle)]">
                    {new Date(n.created_at).toLocaleString("en-NG")}
                  </p>
                </div>
                {!n.read_at ? <Badge variant="gold">New</Badge> : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
