"use client";
import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert, SimulationNotice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { SimTag } from "@/components/ui/badge";
import type { Currency, Limits, OperationType } from "@/lib/db/schema";
import type { FormAction } from "@/lib/forms";
import type { Quote } from "@/lib/domain/operations";
import { formatMoney } from "@/lib/money";

export interface WizardAccount { id: string; bankId: string; bankName: string; label: string; masked: string; currency: Currency }
export interface WizardAgent { id: string; name: string; code: string; pointName: string; commune: string; hours: string }
type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: string; fieldErrors?: Record<string, string> };

const STEPS = ["Compte", "Agent", "Montant", "Résumé"];
const ctl = "h-11 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3.5 text-[0.95rem] focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan/30";

export function OperationWizard({ type, accounts, banks, agents, limits, currencies, quoteAction, executeAction }: {
  type: OperationType; accounts: WizardAccount[]; banks: { id: string; name: string }[]; agents: WizardAgent[];
  limits: Record<Currency, Limits>; currencies: Currency[];
  quoteAction: (fd: FormData) => Promise<QuoteResult>; executeAction: FormAction;
}) {
  const [step, setStep] = useState(0);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "manual");
  const [manual, setManual] = useState({ bankId: banks[0]?.id ?? "", number: "", currency: currencies[0] ?? "USD" as Currency });
  const [agentId, setAgentId] = useState("");
  const [amountText, setAmountText] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const acc = accounts.find((a) => a.id === accountId);
  const bankId = acc ? acc.bankId : manual.bankId;
  const currency: Currency = acc ? acc.currency : manual.currency;
  const accountNumber = acc ? `DEMO${acc.masked.replace(/\D/g, "")}` : manual.number;
  const accountLabel = acc ? acc.label : "Compte de démonstration saisi";
  const agent = agents.find((a) => a.id === agentId);
  const lim = limits[currency];
  const verb = type === "deposit" ? "Dépôt" : "Retrait";

  const fields = () => {
    const fd = new FormData();
    Object.entries({ type, agentId, bankId, currency, amount: amountText, accountLabel, accountNumber }).forEach(([k, v]) => fd.set(k, v));
    return fd;
  };

  const next = async () => {
    setError("");
    if (step === 0) {
      if (!acc && !/^[A-Za-z0-9 ]{4,34}$/.test(manual.number.trim())) return setError("Saisissez un numéro de compte de démonstration (lettres et chiffres, 4 caractères minimum).");
      if (!bankId) return setError("Choisissez une banque.");
    }
    if (step === 1 && !agent) return setError("Choisissez un agent.");
    if (step === 2) {
      const v = Number(amountText.replace(/\s/g, "").replace(",", "."));
      if (!Number.isFinite(v) || v <= 0) return setError("Saisissez un montant valide.");
      setLoading(true);
      const r = await quoteAction(fields());
      setLoading(false);
      if (!r.ok) return setError(r.fieldErrors ? Object.values(r.fieldErrors)[0] : r.error);
      setQuote(r.quote);
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="space-y-5">
      <ol className="flex gap-1.5" aria-label="Étapes">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <span className={`block h-1.5 rounded-full ${i <= step ? "bg-cyan" : "bg-line"}`} />
            <span className={`mt-1.5 block text-xs ${i === step ? "font-semibold text-navy" : "text-muted"}`}>{s}</span>
          </li>
        ))}
      </ol>
      {error && <Alert tone="danger">{error}</Alert>}

      {step === 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Sur quel compte de démonstration ?</h2>
          {accounts.map((a) => (
            <label key={a.id} className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3.5 has-checked:border-cyan-700 has-checked:bg-cyan-50">
              <input type="radio" name="acc" checked={accountId === a.id} onChange={() => setAccountId(a.id)} className="size-4 accent-[var(--color-navy)]" />
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{a.label}</span><span className="font-mono text-xs text-muted">{a.bankName} · {a.masked} · {a.currency}</span></span>
              <SimTag>Démo</SimTag>
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3.5 has-checked:border-cyan-700 has-checked:bg-cyan-50">
            <input type="radio" name="acc" checked={accountId === "manual"} onChange={() => setAccountId("manual")} className="size-4 accent-[var(--color-navy)]" />
            <span className="text-sm font-semibold">Saisir un autre compte de démonstration</span>
          </label>
          {accountId === "manual" && (
            <div className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:grid-cols-3">
              <label className="text-sm sm:col-span-3"><span className="mb-1 block font-semibold">Banque (fictive)</span>
                <select className={ctl} value={manual.bankId} onChange={(e) => setManual({ ...manual, bankId: e.target.value })}>{banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
              <label className="text-sm sm:col-span-2"><span className="mb-1 block font-semibold">Numéro de compte (fictif)</span>
                <input className={`${ctl} font-mono`} value={manual.number} onChange={(e) => setManual({ ...manual, number: e.target.value })} placeholder="DEMO 1234 5678" /></label>
              <label className="text-sm"><span className="mb-1 block font-semibold">Devise</span>
                <select className={ctl} value={manual.currency} onChange={(e) => setManual({ ...manual, currency: e.target.value as Currency })}>{currencies.map((c) => <option key={c}>{c}</option>)}</select></label>
              <p className="text-xs text-muted sm:col-span-3">N&apos;utilisez pas un vrai numéro de compte. Ne communiquez jamais vos identifiants bancaires.</p>
            </div>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Chez quel agent ?</h2>
          {agents.length === 0 && <Alert tone="warning">Aucun agent n&apos;est disponible pour ce service actuellement.</Alert>}
          {agents.map((a) => (
            <label key={a.id} className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3.5 has-checked:border-cyan-700 has-checked:bg-cyan-50">
              <input type="radio" name="agent" checked={agentId === a.id} onChange={() => setAgentId(a.id)} className="mt-1 size-4 accent-[var(--color-navy)]" />
              <span className="min-w-0"><span className="block text-sm font-semibold">{a.pointName}</span>
                <span className="block text-xs text-muted">{a.name} · <span className="font-mono">{a.code}</span> · {a.commune}</span>
                <span className="mt-1 flex items-center gap-1 text-xs text-muted"><Icon name="clock" size={14} />{a.hours}</span></span>
            </label>
          ))}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Quel montant ?</h2>
          <label className="block">
            <span className="sr-only">Montant en {currency}</span>
            <span className="flex items-center rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 focus-within:border-cyan-700 focus-within:ring-2 focus-within:ring-cyan/30">
              <input inputMode="decimal" autoFocus value={amountText} onChange={(e) => setAmountText(e.target.value.replace(/[^\d.,\s]/g, ""))}
                className="h-16 min-w-0 flex-1 bg-transparent font-mono text-3xl font-semibold tabular outline-none" placeholder="0" />
              <span className="font-mono text-lg font-semibold text-muted">{currency}</span>
            </span>
          </label>
          <p className="text-sm text-muted">Minimum {formatMoney(lim.min, currency)} · maximum {formatMoney(lim.maxPerOperation, currency)} par opération · plafond journalier {formatMoney(lim.maxPerDayPerClient, currency)} (limites simulées).</p>
        </section>
      )}

      {step === 3 && quote && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Résumé de l&apos;opération</h2>
          <div className="rounded-[var(--radius-card)] border border-line bg-surface">
            <div className="border-b border-line p-4 text-center">
              <p className="text-sm text-muted">{verb} simulé</p>
              <p className="font-mono text-3xl font-semibold tabular">{formatMoney(quote.accountImpact - (type === "withdrawal" ? quote.fee : 0), currency)}</p>
            </div>
            <dl className="divide-y divide-line px-4 text-sm">
              {[
                ["Compte", `${accountLabel} (${acc?.masked ?? manual.number})`],
                ["Agent", agent ? `${agent.pointName} · ${agent.code}` : "—"],
                ["Frais simulés", formatMoney(quote.fee, currency)],
                [type === "deposit" ? "Espèces à remettre à l'agent" : "Espèces que vous recevrez", formatMoney(quote.cashExchanged, currency)],
                [type === "deposit" ? "Crédit simulé sur le compte" : "Débit simulé sur le compte", formatMoney(quote.accountImpact, currency)],
                ["Utilisé aujourd'hui", `${formatMoney(quote.limits.usedToday, currency)} / ${formatMoney(quote.limits.maxPerDayPerClient, currency)}`],
              ].map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
            </dl>
          </div>
          <div className={`flex items-center gap-2 rounded-[var(--radius-control)] px-3.5 py-3 text-sm font-medium ${quote.liquidityAvailable ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
            <Icon name={quote.liquidityAvailable ? "check" : "alert"} size={18} />
            {quote.liquidityAvailable ? "Vérification simulée : l'agent dispose de la liquidité nécessaire." : "Vérification simulée : liquidité insuffisante chez cet agent."}
          </div>
          {quote.problems.length > 0 && <Alert tone="danger" title="Opération impossible">{quote.problems.map((p) => <p key={p}>{p}</p>)}</Alert>}
          <SimulationNotice />
          <ActionForm action={executeAction} className="space-y-3">
            {Array.from(fields().entries()).map(([k, v]) => <input key={k} type="hidden" name={k} value={String(v)} />)}
            <div className="flex flex-wrap justify-between gap-2">
              <Button type="button" variant="ghost" icon="arrowLeft" onClick={() => setStep(2)}>Modifier</Button>
              {quote.problems.length === 0 && <SubmitButton icon="check" size="lg">Confirmer la simulation</SubmitButton>}
            </div>
          </ActionForm>
        </section>
      )}

      {step < 3 && (
        <div className="flex justify-between gap-2">
          {step > 0 ? <Button type="button" variant="ghost" icon="arrowLeft" onClick={() => { setError(""); setStep(step - 1); }}>Retour</Button> : <span />}
          <Button type="button" onClick={next} iconRight="arrowRight" disabled={loading}>{loading ? "Vérification…" : step === 2 ? "Voir le résumé" : "Continuer"}</Button>
        </div>
      )}
    </div>
  );
}
