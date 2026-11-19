/** Lectures composées pour l'affichage (jointures en mémoire). */
import type { Currency, Database, SimulatedTransaction } from "./db/schema";
import { dayKey, monthKey } from "./domain/time";
import { fullName } from "./domain/users";

export function txView(db: Database, t: SimulatedTransaction) {
  const bank = db.banks.find((b) => b.id === t.bankId);
  const agent = db.agents.find((a) => a.id === t.agentId);
  const agentUser = agent && db.users.find((u) => u.id === agent.userId);
  const point = db.servicePoints.find((p) => p.id === t.servicePointId);
  return {
    ...t,
    bankName: bank?.name ?? "—",
    agentName: agentUser ? fullName(agentUser) : "—",
    agentCode: agent?.code ?? "—",
    pointName: point?.name ?? "—",
    pointAddress: point ? `${point.address}, ${point.commune}` : "—",
  };
}
export type TxView = ReturnType<typeof txView>;

export function agentView(db: Database, agentId: string) {
  const agent = db.agents.find((a) => a.id === agentId);
  if (!agent) return null;
  const user = db.users.find((u) => u.id === agent.userId)!;
  const point = db.servicePoints.find((p) => p.id === agent.servicePointId);
  return { agent, user, point, name: fullName(user) };
}

/** Agents opérationnels pour un type d'opération (client : choix d'un agent). */
export function operationalAgents(db: Database, type?: "deposit" | "withdrawal") {
  return db.agents
    .filter((a) => a.status === "active" && (!type || a.authorizedServices.includes(type)))
    .map((a) => agentView(db, a.id)!)
    .filter((v) => v.point && v.point.status === "open");
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}


const zero = (): Record<Currency, number> => ({ USD: 0, CDF: 0 });

/** Statistiques simulées d'un agent, calculées à partir des données (aucun chiffre inventé). */
export function agentStats(db: Database, agentId: string, now = new Date()) {
  const today = dayKey(now), month = monthKey(now);
  const txs = db.transactions.filter((t) => t.agentId === agentId && t.status === "completed");
  const todayTx = txs.filter((t) => dayKey(t.createdAt) === today);
  const sum = (list: SimulatedTransaction[], type?: string) => list.filter((t) => !type || t.type === type).reduce((acc, t) => { acc[t.currency] += t.amount; return acc; }, zero());
  const coms = db.commissions.filter((c) => c.agentId === agentId);
  const comSum = (pred: (iso: string) => boolean) => coms.filter((c) => pred(c.createdAt)).reduce((acc, c) => { acc[c.currency] += c.amount; return acc; }, zero());
  return {
    todayCount: todayTx.length,
    todayDeposits: sum(todayTx, "deposit"),
    todayWithdrawals: sum(todayTx, "withdrawal"),
    todayDepositCount: todayTx.filter((t) => t.type === "deposit").length,
    todayWithdrawalCount: todayTx.filter((t) => t.type === "withdrawal").length,
    commissionsToday: comSum((iso) => dayKey(iso) === today),
    commissionsMonth: comSum((iso) => monthKey(iso) === month),
    commissionsTotal: comSum(() => true),
    totalCount: txs.length,
  };
}

/** Série journalière (N derniers jours) du nombre d'opérations. */
export function dailySeries(db: Database, days: number, filter: (t: SimulatedTransaction) => boolean, now = new Date()) {
  const out: { day: string; count: number; deposits: number; withdrawals: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = dayKey(new Date(now.getTime() - i * 86400000));
    const list = db.transactions.filter((t) => t.status === "completed" && filter(t) && dayKey(t.createdAt) === d);
    out.push({ day: d, count: list.length, deposits: list.filter((t) => t.type === "deposit").length, withdrawals: list.filter((t) => t.type === "withdrawal").length });
  }
  return out;
}
