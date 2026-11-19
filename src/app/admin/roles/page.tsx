import { requireRole } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { ADMIN_PERMISSIONS, PERMISSIONS, PERMISSION_LABELS } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { adminLevelLabel } from "@/lib/labels";
import { fullName } from "@/lib/domain/users";
import type { AdminLevel } from "@/lib/db/schema";

export const metadata = { title: "Rôles et permissions" };

const levels: AdminLevel[] = ["superadmin", "supervisor", "operator"];

export default async function Roles() {
  await requireRole("admin");
  const db = readDb();
  return (
    <>
      <PageHeader title="Rôles et permissions" subtitle="Contrôle d'accès basé sur les rôles, appliqué côté serveur sur chaque page et chaque action." />
      <div className="space-y-5">
        <Card>
          <CardHeader title="Espaces" />
          <CardBody className="grid gap-3 text-sm sm:grid-cols-3">
            <p><strong>Client</strong> — accès uniquement à ses propres demandes, opérations et notifications.</p>
            <p><strong>Agent</strong> — accès à son point, sa trésorerie simulée, ses opérations et commissions. Jamais aux identifiants bancaires des clients.</p>
            <p><strong>Administration</strong> — trois niveaux ci-dessous.</p>
          </CardBody>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="Matrice des permissions d'administration" />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase text-muted"><th className="px-4 py-3">Permission</th>{levels.map((l) => <th key={l} className="px-4 py-3 text-center">{adminLevelLabel[l]}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {PERMISSIONS.map((p) => (
                  <tr key={p}>
                    <td className="px-4 py-2.5">{PERMISSION_LABELS[p]}<span className="block font-mono text-[0.7rem] text-muted">{p}</span></td>
                    {levels.map((l) => (
                      <td key={l} className="px-4 py-2.5 text-center">
                        {ADMIN_PERMISSIONS[l].includes(p) ? <Icon name="check" size={18} className="inline text-success" aria-label="Autorisé" /> : <span className="text-line-strong" aria-label="Non autorisé">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="Membres de l'administration" />
          <ul className="mt-2 divide-y divide-line">
            {db.users.filter((u) => u.role === "admin").map((u) => (
              <li key={u.id} className="flex justify-between px-4 py-3 text-sm sm:px-5"><span className="font-medium">{fullName(u)}</span><span className="text-muted">{u.adminLevel ? adminLevelLabel[u.adminLevel] : ""}</span></li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
