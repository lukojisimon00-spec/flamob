/** Réinitialise les données de démonstration (fichier .data/flamob.json par défaut). Usage : npm run seed */
import { resetDb } from "../src/lib/db/store";

const db = resetDb();
console.log(`Données de démonstration régénérées : ${db.users.length} utilisateurs, ${db.banks.length} banques fictives, ${db.transactions.length} opérations simulées.`);
