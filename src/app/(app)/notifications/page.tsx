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

  if (user && services) {
    const unread = notifications.filter((n) => !n.read_at);
    await Promise.all(
      unread.map((n) => services.notifications.markRead(n.id, user.id).catch(() => undefined))
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">Notifications</h1>
        <p className="text-sm text-[var(--text-muted)]">Funding, withdrawals, and account updates.</p>
      </header>

      {notifications.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          description="When funding is verified or withdrawals are processed, alerts appear here."
        />
      ) : (
        <div className="space-y-3">
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
