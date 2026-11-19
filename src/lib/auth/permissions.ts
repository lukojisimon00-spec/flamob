import type { AdminLevel, User } from "../db/schema";

/**
 * Contrôle d'accès basé sur les rôles (RBAC).
 * Les trois espaces (client, agent, admin) sont séparés par rôle ; à l'intérieur de
 * l'administration, les niveaux (administrateur, superviseur, opérateur) ont des permissions distinctes.
 */
export const PERMISSIONS = [
  "dashboard.read",
  "users.read",
  "users.manage",
  "agents.read",
  "agents.manage",
  "points.manage",
  "banks.manage",
  "applications.read",
  "applications.decide",
  "operations.read",
  "treasury.adjust",
  "commissions.read",
  "commissions.manage",
  "incidents.read",
  "incidents.manage",
  "notifications.manage",
  "settings.manage",
  "audit.read",
  "demo.reset",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const READ: Permission[] = [
  "dashboard.read", "users.read", "agents.read", "applications.read", "operations.read",
  "commissions.read", "incidents.read",
];

export const ADMIN_PERMISSIONS: Record<AdminLevel, Permission[]> = {
  superadmin: [...PERMISSIONS],
  supervisor: [
    ...READ, "users.manage", "agents.manage", "points.manage", "banks.manage", "applications.decide",
    "treasury.adjust", "commissions.manage", "incidents.manage", "notifications.manage", "audit.read",
  ],
  operator: [...READ, "applications.decide", "incidents.manage"],
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard.read": "Consulter le tableau de bord",
  "users.read": "Consulter les utilisateurs",
  "users.manage": "Suspendre / réactiver des utilisateurs",
  "agents.read": "Consulter les agents",
  "agents.manage": "Créer et gérer les agents",
  "points.manage": "Gérer les points de service",
  "banks.manage": "Gérer les banques et offres",
  "applications.read": "Consulter les demandes",
  "applications.decide": "Traiter les demandes (simulation)",
  "operations.read": "Consulter les opérations simulées",
  "treasury.adjust": "Ajuster une trésorerie simulée",
  "commissions.read": "Consulter les commissions",
  "commissions.manage": "Configurer les règles de commission",
  "incidents.read": "Consulter les incidents",
  "incidents.manage": "Traiter les incidents",
  "notifications.manage": "Publier des notifications",
  "settings.manage": "Modifier les paramètres",
  "audit.read": "Consulter le journal d'activité",
  "demo.reset": "Réinitialiser les données de démonstration",
};

export function permissionsOf(user: Pick<User, "role" | "adminLevel">): Permission[] {
  if (user.role !== "admin" || !user.adminLevel) return [];
  return ADMIN_PERMISSIONS[user.adminLevel];
}

export function can(user: Pick<User, "role" | "adminLevel">, permission: Permission): boolean {
  return permissionsOf(user).includes(permission);
}
