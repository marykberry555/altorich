import Link from "next/link";
import { Bell } from "lucide-react";
import { DashboardPanelCard } from "@/components/design-system";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export function DashboardNotificationsPreview({
  notifications,
  unreadCount
}: {
  notifications: NotificationRow[];
  unreadCount: number;
}) {
  return (
    <DashboardPanelCard title="Latest notifications" href="/notifications" viewLabel="View all alerts" accent="slate">
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gray-100)]">
            <Bell className="h-5 w-5 text-[var(--text-subtle)]" aria-hidden />
          </div>
          <p className="text-sm font-medium text-[var(--heading)]">You&apos;re all caught up.</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Funding and payout updates will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li key={n.id} className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)]/40 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--heading)]">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-[var(--text-muted)]">{n.body}</p>
                  <p className="mt-1.5 text-xs text-[var(--text-subtle)]">
                    {new Date(n.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                {!n.read_at ? <Badge variant="gold">New</Badge> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {unreadCount > 0 ? (
        <Link href="/notifications" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            {unreadCount} unread alert{unreadCount === 1 ? "" : "s"}
          </Button>
        </Link>
      ) : null}
    </DashboardPanelCard>
  );
}
