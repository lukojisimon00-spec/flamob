# Feuille de route

| Phase | Contenu | État |
|---|---|---|
| 1. Audit | Dépôt existant = skill Remotion, aucun code Flamob | ✅ |
| 2. Plan | Architecture, modèle de données, parcours | ✅ |
| 3. Fondations | Design system FLAMOB, logo, navigation, auth, permissions, stockage, données de démo | ✅ |
| 4. Application client | Tous les parcours du cahier des charges §7 | ✅ (v0.1) |
| 5. Espace agent | §8 complet (opérations, trésorerie, commissions, point, sécurité) | ✅ (v0.1) |
| 6. Administration | §9 complet | ✅ (v0.1) |
| 7. Tests | 13 tests de domaine, e2e Playwright (3 rôles + inscription) | ✅ (à étendre) |
| 8. Amélioration | voir ci-dessous | ⏳ |

## Prochaines étapes proposées (par priorité)
1. **Base de données gérée** (PostgreSQL / Supabase) + RLS + migrations, pour un hébergement multi-instance.
2. **Hébergement de démonstration** HTTPS (avec `FLAMOB_DEMO_MODE=true`) pour les présentations partenaires.
3. **Validation par l'agent des opérations initiées par le client** (statut « en attente » → confirmation au guichet,
   code de retrait à usage unique).
4. **Mode hors ligne / réseau faible** : service worker, mise en cache des catalogues, file d'attente des actions.
5. Gestion fine des rôles d'administration depuis l'interface (attribution de niveau), invitations.
6. Export CSV des opérations et commissions, relevés de commission mensuels.
7. Carte réelle (OSM), géolocalisation des points vérifiée.
8. Langues supplémentaires (lingala, swahili, anglais) — libellés déjà centralisés (`labels.ts`).
9. Intégrations réelles (après partenariats et autorisations) : `BankConnector`, `SmsProvider`, KYC.
