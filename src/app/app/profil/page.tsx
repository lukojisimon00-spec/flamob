import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { PageHeader, DescriptionList } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icons";
import { ProfileForm, PasswordForm } from "@/components/domain/ProfileForms";
import { changePasswordAction, updateProfileAction } from "@/app/actions/client";
import { logoutAction } from "@/app/actions/auth";
import { formatPhone } from "@/lib/domain/users";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata = { title: "Profil" };

export default async function Profile() {
  const user = await requireClient();
  return (
    <>
      <PageHeader title="Profil" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card><CardHeader title="Informations personnelles" /><CardBody><ProfileForm action={updateProfileAction} user={user} /></CardBody></Card>
          <Card><CardHeader title="Sécurité" subtitle="Changer le mot de passe ferme vos autres sessions." /><CardBody><PasswordForm action={changePasswordAction} /></CardBody></Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Compte" />
            <CardBody>
              <DescriptionList items={[
                { label: "Téléphone", value: <span className="font-mono">{formatPhone(user.phone)}</span> },
                { label: "Vérification", value: <Badge tone="info">Simulée</Badge> },
                { label: "Membre depuis", value: formatDate(user.createdAt) },
                { label: "Dernière connexion", value: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—" },
                { label: "Langue", value: "Français" },
              ]} />
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-1">
              {[["/app/demandes", "file", "Mes demandes"], ["/app/notifications", "bell", "Notifications"], ["/app/assistance", "help", "Assistance"], ["/mentions-legales#securite", "shield", "Conseils de sécurité"]].map(([href, icon, label]) => (
                <Link key={href} href={href} className="flex h-11 items-center gap-3 rounded-lg px-2 text-sm font-medium hover:bg-canvas">
                  <Icon name={icon as "file"} size={18} className="text-muted" />{label}<Icon name="chevronRight" size={16} className="ml-auto text-muted" />
                </Link>
              ))}
              <form action={logoutAction}><button className="flex h-11 w-full items-center gap-3 rounded-lg px-2 text-sm font-semibold text-danger hover:bg-danger-bg"><Icon name="logout" size={18} />Se déconnecter</button></form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
