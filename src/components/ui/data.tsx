import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export function PageHeader({ title, subtitle, back, action }: { title: ReactNode; subtitle?: ReactNode; back?: { href: string; label: string }; action?: ReactNode }) {
  return (
    <header className="mb-5 space-y-2">
      {back && (
        <Link href={back.href} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-navy">
          <Icon name="arrowLeft" size={16} /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.45rem] font-bold leading-tight text-ink sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

export function StatTile({ label, value, hint, icon, tag }: { label: ReactNode; value: ReactNode; hint?: ReactNode; icon?: IconName; tag?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2 text-sm font-medium text-muted">
        <span className="flex items-center gap-2">{icon && <Icon name={icon} size={16} className="text-navy-700" />}{label}</span>
        {tag}
      </div>
      <p className="mt-2 font-mono text-xl font-semibold tabular text-ink sm:text-[1.4rem]">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`whitespace-nowrap font-mono text-[0.85em] tabular ${className}`}>{children}</span>;
}

export function DescriptionList({ items, cols = 1 }: { items: { label: ReactNode; value: ReactNode }[]; cols?: 1 | 2 }) {
  return (
    <dl className={`grid gap-x-6 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>
      {items.map((it, i) => (
        <div key={i} className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
          <dt className="text-sm text-muted">{it.label}</dt>
          <dd className="text-right text-sm font-medium text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Tableau responsive : défilement horizontal sur petit écran, en-têtes collants. */
export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
            {head.map((h, i) => <th key={i} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Tabs({ tabs, active }: { tabs: { href: string; label: ReactNode; key: string; count?: number }[]; active: string }) {
  return (
    <nav className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Onglets">
      <ul className="flex min-w-max gap-1 rounded-[var(--radius-control)] bg-navy-50 p-1">
        {tabs.map((t) => {
          const on = t.key === active;
          return (
            <li key={t.key}>
              <Link href={t.href} aria-current={on ? "page" : undefined}
                className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium ${on ? "bg-surface text-navy shadow-[var(--shadow-card)] font-semibold" : "text-muted hover:text-navy"}`}>
                {t.label}
                {typeof t.count === "number" && <span className="rounded-full bg-canvas px-1.5 font-mono text-[0.7rem]">{t.count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Pagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (p: number) => string }) {
  if (pageCount <= 1) return null;
  const btn = "inline-flex h-9 items-center gap-1 rounded-lg border border-line px-3 text-sm font-medium";
  return (
    <nav className="flex items-center justify-between gap-3 border-t border-line px-4 py-3" aria-label="Pagination">
      {page > 1 ? <Link className={`${btn} hover:bg-navy-50`} href={hrefFor(page - 1)}><Icon name="arrowLeft" size={16} />Précédent</Link> : <span className={`${btn} opacity-40`}>Précédent</span>}
      <span className="text-sm text-muted">Page <Mono>{page}</Mono> / <Mono>{pageCount}</Mono></span>
      {page < pageCount ? <Link className={`${btn} hover:bg-navy-50`} href={hrefFor(page + 1)}>Suivant<Icon name="arrowRight" size={16} /></Link> : <span className={`${btn} opacity-40`}>Suivant</span>}
    </nav>
  );
}

export function paginate<T>(items: T[], page: number, size = 15) {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(1, page), pageCount);
  return { page: p, pageCount, items: items.slice((p - 1) * size, p * size) };
}

/** Barre de recherche / filtres en GET : fonctionne sans JavaScript, URL partageable. */
export function FilterBar({ children, action }: { children: ReactNode; action?: string }) {
  return (
    <form method="get" action={action} className="mb-4 flex flex-wrap items-end gap-2 [&>*]:min-w-0">
      {children}
      <button type="submit" className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-control)] bg-navy px-3.5 text-sm font-semibold text-white hover:bg-navy-700">
        <Icon name="search" size={16} />Filtrer
      </button>
    </form>
  );
}

export const filterInput = "h-10 rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-sm text-ink focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan/30";

export function SearchInput({ name = "q", defaultValue, placeholder = "Rechercher…" }: { name?: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="relative flex-1 basis-56">
      <span className="sr-only">{placeholder}</span>
      <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input type="search" name={name} defaultValue={defaultValue} placeholder={placeholder} className={`${filterInput} w-full pl-9`} />
    </label>
  );
}

export function FilterSelect({ name, defaultValue, options, label }: { name: string; defaultValue?: string; label: string; options: { value: string; label: string }[] }) {
  return (
    <label className="flex-none">
      <span className="sr-only">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className={`${filterInput} pr-8`} aria-label={label}>
        <option value="">{label} : tous</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
