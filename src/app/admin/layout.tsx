import { AdminShell } from "@/components/layout/Shells";
import type { NavItem } from "@/components/layout/NavLinks";
import { requireRole } from "@/lib/auth/session";
import { can, type Permission } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { unreadCount } from "@/lib/domain/notifications";
import { adminLevelLabel } from "@/lib/labels";

const groups: { title: string; items: (NavItem & { perm: Permission })[] }[] = [
  { title: "Pilotage", items: [
    { href: "/admin", label: "Tableau de bord", icon: "home", exact: true, perm: "dashboard.read" },
    { href: "/admin/operations", label: "Opérations", icon: "receipt", perm: "operations.read" },
    { href: "/admin/demandes", label: "Demandes", icon: "file", perm: "applications.read" },
    { href: "/admin/incidents", label: "Incidents", icon: "alert", perm: "incidents.read" },
  ] },
  { title: "Réseau", items: [
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "users", perm: "users.read" },
    { href: "/admin/agents", label: "Agents", icon: "user", perm: "agents.read" },
    { href: "/admin/points", label: "Points de service", icon: "store", perm: "agents.read" },
    { href: "/admin/banques", label: "Banques", icon: "bank", perm: "dashboard.read" },
    { href: "/admin/commissions", label: "Commissions", icon: "percent", perm: "commissions.read" },
  ] },
  { title: "Configuration", items: [
    { href: "/admin/notifications", label: "Notifications", icon: "megaphone", perm: "dashboard.read" },
    { href: "/admin/parametres", label: "Paramètres", icon: "settings", perm: "dashboard.read" },
    { href: "/admin/roles", label: "Rôles et permissions", icon: "key", perm: "dashboard.read" },
    { href: "/admin/journal", label: "Journal d'activité", icon: "journal", perm: "audit.read" },
  ] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  const visible = groups.map((g) => ({ title: g.title, items: g.items.filter((i) => can(user, i.perm)).map(({ perm: _p, ...i }) => i) })).filter((g) => g.items.length);
  return (
    <AdminShell groups={visible} user={`${user.firstName} ${user.lastName}`} levelLabel={user.adminLevel ? adminLevelLabel[user.adminLevel] : ""} unread={unreadCount(readDb(), user.id)}>
      {children}
    </AdminShell>
  );
}
