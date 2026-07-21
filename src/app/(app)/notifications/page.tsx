import { NotificationCenter } from "@/components/financial/NotificationCenter";
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
        <p className="text-sm text-[var(--text-muted)]">Funding, withdrawals, investment, and security updates.</p>
      </header>

      <NotificationCenter
        notifications={notifications.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          created_at: n.created_at,
          read_at: n.read_at,
          metadata: (n.metadata ?? null) as Record<string, unknown> | null
        }))}
      />
    </div>
  );
}
