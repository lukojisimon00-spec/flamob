"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { readDb, transact } from "@/lib/db/store";
import { requireClient, requireRole, sessionToken, getCurrentUser } from "@/lib/auth/session";
import { deleteDraft, respondToInfoRequest, saveApplication } from "@/lib/domain/applications";
import { quoteOperation, simulateOperation, type OperationInput, type Quote } from "@/lib/domain/operations";
import { markRead } from "@/lib/domain/notifications";
import { changePassword, fullName, updateProfile } from "@/lib/domain/users";
import { reportIncident } from "@/lib/domain/network";
import { fail, parse } from "@/lib/action-utils";
import { amount, checkbox, currency, name, optionalEmail, password, text } from "@/lib/validation";
import type { FormState } from "@/lib/forms";
import type { ApplicationDocument } from "@/lib/db/schema";

// ——— Demandes d'ouverture de compte ———

const documentsSchema = z.string().default("[]").transform((s, ctx): ApplicationDocument[] => {
  try {
    const arr = z.array(z.object({ name: z.string().max(120), kind: z.string().max(60), sizeBytes: z.number().int().min(0).max(10_000_000) })).max(6).parse(JSON.parse(s));
    return arr;
  } catch {
    ctx.addIssue({ code: "custom", message: "Documents invalides (6 maximum, 10 Mo maximum chacun)." });
    return z.NEVER;
  }
});

const applicationSchema = z.object({
  id: z.string().optional(),
  bankId: z.string().min(1, "Choisissez une banque."),
  offerId: z.string().min(1, "Choisissez une offre."),
  currency,
  firstName: name("Prénom"),
  lastName: name("Nom"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance requise.").refine((v) => {
    const age = (Date.now() - new Date(v).getTime()) / (365.25 * 86400000);
    return age >= 18 && age < 110;
  }, "Vous devez avoir au moins 18 ans."),
  idType: text("Type de pièce", 2, 40),
  idNumber: text("Numéro de pièce", 3, 40),
  address: text("Adresse", 4, 160),
  commune: text("Commune", 2, 60),
  occupation: text("Profession", 2, 80),
  email: optionalEmail,
  documents: documentsSchema,
  intent: z.enum(["draft", "submit"]),
  accept: checkbox,
}).superRefine((v, ctx) => {
  if (v.intent === "submit" && !v.accept) ctx.addIssue({ code: "custom", path: ["accept"], message: "Merci de confirmer avoir pris connaissance du caractère simulé de la demande." });
});

export async function saveApplicationAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireClient();
  const p = parse(applicationSchema, fd);
  if (!p.ok) return p.state;
  const d = p.data;
  let id: string;
  try {
    id = transact((db) => saveApplication(db, user.id, {
      bankId: d.bankId, offerId: d.offerId, currency: d.currency, documents: d.documents, submit: d.intent === "submit",
      applicant: { firstName: d.firstName, lastName: d.lastName, birthDate: d.birthDate, idType: d.idType, idNumber: d.idNumber, address: d.address, commune: d.commune, occupation: d.occupation, phone: user.phone, email: d.email || undefined },
    }, new Date(), d.id || undefined)).id;
  } catch (e) {
    return fail(e);
  }
  redirect(`/app/demandes/${id}?${d.intent === "submit" ? "soumise" : "brouillon"}=1`);
}

export async function deleteDraftAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireClient();
  try {
    transact((db) => deleteDraft(db, user.id, String(fd.get("id")), new Date()));
  } catch (e) {
    return fail(e);
  }
  redirect("/app/demandes?supprime=1");
}

export async function respondInfoAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireClient();
  const p = parse(z.object({ id: z.string(), comment: text("Réponse", 3, 600), documents: documentsSchema }), fd);
  if (!p.ok) return p.state;
  try {
    transact((db) => respondToInfoRequest(db, user.id, p.data.id, p.data.comment, p.data.documents, new Date()));
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/app/demandes/${p.data.id}`);
  return { ok: true, message: "Réponse envoyée. Votre demande repasse en examen (simulation)." };
}

// ——— Opérations simulées ———

const operationSchema = z.object({
  type: z.enum(["deposit", "withdrawal"]),
  agentId: z.string().min(1, "Choisissez un agent."),
  bankId: z.string().min(1, "Choisissez une banque."),
  currency,
  amount,
  accountLabel: z.string().trim().max(80).default("Compte de démonstration"),
  accountNumber: z.string().trim().min(4, "Numéro de compte de démonstration requis.").max(34).regex(/^[A-Za-z0-9 ]+$/, "Lettres et chiffres uniquement."),
});

function toInput(user: { id: string; firstName: string; lastName: string; phone: string }, d: z.infer<typeof operationSchema>): OperationInput {
  return { ...d, clientUserId: user.id, clientName: fullName(user), clientPhone: user.phone, initiatedBy: "client", initiatedByUserId: user.id };
}

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Calcul des frais, limites et disponibilité de liquidité — aucune écriture. */
export async function quoteOperationAction(fd: FormData): Promise<QuoteResult> {
  const user = await requireClient();
  const p = parse(operationSchema, fd);
  if (!p.ok) return { ok: false, error: p.state.error ?? "Données invalides.", fieldErrors: p.state.fieldErrors };
  return { ok: true, quote: quoteOperation(readDb(), toInput(user, p.data), new Date()) };
}

export async function executeOperationAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireClient();
  const p = parse(operationSchema, fd);
  if (!p.ok) return p.state;
  let id: string;
  try {
    id = transact((db) => simulateOperation(db, toInput(user, p.data), new Date())).id;
  } catch (e) {
    return fail(e);
  }
  redirect(`/app/operations/${id}?nouveau=1`);
}

// ——— Notifications (tous rôles) ———

export async function markNotificationsReadAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const id = String(fd.get("id") ?? "all");
  transact((db) => markRead(db, user.id, id, new Date()));
  revalidatePath("/", "layout");
}

// ——— Profil (tous rôles) ———

const profileSchema = z.object({
  firstName: name("Prénom"),
  lastName: name("Nom"),
  email: optionalEmail,
  city: z.string().trim().max(60).optional(),
  commune: z.string().trim().max(60).optional(),
  preferredCurrency: currency,
  notifyBySms: checkbox,
});

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const p = parse(profileSchema, fd);
  if (!p.ok) return p.state;
  try {
    transact((db) => updateProfile(db, user.id, { ...p.data, email: p.data.email || undefined }, new Date()));
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Profil mis à jour." };
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const token = await sessionToken();
  if (!user || !token) redirect("/connexion");
  const p = parse(z.object({ current: z.string().min(1, "Requis."), next: password, confirm: z.string() })
    .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas." }), fd);
  if (!p.ok) return p.state;
  try {
    transact((db) => changePassword(db, user.id, p.data.current, p.data.next, token, new Date()));
  } catch (e) {
    return fail(e);
  }
  return { ok: true, message: "Mot de passe modifié. Vos autres sessions ont été fermées." };
}

// ——— Signalements (client et agent) ———

const incidentSchema = z.object({
  type: z.enum(["operational", "error", "complaint", "liquidity", "technical", "security", "other"]),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  title: text("Titre", 4, 120),
  description: text("Description", 10, 2000),
  transactionReference: z.string().trim().max(40).optional(),
});

export async function reportIncidentAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || user.role === "admin") redirect("/connexion");
  if (user.role === "client") await requireClient(); else await requireRole("agent");
  const p = parse(incidentSchema, fd);
  if (!p.ok) return p.state;
  try {
    const inc = transact((db) => reportIncident(db, p.data, user.id, new Date()));
    revalidatePath("/", "layout");
    return { ok: true, message: `Signalement ${inc.reference} transmis à l'équipe Flamob.` };
  } catch (e) {
    return fail(e);
  }
}
