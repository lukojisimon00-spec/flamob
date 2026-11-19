"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icons";

export interface NavItem { href: string; label: string; icon: IconName; exact?: boolean }

const isActive = (path: string, item: NavItem) => (item.exact ? path === item.href : path === item.href || path.startsWith(item.href + "/"));

/** Navigation inférieure mobile (5 entrées max), cibles tactiles ≥ 48 px. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-safe md:hidden">
      <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((it) => {
          const on = isActive(path, it);
          return (
            <li key={it.href}>
              <Link href={it.href} aria-current={on ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium ${on ? "text-navy" : "text-muted"}`}>
                <span className={`grid h-7 w-12 place-items-center rounded-full ${on ? "bg-cyan-100 text-navy" : ""}`}><Icon name={it.icon} size={20} /></span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Navigation horizontale (desktop) pour les espaces client et agent. */
export function TopNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Navigation principale" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {items.map((it) => {
          const on = isActive(path, it);
          return (
            <li key={it.href}>
              <Link href={it.href} aria-current={on ? "page" : undefined}
                className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium ${on ? "bg-white/12 text-white" : "text-white/70 hover:text-white"}`}>
                <Icon name={it.icon} size={17} />{it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Barre latérale (admin, desktop) et liste déroulante horizontale (admin, mobile). */
export function SideNav({ groups }: { groups: { title: string; items: NavItem[] }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Navigation d'administration" className="space-y-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-white/45">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const on = isActive(path, it);
              return (
                <li key={it.href}>
                  <Link href={it.href} aria-current={on ? "page" : undefined}
                    className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium ${on ? "bg-cyan text-navy font-semibold" : "text-white/75 hover:bg-white/8 hover:text-white"}`}>
                    <Icon name={it.icon} size={18} />{it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function ScrollNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Navigation d'administration" className="overflow-x-auto border-b border-line bg-surface lg:hidden">
      <ul className="flex min-w-max gap-1 px-3 py-2">
        {items.map((it) => {
          const on = isActive(path, it);
          return (
            <li key={it.href}>
              <Link href={it.href} aria-current={on ? "page" : undefined}
                className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium ${on ? "bg-navy text-white" : "text-ink-soft hover:bg-navy-50"}`}>
                <Icon name={it.icon} size={16} />{it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
