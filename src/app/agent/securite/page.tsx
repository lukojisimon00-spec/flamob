import { PageHeader } from "@/components/ui/data";
import { Card, CardBody } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icons";

export const metadata = { title: "Sécurité" };

const rules: { icon: IconName; title: string; text: string; critical?: boolean }[] = [
  { icon: "lock", title: "Ne jamais demander le mot de passe bancaire d'un client", text: "Ni mot de passe, ni code PIN, ni code reçu par SMS. Aucune procédure Flamob ne l'exige.", critical: true },
  { icon: "key", title: "Ne jamais utiliser les identifiants bancaires d'un client", text: "Le client saisit lui-même ses informations confidentielles, sur son propre appareil.", critical: true },
  { icon: "check", title: "Ne jamais effectuer une opération sans autorisation", text: "Toute opération nécessite l'accord explicite du client et doit relever de vos services autorisés." },
  { icon: "receipt", title: "Ne jamais falsifier un reçu", text: "Seul le reçu généré par la plateforme fait foi. Il porte une référence unique et vérifiable." },
  { icon: "list", title: "Respecter les procédures", text: "Vérifiez l'identité du client, le montant, la devise et la référence avant toute confirmation." },
  { icon: "user", title: "Protéger les données personnelles", text: "Ne photographiez pas, ne copiez pas et ne partagez pas les informations des clients." },
  { icon: "alert", title: "Prévenir la fraude", text: "Billets suspects, client sous pression, demande inhabituelle : suspendez l'opération et signalez-la." },
  { icon: "megaphone", title: "Signaler les incidents", text: "Tout problème (erreur, liquidité, sécurité, comportement suspect) doit être signalé sans délai." },
  { icon: "shield", title: "Sécurité physique", text: "Limitez les espèces visibles, ne comptez pas l'argent devant la file d'attente, respectez les horaires." },
];

export default function Security() {
  return (
    <>
      <PageHeader back={{ href: "/agent/profil", label: "Profil" }} title="Consignes de sécurité" subtitle="À relire régulièrement. Leur non-respect entraîne la suspension de l'agent." />
      <div className="grid gap-3 sm:grid-cols-2">
        {rules.map((r) => (
          <Card key={r.title} className={r.critical ? "border-danger/30" : ""}>
            <CardBody className="flex gap-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${r.critical ? "bg-danger-bg text-danger" : "bg-navy-50 text-navy-700"}`}><Icon name={r.icon} /></span>
              <div><h2 className="font-semibold leading-snug">{r.title}</h2><p className="mt-1 text-sm text-muted">{r.text}</p></div>
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="mt-5"><ButtonLink href="/agent/incidents" icon="megaphone">Signaler un incident</ButtonLink></div>
    </>
  );
}
