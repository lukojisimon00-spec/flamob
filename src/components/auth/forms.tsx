"use client";
import { useState } from "react";
import Link from "next/link";
import { ActionForm, Checkbox, Field, Input, SubmitButton } from "@/components/ui/form";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import type { FormAction, FormState } from "@/lib/forms";

export function LoginForm({ action, suite }: { action: FormAction; suite?: string }) {
  return (
    <ActionForm action={action}>
      {suite && <input type="hidden" name="suite" value={suite} />}
      <Field name="identifier" label="Téléphone ou e-mail">
        <Input name="identifier" autoComplete="username" inputMode="email" placeholder="0812 345 678" required />
      </Field>
      <Field name="password" label="Mot de passe">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="flex justify-end">
        <Link href="/mot-de-passe-oublie" className="text-sm font-semibold text-cyan-700 hover:underline">Mot de passe oublié ?</Link>
      </div>
      <SubmitButton block size="lg">Se connecter</SubmitButton>
    </ActionForm>
  );
}

export function DemoLogin({ action }: { action: FormAction }) {
  const roles = [
    { role: "client", label: "Client", hint: "Christelle K." },
    { role: "agent", label: "Agent", hint: "Point Gombe" },
    { role: "admin", label: "Admin", hint: "Supervision" },
  ];
  return (
    <ActionForm action={action} className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {roles.map((r) => (
          <button key={r.role} type="submit" name="role" value={r.role}
            className="rounded-[var(--radius-control)] border border-line-strong bg-surface px-2 py-2.5 text-center hover:border-cyan-700 hover:bg-cyan-50">
            <span className="block text-sm font-semibold text-navy">{r.label}</span>
            <span className="block text-xs text-muted">{r.hint}</span>
          </button>
        ))}
      </div>
    </ActionForm>
  );
}

export function RegisterForm({ action }: { action: FormAction }) {
  return (
    <ActionForm action={action}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="lastName" label="Nom"><Input name="lastName" autoComplete="family-name" required /></Field>
        <Field name="firstName" label="Prénom"><Input name="firstName" autoComplete="given-name" required /></Field>
      </div>
      <Field name="phone" label="Téléphone" hint="Format accepté : 0812 345 678 ou +243 812 345 678">
        <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0812 345 678" required />
      </Field>
      <Field name="email" label="Adresse e-mail" optional><Input name="email" type="email" autoComplete="email" /></Field>
      <Field name="password" label="Mot de passe" hint="8 caractères minimum, avec au moins une lettre et un chiffre.">
        <Input name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field name="confirm" label="Confirmer le mot de passe"><Input name="confirm" type="password" autoComplete="new-password" required /></Field>
      <Checkbox name="terms" label={<>J&apos;accepte les <Link href="/mentions-legales" className="font-semibold text-cyan-700 underline" target="_blank">conditions d&apos;utilisation</Link> et je comprends que Flamob est un prototype : les opérations sont simulées.</>} />
      <SubmitButton block size="lg">Créer mon compte</SubmitButton>
    </ActionForm>
  );
}

export function VerifyPhone({ send, verify, phone }: { send: () => Promise<FormState>; verify: FormAction; phone: string }) {
  const [sent, setSent] = useState<FormState | null>(null);
  const [sending, setSending] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">Un code à 6 chiffres sera envoyé au <strong className="font-mono">{phone}</strong>.</p>
      <Button type="button" variant="secondary" block disabled={sending} onClick={async () => { setSending(true); setSent(await send()); setSending(false); }}>
        {sending ? "Envoi…" : sent ? "Renvoyer un code" : "Recevoir le code"}
      </Button>
      {sent?.data?.demoCode && (
        <Alert tone="info" title="SMS simulé (mode démonstration)">
          Aucun SMS réel n&apos;est envoyé. Votre code de démonstration : <strong data-demo-code className="font-mono text-base tracking-[0.2em] text-navy">{sent.data.demoCode}</strong>
        </Alert>
      )}
      {sent && !sent.data?.demoCode && <Alert tone="success">{sent.message}</Alert>}
      <ActionForm action={verify}>
        <Field name="code" label="Code de vérification">
          <Input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" className="font-mono tracking-[0.4em]" />
        </Field>
        <SubmitButton block size="lg">Vérifier</SubmitButton>
      </ActionForm>
    </div>
  );
}

export function ForgotPassword({ request, reset }: { request: FormAction; reset: FormAction }) {
  const [step, setStep] = useState<FormState | null>(null);
  if (!step?.data?.identifier)
    return (
      <ActionForm action={request} onSuccess={(s) => setStep(s)}>
        <Field name="identifier" label="Téléphone ou e-mail du compte"><Input name="identifier" autoComplete="username" /></Field>
        <SubmitButton block size="lg">Recevoir un code</SubmitButton>
      </ActionForm>
    );
  return (
    <div className="space-y-4">
      <Alert tone="success">{step.message}</Alert>
      {step.data.demoCode && (
        <Alert tone="info" title="SMS simulé (mode démonstration)">
          Code de démonstration : <strong data-demo-code className="font-mono text-base tracking-[0.2em] text-navy">{step.data.demoCode}</strong>
        </Alert>
      )}
      <ActionForm action={reset}>
        <input type="hidden" name="identifier" value={step.data.identifier} />
        <Field name="code" label="Code reçu"><Input name="code" inputMode="numeric" maxLength={6} autoComplete="one-time-code" className="font-mono tracking-[0.4em]" /></Field>
        <Field name="password" label="Nouveau mot de passe" hint="8 caractères minimum, avec une lettre et un chiffre."><Input name="password" type="password" autoComplete="new-password" /></Field>
        <Field name="confirm" label="Confirmer"><Input name="confirm" type="password" autoComplete="new-password" /></Field>
        <SubmitButton block size="lg">Réinitialiser le mot de passe</SubmitButton>
      </ActionForm>
      <button type="button" className="text-sm font-semibold text-cyan-700 hover:underline" onClick={() => setStep(null)}>Utiliser un autre identifiant</button>
    </div>
  );
}
