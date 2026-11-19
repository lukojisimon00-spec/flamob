import { MobileShell } from "@/components/layout/Shells";
import type { NavItem } from "@/components/layout/NavLinks";
import { requireAgent } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { unreadCount } from "@/lib/domain/notifications";

const nav: NavItem[] = [
  { href: "/agent", label: "Tableau", icon: "home", exact: true },
  { href: "/agent/operations", label: "Opérations", icon: "list" },
  { href: "/agent/tresorerie", label: "Trésorerie", icon: "wallet" },
  { href: "/agent/commissions", label: "Commissions", icon: "percent" },
  { href: "/agent/profil", label: "Profil", icon: "user" },
];

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAgent();
  return <MobileShell home="/agent" nav={nav} badge="Agent" notificationsHref="/agent/notifications" unread={unreadCount(readDb(), user.id)}>{children}</MobileShell>;
}
