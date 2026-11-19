import type { Database } from "../db/schema";
import { newId } from "../ids";

export function audit(
  db: Database,
  entry: { actorUserId?: string; action: string; entity: string; entityId?: string; details?: string },
  now: Date,
) {
  db.auditLogs.push({ id: newId(), at: now.toISOString(), ...entry });
  // Borne la taille du journal dans le prototype (fichier local).
  if (db.auditLogs.length > 5000) db.auditLogs.splice(0, db.auditLogs.length - 5000);
}
