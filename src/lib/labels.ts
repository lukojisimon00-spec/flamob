import type {
  AccountType, AdminLevel, AgentStatus, ApplicationStatus, Audience, BankStatus, IncidentPriority,
  IncidentStatus, IncidentType, NotificationType, OperationType, ServicePointStatus, ServiceType, UserRole, UserStatus,
} from "./db/schema";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "brand";

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
  draft: "Brouillon",
  submitted: "Soumise",
  under_review: "En cours d'examen",
  info_required: "Informations complémentaires requises",
  approved_sim: "Approuvée (simulation)",
  rejected_sim: "Refusée (simulation)",
  completed: "Terminée",
};
export const applicationStatusTone: Record<ApplicationStatus, Tone> = {
  draft: "neutral",
  submitted: "info",
  under_review: "brand",
  info_required: "warning",
  approved_sim: "success",
  rejected_sim: "danger",
  completed: "neutral",
};
/** Ordre des étapes affichées dans le suivi. */
export const applicationSteps: ApplicationStatus[] = ["submitted", "under_review", "approved_sim", "completed"];

export const accountTypeLabel: Record<AccountType, string> = {
  courant: "Compte courant",
  epargne: "Compte épargne",
  jeune: "Compte jeune",
  pro: "Compte professionnel",
  diaspora: "Compte diaspora",
};

export const bankStatusLabel: Record<BankStatus, string> = {
  demo_available: "Disponible dans la démo",
  coming_soon: "Bientôt",
  inactive: "Inactive",
};
export const bankStatusTone: Record<BankStatus, Tone> = { demo_available: "success", coming_soon: "info", inactive: "neutral" };

export const serviceLabel: Record<ServiceType, string> = {
  deposit: "Dépôt (simulé)",
  withdrawal: "Retrait (simulé)",
  assistance: "Assistance",
  account_support: "Accompagnement ouverture de compte",
};

export const operationLabel: Record<OperationType, string> = { deposit: "Dépôt", withdrawal: "Retrait" };

export const pointStatusLabel: Record<ServicePointStatus, string> = { open: "Ouvert", closed: "Fermé", suspended: "Suspendu" };
export const pointStatusTone: Record<ServicePointStatus, Tone> = { open: "success", closed: "neutral", suspended: "danger" };

export const agentStatusLabel: Record<AgentStatus, string> = { active: "Actif", inactive: "Inactif", suspended: "Suspendu" };
export const agentStatusTone: Record<AgentStatus, Tone> = { active: "success", inactive: "neutral", suspended: "danger" };

export const userStatusLabel: Record<UserStatus, string> = { active: "Actif", suspended: "Suspendu" };
export const userStatusTone: Record<UserStatus, Tone> = { active: "success", suspended: "danger" };

export const roleLabel: Record<UserRole, string> = { client: "Client", agent: "Agent Flamob", admin: "Administration" };
export const adminLevelLabel: Record<AdminLevel, string> = {
  superadmin: "Administrateur",
  supervisor: "Superviseur",
  operator: "Opérateur",
};

export const incidentTypeLabel: Record<IncidentType, string> = {
  operational: "Problème opérationnel",
  error: "Erreur",
  complaint: "Réclamation",
  liquidity: "Problème de liquidité",
  technical: "Problème technique",
  security: "Problème de sécurité",
  other: "Autre",
};
export const incidentStatusLabel: Record<IncidentStatus, string> = {
  open: "Ouvert",
  in_progress: "En traitement",
  resolved: "Résolu",
  closed: "Clôturé",
};
export const incidentStatusTone: Record<IncidentStatus, Tone> = { open: "warning", in_progress: "brand", resolved: "success", closed: "neutral" };
export const incidentPriorityLabel: Record<IncidentPriority, string> = { low: "Basse", medium: "Moyenne", high: "Haute" };
export const incidentPriorityTone: Record<IncidentPriority, Tone> = { low: "neutral", medium: "warning", high: "danger" };

export const notificationTypeLabel: Record<NotificationType, string> = {
  application: "Demande",
  status: "Changement de statut",
  operation: "Opération simulée",
  info: "Information",
  security: "Sécurité",
  support: "Assistance",
  liquidity: "Liquidité",
};

export const audienceLabel: Record<Audience, string> = {
  all: "Tous les utilisateurs",
  clients: "Clients",
  agents: "Agents",
  admins: "Administration",
};
