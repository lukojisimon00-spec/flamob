/**
 * Demandes d'ouverture de compte SIMULÉES.
 * Une approbation simulée ne signifie jamais qu'un compte bancaire réel est ouvert.
 */
import type { AccountApplication, ApplicationDocument, ApplicationStatus, Currency, Database } from "../db/schema";
import { assert } from "../errors";
import { makeReference, maskAccount, newId } from "../ids";
import { applicationStatusLabel } from "../labels";
import { audit } from "./audit";
import { notify } from "./notifications";

/** Transitions autorisées côté administration. */
export const ADMIN_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  submitted: ["under_review", "info_required", "rejected_sim"],
  under_review: ["info_required", "approved_sim", "rejected_sim"],
  info_required: ["under_review", "rejected_sim"],
  approved_sim: ["completed"],
};

export type ApplicantInput = AccountApplication["applicant"];

export interface ApplicationInput {
  bankId: string;
  offerId: string;
  currency: Currency;
  applicant: ApplicantInput;
  documents: ApplicationDocument[];
  submit: boolean;
}

export function saveApplication(db: Database, userId: string, input: ApplicationInput, now: Date, existingId?: string): AccountApplication {
  const bank = db.banks.find((b) => b.id === input.bankId);
  assert(bank && bank.status === "demo_available", "Cette banque n'accepte pas de demandes dans la démonstration.");
  const offer = db.offers.find((o) => o.id === input.offerId && o.bankId === bank.id);
  assert(offer && offer.active, "Offre introuvable ou indisponible.");
  assert(offer.currencies.includes(input.currency), "Cette devise n'est pas proposée pour cette offre.");
  const iso = now.toISOString();

  let app: AccountApplication | undefined;
  if (existingId) {
    app = db.applications.find((a) => a.id === existingId && a.userId === userId);
    assert(app, "Demande introuvable.");
    assert(app.status === "draft", "Seul un brouillon peut être modifié.");
    Object.assign(app, { bankId: bank.id, offerId: offer.id, currency: input.currency, applicant: input.applicant, documents: input.documents, updatedAt: iso });
  } else {
    app = {
      id: newId(),
      reference: makeReference(db, "DEM", now),
      userId,
      bankId: bank.id,
      offerId: offer.id,
      status: "draft",
      currency: input.currency,
      applicant: input.applicant,
      documents: input.documents,
      history: [{ at: iso, status: "draft", byUserId: userId }],
      createdAt: iso,
      updatedAt: iso,
    };
    db.applications.push(app);
  }

  if (input.submit) {
    app.status = "submitted";
    app.submittedAt = iso;
    app.history.push({ at: iso, status: "submitted", byUserId: userId });
    notify(db, userId, {
      type: "application",
      title: "Demande soumise (simulation)",
      body: `Votre demande ${app.reference} auprès de ${bank.name} a été enregistrée. Elle sera examinée dans le cadre de la démonstration — aucun compte réel ne sera ouvert.`,
      link: `/app/demandes/${app.id}`,
    }, now);
    audit(db, { actorUserId: userId, action: "application.submit", entity: "application", entityId: app.id, details: app.reference }, now);
  } else {
    audit(db, { actorUserId: userId, action: "application.save_draft", entity: "application", entityId: app.id }, now);
  }
  return app;
}

export function deleteDraft(db: Database, userId: string, id: string, now: Date) {
  const app = db.applications.find((a) => a.id === id && a.userId === userId);
  assert(app, "Demande introuvable.");
  assert(app.status === "draft", "Seul un brouillon peut être supprimé.");
  db.applications = db.applications.filter((a) => a.id !== id);
  audit(db, { actorUserId: userId, action: "application.delete_draft", entity: "application", entityId: id }, now);
}

/** Réponse du client à une demande d'informations complémentaires. */
export function respondToInfoRequest(db: Database, userId: string, id: string, comment: string, documents: ApplicationDocument[], now: Date) {
  const app = db.applications.find((a) => a.id === id && a.userId === userId);
  assert(app, "Demande introuvable.");
  assert(app.status === "info_required", "Aucune information complémentaire n'est attendue.");
  assert(comment.trim().length >= 3, "Merci de préciser votre réponse.", "comment");
  app.documents.push(...documents);
  app.status = "under_review";
  app.updatedAt = now.toISOString();
  app.history.push({ at: app.updatedAt, status: "under_review", byUserId: userId, comment: `Réponse du client : ${comment.trim()}` });
  audit(db, { actorUserId: userId, action: "application.respond", entity: "application", entityId: id }, now);
}

export function transitionApplication(db: Database, id: string, to: ApplicationStatus, actorUserId: string, comment: string, now: Date) {
  const app = db.applications.find((a) => a.id === id);
  assert(app, "Demande introuvable.");
  const allowed = ADMIN_TRANSITIONS[app.status] ?? [];
  assert(allowed.includes(to), `Transition impossible : ${applicationStatusLabel[app.status]} → ${applicationStatusLabel[to]}.`);
  if (to === "info_required" || to === "rejected_sim") assert(comment.trim().length >= 3, "Un commentaire est obligatoire pour cette décision.", "comment");
  const iso = now.toISOString();
  app.status = to;
  app.updatedAt = iso;
  app.history.push({ at: iso, status: to, byUserId: actorUserId, comment: comment.trim() || undefined });

  const bank = db.banks.find((b) => b.id === app.bankId);
  if (to === "completed") {
    // Crée un compte de DÉMONSTRATION utilisable dans les simulations de dépôt/retrait.
    const fakeNumber = `DEMO${String(Math.abs(hashCode(app.id)) % 1_0000_0000).padStart(8, "0")}`;
    db.demoAccounts.push({
      id: newId(), userId: app.userId, bankId: app.bankId, label: `${bank?.shortName ?? "Banque"} — compte de démonstration`,
      maskedNumber: maskAccount(fakeNumber), currency: app.currency, applicationId: app.id, createdAt: iso,
    });
  }
  const messages: Partial<Record<ApplicationStatus, string>> = {
    under_review: "Votre demande est en cours d'examen (simulation).",
    info_required: `Des informations complémentaires sont requises : ${comment.trim()}`,
    approved_sim: "Votre demande a été approuvée dans le cadre de la simulation. Aucun compte réel n'est ouvert.",
    rejected_sim: `Votre demande a été refusée dans le cadre de la simulation. Motif : ${comment.trim()}`,
    completed: "Parcours terminé. Un compte de démonstration a été ajouté à votre espace pour tester les simulations.",
  };
  notify(db, app.userId, { type: "status", title: `${app.reference} — ${applicationStatusLabel[to]}`, body: messages[to] ?? "", link: `/app/demandes/${app.id}` }, now);
  audit(db, { actorUserId, action: `application.${to}`, entity: "application", entityId: app.id, details: comment.trim() || undefined }, now);
}

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
