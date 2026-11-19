import Link from "next/link";
import { Badge, SimTag } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icons";
import { BankLogo } from "./BankLogo";
import type { Bank, ServicePoint, ServiceType } from "@/lib/db/schema";
import { bankStatusLabel, bankStatusTone, pointStatusLabel, pointStatusTone, serviceLabel } from "@/lib/labels";

export function BankCard({ bank, href, offerCount }: { bank: Bank; href: string; offerCount: number }) {
  return (
    <Link href={href} className="flex gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:border-cyan-700/50">
      <BankLogo name={bank.name} shortName={bank.shortName} color={bank.color} />
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex items-start justify-between gap-2">
          <span className="font-semibold leading-snug">{bank.name}</span>
          <Icon name="chevronRight" size={18} className="mt-0.5 shrink-0 text-muted" />
        </span>
        <span className="block text-sm text-muted">{bank.tagline}</span>
        <span className="flex flex-wrap items-center gap-1.5 pt-1">
          <SimTag>Fictive</SimTag>
          <Badge tone={bankStatusTone[bank.status]}>{bankStatusLabel[bank.status]}</Badge>
          {offerCount > 0 && <span className="text-xs text-muted">{offerCount} offre{offerCount > 1 ? "s" : ""}</span>}
        </span>
      </span>
    </Link>
  );
}

export function AgentCard({ name, code, point, services, distance, href }: {
  name: string; code: string; point: ServicePoint; services: ServiceType[]; distance?: number; href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{point.name}</p>
          <p className="text-sm text-muted">{name} · <span className="font-mono text-xs">{code}</span></p>
        </div>
        <Badge tone={pointStatusTone[point.status]}>{pointStatusLabel[point.status]}</Badge>
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-soft"><Icon name="pin" size={16} className="mt-0.5 shrink-0 text-muted" />{point.address}, {point.quarter}, {point.commune}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft"><Icon name="clock" size={16} className="shrink-0 text-muted" />{point.hours}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {services.map((s) => <span key={s} className="rounded-md bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-700">{serviceLabel[s]}</span>)}
        {typeof distance === "number" && <span className="ml-auto font-mono text-xs text-muted">≈ {distance.toFixed(1)} km</span>}
      </div>
    </>
  );
  const cls = "block rounded-[var(--radius-card)] border border-line bg-surface p-4";
  return href ? <Link href={href} className={`${cls} hover:border-cyan-700/50`}>{body}</Link> : <div className={cls}>{body}</div>;
}
