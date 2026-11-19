# État d'avancement

_Dernière mise à jour : 19 novembre 2026 — version 0.1.0 (prototype)._

## Terminé
- **Fondations** : Next.js 15 / TS strict / Tailwind 4, design system FLAMOB (jetons, Manrope + IBM Plex Mono,
  composants), logo v1 (symbole, mot-symbole, variantes claire/sombre, icône d'app, favicon), PWA (manifeste + icônes).
- **Auth** : inscription, OTP simulé, connexion téléphone/e-mail, verrouillage, mot de passe oublié, sessions,
  déconnexion, changement de mot de passe, suspension, accès rapide démo.
- **Client** : accueil, banques + fiches, comparateur, demande en 6 étapes (brouillon, documents de démo),
  suivi avec frise + réponse aux demandes d'informations, réseau d'agents (carte schématique, filtres, distance),
  dépôt/retrait simulés + reçu, historique filtrable, notifications, profil, assistance.
- **Agent** : tableau de bord + graphique 14 j, opération pour un client (reconnaissance d'un client Flamob,
  contrôle de liquidité, confirmation de procédure), reçus, trésorerie (journal, flux du jour, alertes),
  commissions (jour/mois/type/règles/historique), point de service, consignes, signalements.
- **Admin** : tableau de bord (périodes, alertes, activité), utilisateurs, agents (création, statut, point,
  services, rééquilibrage), points, banques et offres, demandes (workflow simulé), opérations (filtres, détail,
  traçabilité), règles de commission, incidents (affectation, commentaires, historique), diffusions ciblées,
  paramètres (frais, limites, seuils, services, devises), journal, matrice des permissions, réinitialisation.

## Tests effectués
- `npm test` : 13/13 (cohérence trésorerie = Σ mouvements, règles dépôt/retrait, refus sans effet de bord,
  plafonds, statut agent, ajustements, priorité des règles de commission, workflow de demande, verrouillage,
  sessions, OTP, normalisation des numéros, permissions, ciblage des annonces).
- `npm run smoke` sur build de production : pages publiques, inscription + OTP, toutes les pages des 3 rôles, 0 erreur JS.
- Parcours Playwright manuels : dépôt client, demande complète, retrait agent, décisions admin, rééquilibrage,
  création d'agent, suspension, diffusion, validation des paramètres, doublon de règle bloqué, incident.
- Vérification visuelle mobile (412 px) et desktop (1280–1366 px).

## Problèmes connus / à faire
- Stockage fichier : une seule instance serveur (voir D-003).
- Les opérations initiées par le client sont confirmées immédiatement (pas d'étape de validation au guichet).
- Pas de service worker (hors ligne) ni d'export CSV.
