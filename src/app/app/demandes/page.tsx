import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { PageHeader, Tabs } from "@/components/ui/data";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { ApplicationProgress, ApplicationStatusBadge } from "@/components/domain/Status";
import { BankLogo } from "@/components/domain/BankLogo";
import { formatDate, sp } from "@/lib/format";

export const metadata = { title: "Mes demandes" };

const groups = {
  encours: ["submitted", "under_review", "info_required", "approved_sim"],
  brouillons: ["draft"],
  terminees: ["completed", "rejected_sim"],
} as const;

export default async function Applications({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const user = await requireClient();
  const db = readDb();
  const tab = (sp(q.onglet) || "encours") as keyof typeof groups;
  const mine = db.applications.filter((a) => a.userId === user.id);
  const list = mine.filter((a) => (groups[tab] as readonly string[]).includes(a.status)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <>
      <PageHeader title="Mes demandes" subtitle="Demandes d'ouverture de compte simulées." action={<ButtonLink href="/app/demandes/nouvelle" icon="plus" size="sm">Nouvelle demande</ButtonLink>} />
      {q.supprime && <div className="mb-4"><Alert tone="success">Brouillon supprimé.</Alert></div>}
      <Tabs active={tab} tabs={[
        { key: "encours", href: "/app/demandes?onglet=encours", label: "En cours", count: mine.filter((a) => (groups.encours as readonly string[]).includes(a.status)).length },
        { key: "brouillons", href: "/app/demandes?onglet=brouillons", label: "Brouillons", count: mine.filter((a) => a.status === "draft").length },
        { key: "terminees", href: "/app/demandes?onglet=terminees", label: "Terminées", count: mine.filter((a) => (groups.terminees as readonly string[]).includes(a.status)).length },
      ]} />
      <Card>
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((a) => {
              const bank = db.banks.find((b) => b.id === a.bankId)!;
              const offer = db.offers.find((o) => o.id === a.offerId);
              return (
                <li key={a.id}>
                  <Link href={a.status === "draft" ? `/app/demandes/nouvelle?brouillon=${a.id}` : `/app/demandes/${a.id}`} className="flex gap-3 px-4 py-4 hover:bg-canvas sm:px-5">
                    <BankLogo name={bank.name} shortName={bank.shortName} color={bank.color} size={40} />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold">{offer?.name} · {bank.name}</p>
                          <p className="font-mono text-xs text-muted">{a.reference} · {formatDate(a.createdAt)}</p>
                        </div>
                        <ApplicationStatusBadge status={a.status} />
                      </div>
                      {a.status !== "draft" && <ApplicationProgress status={a.status} />}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState icon="file" title="Aucune demande dans cette catégorie" action={<ButtonLink href="/app/demandes/nouvelle" size="sm" icon="plus">Nouvelle demande</ButtonLink>} />}
      </Card>
    </>
  );
}
