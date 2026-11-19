import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

type AlertTone = "info" | "success" | "warning" | "danger";
const alertTones: Record<AlertTone, { cls: string; icon: IconName }> = {
  info: { cls: "bg-info-bg text-info border-navy-700/15", icon: "info" },
  success: { cls: "bg-success-bg text-success border-success/20", icon: "check" },
  warning: { cls: "bg-warning-bg text-warning border-warning/25", icon: "alert" },
  danger: { cls: "bg-danger-bg text-danger border-danger/20", icon: "alert" },
};

export function Alert({ tone = "info", title, children }: { tone?: AlertTone; title?: ReactNode; children?: ReactNode }) {
  const t = alertTones[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`flex gap-3 rounded-[var(--radius-control)] border px-3.5 py-3 text-sm ${t.cls}`}>
      <Icon name={t.icon} size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-ink-soft [&_a]:font-semibold [&_a]:underline">{children}</div>}
      </div>
    </div>
  );
}

/** Rappel permanent : rien n'est réel dans ce prototype. */
export function SimulationNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-dashed border-cyan-700/40 bg-cyan-50 px-3.5 py-2.5 text-[0.82rem] text-ink-soft">
      <Icon name="info" size={16} className="mt-0.5 shrink-0 text-cyan-700" />
      <p>{children ?? "Opération simulée : aucun compte bancaire réel n'est crédité ou débité et aucune somme réelle n'est déplacée."}</p>
    </div>
  );
}

export function EmptyState({ icon = "list", title, children, action }: { icon?: IconName; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-navy-50 text-navy-700"><Icon name={icon} size={22} /></span>
      <p className="mt-3 font-semibold text-ink">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-line/70 ${className}`} aria-hidden="true" />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
