import type { Announcement, AppNotification, Audience, Database, NotificationType } from "../db/schema";
import { newId } from "../ids";
import { assert } from "../errors";
import { audit } from "./audit";

export function notify(
  db: Database,
  userId: string,
  n: { type: NotificationType; title: string; body: string; link?: string; announcementId?: string },
  now: Date,
): AppNotification {
  const notification: AppNotification = { id: newId(), userId, createdAt: now.toISOString(), ...n };
  db.notifications.push(notification);
  return notification;
}

export function notifyAdmins(db: Database, n: Parameters<typeof notify>[2], now: Date) {
  for (const u of db.users) if (u.role === "admin" && u.status === "active") notify(db, u.id, n, now);
}

export function markRead(db: Database, userId: string, notificationId: string | "all", now: Date) {
  for (const n of db.notifications) {
    if (n.userId === userId && !n.readAt && (notificationId === "all" || n.id === notificationId)) n.readAt = now.toISOString();
  }
}

export function unreadCount(db: Database, userId: string) {
  return db.notifications.filter((n) => n.userId === userId && !n.readAt).length;
}

const audienceRoles: Record<Audience, string[]> = {
  all: ["client", "agent", "admin"],
  clients: ["client"],
  agents: ["agent"],
  admins: ["admin"],
};

export function saveAnnouncement(
  db: Database,
  input: { id?: string; title: string; body: string; audience: Audience },
  actorUserId: string,
  now: Date,
): Announcement {
  const iso = now.toISOString();
  if (input.id) {
    const a = db.announcements.find((x) => x.id === input.id);
    assert(a, "Notification introuvable.");
    assert(a.status === "draft", "Une notification publiée ne peut plus être modifiée.");
    Object.assign(a, { title: input.title, body: input.body, audience: input.audience, updatedAt: iso });
    audit(db, { actorUserId, action: "announcement.update", entity: "announcement", entityId: a.id }, now);
    return a;
  }
  const a: Announcement = {
    id: newId(), title: input.title, body: input.body, audience: input.audience, status: "draft",
    createdByUserId: actorUserId, createdAt: iso, updatedAt: iso,
  };
  db.announcements.push(a);
  audit(db, { actorUserId, action: "announcement.create", entity: "announcement", entityId: a.id }, now);
  return a;
}

export function publishAnnouncement(db: Database, id: string, actorUserId: string, now: Date): number {
  const a = db.announcements.find((x) => x.id === id);
  assert(a, "Notification introuvable.");
  assert(a.status === "draft", "Cette notification est déjà publiée.");
  const roles = audienceRoles[a.audience];
  const targets = db.users.filter((u) => roles.includes(u.role) && u.status === "active");
  for (const u of targets) notify(db, u.id, { type: "info", title: a.title, body: a.body, announcementId: a.id }, now);
  a.status = "published";
  a.publishedAt = now.toISOString();
  a.updatedAt = a.publishedAt;
  a.recipients = targets.length;
  audit(db, { actorUserId, action: "announcement.publish", entity: "announcement", entityId: a.id, details: `${targets.length} destinataires` }, now);
  return targets.length;
}
