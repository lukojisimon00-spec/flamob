import { MobileShell } from "@/components/layout/Shells";
import type { NavItem } from "@/components/layout/NavLinks";
import { requireClient } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { unreadCount } from "@/lib/domain/notifications";

const nav: NavItem[] = [
  { href: "/app", label: "Accueil", icon: "home", exact: true },
  { href: "/app/banques", label: "Banques", icon: "bank" },
  { href: "/app/agents", label: "Agents", icon: "pin" },
  { href: "/app/activites", label: "Activités", icon: "activity" },
  { href: "/app/profil", label: "Profil", icon: "user" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireClient();
  return (
    <MobileShell home="/app" nav={nav} notificationsHref="/app/notifications" unread={unreadCount(readDb(), user.id)}>
      {children}
    </MobileShell>
  );
}
