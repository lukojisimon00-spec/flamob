import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/forms";
import { registerAction } from "@/app/actions/auth";
import { readDb } from "@/lib/db/store";
import { Alert } from "@/components/ui/feedback";

export const metadata = { title: "Créer un compte" };

export default function RegisterPage() {
  const open = readDb().settings.registrationOpen;
  return (
    <AuthShell title="Créer un compte" subtitle="Gratuit, en moins de deux minutes." footer={<>Déjà inscrit ? <Link href="/connexion" className="font-semibold text-cyan-700 hover:underline">Se connecter</Link></>}>
      {open ? <RegisterForm action={registerAction} /> : <Alert tone="warning" title="Inscriptions fermées">Les inscriptions sont momentanément fermées dans cette démonstration.</Alert>}
    </AuthShell>
  );
}
