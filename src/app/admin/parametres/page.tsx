import { requireRole } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { SettingsForm } from "@/components/domain/ConfigForms";
import { ResetDemoForm } from "@/components/domain/AdminForms";
import { resetDemoAction, saveSettingsAction } from "@/app/actions/admin";
import { formatDateTime } from "@/lib/format";
import { isDemoMode } from "@/lib/config";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const user = await requireRole("admin");
  const db = readDb();
  const editable = can(user, "settings.manage");
  return (
    <>
      <PageHeader title="Paramètres de la plateforme" subtitle={`Dernière modification : ${formatDateTime(db.settings.updatedAt)}`} />
      <div className="space-y-5">
        {!editable && <Alert tone="info">Consultation seule : la modification des paramètres est réservée aux administrateurs.</Alert>}
        <Card><CardBody><SettingsForm action={saveSettingsAction} s={db.settings} readOnly={!editable} /></CardBody></Card>
        <Card>
          <CardHeader title="Démonstration" />
          <CardBody className="space-y-3 text-sm">
            <p>Mode démonstration : <strong>{isDemoMode() ? "activé" : "désactivé"}</strong> (variable <span className="font-mono">FLAMOB_DEMO_MODE</span>). Toutes les données financières sont simulées quel que soit ce mode.</p>
            {can(user, "demo.reset") && (
              <>
                <Alert tone="warning" title="Réinitialisation">Recrée toutes les données fictives et ferme toutes les sessions. Les comptes créés pendant la démo seront supprimés.</Alert>
                <ResetDemoForm action={resetDemoAction} />
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
