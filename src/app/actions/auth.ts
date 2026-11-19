"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { readDb, transact } from "@/lib/db/store";
import { attemptLogin, confirmPhoneSimulated, findUserByIdentifier, issueOtp, registerClient, resetPassword } from "@/lib/domain/users";
import { endSession, getCurrentUser, homeFor, startSession } from "@/lib/auth/session";
import { fail, parse } from "@/lib/action-utils";
import { loginSchema, password, registerSchema } from "@/lib/validation";
import type { FormState } from "@/lib/forms";
import { isDemoMode } from "@/lib/config";
import { DEMO_PHONES } from "@/lib/db/seed";

/** N'accepte qu'un chemin interne pour la redirection après connexion (anti open-redirect). */
function safeNext(next: unknown, fallback: string) {
  return typeof next === "string" && /^\/(app|agent|admin)(\/|$)/.test(next) && !next.startsWith("//") ? next : fallback;
}

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const p = parse(registerSchema, fd);
  if (!p.ok) return p.state;
  let userId: string;
  try {
    userId = transact((db) => registerClient(db, { ...p.data, email: p.data.email || undefined }, new Date())).id;
  } catch (e) {
    return fail(e);
  }
  await startSession(userId);
  redirect("/verification");
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const p = parse(loginSchema, fd);
  if (!p.ok) return p.state;
  const result = transact((db) => attemptLogin(db, p.data.identifier, p.data.password, new Date()));
  if (!result.ok) return { error: result.error };
  await startSession(result.user.id);
  const home = result.user.role === "client" && !result.user.phoneVerifiedSimulated ? "/verification" : homeFor(result.user.role);
  redirect(result.user.role === "client" && !result.user.phoneVerifiedSimulated ? home : safeNext(fd.get("suite"), home));
}

export async function demoLoginAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!isDemoMode()) return { error: "La connexion de démonstration est désactivée." };
  const role = String(fd.get("role")) as keyof typeof DEMO_PHONES;
  const phone = DEMO_PHONES[role];
  const user = phone ? readDb().users.find((u) => u.phone === phone && u.isDemo) : undefined;
  if (!user || user.status !== "active") return { error: "Compte de démonstration indisponible." };
  await startSession(user.id);
  redirect(homeFor(user.role));
}

export async function logoutAction() {
  await endSession();
  redirect("/connexion?deconnecte=1");
}

export async function sendPhoneOtpAction(): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const { demoCode } = transact((db) => issueOtp(db, user.id, "phone_verification", new Date()));
  return {
    ok: true,
    message: "Code généré. Il est valable 10 minutes.",
    data: isDemoMode() && demoCode ? { demoCode } : undefined,
  };
}

export async function verifyPhoneAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  const code = String(fd.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) return { error: "Le code comporte 6 chiffres.", fieldErrors: { code: "Le code comporte 6 chiffres." } };
  try {
    transact((db) => confirmPhoneSimulated(db, user.id, code, new Date()));
  } catch (e) {
    return fail(e);
  }
  redirect(homeFor(user.role));
}

export async function forgotPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const identifier = String(fd.get("identifier") ?? "").trim();
  if (identifier.length < 3) return { fieldErrors: { identifier: "Saisissez votre téléphone ou votre e-mail." }, error: "Champ requis." };
  const user = findUserByIdentifier(readDb(), identifier);
  let demoCode: string | undefined;
  if (user && user.status === "active") demoCode = transact((db) => issueOtp(db, user.id, "password_reset", new Date())).demoCode;
  // Message identique que le compte existe ou non (pas d'énumération hors mode démo).
  return {
    ok: true,
    message: "Si un compte correspond, un code de réinitialisation a été envoyé par SMS.",
    data: { step: "code", identifier, ...(isDemoMode() && demoCode ? { demoCode } : {}) },
  };
}

const resetSchema = z.object({
  identifier: z.string().min(3),
  code: z.string().trim().regex(/^\d{6}$/, "Le code comporte 6 chiffres."),
  password,
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Les mots de passe ne correspondent pas." });

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const p = parse(resetSchema, fd);
  const identifier = String(fd.get("identifier") ?? "");
  if (!p.ok) return { ...p.state, data: { step: "code", identifier } };
  const user = findUserByIdentifier(readDb(), p.data.identifier);
  if (!user) return { error: "Code incorrect ou expiré.", data: { step: "code", identifier } };
  try {
    transact((db) => resetPassword(db, user.id, p.data.code, p.data.password, new Date()));
  } catch (e) {
    return { ...fail(e), data: { step: "code", identifier } };
  }
  redirect("/connexion?reinitialise=1");
}
