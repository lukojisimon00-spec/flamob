import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeed, DEMO_PHONES } from "../db/seed";
import type { Database } from "../db/schema";
import { toMinor } from "../money";
import { computeFee, quoteOperation, simulateOperation, adjustTreasury, saveCommissionRule, type OperationInput } from "./operations";
import { saveApplication, transitionApplication, respondToInfoRequest } from "./applications";
import { attemptLogin, registerClient, createSession, findSessionUser, issueOtp, confirmPhoneSimulated, normalizePhone, MAX_LOGIN_FAILURES, setUserStatus } from "./users";
import { can } from "../auth/permissions";
import { publishAnnouncement, saveAnnouncement } from "./notifications";

const now = new Date("2026-11-19T10:00:00Z");
const fresh = (): Database => buildSeed(now);

function baseInput(db: Database, over: Partial<OperationInput> = {}): OperationInput {
  const agent = db.agents[0];
  const client = db.users.find((u) => u.phone === DEMO_PHONES.client)!;
  const bank = db.banks.find((b) => b.status === "demo_available")!;
  return {
    type: "deposit", agentId: agent.id, bankId: bank.id, currency: "USD", amount: toMinor(100),
    accountLabel: "Compte démo", accountNumber: "DEMO12345678", clientUserId: client.id,
    clientName: "Christelle Kabeya", initiatedBy: "client", initiatedByUserId: client.id, ...over,
  };
}

test("le seed est cohérent : trésorerie = somme des mouvements", () => {
  const db = fresh();
  assert.ok(db.transactions.length > 30, "historique généré");
  for (const b of db.cashBalances) {
    const moves = db.cashMovements.filter((m) => m.agentId === b.agentId && m.currency === b.currency);
    assert.equal(moves.reduce((s, m) => s + m.cashDelta, 0), b.cash);
    assert.equal(moves.reduce((s, m) => s + m.floatDelta, 0), b.float);
    assert.ok(b.cash >= 0 && b.float >= 0);
  }
  assert.ok(db.banks.every((b) => b.isFictional), "aucune banque réelle");
  // Une commission par transaction commissionnée.
  for (const t of db.transactions) if (t.commission > 0) assert.ok(db.commissions.some((c) => c.transactionId === t.id));
});

test("dépôt simulé : espèces +montant+frais, compensation −montant, commission enregistrée", () => {
  const db = fresh();
  const input = baseInput(db);
  const before = { ...db.cashBalances.find((b) => b.agentId === input.agentId && b.currency === "USD")! };
  const fee = computeFee(db, "deposit", "USD", input.amount);
  const tx = simulateOperation(db, input, now);
  const after = db.cashBalances.find((b) => b.agentId === input.agentId && b.currency === "USD")!;
  assert.equal(after.cash, before.cash + input.amount + fee);
  assert.equal(after.float, before.float - input.amount);
  assert.match(tx.reference, /^FLM-DEP-\d{6}-\d{4}$/);
  assert.equal(tx.fee, fee);
  assert.ok(db.commissions.some((c) => c.transactionId === tx.id && c.amount === tx.commission && c.amount > 0));
  assert.ok(db.notifications.some((n) => n.userId === input.clientUserId && n.body.includes(tx.reference)));
});

test("retrait refusé si espèces insuffisantes, sans effet de bord", () => {
  const db = fresh();
  const input = baseInput(db, { type: "withdrawal", amount: toMinor(1900) });
  const bal = db.cashBalances.find((b) => b.agentId === input.agentId && b.currency === "USD")!;
  bal.cash = toMinor(50);
  const txCount = db.transactions.length;
  assert.throws(() => simulateOperation(db, input, now), /Liquidité insuffisante/);
  assert.equal(db.transactions.length, txCount);
  assert.equal(bal.cash, toMinor(50));
});

test("plafonds : minimum, maximum et plafond journalier", () => {
  const db = fresh();
  assert.ok(quoteOperation(db, baseInput(db, { amount: toMinor(1) }), now).problems.some((p) => p.includes("minimum")));
  assert.ok(quoteOperation(db, baseInput(db, { amount: toMinor(2500) }), now).problems.some((p) => p.includes("maximum")));
  db.settings.limits.USD.maxPerDayPerClient = toMinor(150);
  simulateOperation(db, baseInput(db, { amount: toMinor(100) }), now);
  assert.ok(quoteOperation(db, baseInput(db, { amount: toMinor(100) }), now).problems.some((p) => p.includes("journalier")));
});

test("agent suspendu ou point fermé : opération bloquée", () => {
  const db = fresh();
  const suspended = db.agents.find((a) => a.status === "suspended")!;
  assert.throws(() => simulateOperation(db, baseInput(db, { agentId: suspended.id }), now), /pas actif/);
});

test("ajustement de trésorerie : motif obligatoire et jamais négatif", () => {
  const db = fresh();
  const admin = db.users.find((u) => u.phone === DEMO_PHONES.admin)!;
  const agentId = db.agents[0].id;
  assert.throws(() => adjustTreasury(db, { agentId, currency: "USD", cashDelta: 100, floatDelta: 0, note: "" }, admin, now), /motif/);
  assert.throws(() => adjustTreasury(db, { agentId, currency: "USD", cashDelta: -toMinor(1e9), floatDelta: 0, note: "Retrait test" }, admin, now), /négatives/);
});

test("règle de commission spécifique à un agent prioritaire", () => {
  const db = fresh();
  const admin = db.users.find((u) => u.phone === DEMO_PHONES.admin)!;
  const agentId = db.agents[0].id;
  saveCommissionRule(db, { operationType: "deposit", currency: "USD", fixed: toMinor(2), percentBp: 0, min: 0, max: null, agentId, active: true }, admin.id, now);
  const tx = simulateOperation(db, baseInput(db), now);
  assert.equal(tx.commission, toMinor(2));
});

test("demande : parcours complet jusqu'au compte de démonstration", () => {
  const db = fresh();
  const client = db.users.find((u) => u.phone === DEMO_PHONES.client)!;
  const admin = db.users.find((u) => u.phone === DEMO_PHONES.admin)!;
  const bank = db.banks.find((b) => b.status === "demo_available")!;
  const offer = db.offers.find((o) => o.bankId === bank.id)!;
  const app = saveApplication(db, client.id, {
    bankId: bank.id, offerId: offer.id, currency: offer.currencies[0], documents: [], submit: true,
    applicant: { firstName: "C", lastName: "K", birthDate: "1990-01-01", idType: "Passeport", idNumber: "X", address: "A", commune: "Gombe", occupation: "O", phone: client.phone },
  }, now);
  assert.equal(app.status, "submitted");
  assert.throws(() => transitionApplication(db, app.id, "completed", admin.id, "", now), /Transition impossible/);
  transitionApplication(db, app.id, "under_review", admin.id, "", now);
  assert.throws(() => transitionApplication(db, app.id, "info_required", admin.id, "", now), /commentaire/);
  transitionApplication(db, app.id, "info_required", admin.id, "Pièce manquante", now);
  respondToInfoRequest(db, client.id, app.id, "Voici la pièce", [], now);
  transitionApplication(db, app.id, "approved_sim", admin.id, "", now);
  const accounts = db.demoAccounts.length;
  transitionApplication(db, app.id, "completed", admin.id, "", now);
  assert.equal(db.demoAccounts.length, accounts + 1);
});

test("authentification : verrouillage après échecs répétés, sessions, suspension", () => {
  const db = fresh();
  const user = registerClient(db, { firstName: "Test", lastName: "User", phone: "0899 123 456", password: "MotDePasse1" }, now);
  assert.equal(user.phone, "+243899123456");
  assert.ok(!user.passwordHash.includes("MotDePasse1"));
  assert.equal(attemptLogin(db, "+243899123456", "MotDePasse1", now).ok, true);
  for (let i = 0; i < MAX_LOGIN_FAILURES; i++) attemptLogin(db, "+243899123456", "mauvais", now);
  const locked = attemptLogin(db, "+243899123456", "MotDePasse1", now);
  assert.equal(locked.ok, false);
  const { token } = createSession(db, user.id, now);
  assert.equal(findSessionUser(db, token, now)?.id, user.id);
  const admin = db.users.find((u) => u.phone === DEMO_PHONES.admin)!;
  setUserStatus(db, user.id, "suspended", admin.id, "test", now);
  assert.equal(findSessionUser(db, token, now), null);
});

test("OTP simulé : code requis et à usage unique", () => {
  const db = fresh();
  const user = registerClient(db, { firstName: "A", lastName: "B", phone: "0811111111", password: "MotDePasse1" }, now);
  const { demoCode } = issueOtp(db, user.id, "phone_verification", now);
  assert.ok(demoCode && /^\d{6}$/.test(demoCode));
  assert.throws(() => confirmPhoneSimulated(db, user.id, demoCode === "000000" ? "111111" : "000000", now), /incorrect/);
  confirmPhoneSimulated(db, user.id, demoCode!, now);
  assert.equal(db.users.find((u) => u.id === user.id)!.phoneVerifiedSimulated, true);
  assert.throws(() => confirmPhoneSimulated(db, user.id, demoCode!, now));
});

test("normalisation des numéros", () => {
  assert.equal(normalizePhone("0812345678"), "+243812345678");
  assert.equal(normalizePhone("+243 812 345 678"), "+243812345678");
  assert.equal(normalizePhone("00243812345678"), "+243812345678");
  assert.equal(normalizePhone("12345"), null);
});

test("permissions : l'opérateur ne modifie pas les paramètres", () => {
  assert.equal(can({ role: "admin", adminLevel: "operator" }, "settings.manage"), false);
  assert.equal(can({ role: "admin", adminLevel: "operator" }, "applications.decide"), true);
  assert.equal(can({ role: "admin", adminLevel: "supervisor" }, "settings.manage"), false);
  assert.equal(can({ role: "admin", adminLevel: "superadmin" }, "settings.manage"), true);
  assert.equal(can({ role: "agent" }, "users.read"), false);
});

test("annonce publiée : diffusée uniquement à l'audience ciblée", () => {
  const db = fresh();
  const admin = db.users.find((u) => u.phone === DEMO_PHONES.admin)!;
  const a = saveAnnouncement(db, { title: "Agents", body: "Message", audience: "agents" }, admin.id, now);
  const n = publishAnnouncement(db, a.id, admin.id, now);
  assert.equal(n, db.users.filter((u) => u.role === "agent" && u.status === "active").length);
  assert.ok(db.notifications.filter((x) => x.announcementId === a.id).every((x) => db.users.find((u) => u.id === x.userId)!.role === "agent"));
});
