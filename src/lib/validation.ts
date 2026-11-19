/** Schémas de validation partagés (serveur ; les mêmes règles sont rappelées dans les formulaires). */
import { z } from "zod";
import { normalizePhone } from "./domain/users";

const req = (label: string, min = 2, max = 80) =>
  z.string().trim().min(min, `${label} : ${min} caractères minimum.`).max(max, `${label} : ${max} caractères maximum.`);

export const name = (label: string) => req(label, 2, 60).regex(/^[\p{L}][\p{L}\s'’.-]*$/u, `${label} : lettres uniquement.`);
export const phone = z.string().trim().refine((v) => normalizePhone(v) !== null, "Numéro invalide. Exemple : 0812 345 678 ou +243 812 345 678.");
export const optionalEmail = z.string().trim().max(120).refine((v) => v === "" || z.email().safeParse(v).success, "Adresse e-mail invalide.").optional();
export const password = z.string()
  .min(8, "8 caractères minimum.")
  .max(128, "128 caractères maximum.")
  .regex(/[A-Za-z]/, "Doit contenir au moins une lettre.")
  .regex(/\d/, "Doit contenir au moins un chiffre.");
export const currency = z.enum(["USD", "CDF"], { error: "Devise invalide." });
export const checkbox = z.string().optional().transform((v) => v === "on" || v === "true");

/** Montant saisi en unités majeures (« 125,50 ») → entier en unités mineures. */
export const amount = z.string().trim()
  .transform((v) => Number(v.replace(/\s/g, "").replace(",", ".")))
  .refine((v) => Number.isFinite(v) && v > 0, "Montant invalide.")
  .refine((v) => Math.round(v * 100) === Number((v * 100).toFixed(2)) && Number.isInteger(Math.round(v * 100)), "Maximum deux décimales.")
  .transform((v) => Math.round(v * 100));

export { req as text };

export const registerSchema = z.object({
  lastName: name("Nom"),
  firstName: name("Prénom"),
  phone,
  email: optionalEmail,
  password,
  confirm: z.string(),
  terms: checkbox,
}).superRefine((v, ctx) => {
  if (v.password !== v.confirm) ctx.addIssue({ code: "custom", path: ["confirm"], message: "Les mots de passe ne correspondent pas." });
  if (!v.terms) ctx.addIssue({ code: "custom", path: ["terms"], message: "Vous devez accepter les conditions d'utilisation." });
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Saisissez votre téléphone ou votre e-mail.").max(120),
  password: z.string().min(1, "Saisissez votre mot de passe.").max(128),
});
