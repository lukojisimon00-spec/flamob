import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { PageHeader, Mono } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Receipt } from "@/components/domain/Transaction";
import { txView } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { formatMoney } from "@/lib/money";

export default async function OpAdminDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("operations.read");
  const db = readDb();
  const tx = db.transactions.find((t) => t.id === id);
  if (!tx) notFound();
  const moves = db.cashMovements.filter((m) => m.transactionId === tx.id);
  const logs = db.auditLogs.filter((l) => l.entityId === tx.id);
  return (
    <>
      <PageHeader back={{ href: "/admin/operations", label: "Opérations" }} title="Détail de l'opération" subtitle={<Mono>{tx.reference}</Mono>} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <Receipt tx={txView(db, tx)} showCommission />
        <div className="space-y-5">
          <Card>
            <CardHeader title="Impact sur la trésorerie simulée" />
            <CardBody className="space-y-2 text-sm">
              {moves.map((m) => (
                <div key={m.id} className="rounded-lg bg-canvas p-3">
                  <p>Espèces : <Mono>{m.cashDelta >= 0 ? "+" : "−"}{formatMoney(Math.abs(m.cashDelta), m.currency)}</Mono> → <Mono>{formatMoney(m.cashAfter, m.currency)}</Mono></p>
                  <p>Compensation : <Mono>{m.floatDelta >= 0 ? "+" : "−"}{formatMoney(Math.abs(m.floatDelta), m.currency)}</Mono> → <Mono>{formatMoney(m.floatAfter, m.currency)}</Mono></p>
                </div>
              ))}
              <Link href={`/admin/agents/${tx.agentId}`} className="font-semibold text-cyan-700 hover:underline">Voir l&apos;agent</Link>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Traçabilité" />
            <CardBody className="space-y-1 text-sm">
              <p>Initiée par : {tx.initiatedBy === "client" ? "le client (application)" : "l'agent"}</p>
              {logs.map((l) => <p key={l.id} className="text-muted"><Mono className="text-cyan-700">{l.action}</Mono> · {formatDateTime(l.at)}</p>)}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
