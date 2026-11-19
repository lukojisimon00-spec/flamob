"use client";
import { useRef, useState } from "react";
import { ActionForm, Checkbox, Field, Input, Select, SubmitButton } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert, SimulationNotice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import type { Currency, OperationType } from "@/lib/db/schema";
import type { FormAction } from "@/lib/forms";
import type { Quote } from "@/lib/domain/operations";
import { formatMoney } from "@/lib/money";

type QuoteResult = ({ ok: true; quote: Quote } | { ok: false; error: string; fieldErrors?: Record<string, string> }) & { linkedClient?: string };

export function AgentOperationForm({ banks, currencies, services, quoteAction, executeAction, initialType }: {
  banks: { id: string; name: string }[]; currencies: Currency[]; services: OperationType[];
  quoteAction: (fd: FormData) => Promise<QuoteResult>; executeAction: FormAction; initialType: OperationType;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<OperationType>(services.includes(initialType) ? initialType : services[0]);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<Record<string, string>>({});

  const check = async () => {
    const form = formRef.current!;
    const fd = new FormData(form);
    fd.set("type", type);
    setLoading(true);
    const r = await quoteAction(fd);
    setLoading(false);
    setResult(r);
    if (r.ok) setSnapshot(Object.fromEntries(Array.from(fd.entries()).map(([k, v]) => [k, String(v)])));
  };

  const cur = (snapshot.currency ?? "USD") as Currency;
  const ok = result?.ok ? result : null;

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Type d'opération" className="grid grid-cols-2 gap-2">
        {services.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={type === s} onClick={() => { setType(s); setResult(null); }}
            className={`flex h-14 items-center justify-center gap-2 rounded-[var(--radius-card)] border text-sm font-semibold ${type === s ? "border-navy bg-navy text-white" : "border-line bg-surface text-navy"}`}>
            <Icon name={s === "deposit" ? "arrowDown" : "arrowUp"} size={18} />{s === "deposit" ? "Dépôt (simulé)" : "Retrait (simulé)"}
          </button>
        ))}
      </div>

      <form ref={formRef} onSubmit={(e) => { e.preventDefault(); check(); }} onChange={() => setResult(null)} className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm"><span className="mb-1.5 block font-semibold">Téléphone du client <span className="font-medium text-muted">(facultatif)</span></span>
            <input name="clientPhone" type="tel" inputMode="tel" className="h-11 w-full rounded-[var(--radius-control)] border border-line-strong px-3.5" placeholder="0812 345 678" /></label>
          <label className="text-sm"><span className="mb-1.5 block font-semibold">Nom du client</span>
            <input name="clientName" required className="h-11 w-full rounded-[var(--radius-control)] border border-line-strong px-3.5" /></label>
          <label className="text-sm"><span className="mb-1.5 block font-semibold">Banque (fictive)</span>
            <select name="bankId" className="h-11 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3">{banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          <label className="text-sm"><span className="mb-1.5 block font-semibold">N° de compte de démonstration</span>
            <input name="accountNumber" required className="h-11 w-full rounded-[var(--radius-control)] border border-line-strong px-3.5 font-mono" placeholder="DEMO 1234 5678" /></label>
          <label className="text-sm"><span className="mb-1.5 block font-semibold">Devise</span>
            <select name="currency" className="h-11 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3">{currencies.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm"><span className="mb-1.5 block font-semibold">Montant</span>
            <input name="amount" inputMode="decimal" required className="h-11 w-full rounded-[var(--radius-control)] border border-line-strong px-3.5 font-mono text-lg" placeholder="0" /></label>
        </div>
        <p className="flex gap-2 rounded-lg bg-warning-bg p-3 text-sm text-ink-soft"><Icon name="lock" size={18} className="shrink-0 text-warning" />Ne demandez jamais le mot de passe, le code PIN ou les identifiants bancaires du client.</p>
        <Button type="submit" variant="secondary" icon="search" disabled={loading}>{loading ? "Vérification…" : "Vérifier l'opération"}</Button>
      </form>

      {result && !result.ok && <Alert tone="danger">{result.fieldErrors ? Object.values(result.fieldErrors)[0] : result.error}</Alert>}

      {ok && (
        <section className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5">
          <h2 className="font-semibold">Contrôle avant confirmation</h2>
          {result?.linkedClient && <Alert tone="info">Client Flamob reconnu : {result.linkedClient}. L&apos;opération apparaîtra dans son historique.</Alert>}
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ["Frais simulés", formatMoney(ok.quote.fee, cur)],
              [type === "deposit" ? "Espèces à recevoir" : "Espèces à remettre", formatMoney(ok.quote.cashExchanged, cur)],
              [type === "deposit" ? "Crédit simulé du compte" : "Débit simulé du compte", formatMoney(ok.quote.accountImpact, cur)],
              ["Votre commission (simulée)", formatMoney(ok.quote.commission, cur)],
            ].map(([k, v]) => <div key={k} className="flex justify-between rounded-lg bg-canvas px-3 py-2"><dt className="text-muted">{k}</dt><dd className="font-mono font-semibold">{v}</dd></div>)}
          </dl>
          <p className={`flex items-center gap-2 text-sm font-medium ${ok.quote.liquidityAvailable ? "text-success" : "text-danger"}`}>
            <Icon name={ok.quote.liquidityAvailable ? "check" : "alert"} size={18} />
            {ok.quote.liquidityAvailable ? "Trésorerie simulée suffisante." : type === "deposit" ? "Liquidité de compensation insuffisante." : "Espèces simulées insuffisantes."}
          </p>
          {ok.quote.problems.length > 0 ? (
            <Alert tone="danger" title="Opération impossible">{ok.quote.problems.map((p) => <p key={p}>{p}</p>)}</Alert>
          ) : (
            <ActionForm action={executeAction}>
              {Object.entries({ ...snapshot, type }).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
              <Checkbox name="identityChecked" label="J'ai vérifié l'identité du client selon la procédure, sans lui demander ses identifiants bancaires." />
              <SimulationNotice />
              <SubmitButton icon="check" size="lg">Confirmer l&apos;opération simulée</SubmitButton>
            </ActionForm>
          )}
        </section>
      )}
    </div>
  );
}
