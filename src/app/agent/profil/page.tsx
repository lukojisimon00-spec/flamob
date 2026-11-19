import Link from "next/link";
import { requireAgent } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { DescriptionList, PageHeader } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/ui/icons";
import { PasswordForm } from "@/components/domain/ProfileForms";
import { changePasswordAction } from "@/app/actions/client";
import { logoutAction } from "@/app/actions/auth";
import { formatPhone } from "@/lib/domain/users";
import { formatDate } from "@/lib/format";
import { agentStatusLabel, agentStatusTone, serviceLabel } from "@/lib/labels";

export const metadata = { title: "Profil agent" };

export default async function AgentProfile() {
  const { user, agent } = await requireAgent();
  const db = readDb();
  const point = db.servicePoints.find((p) => p.id === agent.servicePointId);
  const links: [string, IconName, string][] = [["/agent/point", "store", "Mon point de service"], ["/agent/securite", "shield", "Consignes de sécurité"], ["/agent/incidents", "alert", "Signaler un problème"], ["/agent/notifications", "bell", "Notifications"]];
  return (
    <>
      <PageHeader title="Profil agent" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader title={`${user.firstName} ${user.lastName}`} subtitle="Les informations agent sont gérées par l'administration Flamob." action={<Badge tone={agentStatusTone[agent.status]}>{agentStatusLabel[agent.status]}</Badge>} />
            <CardBody>
              <DescriptionList items={[
                { label: "Identifiant", value: <span className="font-mono">{agent.code}</span> },
                { label: "Téléphone", value: <span className="font-mono">{formatPhone(user.phone)}</span> },
                { label: "E-mail", value: user.email ?? "—" },
                { label: "Point de service", value: point?.name ?? "—" },
                { label: "Adresse", value: point ? `${point.address}, ${point.commune}` : "—" },
                { label: "Services autorisés (démo)", value: agent.authorizedServices.map((s) => serviceLabel[s]).join(", ") },
                { label: "Agent depuis", value: formatDate(agent.createdAt) },
                { label: "Contact superviseur", value: db.settings.supportPhone },
              ]} />
            </CardBody>
          </Card>
          <Card><CardHeader title="Mot de passe" /><CardBody><PasswordForm action={changePasswordAction} /></CardBody></Card>
        </div>
        <Card>
          <CardBody className="space-y-1">
            {links.map(([href, icon, label]) => (
              <Link key={href} href={href} className="flex h-11 items-center gap-3 rounded-lg px-2 text-sm font-medium hover:bg-canvas"><Icon name={icon} size={18} className="text-muted" />{label}<Icon name="chevronRight" size={16} className="ml-auto text-muted" /></Link>
            ))}
            <form action={logoutAction}><button className="flex h-11 w-full items-center gap-3 rounded-lg px-2 text-sm font-semibold text-danger hover:bg-danger-bg"><Icon name="logout" size={18} />Se déconnecter</button></form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
