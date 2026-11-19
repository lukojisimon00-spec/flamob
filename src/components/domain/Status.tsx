import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icons";
import type { AccountApplication, ApplicationStatus } from "@/lib/db/schema";
import { applicationStatusLabel, applicationStatusTone, applicationSteps } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={applicationStatusTone[status]}>{applicationStatusLabel[status]}</Badge>;
}

/** Barre d'avancement compacte (4 étapes). */
export function ApplicationProgress({ status }: { status: ApplicationStatus }) {
  const idx = status === "info_required" ? 1 : status === "rejected_sim" ? 1 : applicationSteps.indexOf(status);
  return (
    <div className="flex gap-1" aria-hidden="true">
      {applicationSteps.map((s, i) => (
        <span key={s} className={`h-1.5 flex-1 rounded-full ${status === "rejected_sim" && i === idx ? "bg-danger" : i <= idx ? "bg-cyan" : "bg-line"}`} />
      ))}
    </div>
  );
}

/** Frise chronologique du dossier. */
export function ApplicationTimeline({ app, names }: { app: AccountApplication; names: Record<string, string> }) {
  const events = [...app.history].reverse();
  return (
    <ol className="relative space-y-5 border-l-2 border-line pl-5">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className={`absolute -left-[1.72rem] top-0.5 grid size-5 place-items-center rounded-full ring-4 ring-surface ${i === 0 ? "bg-navy text-white" : "bg-line text-muted"}`}>
            <Icon name={e.status === "rejected_sim" ? "x" : "check"} size={12} />
          </span>
          <p className="text-sm font-semibold">{applicationStatusLabel[e.status]}</p>
          <p className="text-xs text-muted">{formatDateTime(e.at)}{e.byUserId && names[e.byUserId] ? ` · ${names[e.byUserId]}` : ""}</p>
          {e.comment && <p className="mt-1 rounded-lg bg-canvas px-3 py-2 text-sm text-ink-soft">{e.comment}</p>}
        </li>
      ))}
    </ol>
  );
}
