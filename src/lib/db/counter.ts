import type { Database } from "./schema";

export function nextCounter(db: Database, key: string): number {
  db.counters[key] = (db.counters[key] ?? 0) + 1;
  return db.counters[key];
}
