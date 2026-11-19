# Sécurité

## En place
- **Mots de passe** : scrypt (N=16384, r=8, p=1, sel 16 octets), comparaison à temps constant. Jamais en clair.
- **Sessions** : jeton aléatoire 256 bits dans un cookie `httpOnly`, `SameSite=Lax`, `Secure` en production ;
  seul le SHA-256 est stocké ; expiration 7 jours ; révocation à la déconnexion, à la suspension et au changement
  de mot de passe (les autres sessions sont fermées).
- **Limitation des tentatives** : 5 échecs en 15 min → verrouillage 15 min (par identifiant).
- **OTP simulé** : code 6 chiffres haché, 10 min, 5 essais, usage unique. *N'a aucune valeur d'authentification réelle.*
- **Contrôle d'accès** : middleware (présence de session) + vérification serveur du rôle dans chaque layout et
  **chaque action serveur** (`requireClient`, `requireAgent`, `requirePermission`). Un client ne lit que ses
  données (filtrage par `userId`), un agent que les siennes (`agentId`).
- **Permissions d'administration** distinctes : administrateur / superviseur / opérateur (matrice dans `/admin/roles`).
  Un administrateur ne peut pas modifier son propre statut ; seul un administrateur peut suspendre un compte d'administration.
- **Validation** côté serveur (Zod) de toutes les entrées ; anti open-redirect sur le paramètre `suite`.
- **Journal d'activité** : connexions, échecs, opérations (et refus), décisions, ajustements, configuration.
- **En-têtes** : `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Powered-By` retiré.
- **Données sensibles** : pas de stockage de documents ; numéros de compte masqués sur les reçus.
- **Agents** : aucune interface ne demande ni n'affiche d'identifiants bancaires ; confirmation explicite de la
  vérification d'identité « sans demander les identifiants » avant chaque opération ; consignes dans `/agent/securite`.

## Limites connues (prototype)
- En mode démonstration, le code OTP est affiché à l'écran : sur « mot de passe oublié », cela révèle si un compte
  existe. Désactiver `FLAMOB_DEMO_MODE` en dehors des démonstrations.
- La connexion rapide sans mot de passe n'existe qu'en mode démonstration.
- Cookie `Secure` en production : servir l'application en HTTPS (sinon la connexion échoue hors `localhost`).
- Stockage fichier non chiffré, sans sauvegarde : ne pas y mettre de données réelles.
- Pas encore de CSP stricte, de protection anti-automatisation sur l'inscription, ni de 2FA réelle.

## Avant toute mise en production réelle
Base de données gérée avec RLS, fournisseur SMS réel, CSP, rate-limiting réseau, chiffrement au repos,
politique de conservation des données, revue de sécurité externe, conformité réglementaire (BCC, protection des données).
