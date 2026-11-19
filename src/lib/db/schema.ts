/**
 * Modèle de données Flamob (prototype).
 *
 * Conventions :
 * - Identifiants : UUID v4 (crypto.randomUUID) — références lisibles séparées (ex. FLM-DEP-…).
 * - Montants : entiers en unités mineures (×100) pour USD et CDF, jamais de flottants.
 * - Dates : chaînes ISO 8601 (UTC).
 * - Toute donnée financière est SIMULÉE. Aucun champ ne représente un solde bancaire réel.
 *
 * Correspondance avec les entités du cahier des charges (voir docs/ARCHITECTURE.md) :
 * Users + UserProfiles → User ; Roles/Permissions → src/lib/auth/permissions.ts ;
 * AgentLocations → ServicePoint ; AgentServices → Agent.authorizedServices ;
 * SimulatedCashBalances → CashBalance (+ CashMovement pour la traçabilité).
 */

export type ISODate = string;
export type Currency = "USD" | "CDF";
export const CURRENCIES: Currency[] = ["USD", "CDF"];

export type UserRole = "client" | "agent" | "admin";
export type AdminLevel = "superadmin" | "supervisor" | "operator";
export type UserStatus = "active" | "suspended";

export interface User {
  id: string;
  role: UserRole;
  adminLevel?: AdminLevel;
  firstName: string;
  lastName: string;
  /** Format E.164, ex. +243800000001 */
  phone: string;
  email?: string;
  /** scrypt$N$r$p$salt$hash — jamais de mot de passe en clair. */
  passwordHash: string;
  status: UserStatus;
  /** Vérification OTP SIMULÉE : ne vaut pas authentification réelle du numéro. */
  phoneVerifiedSimulated: boolean;
  city?: string;
  commune?: string;
  preferredCurrency: Currency;
  language: "fr";
  notifyBySms: boolean;
  isDemo: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
  lastLoginAt?: ISODate;
}

export interface Session {
  id: string;
  userId: string;
  /** SHA-256 du jeton : le jeton brut n'existe que dans le cookie du navigateur. */
  tokenHash: string;
  createdAt: ISODate;
  expiresAt: ISODate;
  userAgent?: string;
}

export interface LoginThrottle {
  key: string;
  failures: number;
  firstFailureAt: ISODate;
  lockedUntil?: ISODate;
}

export type OtpPurpose = "phone_verification" | "password_reset";
export interface OtpChallenge {
  id: string;
  userId: string;
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  expiresAt: ISODate;
  consumedAt?: ISODate;
  createdAt: ISODate;
}

export type BankStatus = "demo_available" | "coming_soon" | "inactive";
export interface Bank {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  /** Couleur de l'identité visuelle (logo généré, pas de logo réel). */
  color: string;
  tagline: string;
  description: string;
  services: string[];
  generalConditions: string;
  procedures: string[];
  eligibility: string[];
  contact: { phone?: string; email?: string; website?: string; address?: string };
  status: BankStatus;
  /** Toujours vrai dans le prototype : aucune banque réelle n'est présentée comme partenaire. */
  isFictional: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type AccountType = "courant" | "epargne" | "jeune" | "pro" | "diaspora";
export interface Money {
  amount: number;
  currency: Currency;
}
export interface BankOffer {
  id: string;
  bankId: string;
  name: string;
  accountType: AccountType;
  currencies: Currency[];
  openingFee: Money | null;
  monthlyFee: Money | null;
  minDeposit: Money | null;
  withdrawalConditions: string;
  conditions: string[];
  services: string[];
  requiredDocuments: string[];
  accessibility: string;
  /** Faux dans le prototype : informations indicatives non vérifiées. */
  infoVerified: boolean;
  active: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "info_required"
  | "approved_sim"
  | "rejected_sim"
  | "completed";

export interface ApplicationEvent {
  at: ISODate;
  status: ApplicationStatus;
  byUserId?: string;
  comment?: string;
}

export interface ApplicationDocument {
  /** Seules les métadonnées sont conservées : le contenu du fichier n'est jamais stocké. */
  name: string;
  kind: string;
  sizeBytes: number;
}

export interface AccountApplication {
  id: string;
  reference: string;
  userId: string;
  bankId: string;
  offerId: string;
  status: ApplicationStatus;
  currency: Currency;
  applicant: {
    firstName: string;
    lastName: string;
    birthDate: string;
    idType: string;
    idNumber: string;
    address: string;
    commune: string;
    occupation: string;
    phone: string;
    email?: string;
  };
  documents: ApplicationDocument[];
  history: ApplicationEvent[];
  submittedAt?: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** Compte de DÉMONSTRATION : n'existe dans aucune banque. */
export interface DemoAccount {
  id: string;
  userId: string;
  bankId: string;
  label: string;
  maskedNumber: string;
  currency: Currency;
  applicationId?: string;
  createdAt: ISODate;
}

export type ServiceType = "deposit" | "withdrawal" | "assistance" | "account_support";
export const SERVICE_TYPES: ServiceType[] = ["deposit", "withdrawal", "assistance", "account_support"];

export type ServicePointStatus = "open" | "closed" | "suspended";
export interface ServicePoint {
  id: string;
  code: string;
  name: string;
  kind: "cabine" | "boutique" | "kiosque";
  address: string;
  quarter: string;
  commune: string;
  city: string;
  lat: number;
  lng: number;
  hours: string;
  services: ServiceType[];
  status: ServicePointStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type AgentStatus = "active" | "inactive" | "suspended";
export interface Agent {
  id: string;
  userId: string;
  code: string;
  servicePointId?: string;
  status: AgentStatus;
  authorizedServices: ServiceType[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** Trésorerie SIMULÉE d'un point de service (pas un portefeuille électronique). */
export interface CashBalance {
  agentId: string;
  currency: Currency;
  /** Espèces physiques simulées en caisse. */
  cash: number;
  /** Liquidité de compensation simulée (côté banque partenaire). */
  float: number;
  updatedAt: ISODate;
}

export type CashMovementKind = "deposit" | "withdrawal" | "adjustment";
export interface CashMovement {
  id: string;
  agentId: string;
  currency: Currency;
  kind: CashMovementKind;
  cashDelta: number;
  floatDelta: number;
  cashAfter: number;
  floatAfter: number;
  transactionId?: string;
  note?: string;
  byUserId?: string;
  createdAt: ISODate;
}

export type OperationType = "deposit" | "withdrawal";
export type TransactionStatus = "completed" | "cancelled";
export interface SimulatedTransaction {
  id: string;
  reference: string;
  type: OperationType;
  status: TransactionStatus;
  amount: number;
  fee: number;
  currency: Currency;
  bankId: string;
  accountLabel: string;
  accountMasked: string;
  clientUserId?: string;
  clientName: string;
  clientPhone?: string;
  agentId: string;
  servicePointId?: string;
  initiatedBy: "client" | "agent";
  initiatedByUserId: string;
  commission: number;
  createdAt: ISODate;
}

export interface CommissionRule {
  id: string;
  operationType: OperationType;
  currency: Currency;
  /** Montant fixe en unités mineures. */
  fixed: number;
  /** Part variable en points de base (100 bp = 1 %). */
  percentBp: number;
  min: number;
  max: number | null;
  /** Règle spécifique à un agent (prioritaire sur la règle générale). */
  agentId?: string;
  active: boolean;
  updatedAt: ISODate;
  updatedByUserId?: string;
}

export interface SimulatedCommission {
  id: string;
  agentId: string;
  transactionId: string;
  ruleId: string;
  amount: number;
  currency: Currency;
  operationType: OperationType;
  createdAt: ISODate;
}

export type NotificationType = "application" | "status" | "operation" | "info" | "security" | "support" | "liquidity";
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  announcementId?: string;
  readAt?: ISODate;
  createdAt: ISODate;
}

export type Audience = "all" | "clients" | "agents" | "admins";
export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  status: "draft" | "published";
  createdByUserId: string;
  createdAt: ISODate;
  updatedAt: ISODate;
  publishedAt?: ISODate;
  recipients?: number;
}

export type IncidentType = "operational" | "error" | "complaint" | "liquidity" | "technical" | "security" | "other";
export type IncidentStatus = "open" | "in_progress" | "resolved" | "closed";
export type IncidentPriority = "low" | "medium" | "high";
export interface Incident {
  id: string;
  reference: string;
  type: IncidentType;
  priority: IncidentPriority;
  title: string;
  description: string;
  status: IncidentStatus;
  reporterUserId: string;
  assigneeUserId?: string;
  transactionReference?: string;
  comments: { at: ISODate; byUserId: string; text: string }[];
  history: { at: ISODate; byUserId: string; change: string }[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface AuditLog {
  id: string;
  at: ISODate;
  actorUserId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
}

export interface FeeRule {
  percentBp: number;
  min: Record<Currency, number>;
}
export interface Limits {
  min: number;
  maxPerOperation: number;
  maxPerDayPerClient: number;
}
export interface Settings {
  platformName: string;
  supportPhone: string;
  supportEmail: string;
  fees: Record<OperationType, FeeRule>;
  limits: Record<Currency, Limits>;
  liquidityAlert: Record<Currency, number>;
  enabledServices: ServiceType[];
  enabledCurrencies: Currency[];
  /** Ouverture des inscriptions publiques dans la démo. */
  registrationOpen: boolean;
  updatedAt: ISODate;
  updatedByUserId?: string;
}

export interface Database {
  version: number;
  users: User[];
  sessions: Session[];
  loginThrottles: LoginThrottle[];
  otpChallenges: OtpChallenge[];
  banks: Bank[];
  offers: BankOffer[];
  applications: AccountApplication[];
  demoAccounts: DemoAccount[];
  servicePoints: ServicePoint[];
  agents: Agent[];
  cashBalances: CashBalance[];
  cashMovements: CashMovement[];
  transactions: SimulatedTransaction[];
  commissionRules: CommissionRule[];
  commissions: SimulatedCommission[];
  notifications: AppNotification[];
  announcements: Announcement[];
  incidents: Incident[];
  auditLogs: AuditLog[];
  settings: Settings;
  counters: Record<string, number>;
}

export const DB_VERSION = 1;
