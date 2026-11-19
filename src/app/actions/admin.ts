"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { readDb, resetDb, transact } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth/session";
import { fail, parse } from "@/lib/action-utils";
import { amount, currency, name, optionalEmail, phone, text } from "@/lib/validation";
import type { FormState } from "@/lib/forms";
import { setUserStatus } from "@/lib/domain/users";
import { createAgent, saveBank, saveOffer, saveServicePoint, updateAgent, updateIncident, updateSettings } from "@/lib/domain/network";
import { transitionApplication } from "@/lib/domain/applications";
import { adjustTreasury, saveCommissionRule } from "@/lib/domain/operations";
import { publishAnnouncement, saveAnnouncement } from "@/lib/domain/notifications";
import { audit } from "@/lib/domain/audit";
import { toMinor } from "@/lib/money";
import { SERVICE_TYPES, type Currency } from "@/lib/db/schema";
import { buildSeed } from "@/lib/db/seed";

const services = z.preprocess((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]), z.array(z.enum(SERVICE_TYPES as [string, ...string[]])))
  .transform((v) => v as (typeof SERVICE_TYPES)[number][]);
const lines = z.string().default("").transform((s) => s.split("\n").map((l) => l.trim()).filter(Boolean));
const major = (label: string) => z.string().trim().transform((v) => Number(v.replace(/\s/g, "").replace(",", ".")))
  .refine((v) => Number.isFinite(v) && v >= 0, `${label} : montant invalide.`).transform(toMinor);
const optionalMajor = z.string().trim().transform((v) => (v === "" ? null : Number(v.replace(/\s/g, "").replace(",", "."))))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Montant invalide.").transform((v) => (v === null ? null : toMinor(v)));
const pct = z.string().trim().transform((v) => Number(v.replace(",", "."))).refine((v) => Number.isFinite(v) && v >= 0 && v <= 10, "Pourcentage entre 0 et 10.").transform((v) => Math.round(v * 100));

function done(path: string, message: string): FormState {
  revalidatePath(path);
  return { ok: true, message };
}

// ——— Utilisateurs ———
export async function setUserStatusAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("users.manage");
  const p = parse(z.object({ userId: z.string(), status: z.enum(["active", "suspended"]), reason: z.string().trim().max(300).default("") }), fd);
  if (!p.ok) return p.state;
  if (p.data.status === "suspended" && p.data.reason.length < 3) return { error: "Indiquez le motif de la suspension.", fieldErrors: { reason: "Motif requis." } };
  try { transact((db) => setUserStatus(db, p.data.userId, p.data.status, actor.id, p.data.reason, new Date())); } catch (e) { return fail(e); }
  return done(`/admin/utilisateurs/${p.data.userId}`, p.data.status === "suspended" ? "Compte suspendu (sessions fermées)." : "Compte réactivé.");
}

// ——— Agents ———
const agentCreate = z.object({
  firstName: name("Prénom"), lastName: name("Nom"), phone, email: optionalEmail,
  servicePointId: z.string().optional(), authorizedServices: services,
});
export async function createAgentAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("agents.manage");
  const p = parse(agentCreate, fd);
  if (!p.ok) return p.state;
  let id: string;
  try { id = transact((db) => createAgent(db, { ...p.data, email: p.data.email || undefined, servicePointId: p.data.servicePointId || undefined }, actor.id, new Date())).id; } catch (e) { return fail(e); }
  redirect(`/admin/agents/${id}?cree=1`);
}

export async function updateAgentAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("agents.manage");
  const p = parse(z.object({ agentId: z.string(), status: z.enum(["active", "inactive", "suspended"]), servicePointId: z.string().optional(), authorizedServices: services }), fd);
  if (!p.ok) return p.state;
  try { transact((db) => updateAgent(db, p.data.agentId, { status: p.data.status, servicePointId: p.data.servicePointId || undefined, authorizedServices: p.data.authorizedServices }, actor.id, new Date())); } catch (e) { return fail(e); }
  return done(`/admin/agents/${p.data.agentId}`, "Agent mis à jour.");
}

const signed = z.string().trim().default("0").transform((v) => Number(v.replace(/\s/g, "").replace(",", ".") || "0")).refine(Number.isFinite, "Montant invalide.").transform(toMinor);
export async function adjustTreasuryAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("treasury.adjust");
  const p = parse(z.object({ agentId: z.string(), currency, cashDelta: signed, floatDelta: signed, note: text("Motif", 3, 200) }), fd);
  if (!p.ok) return p.state;
  try { transact((db) => adjustTreasury(db, p.data, actor, new Date())); } catch (e) { return fail(e); }
  return done(`/admin/agents/${p.data.agentId}`, "Trésorerie simulée ajustée.");
}

// ——— Points de service ———
const pointSchema = z.object({
  id: z.string().optional(),
  name: text("Nom", 3, 80), kind: z.enum(["cabine", "boutique", "kiosque"]),
  address: text("Adresse", 3, 160), quarter: text("Quartier", 2, 60), commune: text("Commune", 2, 60), city: text("Ville", 2, 60),
  lat: z.coerce.number({ error: "Latitude invalide." }).min(-90).max(90), lng: z.coerce.number({ error: "Longitude invalide." }).min(-180).max(180),
  hours: text("Horaires", 3, 80), status: z.enum(["open", "closed", "suspended"]), services,
});
export async function savePointAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("points.manage");
  const p = parse(pointSchema, fd);
  if (!p.ok) return p.state;
  const { id, ...input } = p.data;
  let pid: string;
  try { pid = transact((db) => saveServicePoint(db, input, actor.id, new Date(), id || undefined)).id; } catch (e) { return fail(e); }
  if (!id) redirect(`/admin/points/${pid}?cree=1`);
  return done(`/admin/points/${pid}`, "Point de service enregistré.");
}

// ——— Banques et offres ———
const bankSchema = z.object({
  id: z.string().optional(), name: text("Nom", 3, 80), shortName: text("Sigle", 2, 5), color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Format #RRGGBB."),
  tagline: text("Accroche", 3, 120), description: text("Description", 10, 1000), services: lines, generalConditions: text("Conditions générales", 3, 1000),
  procedures: lines, eligibility: lines, status: z.enum(["demo_available", "coming_soon", "inactive"]),
  phone: z.string().trim().max(60).optional(), email: z.string().trim().max(120).optional(), website: z.string().trim().max(160).optional().refine((v) => !v || /^https?:\/\//.test(v), "L'adresse doit commencer par http(s)://"), address: z.string().trim().max(160).optional(),
});
export async function saveBankAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("banks.manage");
  const p = parse(bankSchema, fd);
  if (!p.ok) return p.state;
  const { id, phone: ph, email, website, address, ...rest } = p.data;
  let bid: string;
  try { bid = transact((db) => saveBank(db, { ...rest, contact: { phone: ph || undefined, email: email || undefined, website: website || undefined, address: address || undefined } }, actor.id, new Date(), id || undefined)).id; } catch (e) { return fail(e); }
  if (!id) redirect(`/admin/banques/${bid}?cree=1`);
  return done(`/admin/banques/${bid}`, "Banque enregistrée.");
}

const offerSchema = z.object({
  id: z.string().optional(), bankId: z.string(), name: text("Nom", 3, 80), accountType: z.enum(["courant", "epargne", "jeune", "pro", "diaspora"]),
  currencies: z.preprocess((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]), z.array(currency).min(1, "Au moins une devise.")),
  feeCurrency: currency, openingFee: optionalMajor, monthlyFee: optionalMajor, minDeposit: optionalMajor,
  withdrawalConditions: text("Conditions de retrait", 3, 300), conditions: lines, services: lines, requiredDocuments: lines,
  accessibility: text("Accessibilité", 3, 300), active: z.string().optional().transform((v) => v === "on"),
});
export async function saveOfferAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("banks.manage");
  const p = parse(offerSchema, fd);
  if (!p.ok) return p.state;
  const { id, feeCurrency, openingFee, monthlyFee, minDeposit, ...rest } = p.data;
  const money = (v: number | null) => (v === null ? null : { amount: v, currency: feeCurrency as Currency });
  try { transact((db) => saveOffer(db, { ...rest, openingFee: money(openingFee), monthlyFee: money(monthlyFee), minDeposit: money(minDeposit) }, actor.id, new Date(), id || undefined)); } catch (e) { return fail(e); }
  revalidatePath(`/admin/banques/${p.data.bankId}`);
  redirect(`/admin/banques/${p.data.bankId}?offre_ok=1`);
}

// ——— Demandes ———
export async function decideApplicationAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("applications.decide");
  const p = parse(z.object({ id: z.string(), to: z.enum(["under_review", "info_required", "approved_sim", "rejected_sim", "completed"]), comment: z.string().trim().max(600).default("") }), fd);
  if (!p.ok) return p.state;
  try { transact((db) => transitionApplication(db, p.data.id, p.data.to, actor.id, p.data.comment, new Date())); } catch (e) { return fail(e); }
  return done(`/admin/demandes/${p.data.id}`, "Statut mis à jour. Le client a été notifié.");
}

// ——— Commissions ———
export async function saveCommissionRuleAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("commissions.manage");
  const p = parse(z.object({
    id: z.string().optional(), operationType: z.enum(["deposit", "withdrawal"]), currency, fixed: major("Fixe"), percent: pct,
    min: major("Minimum"), max: optionalMajor, agentId: z.string().optional(), active: z.string().optional().transform((v) => v === "on"),
  }), fd);
  if (!p.ok) return p.state;
  const { percent, id, agentId, ...rest } = p.data;
  try { transact((db) => saveCommissionRule(db, { ...rest, id: id || undefined, percentBp: percent, agentId: agentId || undefined }, actor.id, new Date())); } catch (e) { return fail(e); }
  revalidatePath("/admin/commissions");
  return { ok: true, message: "Règle enregistrée. Elle s'applique aux prochaines opérations." };
}

// ——— Incidents ———
export async function updateIncidentAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("incidents.manage");
  const p = parse(z.object({ id: z.string(), status: z.enum(["open", "in_progress", "resolved", "closed"]), priority: z.enum(["low", "medium", "high"]), assigneeUserId: z.string().optional(), comment: z.string().trim().max(1000).optional() }), fd);
  if (!p.ok) return p.state;
  try { transact((db) => updateIncident(db, p.data.id, { ...p.data, assigneeUserId: p.data.assigneeUserId || undefined }, actor.id, new Date())); } catch (e) { return fail(e); }
  return done(`/admin/incidents/${p.data.id}`, "Incident mis à jour.");
}

// ——— Notifications ———
export async function saveAnnouncementAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("notifications.manage");
  const p = parse(z.object({ id: z.string().optional(), title: text("Titre", 3, 100), body: text("Message", 5, 600), audience: z.enum(["all", "clients", "agents", "admins"]), intent: z.enum(["draft", "publish"]) }), fd);
  if (!p.ok) return p.state;
  try {
    const n = transact((db) => {
      const a = saveAnnouncement(db, { ...p.data, id: p.data.id || undefined }, actor.id, new Date());
      return p.data.intent === "publish" ? publishAnnouncement(db, a.id, actor.id, new Date()) : -1;
    });
    revalidatePath("/admin/notifications");
    return { ok: true, message: n >= 0 ? `Notification publiée à ${n} destinataire(s).` : "Brouillon enregistré." };
  } catch (e) { return fail(e); }
}

export async function publishAnnouncementAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("notifications.manage");
  try {
    const n = transact((db) => publishAnnouncement(db, String(fd.get("id")), actor.id, new Date()));
    return done("/admin/notifications", `Notification publiée à ${n} destinataire(s).`);
  } catch (e) { return fail(e); }
}

// ——— Paramètres ———
export async function saveSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("settings.manage");
  const p = parse(z.object({
    supportPhone: text("Téléphone d'assistance", 3, 60), supportEmail: z.email("E-mail invalide."),
    depositPct: pct, depositMinUSD: major("Frais min USD"), depositMinCDF: major("Frais min CDF"),
    withdrawalPct: pct, withdrawalMinUSD: major("Frais min USD"), withdrawalMinCDF: major("Frais min CDF"),
    minUSD: amount, maxOpUSD: amount, maxDayUSD: amount, minCDF: amount, maxOpCDF: amount, maxDayCDF: amount,
    alertUSD: major("Seuil USD"), alertCDF: major("Seuil CDF"),
    enabledServices: services,
    enabledCurrencies: z.preprocess((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]), z.array(currency)),
    registrationOpen: z.string().optional().transform((v) => v === "on"),
  }), fd);
  if (!p.ok) return p.state;
  const d = p.data;
  try {
    transact((db) => updateSettings(db, {
      platformName: db.settings.platformName, supportPhone: d.supportPhone, supportEmail: d.supportEmail,
      fees: { deposit: { percentBp: d.depositPct, min: { USD: d.depositMinUSD, CDF: d.depositMinCDF } }, withdrawal: { percentBp: d.withdrawalPct, min: { USD: d.withdrawalMinUSD, CDF: d.withdrawalMinCDF } } },
      limits: { USD: { min: d.minUSD, maxPerOperation: d.maxOpUSD, maxPerDayPerClient: d.maxDayUSD }, CDF: { min: d.minCDF, maxPerOperation: d.maxOpCDF, maxPerDayPerClient: d.maxDayCDF } },
      liquidityAlert: { USD: d.alertUSD, CDF: d.alertCDF }, enabledServices: d.enabledServices, enabledCurrencies: d.enabledCurrencies, registrationOpen: d.registrationOpen,
    }, actor.id, new Date()));
  } catch (e) { return fail(e); }
  return done("/admin/parametres", "Paramètres enregistrés.");
}

export async function resetDemoAction(_: FormState, fd: FormData): Promise<FormState> {
  const actor = await requirePermission("demo.reset");
  if (fd.get("confirm") !== "REINITIALISER") return { error: "Saisissez REINITIALISER pour confirmer.", fieldErrors: { confirm: "Confirmation requise." } };
  const seed = buildSeed();
  audit(seed, { action: "demo.reset", entity: "database", details: `Réinitialisation demandée par ${readDb().users.find((u) => u.id === actor.id)?.firstName ?? "admin"}` }, new Date());
  resetDb(seed);
  redirect("/connexion?reinitialisation=1");
}
