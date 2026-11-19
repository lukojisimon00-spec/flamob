import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { DemoLogin, LoginForm } from "@/components/auth/forms";
import { Alert } from "@/components/ui/feedback";
import { demoLoginAction, loginAction } from "@/app/actions/auth";
import { getCurrentUser, homeFor } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/config";

export const metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  return (
    <AuthShell title="Connexion" subtitle="Accédez à votre espace Flamob." footer={<>Pas encore de compte ? <Link href="/inscription" className="font-semibold text-cyan-700 hover:underline">Créer un compte</Link></>}>
      <div className="space-y-4">
        {sp.deconnecte && <Alert tone="success">Vous êtes déconnecté.</Alert>}
        {sp.reinitialise && <Alert tone="success">Mot de passe réinitialisé. Vous pouvez vous connecter.</Alert>}
        {sp.reinitialisation && <Alert tone="success">Données de démonstration réinitialisées.</Alert>}
        {sp.suite && <Alert tone="info">Connectez-vous pour continuer.</Alert>}
        <LoginForm action={loginAction} suite={sp.suite} />
        {isDemoMode() && (
          <div className="space-y-3 border-t border-line pt-5">
            <p className="text-sm font-semibold">Accès rapide aux comptes de démonstration</p>
            <p className="text-xs text-muted">Comptes fictifs, sans mot de passe, disponibles uniquement en mode démonstration.</p>
            <DemoLogin action={demoLoginAction} />
          </div>
        )}
      </div>
    </AuthShell>
  );
}
