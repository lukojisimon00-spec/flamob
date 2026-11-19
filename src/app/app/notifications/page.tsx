import { requireClient } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Card } from "@/components/ui/card";
import { MarkAllRead, NotificationList } from "@/components/domain/NotificationList";

export const metadata = { title: "Notifications" };

export default async function Notifications() {
  const user = await requireClient();
  const items = readDb().notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
  return (
    <>
      <PageHeader title="Notifications" action={items.some((n) => !n.readAt) ? <MarkAllRead /> : undefined} />
      <Card className="overflow-hidden"><NotificationList items={items} /></Card>
    </>
  );
}
