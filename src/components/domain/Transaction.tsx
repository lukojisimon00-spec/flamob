import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { Badge, SimTag } from "@/components/ui/badge";
import { DescriptionList, Mono } from "@/components/ui/data";
import { LogoMark } from "@/components/brand/Logo";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { operationLabel } from "@/lib/labels";
import type { TxView } from "@/lib/queries";

export function TransactionRow({ tx, href, perspective = "client" }: { tx: TxView; href: string; perspective?: "client" | "agent" }) {
  const deposit = tx.type === "deposit";
  // Pour l'agent, un dépôt fait entrer des espèces ; pour le client, c'est un versement.
  const sign = perspective === "agent" ? (deposit ? "+" : "−") : "";
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas">
        <span className={`grid size-10 shrink-0 place-items-center rounded-full ${deposit ? "bg-cyan-50 text-cyan-700" : "bg-navy-50 text-navy-700"}`}>
          <Icon name={deposit ? "arrowDown" : "arrowUp"} size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{operationLabel[tx.type]} · {perspective === "agent" ? tx.clientName : tx.bankName}</span>
          </span>
          <span className="block truncate font-mono text-[0.72rem] text-muted">{tx.reference} · {formatDateTime(tx.createdAt)}</span>
        </span>
        <span className="text-right">
          <span className="block font-mono text-sm font-semibold tabular">{sign}{formatMoney(tx.amount, tx.currency)}</span>
          <span className="block text-[0.7rem] text-muted">Simulé</span>
        </span>
      </Link>
    </li>
  );
}

/** Reçu de démonstration — jamais présenté comme une preuve de paiement réelle. */
export function Receipt({ tx, showCommission = false }: { tx: TxView; showCommission?: boolean }) {
  const deposit = tx.type === "deposit";
  return (
    <article className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface" aria-label="Reçu de démonstration">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="-rotate-12 select-none text-5xl font-extrabold uppercase tracking-widest text-navy/[0.04] sm:text-7xl">Démonstration</span>
      </div>
      <header className="flex items-start justify-between gap-3 border-b border-dashed border-line-strong p-5">
        <div className="flex items-center gap-3">
          <LogoMark size={34} />
          <div>
            <p className="text-sm font-semibold">Reçu de démonstration</p>
            <p className="text-xs text-muted">Sans valeur de preuve de paiement</p>
          </div>
        </div>
        <SimTag>Simulé</SimTag>
      </header>
      <div className="p-5 text-center">
        <p className="text-sm text-muted">{operationLabel[tx.type]} simulé</p>
        <p className="mt-1 font-mono text-3xl font-semibold tabular">{formatMoney(tx.amount, tx.currency)}</p>
        <div className="mt-2"><Badge tone={tx.status === "completed" ? "success" : "neutral"}>{tx.status === "completed" ? "Simulation enregistrée" : "Annulée"}</Badge></div>
      </div>
      <div className="px-5 pb-2">
        <DescriptionList items={[
          { label: "Référence", value: <Mono className="text-[0.95em]">{tx.reference}</Mono> },
          { label: "Date", value: formatDateTime(tx.createdAt) },
          { label: "Client", value: tx.clientName },
          { label: "Banque (fictive)", value: tx.bankName },
          { label: "Compte de démonstration", value: <span>{tx.accountLabel}<br /><Mono>{tx.accountMasked}</Mono></span> },
          { label: "Agent", value: <span>{tx.agentName} · <Mono>{tx.agentCode}</Mono></span> },
          { label: "Point de service", value: tx.pointName },
          { label: "Frais simulés", value: <Mono>{formatMoney(tx.fee, tx.currency)}</Mono> },
          { label: deposit ? "Espèces remises par le client" : "Espèces remises au client", value: <Mono>{formatMoney(deposit ? tx.amount + tx.fee : tx.amount, tx.currency)}</Mono> },
          { label: deposit ? "Crédit simulé sur le compte" : "Débit simulé sur le compte", value: <Mono>{formatMoney(deposit ? tx.amount : tx.amount + tx.fee, tx.currency)}</Mono> },
          ...(showCommission ? [{ label: "Commission agent (simulée)", value: <Mono>{formatMoney(tx.commission, tx.currency)}</Mono> }] : []),
        ]} />
      </div>
      <footer className="border-t border-dashed border-line-strong bg-canvas px-5 py-3 text-xs text-muted">
        Opération fictive générée par le prototype Flamob. Aucun compte bancaire réel n&apos;a été {deposit ? "crédité" : "débité"} et aucune somme réelle n&apos;a été déplacée.
      </footer>
    </article>
  );
}
