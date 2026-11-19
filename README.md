# FLAMOB — prototype de démonstration

> **Vos services financiers, plus proches.**
> Plateforme d'accès aux services financiers et de proximité pour la RDC (Flash + Mobile).

⚠️ **Prototype.** Flamob n'est pas une banque, ni un établissement de paiement ou de monnaie électronique.
Toutes les banques, agents et points de service sont **fictifs** ; toutes les demandes, dépôts, retraits,
trésoreries et commissions sont **simulés**. Aucune somme réelle n'est déplacée.

## Démarrage

Prérequis : Node.js 20+ (testé avec Node 22).

```bash
cd flamob
npm install
cp .env.example .env.local     # FLAMOB_DEMO_MODE=true par défaut
npm run dev                    # http://localhost:3000
```

Production : `npm run build && npm start`.

Au premier lancement, les données de démonstration sont générées dans `.data/flamob.json`
(ignoré par git). Pour les régénérer : `npm run seed` (ou *Administration → Paramètres → Réinitialiser*).

## Comptes de démonstration

En mode démonstration, la page **/connexion** propose un accès rapide (sans mot de passe) :

| Rôle | Compte fictif | Espace |
|---|---|---|
| Client | Christelle Kabeya | `/app` |
| Agent | Jean-Marc Kalala — AG-0001, Cabine Gombe Centre | `/agent` |
| Administrateur | Admin Démo (niveau administrateur) | `/admin` |

Aucun mot de passe n'est écrit dans le code. Pour une connexion classique, définissez
`FLAMOB_DEMO_PASSWORD` (8 caractères minimum) **avant** la génération des données ; les comptes
utilisent alors les identifiants `+243 800 000 001` (client), `+243 800 000 101` (agent), `+243 800 000 901` (admin).
Vous pouvez aussi créer votre propre compte client via `/inscription` (code SMS simulé affiché à l'écran).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run lint` | Vérification TypeScript stricte |
| `npm test` | Tests du domaine (trésorerie, plafonds, commissions, demandes, auth, permissions) |
| `npm run seed` | Régénère les données de démonstration |
| `BASE_URL=… npm run smoke` | Test de bout en bout dans un vrai navigateur (Playwright requis) |

## Documentation

- [Vision et fonctionnement](docs/PROJECT_OVERVIEW.md)
- [Architecture](docs/ARCHITECTURE.md) · [Décisions techniques](docs/DECISIONS.md)
- [Identité visuelle et design system](docs/DESIGN_SYSTEM.md)
- [Sécurité](docs/SECURITY.md) · [Démonstration](docs/DEMO.md)
- [Feuille de route](docs/ROADMAP.md) · [État d'avancement](docs/PROGRESS.md)
