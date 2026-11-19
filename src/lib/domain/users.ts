import crypto from "node:crypto";
import type { Currency, Database, OtpPurpose, Session, User } from "../db/schema";
import { DomainError, assert } from "../errors";
import { newId } from "../ids";
import { hashPassword, sha256, verifyPassword } from "../auth/password";
import { getSmsProvider } from "../integrations/sms";
import { audit } from "./audit";
import { notify } from "./notifications";
import { addMinutes } from "./time";

export const SESSION_DAYS = 7;
export const MAX_LOGIN_FAILURES = 5;
export const LOCK_MINUTES = 15;
export const OTP_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

/** Normalise un numéro congolais vers +243XXXXXXXXX (9 chiffres). Retourne null si invalide. */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/[\s.\-()]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("243")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return /^[1-9]\d{8}$/.test(d) ? `+243${d}` : null;
}

export function formatPhone(e164: string): string {
  const d = e164.replace("+243", "");
  return `+243 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export const fullName = (u: Pick<User, "firstName" | "lastName">) => `${u.firstName} ${u.lastName}`;

export function findUserByIdentifier(db: Database, identifier: string): User | undefined {
  const id = identifier.trim().toLowerCase();
  if (id.includes("@")) return db.users.find((u) => u.email?.toLowerCase() === id);
  const phone = normalizePhone(id);
  return phone ? db.users.find((u) => u.phone === phone) : undefined;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
}

export function registerClient(db: Database, input: RegisterInput, now: Date): User {
  assert(db.settings.registrationOpen, "Les inscriptions sont momentanément fermées.");
  const phone = normalizePhone(input.phone);
  assert(phone, "Numéro de téléphone invalide.", "phone");
  assert(!db.users.some((u) => u.phone === phone), "Un compte existe déjà avec ce numéro.", "phone");
  const email = input.email?.trim().toLowerCase() || undefined;
  if (email) assert(!db.users.some((u) => u.email === email), "Un compte existe déjà avec cette adresse e-mail.", "email");
  const iso = now.toISOString();
  const user: User = {
    id: newId(),
    role: "client",
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone,
    email,
    passwordHash: hashPassword(input.password),
    status: "active",
    phoneVerifiedSimulated: false,
    preferredCurrency: "USD",
    language: "fr",
    notifyBySms: false,
    isDemo: false,
    createdAt: iso,
    updatedAt: iso,
  };
  db.users.push(user);
  notify(db, user.id, {
    type: "info",
    title: "Bienvenue sur Flamob",
    body: "Votre compte est créé. Découvrez les banques de démonstration et le réseau d'agents. Toutes les opérations de ce prototype sont simulées.",
    link: "/app",
  }, now);
  audit(db, { actorUserId: user.id, action: "user.register", entity: "user", entityId: user.id }, now);
  return user;
}

// ——— Connexion et limitation des tentatives ———

export type LoginResult = { ok: true; user: User } | { ok: false; error: string };

export function attemptLogin(db: Database, identifier: string, password: string, now: Date): LoginResult {
  const key = identifier.trim().toLowerCase();
  const throttle = db.loginThrottles.find((t) => t.key === key);
  if (throttle?.lockedUntil && new Date(throttle.lockedUntil) > now) {
    const minutes = Math.ceil((new Date(throttle.lockedUntil).getTime() - now.getTime()) / 60000);
    return { ok: false, error: `Trop de tentatives. Réessayez dans ${minutes} min.` };
  }
  const user = findUserByIdentifier(db, identifier);
  const valid = user ? verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) {
    registerFailure(db, key, now);
    audit(db, { action: "auth.login_failed", entity: "user", entityId: user?.id, details: "Identifiants invalides" }, now);
    return { ok: false, error: "Identifiant ou mot de passe incorrect." };
  }
  if (user.status === "suspended") {
    audit(db, { actorUserId: user.id, action: "auth.login_blocked", entity: "user", entityId: user.id }, now);
    return { ok: false, error: "Ce compte est suspendu. Contactez l'assistance Flamob." };
  }
  db.loginThrottles = db.loginThrottles.filter((t) => t.key !== key);
  return { ok: true, user };
}

function registerFailure(db: Database, key: string, now: Date) {
  let t = db.loginThrottles.find((x) => x.key === key);
  const windowStart = addMinutes(now, -LOCK_MINUTES);
  if (!t || new Date(t.firstFailureAt) < windowStart) {
    db.loginThrottles = db.loginThrottles.filter((x) => x.key !== key);
    t = { key, failures: 0, firstFailureAt: now.toISOString() };
    db.loginThrottles.push(t);
  }
  t.failures += 1;
  if (t.failures >= MAX_LOGIN_FAILURES) t.lockedUntil = addMinutes(now, LOCK_MINUTES).toISOString();
}

// ——— Sessions ———

export function createSession(db: Database, userId: string, now: Date, userAgent?: string): { token: string; session: Session } {
  const token = crypto.randomBytes(32).toString("base64url");
  const session: Session = {
    id: newId(),
    userId,
    tokenHash: sha256(token),
    createdAt: now.toISOString(),
    expiresAt: addMinutes(now, SESSION_DAYS * 24 * 60).toISOString(),
    userAgent: userAgent?.slice(0, 200),
  };
  // Nettoyage des sessions expirées.
  db.sessions = db.sessions.filter((s) => new Date(s.expiresAt) > now);
  db.sessions.push(session);
  const user = db.users.find((u) => u.id === userId);
  if (user) user.lastLoginAt = now.toISOString();
  audit(db, { actorUserId: userId, action: "auth.login", entity: "session", entityId: session.id }, now);
  return { token, session };
}

export function findSessionUser(db: Database, token: string, now: Date): User | null {
  const hash = sha256(token);
  const session = db.sessions.find((s) => s.tokenHash === hash);
  if (!session || new Date(session.expiresAt) <= now) return null;
  const user = db.users.find((u) => u.id === session.userId);
  if (!user || user.status !== "active") return null;
  return user;
}

export function destroySession(db: Database, token: string) {
  const hash = sha256(token);
  db.sessions = db.sessions.filter((s) => s.tokenHash !== hash);
}

export function destroyUserSessions(db: Database, userId: string) {
  db.sessions = db.sessions.filter((s) => s.userId !== userId);
}

// ——— OTP simulé ———

export function issueOtp(db: Database, userId: string, purpose: OtpPurpose, now: Date): { demoCode?: string } {
  const user = db.users.find((u) => u.id === userId);
  assert(user, "Utilisateur introuvable.");
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  db.otpChallenges = db.otpChallenges.filter((c) => !(c.userId === userId && c.purpose === purpose));
  db.otpChallenges.push({
    id: newId(), userId, purpose, codeHash: sha256(`${userId}:${code}`), attempts: 0,
    expiresAt: addMinutes(now, OTP_MINUTES).toISOString(), createdAt: now.toISOString(),
  });
  const delivery = getSmsProvider().sendOtp(user.phone, code);
  return { demoCode: delivery.demoCode };
}

export function verifyOtp(db: Database, userId: string, purpose: OtpPurpose, code: string, now: Date): void {
  const c = db.otpChallenges.find((x) => x.userId === userId && x.purpose === purpose && !x.consumedAt);
  if (!c) throw new DomainError("Aucun code en attente. Demandez un nouveau code.", "code");
  if (new Date(c.expiresAt) <= now) throw new DomainError("Ce code a expiré. Demandez un nouveau code.", "code");
  if (c.attempts >= OTP_MAX_ATTEMPTS) throw new DomainError("Trop d'essais. Demandez un nouveau code.", "code");
  c.attempts += 1;
  if (c.codeHash !== sha256(`${userId}:${code.trim()}`)) throw new DomainError("Code incorrect.", "code");
  c.consumedAt = now.toISOString();
}

export function confirmPhoneSimulated(db: Database, userId: string, code: string, now: Date) {
  verifyOtp(db, userId, "phone_verification", code, now);
  const user = db.users.find((u) => u.id === userId)!;
  user.phoneVerifiedSimulated = true;
  user.updatedAt = now.toISOString();
  audit(db, { actorUserId: userId, action: "user.phone_verified_simulated", entity: "user", entityId: userId }, now);
}

export function resetPassword(db: Database, userId: string, code: string, newPassword: string, now: Date) {
  verifyOtp(db, userId, "password_reset", code, now);
  const user = db.users.find((u) => u.id === userId)!;
  user.passwordHash = hashPassword(newPassword);
  user.updatedAt = now.toISOString();
  destroyUserSessions(db, userId);
  notify(db, userId, { type: "security", title: "Mot de passe réinitialisé", body: "Votre mot de passe a été modifié. Si vous n'êtes pas à l'origine de ce changement, contactez l'assistance." }, now);
  audit(db, { actorUserId: userId, action: "user.password_reset", entity: "user", entityId: userId }, now);
}

// ——— Profil ———

export function updateProfile(
  db: Database,
  userId: string,
  input: { firstName: string; lastName: string; email?: string; city?: string; commune?: string; preferredCurrency: Currency; notifyBySms: boolean },
  now: Date,
) {
  const user = db.users.find((u) => u.id === userId);
  assert(user, "Utilisateur introuvable.");
  const email = input.email?.trim().toLowerCase() || undefined;
  if (email) assert(!db.users.some((u) => u.email === email && u.id !== userId), "Cette adresse e-mail est déjà utilisée.", "email");
  Object.assign(user, {
    firstName: input.firstName.trim(), lastName: input.lastName.trim(), email,
    city: input.city?.trim() || undefined, commune: input.commune?.trim() || undefined,
    preferredCurrency: input.preferredCurrency, notifyBySms: input.notifyBySms, updatedAt: now.toISOString(),
  });
  audit(db, { actorUserId: userId, action: "user.profile_update", entity: "user", entityId: userId }, now);
}

export function changePassword(db: Database, userId: string, current: string, next: string, keepToken: string, now: Date) {
  const user = db.users.find((u) => u.id === userId);
  assert(user, "Utilisateur introuvable.");
  assert(verifyPassword(current, user.passwordHash), "Mot de passe actuel incorrect.", "current");
  user.passwordHash = hashPassword(next);
  user.updatedAt = now.toISOString();
  // Déconnecte les autres appareils, garde la session courante.
  const keep = sha256(keepToken);
  db.sessions = db.sessions.filter((s) => s.userId !== userId || s.tokenHash === keep);
  notify(db, userId, { type: "security", title: "Mot de passe modifié", body: "Votre mot de passe a été changé. Les autres sessions ont été fermées." }, now);
  audit(db, { actorUserId: userId, action: "user.password_change", entity: "user", entityId: userId }, now);
}

export function setUserStatus(db: Database, userId: string, status: User["status"], actorUserId: string, reason: string, now: Date) {
  const user = db.users.find((u) => u.id === userId);
  assert(user, "Utilisateur introuvable.");
  assert(user.id !== actorUserId, "Vous ne pouvez pas modifier le statut de votre propre compte.");
  if (user.role === "admin") {
    const actor = db.users.find((u) => u.id === actorUserId);
    assert(actor?.adminLevel === "superadmin", "Seul un administrateur peut suspendre un compte d'administration.");
  }
  user.status = status;
  user.updatedAt = now.toISOString();
  if (status === "suspended") destroyUserSessions(db, userId);
  audit(db, { actorUserId, action: status === "suspended" ? "user.suspend" : "user.reactivate", entity: "user", entityId: userId, details: reason || undefined }, now);
}
