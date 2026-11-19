import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { PageHeader, Tabs } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { AnnouncementForm } from "@/components/domain/ConfigForms";
import { ConfirmAction } from "@/components/domain/AdminForms";
import { MarkAllRead, NotificationList } from "@/components/domain/NotificationList";
import { publishAnnouncementAction, saveAnnouncementAction } from "@/app/actions/admin";
import { audienceLabel } from "@/lib/labels";
import { formatDateTime, sp } from "@/lib/format";
import { fullName } from "@/lib/domain/users";

export const metadata = { title: "Notifications" };

export default async function NotificationsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const user = await requireRole("admin");
  const manage = can(user, "notifications.manage");
  const db = readDb();
  const tab = sp(q.onglet) === "diffusions" && manage ? "diffusions" : "alertes";
  const mine = db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
  const anns = [...db.announcements].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const editing = anns.find((a) => a.id === sp(q.edit) && a.status === "draft");
  return (
    <>
      <PageHeader title="Notifications" action={tab === "alertes" && mine.some((n) => !n.readAt) ? <MarkAllRead /> : undefined} />
      <Tabs active={tab} tabs={[
        { key: "alertes", href: "/admin/notifications?onglet=alertes", label: "Mes alertes", count: mine.filter((n) => !n.readAt).length },
        ...(manage ? [{ key: "diffusions", href: "/admin/notifications?onglet=diffusions", label: "Diffusions", count: anns.length }] : []),
      ]} />
      {tab === "alertes" ? <Card className="overflow-hidden"><NotificationList items={mine} /></Card> : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <Card>
            <CardHeader title="Historique des diffusions" />
            {anns.length ? (
              <ul className="mt-2 divide-y divide-line">
                {anns.map((a) => (
                  <li key={a.id} className="space-y-2 px-4 py-3.5 sm:px-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><p className="font-semibold">{a.title}</p><p className="text-sm text-ink-soft">{a.body}</p></div>
                      <Badge tone={a.status === "published" ? "success" : "neutral"}>{a.status === "published" ? "Publiée" : "Brouillon"}</Badge>
                    </div>
                    <p className="text-xs text-muted">{audienceLabel[a.audience]} · {fullName(db.users.find((u) => u.id === a.createdByUserId) ?? { firstName: "—", lastName: "" })} · {a.publishedAt ? `publiée le ${formatDateTime(a.publishedAt)} · ${a.recipients} destinataire(s)` : `modifiée le ${formatDateTime(a.updatedAt)}`}</p>
                    {a.status === "draft" && (
                      <div className="flex flex-wrap items-center gap-3">
                        <Link href={`/admin/notifications?onglet=diffusions&edit=${a.id}`} className="text-sm font-semibold text-cyan-700 hover:underline">Modifier</Link>
                        <ConfirmAction action={publishAnnouncementAction} id={`pub-${a.id}`} hidden={{ id: a.id }} trigger="Publier" title="Publier cette notification ?" description={`Elle sera envoyée à : ${audienceLabel[a.audience]}. Une notification publiée ne peut plus être modifiée.`} confirmLabel="Publier" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon="megaphone" title="Aucune diffusion" />}
          </Card>
          <Card><CardHeader title={editing ? "Modifier le brouillon" : "Nouvelle notification"} /><CardBody><AnnouncementForm key={editing?.id ?? "new"} action={saveAnnouncementAction} draft={editing} /></CardBody></Card>
        </div>
      )}
    </>
  );
}
