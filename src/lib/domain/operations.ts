/**
 * Opérations de dépôt / retrait SIMULÉES et trésorerie simulée des points de service.
 *
 * Règles (cahier des charges §8.2) :
 * - Dépôt : le client remet des espèces → espèces de l'agent +(montant + frais) ;
 *   la liquidité de compensation de l'agent −montant (elle « crédite » le compte, simulé).
 * - Retrait : l'agent remet des espèces → espèces −montant ; liquidité de compensation +montant.
 * - Refus si espèces (retrait) ou liquidité de compensation (dépôt) insuffisantes.
 * - Chaque opération crée : une transaction, un ou des mouvements de trésorerie, une commission,
 *   des notifications et une entrée de journal. Tout est traçable.
 *
 * AUCUN compte bancaire réel n'est crédité ou débité. Aucun argent n'est conservé par Flamob.
 */
import type {
  CashBalance, CommissionRule, Currency, Database, OperationType, SimulatedTransaction, User,
} from "../db/schema";
import { DomainError, assert } from "../errors";
import { makeReference, maskAccount, newId } from "../ids";
import { computeRate, formatMoney } from "../money";
import { audit } from "./audit";
import { notify, notifyAdmins } from "./notifications";
import { dayKey } from "./time";
import { fullName } from "./users";

export interface OperationInput {
  type: OperationType;
  agentId: string;
  bankId: string;
  currency: Currency;
  /** Unités mineures. */
  amount: number;
  accountLabel: string;
  accountNumber: string;
  clientUserId?: string;
  clientName: string;
  clientPhone?: string;
  initiatedBy: "client" | "agent";
  initiatedByUserId: string;
}

export interface Quote {
  fee: number;
  /** Ce que le client remet (dépôt) ou reçoit (retrait) en espèces. */
  cashExchanged: number;
  /** Ce qui serait crédité/débité sur le compte de démonstration. */
  accountImpact: number;
  limits: { min: number; maxPerOperation: number; maxPerDayPerClient: number; usedToday: number };
  liquidityAvailable: boolean;
  commission: number;
  problems: string[];
}

export function computeFee(db: Database, type: OperationType, currency: Currency, amount: number): number {
  const rule = db.settings.fees[type];
  return computeRate(amount, rule.percentBp, 0, rule.min[currency], null);
}

export function resolveCommissionRule(db: Database, agentId: string, type: OperationType, currency: Currency): CommissionRule | undefined {
  const candidates = db.commissionRules.filter((r) => r.active && r.operationType === type && r.currency === currency);
  return candidates.find((r) => r.agentId === agentId) ?? candidates.find((r) => !r.agentId);
}

export function computeCommission(db: Database, agentId: string, type: OperationType, currency: Currency, amount: number) {
  const rule = resolveCommissionRule(db, agentId, type, currency);
  if (!rule) return { rule: undefined, amount: 0 };
  return { rule, amount: computeRate(amount, rule.percentBp, rule.fixed, rule.min, rule.max) };
}

export function getBalance(db: Database, agentId: string, currency: Currency): CashBalance {
  let b = db.cashBalances.find((x) => x.agentId === agentId && x.currency === currency);
  if (!b) {
    b = { agentId, currency, cash: 0, float: 0, updatedAt: new Date(0).toISOString() };
    db.cashBalances.push(b);
  }
  return b;
}

function usedToday(db: Database, input: Pick<OperationInput, "type" | "currency" | "clientUserId" | "clientPhone">, now: Date): number {
  const today = dayKey(now);
  return db.transactions
    .filter((t) =>
      t.status === "completed" && t.type === input.type && t.currency === input.currency && dayKey(t.createdAt) === today &&
      ((input.clientUserId && t.clientUserId === input.clientUserId) || (!input.clientUserId && input.clientPhone && t.clientPhone === input.clientPhone)))
    .reduce((s, t) => s + t.amount, 0);
}

/** Calcule frais, limites et disponibilité — sans rien modifier. */
export function quoteOperation(db: Database, input: OperationInput, now: Date): Quote {
  const problems: string[] = [];
  const s = db.settings;
  const limits = s.limits[input.currency];
  const fee = computeFee(db, input.type, input.currency, input.amount);
  const used = usedToday(db, input, now);

  const agent = db.agents.find((a) => a.id === input.agentId);
  const point = agent?.servicePointId ? db.servicePoints.find((p) => p.id === agent.servicePointId) : undefined;
  const bank = db.banks.find((b) => b.id === input.bankId);

  if (!s.enabledCurrencies.includes(input.currency)) problems.push("Cette devise n'est pas activée.");
  if (!s.enabledServices.includes(input.type)) problems.push("Ce service est momentanément désactivé sur la plateforme.");
  if (!bank || bank.status !== "demo_available") problems.push("Cette banque n'est pas disponible pour les opérations de démonstration.");
  if (!agent) problems.push("Agent introuvable.");
  else {
    if (agent.status !== "active") problems.push("Cet agent n'est pas actif.");
    if (!agent.authorizedServices.includes(input.type)) problems.push("Cet agent n'est pas habilité pour ce service.");
    if (!point) problems.push("Cet agent n'est rattaché à aucun point de service.");
    else if (point.status !== "open") problems.push("Le point de service est actuellement fermé.");
  }
  if (!Number.isInteger(input.amount) || input.amount <= 0) problems.push("Montant invalide.");
  else {
    if (input.amount < limits.min) problems.push(`Montant minimum : ${formatMoney(limits.min, input.currency)}.`);
    if (input.amount > limits.maxPerOperation) problems.push(`Montant maximum par opération : ${formatMoney(limits.maxPerOperation, input.currency)}.`);
    if (used + input.amount > limits.maxPerDayPerClient)
      problems.push(`Plafond journalier dépassé (déjà utilisé aujourd'hui : ${formatMoney(used, input.currency)} sur ${formatMoney(limits.maxPerDayPerClient, input.currency)}).`);
  }

  let liquidityAvailable = false;
  if (agent) {
    const b = db.cashBalances.find((x) => x.agentId === agent.id && x.currency === input.currency);
    liquidityAvailable = input.type === "withdrawal" ? (b?.cash ?? 0) >= input.amount : (b?.float ?? 0) >= input.amount;
    if (!liquidityAvailable)
      problems.push(input.type === "withdrawal"
        ? "Liquidité insuffisante chez cet agent pour ce retrait. Choisissez un autre agent ou un montant plus faible."
        : "Capacité de dépôt insuffisante chez cet agent pour ce montant. Choisissez un autre agent ou un montant plus faible.");
  }

  const commission = agent ? computeCommission(db, agent.id, input.type, input.currency, input.amount).amount : 0;
  return {
    fee,
    cashExchanged: input.type === "deposit" ? input.amount + fee : input.amount,
    accountImpact: input.type === "deposit" ? input.amount : input.amount + fee,
    limits: { ...limits, usedToday: used },
    liquidityAvailable,
    commission,
    problems,
  };
}

export function simulateOperation(db: Database, input: OperationInput, now: Date): SimulatedTransaction {
  assert(input.clientName.trim().length >= 2, "Nom du client requis.", "clientName");
  assert(input.accountNumber.replace(/\s/g, "").length >= 4, "Numéro de compte de démonstration invalide.", "accountNumber");
  const quote = quoteOperation(db, input, now);
  if (quote.problems.length) {
    audit(db, { actorUserId: input.initiatedByUserId, action: `operation.${input.type}_refused`, entity: "agent", entityId: input.agentId, details: quote.problems.join(" ") }, now);
    throw new DomainError(quote.problems[0]);
  }
  const agent = db.agents.find((a) => a.id === input.agentId)!;
  const iso = now.toISOString();
  const { rule, amount: commission } = computeCommission(db, agent.id, input.type, input.currency, input.amount);

  const tx: SimulatedTransaction = {
    id: newId(),
    reference: makeReference(db, input.type === "deposit" ? "DEP" : "RET", now),
    type: input.type,
    status: "completed",
    amount: input.amount,
    fee: quote.fee,
    currency: input.currency,
    bankId: input.bankId,
    accountLabel: input.accountLabel.trim() || "Compte de démonstration",
    accountMasked: maskAccount(input.accountNumber),
    clientUserId: input.clientUserId,
    clientName: input.clientName.trim(),
    clientPhone: input.clientPhone,
    agentId: agent.id,
    servicePointId: agent.servicePointId,
    initiatedBy: input.initiatedBy,
    initiatedByUserId: input.initiatedByUserId,
    commission,
    createdAt: iso,
  };
  db.transactions.push(tx);

  const cashDelta = input.type === "deposit" ? input.amount + quote.fee : -input.amount;
  const floatDelta = input.type === "deposit" ? -input.amount : input.amount;
  applyMovement(db, { agentId: agent.id, currency: input.currency, kind: input.type, cashDelta, floatDelta, transactionId: tx.id }, now);

  if (rule && commission > 0) {
    db.commissions.push({
      id: newId(), agentId: agent.id, transactionId: tx.id, ruleId: rule.id, amount: commission,
      currency: input.currency, operationType: input.type, createdAt: iso,
    });
  }

  const label = input.type === "deposit" ? "Dépôt simulé" : "Retrait simulé";
  const money = formatMoney(input.amount, input.currency);
  if (input.clientUserId)
    notify(db, input.clientUserId, { type: "operation", title: `${label} enregistré`, body: `${money} — réf. ${tx.reference}. Opération fictive : aucun compte réel n'a été ${input.type === "deposit" ? "crédité" : "débité"}.`, link: `/app/operations/${tx.id}` }, now);
  const agentUser = db.users.find((u) => u.id === agent.userId);
  if (agentUser && input.initiatedBy === "client")
    notify(db, agentUser.id, { type: "operation", title: `${label} — client ${tx.clientName}`, body: `${money} — réf. ${tx.reference}.`, link: `/agent/operations/${tx.id}` }, now);

  checkLiquidity(db, agent.id, input.currency, now);
  audit(db, { actorUserId: input.initiatedByUserId, action: `operation.${input.type}`, entity: "transaction", entityId: tx.id, details: `${tx.reference} · ${money}` }, now);
  return tx;
}

export function applyMovement(
  db: Database,
  m: { agentId: string; currency: Currency; kind: "deposit" | "withdrawal" | "adjustment"; cashDelta: number; floatDelta: number; transactionId?: string; note?: string; byUserId?: string },
  now: Date,
) {
  const b = getBalance(db, m.agentId, m.currency);
  assert(b.cash + m.cashDelta >= 0, "Les espèces simulées ne peuvent pas devenir négatives.");
  assert(b.float + m.floatDelta >= 0, "La liquidité de compensation simulée ne peut pas devenir négative.");
  b.cash += m.cashDelta;
  b.float += m.floatDelta;
  b.updatedAt = now.toISOString();
  db.cashMovements.push({ id: newId(), ...m, cashAfter: b.cash, floatAfter: b.float, createdAt: now.toISOString() });
}

function checkLiquidity(db: Database, agentId: string, currency: Currency, now: Date) {
  const b = getBalance(db, agentId, currency);
  const threshold = db.settings.liquidityAlert[currency];
  const agent = db.agents.find((a) => a.id === agentId);
  if (!agent || (b.cash >= threshold && b.float >= threshold)) return;
  const today = dayKey(now);
  const already = db.notifications.some((n) => n.userId === agent.userId && n.type === "liquidity" && dayKey(n.createdAt) === today && n.body.includes(currency));
  if (already) return;
  const which = b.cash < threshold ? "espèces" : "liquidité de compensation";
  notify(db, agent.userId, { type: "liquidity", title: "Alerte de liquidité", body: `Niveau bas de ${which} en ${currency} (seuil ${formatMoney(threshold, currency)}). Prévoyez un rééquilibrage.`, link: "/agent/tresorerie" }, now);
  notifyAdmins(db, { type: "liquidity", title: `Liquidité basse — agent ${agent.code}`, body: `Niveau bas de ${which} en ${currency}.`, link: `/admin/agents/${agent.id}` }, now);
}

/** Rééquilibrage simulé de la trésorerie d'un agent (administration). */
export function adjustTreasury(
  db: Database,
  input: { agentId: string; currency: Currency; cashDelta: number; floatDelta: number; note: string },
  actor: User,
  now: Date,
) {
  assert(input.note.trim().length >= 3, "Un motif est obligatoire.", "note");
  assert(input.cashDelta !== 0 || input.floatDelta !== 0, "Aucun ajustement saisi.");
  applyMovement(db, { ...input, kind: "adjustment", note: input.note.trim(), byUserId: actor.id }, now);
  const agent = db.agents.find((a) => a.id === input.agentId)!;
  notify(db, agent.userId, { type: "liquidity", title: "Trésorerie ajustée (simulation)", body: `Ajustement par ${fullName(actor)} : ${input.note.trim()}`, link: "/agent/tresorerie" }, now);
  audit(db, { actorUserId: actor.id, action: "treasury.adjust", entity: "agent", entityId: input.agentId, details: `${input.currency} espèces ${input.cashDelta} / compensation ${input.floatDelta} — ${input.note}` }, now);
}

export function saveCommissionRule(
  db: Database,
  input: Omit<CommissionRule, "id" | "updatedAt" | "updatedByUserId"> & { id?: string },
  actorUserId: string,
  now: Date,
): CommissionRule {
  assert(input.fixed >= 0 && input.percentBp >= 0 && input.min >= 0, "Les valeurs doivent être positives.");
  assert(input.percentBp <= 1000, "La part variable ne peut pas dépasser 10 %.");
  if (input.max !== null) assert(input.max >= input.min, "Le maximum doit être supérieur ou égal au minimum.");
  const iso = now.toISOString();
  const duplicate = db.commissionRules.find((r) =>
    r.id !== input.id && r.active && input.active && r.operationType === input.operationType && r.currency === input.currency && (r.agentId ?? "") === (input.agentId ?? ""));
  assert(!duplicate, "Une règle active existe déjà pour ce type d'opération, cette devise et cette cible.");
  let rule = input.id ? db.commissionRules.find((r) => r.id === input.id) : undefined;
  if (input.id) assert(rule, "Règle introuvable.");
  if (rule) Object.assign(rule, { ...input, updatedAt: iso, updatedByUserId: actorUserId });
  else {
    rule = { ...input, id: newId(), updatedAt: iso, updatedByUserId: actorUserId };
    db.commissionRules.push(rule);
  }
  audit(db, { actorUserId, action: "commission_rule.save", entity: "commission_rule", entityId: rule.id, details: `${input.operationType} ${input.currency} fixe ${input.fixed} + ${input.percentBp} bp` }, now);
  return rule;
}
