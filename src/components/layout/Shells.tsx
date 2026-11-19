import Link from "next/link";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/icons";
import { BottomNav, ScrollNav, SideNav, TopNav, type NavItem } from "./NavLinks";
import { logoutAction } from "@/app/actions/auth";

function DemoStrip() {
  return (
    <div className="bg-cyan-50 px-4 py-1.5 text-center text-[0.72rem] font-medium text-cyan-700">
      Prototype — banques fictives, opérations simulées. Aucune somme réelle n&apos;est déplacée.
    </div>
  );
}

function Bell({ href, count }: { href: string; count: number }) {
  return (
    <Link href={href} className="relative grid size-10 place-items-center rounded-full text-white/85 hover:bg-white/10" aria-label={`Notifications${count ? ` (${count} non lues)` : ""}`}>
      <Icon name="bell" size={20} />
      {count > 0 && <span className="absolute right-1 top-1 grid min-w-4.5 place-items-center rounded-full bg-cyan px-1 font-mono text-[0.62rem] font-semibold text-navy">{count > 9 ? "9+" : count}</span>}
    </Link>
  );
}

/** Coque des espaces mobiles (client et agent) : en-tête navy, navigation inférieure sur mobile. */
export function MobileShell({ home, nav, notificationsHref, unread, badge, children }: {
  home: string; nav: NavItem[]; notificationsHref: string; unread: number; badge?: string; children: ReactNode;
}) {
  return (
    <div className="min-h-dvh pb-20 md:pb-8">
      <DemoStrip />
      <header className="sticky top-0 z-30 bg-navy">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href={home} className="flex items-center gap-2" aria-label="Accueil de l'espace">
            <Logo tone="onDark" size={26} className="text-[0.95rem]" />
            {badge && <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-cyan">{badge}</span>}
          </Link>
          <TopNav items={nav} />
          <div className="flex items-center">
            <Bell href={notificationsHref} count={unread} />
            <form action={logoutAction} className="hidden md:block">
              <button className="grid size-10 place-items-center rounded-full text-white/85 hover:bg-white/10" aria-label="Se déconnecter" title="Se déconnecter"><Icon name="logout" size={19} /></button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5 sm:py-7">{children}</main>
      <BottomNav items={nav} />
    </div>
  );
}

/** Coque d'administration : barre latérale sur desktop, menu défilant sur mobile. */
export function AdminShell({ groups, user, levelLabel, unread, children }: {
  groups: { title: string; items: NavItem[] }[]; user: string; levelLabel: string; unread: number; children: ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto bg-navy px-3 py-5 lg:flex">
        <Link href="/admin" className="px-3"><Logo tone="onDark" size={28} /></Link>
        <p className="mt-1 px-3 font-mono text-[0.65rem] uppercase tracking-wider text-cyan">Management</p>
        <div className="mt-6 flex-1"><SideNav groups={groups} /></div>
        <div className="mt-6 rounded-xl bg-white/6 p-3 text-sm text-white">
          <p className="font-semibold">{user}</p>
          <p className="text-xs text-white/60">{levelLabel}</p>
          <form action={logoutAction} className="mt-2"><button className="flex items-center gap-1.5 text-xs font-semibold text-cyan hover:underline"><Icon name="logout" size={14} />Se déconnecter</button></form>
        </div>
      </aside>
      <div className="min-w-0">
        <DemoStrip />
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 bg-navy px-4 lg:hidden">
          <Link href="/admin" className="flex items-center gap-2"><LogoMark tone="onDark" size={26} /><span className="font-mono text-xs uppercase tracking-wider text-cyan">Management</span></Link>
          <div className="flex items-center">
            <Bell href="/admin/notifications?onglet=alertes" count={unread} />
            <form action={logoutAction}><button className="grid size-10 place-items-center rounded-full text-white/85" aria-label="Se déconnecter"><Icon name="logout" size={19} /></button></form>
          </div>
        </header>
        <div className="sticky top-14 z-20 lg:hidden"><ScrollNav items={groups.flatMap((g) => g.items)} /></div>
        <div className="hidden h-14 items-center justify-end gap-2 border-b border-line bg-surface px-6 lg:flex">
          <Link href="/admin/notifications?onglet=alertes" className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-navy-50">
            <Icon name="bell" size={18} />Alertes
            {unread > 0 && <span className="rounded-full bg-cyan px-1.5 font-mono text-[0.68rem] font-semibold text-navy">{unread}</span>}
          </Link>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">{children}</main>
      </div>
    </div>
  );
}
