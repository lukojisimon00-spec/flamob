# Flamob — vision et fonctionnement

## Positionnement
Flamob (Flash + Mobile) est une **plateforme technologique d'accès, d'intermédiation et de proximité**
(modèle B2B2C + réseau physique). Elle connecte les particuliers, de futures banques partenaires, un réseau
d'agents et de points de service, et une administration centrale. **Flamob n'est pas une banque** et ne conserve
pas l'argent des utilisateurs.

Marché initial : République démocratique du Congo (Kinshasa dans la démo), Android d'abord, connexions instables,
USD et CDF, interface en français.

## Les trois piliers dans le prototype

| Pilier | Espace | Ce que l'on peut faire |
|---|---|---|
| **Flamob Digital** | `/app` (client) | Inscription + OTP simulé, banques, comparateur, demande d'ouverture de compte en 6 étapes, suivi, réseau d'agents (carte schématique, filtres, tri par distance), dépôt/retrait simulés avec reçu, historique, notifications, profil, assistance |
| **Flamob Agents** | `/agent` | Tableau de bord, opérations simulées pour un client (avec contrôle de liquidité), trésorerie simulée (espèces + liquidité de compensation, journal des mouvements), commissions, point de service, consignes de sécurité, signalements |
| **Flamob Management** | `/admin` | Statistiques calculées, utilisateurs (suspension), agents (création, statut, point, services, rééquilibrage), points de service, banques et offres, demandes (examen/approbation/refus simulés), opérations, règles de commission, incidents, diffusions, paramètres, journal d'activité, matrice des permissions |

## Règles de la simulation
- **Dépôt** : le client remet *montant + frais* en espèces → espèces de l'agent ↑ ; la liquidité de
  compensation de l'agent ↓ *montant* (elle représente ce qui serait crédité côté banque).
- **Retrait** : l'agent remet *montant* → espèces ↓ ; compensation ↑ ; frais imputés au compte (simulé).
- Refus si la liquidité est insuffisante, si l'agent/le point n'est pas actif/ouvert, si le service n'est
  pas autorisé, ou si les limites (min, max par opération, plafond journalier par client) sont dépassées.
- Chaque opération produit : transaction + mouvement de trésorerie + commission + notifications + entrée de journal.
- Une demande « approuvée » ou « terminée » reste une **simulation** ; la terminer crée un *compte de démonstration*
  utilisable uniquement dans les simulations.

## Ce que le prototype ne fait pas (volontairement)
Aucune connexion à une banque, aucun transfert, aucun portefeuille électronique, aucun SMS réel, aucune
vérification d'identité réelle, aucun stockage de documents.
