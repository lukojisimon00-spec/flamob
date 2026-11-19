# Architecture

## Pile technique
- **Next.js 15 (App Router) + React 19 + TypeScript strict** — rendu serveur, actions serveur pour toutes les écritures.
- **Tailwind CSS v4** — jetons de design dans `src/app/globals.css` (`@theme`).
- **Zod 4** — validation côté serveur de chaque action (les formulaires valident aussi côté client).
- **Polices auto-hébergées** (@fontsource : Manrope, IBM Plex Mono) — aucune dépendance à Google Fonts.
- **Stockage prototype** : fichier JSON local chargé en mémoire (`src/lib/db/store.ts`).
- Tests : `node:test` via `tsx` (aucun framework de test ajouté). E2E : Playwright (script `scripts/smoke.mjs`).

## Organisation
```
src/
  app/                    Routes (UI). Chaque espace a son layout qui vérifie le rôle.
    (auth)/               connexion, inscription, vérification, mot de passe oublié
    app/                  espace client         agent/   espace agent      admin/  administration
    actions/              actions serveur : auth.ts, client.ts, agent.ts, admin.ts
  components/
    ui/                   design system (Button, Card, Badge, form, feedback, data, dialog, icons, BarChart)
    brand/                logo (symbole, mot-symbole)
    layout/               coques mobiles / admin, navigations
    domain/               composants métier (reçu, lignes d'opération, assistants, cartes, frise de demande…)
  lib/
    db/                   schema.ts (types), store.ts (persistance), seed.ts (données fictives)
    domain/               logique métier PURE (aucune dépendance Next) : users, operations, applications,
                          network (agents, points, banques, incidents, paramètres), notifications, audit
    auth/                 password.ts (scrypt), session.ts (cookies Next), permissions.ts (RBAC)
    integrations/         sms.ts — point d'intégration (fournisseur simulé)
    validation.ts, action-utils.ts, queries.ts, money.ts, labels.ts, format.ts
  middleware.ts           redirection vers /connexion sans cookie (1re barrière)
```

## Flux d'une écriture
Formulaire (`ActionForm`) → action serveur (`"use server"`) → **contrôle de rôle/permission** → **validation Zod**
→ `transact(db => fonctionDuDomaine(db, …))` → la fonction applique les règles, écrit transaction, trésorerie,
commission, notifications, journal → l'action renvoie un état (`FormState`) ou redirige.

`transact` travaille sur une copie : si une règle lève une `DomainError`, **rien** n'est écrit.

## Modèle de données (correspondance avec le cahier des charges)
| Cahier des charges | Implémentation |
|---|---|
| Users, UserProfiles | `User` (profil fusionné) |
| Roles, Permissions | `role` + `adminLevel` sur `User`, matrice dans `lib/auth/permissions.ts` |
| Banks, BankOffers | `Bank`, `BankOffer` (`isFictional`, `infoVerified=false`) |
| AccountApplications | `AccountApplication` (+ `history`, documents = métadonnées) ; `DemoAccount` |
| Agents, AgentLocations, AgentServices | `Agent` (`authorizedServices`), `ServicePoint` |
| SimulatedTransactions | `SimulatedTransaction` |
| SimulatedCashBalances | `CashBalance` (espèces + compensation) + `CashMovement` (journal, soldes après) |
| CommissionRules, SimulatedCommissions | `CommissionRule` (fixe + bp, min/max, règle par agent), `SimulatedCommission` |
| Notifications | `AppNotification` (+ `Announcement` pour les diffusions) |
| Incidents, AuditLogs, Settings | `Incident`, `AuditLog`, `Settings` |
| (sécurité) | `Session` (hash du jeton), `LoginThrottle`, `OtpChallenge` |

Montants : **entiers en unités mineures** (×100). Identifiants : UUID v4 ; références lisibles `FLM-DEP-AAMMJJ-0001`.

## Évolution prévue
- **Base de données** : remplacer `store.ts` par PostgreSQL (Supabase ou autre). Les fonctions du domaine
  prennent déjà `db` en paramètre ; il faudra les rendre asynchrones et transactionnelles (SQL) — chaque
  fonction correspond à une transaction SQL. Les politiques RLS reproduiront la séparation actuelle
  (client : ses lignes ; agent : son agent/point ; admin : selon permission).
- **Partenaires bancaires** : introduire une interface `BankConnector` (ouverture de compte, dépôt, retrait,
  statut) avec une implémentation « simulée » (comportement actuel) et une par partenaire, sélectionnée par banque.
- **SMS** : implémenter `SmsProvider` (`src/lib/integrations/sms.ts`).
- **Hors ligne** : service worker pour la mise en cache des écrans de consultation (le manifeste PWA est en place).
