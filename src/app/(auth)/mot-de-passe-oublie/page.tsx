import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPassword } from "@/components/auth/forms";
import { forgotPasswordAction, resetPasswordAction } from "@/app/actions/auth";

export const metadata = { title: "Mot de passe oublié" };

export default function ForgotPage() {
  return (
    <AuthShell title="Mot de passe oublié" subtitle="Recevez un code pour définir un nouveau mot de passe." footer={<Link href="/connexion" className="font-semibold text-cyan-700 hover:underline">Retour à la connexion</Link>}>
      <ForgotPassword request={forgotPasswordAction} reset={resetPasswordAction} />
    </AuthShell>
  );
}
