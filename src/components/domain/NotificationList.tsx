import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/feedback";
import type { AppNotification, NotificationType } from "@/lib/db/schema";
import { notificationTypeLabel } from "@/lib/labels";
import { relativeTime } from "@/lib/format";
import { markNotificationsReadAction } from "@/app/actions/client";

const icons: Record<NotificationType, IconName> = {
  application: "file", status: "refresh", operation: "receipt", info: "info", security: "shield", support: "help", liquidity: "alert",
};

export function NotificationList({ items, compact = false }: { items: AppNotification[]; compact?: boolean }) {
  if (!items.length) return <EmptyState icon="bell" title="Aucune notification">Vous serez averti ici des changements de statut et des opérations simulées.</EmptyState>;
  return (
    <ul className="divide-y divide-line">
      {items.map((n) => (
        <li key={n.id} className={`flex gap-3 px-4 py-3.5 ${n.readAt ? "" : "bg-cyan-50/60"}`}>
          <span className={`grid size-9 shrink-0 place-items-center rounded-full ${n.type === "liquidity" || n.type === "security" ? "bg-warning-bg text-warning" : "bg-navy-50 text-navy-700"}`}>
            <Icon name={icons[n.type]} size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{n.title}</p>
              {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-cyan" aria-label="Non lue" />}
            </div>
            <p className={`mt-0.5 text-sm text-ink-soft ${compact ? "line-clamp-2" : ""}`}>{n.body}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span>{notificationTypeLabel[n.type]} · {relativeTime(n.createdAt)}</span>
              {n.link && <Link href={n.link} className="font-semibold text-cyan-700 hover:underline">Voir</Link>}
              {!n.readAt && !compact && (
                <form action={markNotificationsReadAction}><input type="hidden" name="id" value={n.id} /><button className="font-semibold text-cyan-700 hover:underline">Marquer comme lue</button></form>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MarkAllRead() {
  return (
    <form action={markNotificationsReadAction}>
      <input type="hidden" name="id" value="all" />
      <button className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 text-sm font-semibold text-navy hover:bg-navy-50"><Icon name="check" size={16} />Tout marquer comme lu</button>
    </form>
  );
}
