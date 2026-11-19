# Décisions techniques

**D-001 — Sous-dossier `flamob/` dans ce dépôt.** Le dépôt contenait uniquement un skill Remotion (vidéo), sans
code Flamob. Pour ne rien détruire, Flamob est un projet autonome dans `flamob/`. Il pourra être déplacé dans
un dépôt dédié sans modification.

**D-002 — Next.js + TypeScript + Tailwind.** Recommandé par le cahier des charges ; rendu serveur = pages légères
pour smartphones d'entrée de gamme (≈105–115 kB de JS au premier chargement).

**D-003 — Pas de Supabase pour l'instant ; stockage JSON local.** Aucun projet ni clé n'était disponible. Plutôt que
de bloquer, la persistance est isolée dans `store.ts` et la logique dans des fonctions pures testables.
Limite : une seule instance de serveur, pas d'hébergement « serverless » à disque éphémère. Migration : voir ARCHITECTURE.

**D-004 — Authentification maison minimale plutôt qu'une bibliothèque.** scrypt natif + sessions opaques en base
(hash SHA-256 du jeton) + cookie httpOnly. Peu de code, aucune dépendance, révocation immédiate (suspension,
changement de mot de passe). À remplacer par Supabase Auth ou équivalent lors du passage à PostgreSQL.

**D-005 — Connexion rapide de démonstration au lieu de mots de passe dans le code.** Gated par `FLAMOB_DEMO_MODE`.
Mot de passe optionnel via `FLAMOB_DEMO_PASSWORD`, jamais commité.

**D-006 — Trésorerie à deux soldes (espèces + liquidité de compensation).** Reflète le fonctionnement réel d'un
agent bancaire (le dépôt consomme la liquidité côté banque, le retrait consomme les espèces). Aucun des deux n'est
un portefeuille électronique.

**D-007 — Montants en entiers (unités mineures).** Évite les erreurs d'arrondi des flottants.

**D-008 — Documents : métadonnées seulement.** Le contenu d'un fichier ne quitte pas l'appareil dans la démo
(protection des données, pas de stockage de pièces d'identité).

**D-009 — Carte schématique sans service cartographique.** Pas de dépendance réseau ni de clé ; positions fictives.
Une carte réelle (Leaflet/OSM ou autre) pourra la remplacer.

**D-010 — Polices auto-hébergées.** Manrope et IBM Plex Mono via @fontsource : pas d'appel à des CDN tiers,
fonctionne en réseau restreint.

**D-011 — Tests avec `node:test`.** Vitest présentait des vulnérabilités signalées par `npm audit` ; le runner natif
suffit pour le domaine. Dépendances : 0 vulnérabilité connue à la date de création.

**D-012 — Commission non rétroactive.** Une règle modifiée s'applique aux opérations suivantes ; l'historique conserve
le montant calculé au moment de l'opération.
