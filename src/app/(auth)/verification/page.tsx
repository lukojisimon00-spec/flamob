import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyPhone } from "@/components/auth/forms";
import { sendPhoneOtpAction, verifyPhoneAction, logoutAction } from "@/app/actions/auth";
import { getCurrentUser, homeFor } from "@/lib/auth/session";
import { formatPhone } from "@/lib/domain/users";

export const metadata = { title: "Vérification du numéro" };

export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (user.phoneVerifiedSimulated) redirect(homeFor(user.role));
  return (
    <AuthShell title="Vérifiez votre numéro" subtitle="Étape de sécurité avant d'accéder à votre espace."
      footer={<form action={logoutAction}><button className="font-semibold text-cyan-700 hover:underline">Se déconnecter</button></form>}>
      <VerifyPhone send={sendPhoneOtpAction} verify={verifyPhoneAction} phone={formatPhone(user.phone)} />
      <p className="mt-5 text-xs text-muted">Dans ce prototype, l&apos;envoi de SMS est simulé : cette étape ne constitue pas une vérification réelle de votre numéro.</p>
    </AuthShell>
  );
}
