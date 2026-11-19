import { SimTag } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icons";
import type { CashBalance, Currency } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";

/** Trésorerie SIMULÉE par devise : espèces en caisse et liquidité de compensation. */
export function TreasuryTiles({ balances, alert }: { balances: CashBalance[]; alert: Record<Currency, number> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {balances.map((b) => {
        const lowCash = b.cash < alert[b.currency], lowFloat = b.float < alert[b.currency];
        return (
          <div key={b.currency} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <div className="flex items-center justify-between"><span className="font-mono text-sm font-semibold">{b.currency}</span><SimTag>Simulé</SimTag></div>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="text-xs text-muted">Espèces en caisse</dt>
                <dd className={`font-mono text-xl font-semibold tabular ${lowCash ? "text-danger" : ""}`}>{formatMoney(b.cash, b.currency)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Liquidité de compensation</dt>
                <dd className={`font-mono text-lg font-semibold tabular ${lowFloat ? "text-danger" : ""}`}>{formatMoney(b.float, b.currency)}</dd>
              </div>
            </dl>
            {(lowCash || lowFloat) && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-danger-bg px-2.5 py-1.5 text-xs font-medium text-danger">
                <Icon name="alert" size={14} />Sous le seuil d&apos;alerte ({formatMoney(alert[b.currency], b.currency)})
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
