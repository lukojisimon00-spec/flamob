/**
 * Données de démonstration — TOUTES FICTIVES.
 * - Banques fictives (aucun partenariat réel n'est revendiqué).
 * - Agents, points de service et adresses fictifs (coordonnées approximatives de communes de Kinshasa).
 * - L'historique d'opérations est généré en appelant les vraies règles métier, ce qui garantit la
 *   cohérence trésorerie / commissions / historique.
 */
import { CURRENCIES, DB_VERSION, type Bank, type BankOffer, type Currency, type Database, type Settings, type User } from "./schema";
import { hashPassword, unusablePasswordHash } from "../auth/password";
import { newId } from "../ids";
import { toMinor } from "../money";
import { saveApplication, transitionApplication } from "../domain/applications";
import { applyMovement, simulateOperation } from "../domain/operations";
import { createAgent, reportIncident, saveServicePoint, updateIncident } from "../domain/network";
import { publishAnnouncement, saveAnnouncement } from "../domain/notifications";
import { addDays } from "../domain/time";

export const DEMO_PHONES = {
  client: "+243800000001",
  agent: "+243800000101",
  admin: "+243800000901",
} as const;

function emptyDb(now: Date): Database {
  return {
    version: DB_VERSION,
    users: [], sessions: [], loginThrottles: [], otpChallenges: [], banks: [], offers: [], applications: [],
    demoAccounts: [], servicePoints: [], agents: [], cashBalances: [], cashMovements: [], transactions: [],
    commissionRules: [], commissions: [], notifications: [], announcements: [], incidents: [], auditLogs: [],
    settings: defaultSettings(now), counters: {},
  };
}

export function defaultSettings(now: Date): Settings {
  return {
    platformName: "Flamob",
    supportPhone: "+243 800 000 000 (démo)",
    supportEmail: "assistance@flamob.example",
    fees: {
      deposit: { percentBp: 50, min: { USD: toMinor(0.5), CDF: toMinor(1000) } },
      withdrawal: { percentBp: 150, min: { USD: toMinor(1), CDF: toMinor(2500) } },
    },
    limits: {
      USD: { min: toMinor(5), maxPerOperation: toMinor(2000), maxPerDayPerClient: toMinor(5000) },
      CDF: { min: toMinor(10000), maxPerOperation: toMinor(5_000_000), maxPerDayPerClient: toMinor(12_000_000) },
    },
    liquidityAlert: { USD: toMinor(300), CDF: toMinor(750_000) },
    enabledServices: ["deposit", "withdrawal", "assistance", "account_support"],
    enabledCurrencies: ["USD", "CDF"],
    registrationOpen: true,
    updatedAt: now.toISOString(),
  };
}

/** PRNG déterministe pour des données de démo stables. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function demoPasswordHash(): string {
  const pwd = process.env.FLAMOB_DEMO_PASSWORD;
  return pwd && pwd.length >= 8 ? hashPassword(pwd) : unusablePasswordHash();
}

function addUser(db: Database, now: Date, u: Partial<User> & Pick<User, "role" | "firstName" | "lastName" | "phone">, passwordHash: string): User {
  const iso = addDays(now, -60).toISOString();
  const user: User = {
    id: newId(), status: "active", phoneVerifiedSimulated: true, preferredCurrency: "USD", language: "fr",
    notifyBySms: false, isDemo: true, createdAt: iso, updatedAt: iso, passwordHash, ...u,
  };
  db.users.push(user);
  return user;
}

const m = (amount: number, currency: Currency = "USD") => ({ amount: toMinor(amount), currency });

export function buildSeed(now = new Date()): Database {
  const db = emptyDb(now);
  const rand = mulberry32(243);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const pwd = demoPasswordHash();
  const filler = unusablePasswordHash();
  const past = (days: number, hour = 10) => {
    const d = addDays(now, -days);
    d.setUTCHours(hour - 1, Math.floor(rand() * 59), 0, 0);
    return d;
  };

  // ——— Utilisateurs ———
  const admin = addUser(db, now, { role: "admin", adminLevel: "superadmin", firstName: "Admin", lastName: "Démo", phone: DEMO_PHONES.admin, email: "admin.demo@flamob.example" }, pwd);
  const supervisor = addUser(db, now, { role: "admin", adminLevel: "supervisor", firstName: "Nadine", lastName: "Kapinga", phone: "+243800000902" }, filler);
  addUser(db, now, { role: "admin", adminLevel: "operator", firstName: "Olivier", lastName: "Mputu", phone: "+243800000903" }, filler);

  const client = addUser(db, now, { role: "client", firstName: "Christelle", lastName: "Kabeya", phone: DEMO_PHONES.client, email: "client.demo@flamob.example", commune: "Kalamu", city: "Kinshasa" }, pwd);
  const otherClients = [
    ["Patrick", "Ilunga", "Lemba"], ["Ruth", "Mukendi", "Limete"], ["Joël", "Tshibangu", "Masina"],
    ["Sarah", "Lukusa", "Ngaliema"], ["Benjamin", "Kasongo", "Bandalungwa"], ["Merveille", "Ndaya", "Gombe"],
  ].map(([firstName, lastName, commune], i) =>
    addUser(db, now, { role: "client", firstName, lastName, commune, city: "Kinshasa", phone: `+2438000000${String(i + 2).padStart(2, "0")}` }, filler));
  otherClients[3].status = "suspended";

  // ——— Paramètres de commission ———
  const iso = now.toISOString();
  const rule = (operationType: "deposit" | "withdrawal", currency: Currency, fixed: number, percentBp: number, min: number, max: number) =>
    db.commissionRules.push({ id: newId(), operationType, currency, fixed: toMinor(fixed), percentBp, min: toMinor(min), max: toMinor(max), active: true, updatedAt: iso });
  rule("deposit", "USD", 0.25, 30, 0.25, 10);
  rule("withdrawal", "USD", 0.5, 50, 0.5, 15);
  rule("deposit", "CDF", 500, 30, 500, 25000);
  rule("withdrawal", "CDF", 1000, 50, 1000, 40000);

  // ——— Banques fictives ———
  const bank = (b: Omit<Bank, "id" | "createdAt" | "updatedAt" | "isFictional">): Bank => {
    const full: Bank = { ...b, id: newId(), isFictional: true, createdAt: iso, updatedAt: iso };
    db.banks.push(full);
    return full;
  };
  const offer = (o: Omit<BankOffer, "id" | "createdAt" | "updatedAt" | "infoVerified" | "active">) =>
    db.offers.push({ ...o, id: newId(), infoVerified: false, active: true, createdAt: iso, updatedAt: iso });

  const commonDocs = ["Pièce d'identité valide (carte d'électeur, passeport ou permis)", "Photo d'identité récente", "Justificatif de domicile"];

  const horizon = bank({
    slug: "banque-horizon-congo", name: "Banque Horizon Congo", shortName: "BHC", color: "#174B73",
    tagline: "Banque universelle (fictive) orientée particuliers et PME",
    description: "Banque fictive créée pour la démonstration Flamob. Elle illustre une banque universelle disposant d'offres pour les particuliers, les jeunes et les petites entreprises.",
    services: ["Comptes courants USD/CDF", "Épargne", "Carte de débit", "Banque en ligne", "Virements"],
    generalConditions: "Conditions indicatives à titre d'illustration. Les conditions réelles d'une banque doivent être consultées auprès de celle-ci.",
    procedures: ["Choisir une offre", "Remplir la demande dans Flamob", "Joindre les pièces (démo)", "Examen de la demande", "Finalisation en agence ou via un agent (à terme)"],
    eligibility: ["Être âgé d'au moins 18 ans", "Disposer d'une pièce d'identité valide", "Résider en RDC"],
    contact: { phone: "+243 800 100 000 (fictif)", email: "contact@horizon.example", website: "https://horizon.example", address: "Gombe, Kinshasa (adresse fictive)" },
    status: "demo_available",
  });
  offer({ bankId: horizon.id, name: "Horizon Essentiel", accountType: "courant", currencies: ["USD", "CDF"], openingFee: m(10), monthlyFee: m(3), minDeposit: m(50), withdrawalConditions: "Retraits illimités en agence ; via agent Flamob (à terme) selon plafonds.", conditions: ["Dépôt initial requis", "Pièce d'identité valide"], services: ["Carte de débit", "Relevé mensuel", "Banque mobile"], requiredDocuments: commonDocs, accessibility: "Ouverture accompagnée possible auprès d'un agent Flamob." });
  offer({ bankId: horizon.id, name: "Horizon Épargne Plus", accountType: "epargne", currencies: ["USD"], openingFee: m(0), monthlyFee: m(0), minDeposit: m(25), withdrawalConditions: "2 retraits gratuits par mois, puis frais indicatifs.", conditions: ["Solde minimum indicatif de 25 $"], services: ["Rémunération indicative", "Épargne programmée"], requiredDocuments: commonDocs, accessibility: "Sans frais de tenue de compte (indicatif)." });
  offer({ bankId: horizon.id, name: "Horizon Pro", accountType: "pro", currencies: ["USD", "CDF"], openingFee: m(25), monthlyFee: m(8), minDeposit: m(200), withdrawalConditions: "Retraits en agence et via réseau partenaire.", conditions: ["Registre de commerce (RCCM)", "Identification nationale"], services: ["Encaissements", "Terminal de paiement (à terme)", "Crédit (sous conditions)"], requiredDocuments: [...commonDocs, "RCCM", "Numéro d'identification nationale"], accessibility: "Destiné aux commerçants et PME." });

  const mwinda = bank({
    slug: "mwinda-bank", name: "Mwinda Bank", shortName: "MWB", color: "#0E7C86",
    tagline: "Banque digitale fictive, comptes simples à petits frais",
    description: "Banque fictive de démonstration. Elle illustre une banque à dominante numérique, avec des comptes à frais réduits et une ouverture simplifiée.",
    services: ["Compte mobile", "Épargne", "Carte virtuelle", "Mobile Money (interconnexion envisagée)"],
    generalConditions: "Informations indicatives non vérifiées, à des fins de démonstration uniquement.",
    procedures: ["Demande en ligne via Flamob", "Vérification d'identité (démo)", "Activation du compte (simulation)"],
    eligibility: ["18 ans minimum", "Numéro de téléphone actif", "Pièce d'identité"],
    contact: { phone: "+243 800 200 000 (fictif)", email: "hello@mwinda.example", website: "https://mwinda.example" },
    status: "demo_available",
  });
  offer({ bankId: mwinda.id, name: "Mwinda Mobile", accountType: "courant", currencies: ["USD", "CDF"], openingFee: m(0), monthlyFee: m(1), minDeposit: m(5), withdrawalConditions: "Retraits via agents (à terme) selon plafonds réglementaires.", conditions: ["Téléphone actif", "Pièce d'identité"], services: ["Application mobile", "Carte virtuelle", "Alertes SMS"], requiredDocuments: ["Pièce d'identité valide", "Selfie de vérification (démo)"], accessibility: "Pensé pour une première bancarisation." });
  offer({ bankId: mwinda.id, name: "Mwinda Jeunes", accountType: "jeune", currencies: ["CDF", "USD"], openingFee: m(0), monthlyFee: m(0), minDeposit: m(2), withdrawalConditions: "Plafond mensuel indicatif de 500 $.", conditions: ["18 à 25 ans", "Carte d'étudiant ou pièce d'identité"], services: ["Épargne objectif", "Carte virtuelle"], requiredDocuments: ["Pièce d'identité valide", "Carte d'étudiant (facultatif)"], accessibility: "Aucun frais de tenue (indicatif)." });

  const lisanga = bank({
    slug: "lisanga-banque", name: "Lisanga Banque", shortName: "LSB", color: "#7A4CC2",
    tagline: "Banque fictive de proximité et d'épargne",
    description: "Banque fictive de démonstration axée sur l'épargne des ménages et l'accompagnement de proximité.",
    services: ["Épargne", "Comptes courants", "Microcrédit (illustratif)", "Transferts diaspora"],
    generalConditions: "Données illustratives. Aucune relation contractuelle avec Flamob.",
    procedures: ["Choix de l'offre", "Demande via Flamob", "Entretien (simulation)", "Décision (simulation)"],
    eligibility: ["Majorité", "Pièce d'identité", "Adresse en RDC ou à l'étranger (diaspora)"],
    contact: { phone: "+243 800 300 000 (fictif)", email: "info@lisanga.example" },
    status: "demo_available",
  });
  offer({ bankId: lisanga.id, name: "Lisanga Épargne Famille", accountType: "epargne", currencies: ["CDF", "USD"], openingFee: m(5), monthlyFee: m(0), minDeposit: m(10), withdrawalConditions: "1 retrait gratuit par mois (indicatif).", conditions: ["Épargne régulière encouragée"], services: ["Épargne programmée", "Relevé trimestriel"], requiredDocuments: commonDocs, accessibility: "Accompagnement possible auprès d'un agent." });
  offer({ bankId: lisanga.id, name: "Lisanga Diaspora", accountType: "diaspora", currencies: ["USD"], openingFee: m(20), monthlyFee: m(5), minDeposit: m(100), withdrawalConditions: "Retraits par le titulaire ou un mandataire désigné (illustratif).", conditions: ["Résidence à l'étranger", "Passeport"], services: ["Réception de transferts", "Mandataire local"], requiredDocuments: ["Passeport valide", "Justificatif de résidence à l'étranger"], accessibility: "Ouverture à distance envisagée." });

  const kivu = bank({
    slug: "kivu-avenir-bank", name: "Kivu Avenir Bank", shortName: "KAB", color: "#B4532A",
    tagline: "Banque fictive régionale — commerce et agriculture",
    description: "Banque fictive de démonstration représentant une banque régionale tournée vers le commerce et l'agriculture.",
    services: ["Comptes commerçants", "Crédit agricole (illustratif)", "Épargne"],
    generalConditions: "Conditions illustratives non contractuelles.",
    procedures: ["Demande via Flamob", "Examen", "Décision (simulation)"],
    eligibility: ["Activité commerciale ou agricole", "Pièce d'identité"],
    contact: { email: "contact@kivuavenir.example" },
    status: "demo_available",
  });
  offer({ bankId: kivu.id, name: "Kivu Commerçant", accountType: "pro", currencies: ["USD", "CDF"], openingFee: m(15), monthlyFee: m(4), minDeposit: m(100), withdrawalConditions: "Retraits en agence ; dépôts fréquents via agents (à terme).", conditions: ["Preuve d'activité"], services: ["Encaissement", "Relevés"], requiredDocuments: [...commonDocs, "Preuve d'activité commerciale"], accessibility: "Adapté aux commerçants des marchés." });

  bank({
    slug: "banque-du-fleuve-solidaire", name: "Banque du Fleuve Solidaire", shortName: "BFS", color: "#3B6E3A",
    tagline: "Institution fictive — intégration prévue",
    description: "Institution fictive affichée comme « bientôt disponible » pour illustrer l'arrivée progressive de nouveaux partenaires.",
    services: ["Microfinance (illustratif)"], generalConditions: "Non disponible dans la démonstration.", procedures: [], eligibility: [],
    contact: {}, status: "coming_soon",
  });

  // ——— Points de service et agents ———
  const points = [
    { name: "Cabine Flamob Gombe Centre", kind: "cabine", commune: "Gombe", quarter: "Quartier des Affaires", address: "Avenue des Palmiers n°12", lat: -4.3105, lng: 15.3080, status: "open", hours: "Lun–Sam · 08:00–18:00" },
    { name: "Point Flamob Limete Marché", kind: "boutique", commune: "Limete", quarter: "Quartier Industriel", address: "Avenue de l'Espoir n°45", lat: -4.357, lng: 15.344, status: "open", hours: "Lun–Sam · 07:30–19:00" },
    { name: "Kiosque Flamob Kalamu", kind: "kiosque", commune: "Kalamu", quarter: "Matonge", address: "Rue du Marché n°7", lat: -4.342, lng: 15.317, status: "open", hours: "Lun–Dim · 08:00–20:00" },
    { name: "Cabine Flamob Masina", kind: "cabine", commune: "Masina", quarter: "Petro-Congo", address: "Avenue de la Paix n°101", lat: -4.383, lng: 15.395, status: "open", hours: "Lun–Sam · 08:00–17:30" },
    { name: "Point Flamob Ngaliema", kind: "boutique", commune: "Ngaliema", quarter: "Binza", address: "Avenue des Collines n°3", lat: -4.37, lng: 15.25, status: "open", hours: "Lun–Ven · 08:30–17:00" },
    { name: "Kiosque Flamob Lemba", kind: "kiosque", commune: "Lemba", quarter: "Righini", address: "Avenue de l'Université n°18", lat: -4.4, lng: 15.32, status: "open", hours: "Lun–Sam · 08:00–18:00" },
    { name: "Cabine Flamob Bandalungwa", kind: "cabine", commune: "Bandalungwa", quarter: "Bisengo", address: "Avenue du Progrès n°60", lat: -4.343, lng: 15.288, status: "closed", hours: "Lun–Sam · 09:00–17:00" },
    { name: "Point Flamob Matete", kind: "boutique", commune: "Matete", quarter: "Quartier Tomba", address: "Avenue de la Rivière n°22", lat: -4.388, lng: 15.34, status: "suspended", hours: "Lun–Sam · 08:00–18:00" },
  ] as const;
  const createdPoints = points.map((p) =>
    saveServicePoint(db, { ...p, address: `${p.address} (adresse fictive)`, city: "Kinshasa", services: ["deposit", "withdrawal", "assistance", "account_support"] }, admin.id, addDays(now, -90)));

  const agentDefs = [
    { firstName: "Jean-Marc", lastName: "Kalala", phone: DEMO_PHONES.agent, email: "agent.demo@flamob.example", point: 0 },
    { firstName: "Esther", lastName: "Mwamba", phone: "+243800000102", point: 1 },
    { firstName: "Didier", lastName: "Nsimba", phone: "+243800000103", point: 3 },
    { firstName: "Aline", lastName: "Bokele", phone: "+243800000104", point: 2 },
    { firstName: "Gloire", lastName: "Mabiala", phone: "+243800000105", point: 4 },
    { firstName: "Fiston", lastName: "Mbala", phone: "+243800000106", point: 5 },
    { firstName: "Josué", lastName: "Lumbala", phone: "+243800000107", point: 7 },
  ];
  const agents = agentDefs.map((a, i) => {
    const agent = createAgent(db, { ...a, servicePointId: createdPoints[a.point].id, authorizedServices: i === 4 ? ["deposit", "assistance", "account_support"] : ["deposit", "withdrawal", "assistance", "account_support"] }, admin.id, addDays(now, -80), { isDemo: true });
    const user = db.users.find((u) => u.id === agent.userId)!;
    user.passwordHash = i === 0 ? pwd : filler;
    user.createdAt = addDays(now, -80).toISOString();
    return agent;
  });
  agents[6].status = "suspended";

  // Dotation initiale simulée de trésorerie.
  agents.forEach((agent, i) => {
    const low = i === 3; // Un agent volontairement à faible liquidité pour illustrer les alertes.
    const funding: Record<Currency, [number, number]> = {
      USD: low ? [450, 600] : [2500, 3000],
      CDF: low ? [900_000, 1_000_000] : [4_000_000, 5_000_000],
    };
    for (const c of CURRENCIES)
      applyMovement(db, { agentId: agent.id, currency: c, kind: "adjustment", cashDelta: toMinor(funding[c][0]), floatDelta: toMinor(funding[c][1]), note: "Dotation initiale simulée", byUserId: admin.id }, addDays(now, -45));
  });

  // ——— Comptes de démonstration du client démo ———
  db.demoAccounts.push(
    { id: newId(), userId: client.id, bankId: horizon.id, label: "Horizon Essentiel — compte de démonstration", maskedNumber: "•••• 4821", currency: "USD", createdAt: addDays(now, -40).toISOString() },
    { id: newId(), userId: client.id, bankId: mwinda.id, label: "Mwinda Mobile — compte de démonstration", maskedNumber: "•••• 7310", currency: "CDF", createdAt: addDays(now, -35).toISOString() },
  );

  // ——— Historique d'opérations simulées (30 jours) ———
  const opBanks = [horizon, mwinda, lisanga, kivu];
  const activeAgents = agents.slice(0, 6);
  const walkIns = ["Pascal Nzuzi", "Annie Kabongo", "Éric Mulumba", "Dorcas Ngalula", "Hervé Kanku", "Rachel Mbombo"];
  for (let day = 30; day >= 1; day--) {
    const count = 2 + Math.floor(rand() * 4);
    for (let k = 0; k < count; k++) {
      const agent = pick(activeAgents);
      const isRegistered = rand() < 0.55;
      const c = isRegistered ? pick([client, ...otherClients.filter((x) => x.status === "active")]) : undefined;
      const currency: Currency = rand() < 0.7 ? "USD" : "CDF";
      const type = agent.authorizedServices.includes("withdrawal") && rand() < 0.45 ? "withdrawal" : "deposit";
      const amount = currency === "USD" ? toMinor(Math.round(10 + rand() * 280)) : toMinor(Math.round(20 + rand() * 480) * 1000);
      const agentUser = db.users.find((u) => u.id === agent.userId)!;
      const initiatedByClient = c && rand() < 0.5;
      try {
        simulateOperation(db, {
          type, agentId: agent.id, bankId: pick(opBanks).id, currency, amount,
          accountLabel: "Compte de démonstration", accountNumber: `DEMO${Math.floor(rand() * 1e8)}`,
          clientUserId: c?.id, clientName: c ? `${c.firstName} ${c.lastName}` : pick(walkIns), clientPhone: c?.phone,
          initiatedBy: initiatedByClient ? "client" : "agent", initiatedByUserId: initiatedByClient ? c!.id : agentUser.id,
        }, past(day, 8 + Math.floor(rand() * 9)));
      } catch {
        /* Une opération refusée par les règles (plafond, liquidité) n'est simplement pas générée. */
      }
    }
  }

  // ——— Demandes d'ouverture de compte ———
  const applicant = (u: User, commune: string) => ({
    firstName: u.firstName, lastName: u.lastName, birthDate: "1994-05-12", idType: "Carte d'électeur", idNumber: "DEMO-000000",
    address: "Adresse de démonstration", commune, occupation: "Commerçant(e)", phone: u.phone, email: u.email,
  });
  const docs = [{ name: "piece-identite-demo.jpg", kind: "Pièce d'identité", sizeBytes: 182_000 }];
  const offersOf = (b: Bank) => db.offers.filter((o) => o.bankId === b.id);

  const a1 = saveApplication(db, client.id, { bankId: lisanga.id, offerId: offersOf(lisanga)[0].id, currency: "USD", applicant: applicant(client, "Kalamu"), documents: docs, submit: true }, past(12));
  transitionApplication(db, a1.id, "under_review", supervisor.id, "", past(11));
  transitionApplication(db, a1.id, "approved_sim", supervisor.id, "Dossier complet (simulation).", past(9));
  transitionApplication(db, a1.id, "completed", supervisor.id, "", past(8));

  const a2 = saveApplication(db, client.id, { bankId: kivu.id, offerId: offersOf(kivu)[0].id, currency: "USD", applicant: applicant(client, "Kalamu"), documents: docs, submit: true }, past(4));
  transitionApplication(db, a2.id, "under_review", admin.id, "", past(3));
  transitionApplication(db, a2.id, "info_required", admin.id, "Merci de préciser la nature de votre activité commerciale.", past(2));

  saveApplication(db, client.id, { bankId: mwinda.id, offerId: offersOf(mwinda)[1].id, currency: "CDF", applicant: applicant(client, "Kalamu"), documents: [], submit: false }, past(1));

  otherClients.slice(0, 5).forEach((u, i) => {
    const b = opBanks[i % opBanks.length];
    const app = saveApplication(db, u.id, { bankId: b.id, offerId: offersOf(b)[0].id, currency: "USD", applicant: applicant(u, u.commune ?? "Gombe"), documents: docs, submit: true }, past(6 - i));
    if (i === 0) transitionApplication(db, app.id, "under_review", supervisor.id, "", past(4));
    if (i === 1) transitionApplication(db, app.id, "rejected_sim", supervisor.id, "Pièce d'identité illisible (simulation).", past(3));
  });

  // ——— Incidents ———
  const agentUser = (i: number) => db.users.find((u) => u.id === agents[i].userId)!;
  const inc1 = reportIncident(db, { type: "liquidity", priority: "high", title: "Espèces USD insuffisantes en fin de journée", description: "Plusieurs demandes de retrait n'ont pas pu être servies après 16h faute d'espèces en dollars." }, agentUser(3).id, past(3));
  updateIncident(db, inc1.id, { status: "in_progress", assigneeUserId: supervisor.id, priority: "high", comment: "Rééquilibrage planifié (simulation)." }, supervisor.id, past(2));
  reportIncident(db, { type: "technical", priority: "medium", title: "Lenteur de l'application en heure de pointe", description: "L'écran de confirmation met plus de 10 secondes à s'afficher avec une connexion 3G." }, agentUser(1).id, past(2));
  reportIncident(db, { type: "complaint", priority: "low", title: "Question sur les frais de retrait affichés", description: "Je souhaite comprendre le calcul des frais simulés affichés lors de mon dernier retrait." }, client.id, past(1));

  // ——— Annonce publiée ———
  const ann = saveAnnouncement(db, { title: "Bienvenue dans la démonstration Flamob", body: "Toutes les banques, agents et opérations présentés sont fictifs. Aucun argent réel n'est déplacé.", audience: "all" }, admin.id, past(20));
  publishAnnouncement(db, ann.id, admin.id, past(20));

  // Les notifications de plus de 3 jours sont marquées comme lues pour une démo lisible.
  const cutoff = addDays(now, -3).toISOString();
  for (const n of db.notifications) if (n.createdAt < cutoff) n.readAt = n.createdAt;
  return db;
}
