/**
 * Stockage du prototype : un fichier JSON local, chargé en mémoire.
 *
 * - Les lectures passent par `readDb()` (ne jamais muter le résultat).
 * - Les écritures passent par `transact()` : la mutation s'applique sur une copie ;
 *   si elle lève une erreur, rien n'est enregistré (atomicité). L'écriture disque est
 *   atomique (fichier temporaire + rename).
 * - Node exécute le code de façon séquentielle : une transaction synchrone ne peut pas
 *   être entrelacée avec une autre dans le même processus.
 *
 * Cette couche est volontairement isolée : la remplacer par PostgreSQL/Supabase ne touche
 * que ce fichier et les services (voir docs/DECISIONS.md, D-003).
 */
import fs from "node:fs";
import path from "node:path";
import { DB_VERSION, type Database } from "./schema";
import { buildSeed } from "./seed";

const MEMORY = ":memory:";

function dataFile(): string {
  const configured = process.env.FLAMOB_DATA_FILE;
  if (configured === MEMORY) return MEMORY;
  return path.resolve(process.cwd(), configured || ".data/flamob.json");
}

const g = globalThis as unknown as { __flamobDb?: Database };

function persist(db: Database) {
  const file = dataFile();
  if (file === MEMORY) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, file);
}

function load(): Database {
  const file = dataFile();
  if (file !== MEMORY && fs.existsSync(file)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Database;
      if (parsed.version === DB_VERSION) return parsed;
      console.warn(`[flamob] Version de données ${parsed.version} ≠ ${DB_VERSION} : réinitialisation de la démo.`);
    } catch (err) {
      console.error("[flamob] Fichier de données illisible, réinitialisation de la démo.", err);
    }
  }
  const seeded = buildSeed();
  persist(seeded);
  return seeded;
}

export function readDb(): Database {
  if (!g.__flamobDb) g.__flamobDb = load();
  return g.__flamobDb;
}

export function transact<T>(mutator: (db: Database) => T): T {
  const draft = structuredClone(readDb());
  const result = mutator(draft);
  persist(draft);
  g.__flamobDb = draft;
  return result;
}

/** Réinitialise les données de démonstration (admin ou tests). */
export function resetDb(seed: Database = buildSeed()): Database {
  persist(seed);
  g.__flamobDb = seed;
  return seed;
}
