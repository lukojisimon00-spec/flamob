/** Réseau Flamob : agents, points de service, banques, incidents, paramètres. */
import type {
  Agent, AgentStatus, Bank, BankOffer, Currency, Database, Incident, IncidentPriority, IncidentStatus, IncidentType,
  ServicePoint, ServiceType, Settings, User,
} from "../db/schema";
import { CURRENCIES } from "../db/schema";
import { assert } from "../errors";
import { makeReference, newId } from "../ids";
import { hashPassword, unusablePasswordHash } from "../auth/password";
import { incidentStatusLabel } from "../labels";
import { audit } from "./audit";
import { notify, notifyAdmins } from "./notifications";
import { normalizePhone } from "./users";

// ——— Points de service ———

export type ServicePointInput = Omit<ServicePoint, "id" | "code" | "createdAt" | "updatedAt">;

export function saveServicePoint(db: Database, input: ServicePointInput, actorUserId: string, now: Date, id?: string): ServicePoint {
  assert(input.name.trim().length >= 3, "Nom du point requis.", "name");
  assert(input.lat >= -90 && input.lat <= 90 && input.lng >= -180 && input.lng <= 180, "Coordonnées invalides.", "lat");
  const iso = now.toISOString();
  let point = id ? db.servicePoints.find((p) => p.id === id) : undefined;
  if (id) assert(point, "Point de service introuvable.");
  if (point) Object.assign(point, input, { updatedAt: iso });
  else {
    point = { ...input, id: newId(), code: `PS-${String(db.servicePoints.length + 1).padStart(3, "0")}`, createdAt: iso, updatedAt: iso };
    while (db.servicePoints.some((p) => p.code === point!.code)) point.code = `PS-${Math.floor(Math.random() * 900 + 100)}`;
    db.servicePoints.push(point);
  }
  audit(db, { actorUserId, action: id ? "point.update" : "point.create", entity: "service_point", entityId: point.id, details: point.name }, now);
  return point;
}

// ——— Agents ———

export interface AgentInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  servicePointId?: string;
  authorizedServices: ServiceType[];
  /** Mot de passe initial (facultatif). Sans mot de passe, le compte n'est utilisable qu'après réinitialisation. */
  initialPassword?: string;
}

export function createAgent(db: Database, input: AgentInput, actorUserId: string, now: Date, opts: { isDemo?: boolean } = {}): Agent {
  const phone = normalizePhone(input.phone);
  assert(phone, "Numéro de téléphone invalide.", "phone");
  assert(!db.users.some((u) => u.phone === phone), "Ce numéro est déjà utilisé.", "phone");
  const email = input.email?.trim().toLowerCase() || undefined;
  if (email) assert(!db.users.some((u) => u.email === email), "Cette adresse e-mail est déjà utilisée.", "email");
  if (input.servicePointId) assert(db.servicePoints.some((p) => p.id === input.servicePointId), "Point de service introuvable.");
  const iso = now.toISOString();
  const user: User = {
    id: newId(), role: "agent", firstName: input.firstName.trim(), lastName: input.lastName.trim(), phone, email,
    passwordHash: input.initialPassword ? hashPassword(input.initialPassword) : unusablePasswordHash(),
    status: "active", phoneVerifiedSimulated: true, preferredCurrency: "USD", language: "fr", notifyBySms: true,
    isDemo: !!opts.isDemo, createdAt: iso, updatedAt: iso,
  };
  db.users.push(user);
  const agent: Agent = {
    id: newId(), userId: user.id, code: `AG-${String(db.agents.length + 1).padStart(4, "0")}`,
    servicePointId: input.servicePointId, status: "active", authorizedServices: input.authorizedServices,
    createdAt: iso, updatedAt: iso,
  };
  db.agents.push(agent);
  for (const currency of CURRENCIES) db.cashBalances.push({ agentId: agent.id, currency, cash: 0, float: 0, updatedAt: iso });
  notify(db, user.id, { type: "security", title: "Bienvenue dans le réseau Flamob", body: "Consultez les consignes de sécurité avant toute opération. Ne demandez jamais le mot de passe bancaire d'un client.", link: "/agent/securite" }, now);
  audit(db, { actorUserId, action: "agent.create", entity: "agent", entityId: agent.id, details: `${agent.code} — ${user.firstName} ${user.lastName}` }, now);
  return agent;
}

export function updateAgent(
  db: Database,
  agentId: string,
  input: { servicePointId?: string; authorizedServices: ServiceType[]; status: AgentStatus },
  actorUserId: string,
  now: Date,
) {
  const agent = db.agents.find((a) => a.id === agentId);
  assert(agent, "Agent introuvable.");
  if (input.servicePointId) assert(db.servicePoints.some((p) => p.id === input.servicePointId), "Point de service introuvable.");
  const changes: string[] = [];
  if (agent.status !== input.status) changes.push(`statut ${agent.status} → ${input.status}`);
  if (agent.servicePointId !== input.servicePointId) changes.push("point de service modifié");
  Object.assign(agent, input, { updatedAt: now.toISOString() });
  const user = db.users.find((u) => u.id === agent.userId);
  if (user && input.status !== "active" && changes.length)
    notify(db, user.id, { type: "security", title: "Statut agent modifié", body: `Votre statut d'agent est désormais : ${input.status === "suspended" ? "suspendu" : "inactif"}. Les opérations sont bloquées.` }, now);
  audit(db, { actorUserId, action: "agent.update", entity: "agent", entityId: agentId, details: changes.join(", ") || "services modifiés" }, now);
}

// ——— Banques et offres ———

export type BankInput = Omit<Bank, "id" | "slug" | "createdAt" | "updatedAt" | "isFictional">;

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function saveBank(db: Database, input: BankInput, actorUserId: string, now: Date, id?: string): Bank {
  assert(input.name.trim().length >= 3, "Nom de la banque requis.", "name");
  assert(/^#[0-9a-fA-F]{6}$/.test(input.color), "Couleur invalide (format #RRGGBB).", "color");
  const iso = now.toISOString();
  let bank = id ? db.banks.find((b) => b.id === id) : undefined;
  if (id) assert(bank, "Banque introuvable.");
  if (bank) Object.assign(bank, input, { updatedAt: iso });
  else {
    let slug = slugify(input.name);
    while (db.banks.some((b) => b.slug === slug)) slug = `${slug}-${db.banks.length}`;
    // isFictional : toute banque ajoutée dans le prototype est une banque de démonstration.
    bank = { ...input, id: newId(), slug, isFictional: true, createdAt: iso, updatedAt: iso };
    db.banks.push(bank);
  }
  audit(db, { actorUserId, action: id ? "bank.update" : "bank.create", entity: "bank", entityId: bank.id, details: bank.name }, now);
  return bank;
}

export type OfferInput = Omit<BankOffer, "id" | "createdAt" | "updatedAt" | "infoVerified">;

export function saveOffer(db: Database, input: OfferInput, actorUserId: string, now: Date, id?: string): BankOffer {
  assert(db.banks.some((b) => b.id === input.bankId), "Banque introuvable.");
  assert(input.name.trim().length >= 3, "Nom de l'offre requis.", "name");
  assert(input.currencies.length > 0, "Au moins une devise est requise.", "currencies");
  const iso = now.toISOString();
  let offer = id ? db.offers.find((o) => o.id === id) : undefined;
  if (id) assert(offer, "Offre introuvable.");
  if (offer) Object.assign(offer, input, { updatedAt: iso });
  else {
    offer = { ...input, id: newId(), infoVerified: false, createdAt: iso, updatedAt: iso };
    db.offers.push(offer);
  }
  audit(db, { actorUserId, action: id ? "offer.update" : "offer.create", entity: "offer", entityId: offer.id, details: offer.name }, now);
  return offer;
}

// ——— Incidents ———

export function reportIncident(
  db: Database,
  input: { type: IncidentType; priority: IncidentPriority; title: string; description: string; transactionReference?: string },
  reporterUserId: string,
  now: Date,
): Incident {
  assert(input.title.trim().length >= 4, "Titre trop court.", "title");
  assert(input.description.trim().length >= 10, "Merci de décrire le problème (10 caractères minimum).", "description");
  const iso = now.toISOString();
  const incident: Incident = {
    id: newId(), reference: makeReference(db, "INC", now), type: input.type, priority: input.priority,
    title: input.title.trim(), description: input.description.trim(), status: "open", reporterUserId,
    transactionReference: input.transactionReference?.trim() || undefined, comments: [],
    history: [{ at: iso, byUserId: reporterUserId, change: "Signalement créé" }], createdAt: iso, updatedAt: iso,
  };
  db.incidents.push(incident);
  notify(db, reporterUserId, { type: "support", title: `Signalement ${incident.reference} reçu`, body: "Votre signalement a été transmis à l'équipe Flamob." }, now);
  notifyAdmins(db, { type: "support", title: `Nouvel incident ${incident.reference}`, body: incident.title, link: `/admin/incidents/${incident.id}` }, now);
  audit(db, { actorUserId: reporterUserId, action: "incident.create", entity: "incident", entityId: incident.id, details: incident.reference }, now);
  return incident;
}

export function updateIncident(
  db: Database,
  id: string,
  input: { status: IncidentStatus; assigneeUserId?: string; priority: IncidentPriority; comment?: string },
  actorUserId: string,
  now: Date,
) {
  const inc = db.incidents.find((i) => i.id === id);
  assert(inc, "Incident introuvable.");
  if (input.assigneeUserId) assert(db.users.some((u) => u.id === input.assigneeUserId && u.role === "admin"), "Responsable invalide.");
  const iso = now.toISOString();
  const changes: string[] = [];
  if (inc.status !== input.status) changes.push(`Statut : ${incidentStatusLabel[inc.status]} → ${incidentStatusLabel[input.status]}`);
  if (inc.assigneeUserId !== input.assigneeUserId) {
    const a = db.users.find((u) => u.id === input.assigneeUserId);
    changes.push(a ? `Affecté à ${a.firstName} ${a.lastName}` : "Affectation retirée");
  }
  if (inc.priority !== input.priority) changes.push(`Priorité : ${input.priority}`);
  Object.assign(inc, { status: input.status, assigneeUserId: input.assigneeUserId, priority: input.priority, updatedAt: iso });
  for (const change of changes) inc.history.push({ at: iso, byUserId: actorUserId, change });
  if (input.comment?.trim()) inc.comments.push({ at: iso, byUserId: actorUserId, text: input.comment.trim() });
  if (changes.some((c) => c.startsWith("Statut")) || input.comment?.trim())
    notify(db, inc.reporterUserId, { type: "support", title: `Incident ${inc.reference} mis à jour`, body: `Statut : ${incidentStatusLabel[inc.status]}.${input.comment?.trim() ? ` Message : ${input.comment.trim()}` : ""}` }, now);
  audit(db, { actorUserId, action: "incident.update", entity: "incident", entityId: id, details: changes.join(" ; ") || "commentaire" }, now);
}

// ——— Paramètres ———

export function updateSettings(db: Database, next: Omit<Settings, "updatedAt" | "updatedByUserId">, actorUserId: string, now: Date) {
  for (const c of CURRENCIES as Currency[]) {
    const l = next.limits[c];
    assert(l.min > 0 && l.min <= l.maxPerOperation && l.maxPerOperation <= l.maxPerDayPerClient, `Limites ${c} incohérentes (min ≤ max par opération ≤ plafond journalier).`);
  }
  assert(next.enabledCurrencies.length > 0, "Au moins une devise doit être activée.");
  for (const t of ["deposit", "withdrawal"] as const) assert(next.fees[t].percentBp >= 0 && next.fees[t].percentBp <= 1000, "Les frais variables doivent être entre 0 et 10 %.");
  db.settings = { ...next, updatedAt: now.toISOString(), updatedByUserId: actorUserId };
  audit(db, { actorUserId, action: "settings.update", entity: "settings" }, now);
}
