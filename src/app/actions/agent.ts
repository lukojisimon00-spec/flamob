"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { readDb, transact } from "@/lib/db/store";
import { requireAgent } from "@/lib/auth/session";
import { quoteOperation, simulateOperation, type OperationInput } from "@/lib/domain/operations";
import { fullName, normalizePhone } from "@/lib/domain/users";
import { fail, parse } from "@/lib/action-utils";
import { amount, currency, text } from "@/lib/validation";
import type { FormState } from "@/lib/forms";
import type { QuoteResult } from "./client";

const schema = z.object({
  type: z.enum(["deposit", "withdrawal"]),
  bankId: z.string().min(1, "Choisissez une banque."),
  currency,
  amount,
  clientName: text("Nom du client", 2, 80),
  clientPhone: z.string().trim().optional().refine((v) => !v || normalizePhone(v) !== null, "Numéro invalide."),
  accountNumber: z.string().trim().min(4, "Numéro de compte de démonstration requis.").max(34).regex(/^[A-Za-z0-9 ]+$/, "Lettres et chiffres uniquement."),
  identityChecked: z.string().optional(),
});

async function build(fd: FormData): Promise<{ ok: true; input: OperationInput } | { ok: false; state: FormState }> {
  const { user, agent } = await requireAgent();
  const p = parse(schema, fd);
  if (!p.ok) return p;
  const phone = p.data.clientPhone ? normalizePhone(p.data.clientPhone)! : undefined;
  // Si le client possède un compte Flamob, l'opération apparaît aussi dans son historique.
  const client = phone ? readDb().users.find((u) => u.phone === phone && u.role === "client" && u.status === "active") : undefined;
  return {
    ok: true,
    input: {
      type: p.data.type, agentId: agent.id, bankId: p.data.bankId, currency: p.data.currency, amount: p.data.amount,
      accountLabel: "Compte de démonstration", accountNumber: p.data.accountNumber,
      clientUserId: client?.id, clientName: client ? fullName(client) : p.data.clientName, clientPhone: phone,
      initiatedBy: "agent", initiatedByUserId: user.id,
    },
  };
}

export async function agentQuoteAction(fd: FormData): Promise<QuoteResult & { linkedClient?: string }> {
  const b = await build(fd);
  if (!b.ok) return { ok: false, error: b.state.error ?? "Données invalides.", fieldErrors: b.state.fieldErrors };
  return { ok: true, quote: quoteOperation(readDb(), b.input, new Date()), linkedClient: b.input.clientUserId ? b.input.clientName : undefined };
}

export async function agentExecuteAction(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("identityChecked") !== "on") return { error: "Confirmez la vérification de l'identité du client (procédure).", fieldErrors: { identityChecked: "Requis." } };
  const b = await build(fd);
  if (!b.ok) return b.state;
  let id: string;
  try {
    id = transact((db) => simulateOperation(db, b.input, new Date())).id;
  } catch (e) {
    return fail(e);
  }
  redirect(`/agent/operations/${id}?nouveau=1`);
}
