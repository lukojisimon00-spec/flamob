# Démonstration

Toutes les données sont **fictives** et toutes les opérations **simulées** (bandeau permanent dans les espaces).

## Données générées
- 5 banques fictives (4 disponibles, 1 « bientôt ») et 8 offres aux frais **indicatifs non vérifiés**.
- 8 points de service fictifs à Kinshasa (6 ouverts, 1 fermé, 1 suspendu), 7 agents (dont 1 suspendu, 1 sans retrait,
  1 à faible liquidité pour illustrer les alertes).
- ~110 opérations sur 30 jours générées **par les vraies règles métier** (trésoreries et commissions cohérentes).
- Demandes à différents statuts, 3 incidents, 1 annonce publiée.

## Parcours conseillé (≈10 min)
1. **Accueil** `/` → « Essayer la démo ».
2. **Client** : tableau de bord → *Banques* → fiche → *Comparer* → *Ouvrir un compte* (assistant 6 étapes) → suivi.
   Ouvrir la demande « informations complémentaires requises » et y répondre. *Dépôt* : compte de démo → agent →
   montant → résumé (frais, plafonds, contrôle de liquidité) → reçu de démonstration. *Agents* : carte, filtres,
   « Trier par distance ».
3. **Agent** : tableau de bord → *Retrait* pour un client (essayer 1 999 $ chez un agent à faible liquidité pour voir
   le refus) → reçu → *Trésorerie* (journal des mouvements) → *Commissions* → *Sécurité*.
4. **Admin** : tableau de bord (période 7/30/90 j, alertes) → *Demandes* : passer en examen, approuver, terminer
   (crée un compte de démo chez le client) → *Agents* : rééquilibrage de trésorerie → *Commissions* : modifier une
   règle → *Notifications* : publier une diffusion ciblée → *Journal d'activité*.
5. *Paramètres → Réinitialiser* pour revenir à l'état initial.

## Inscription réelle dans la démo
`/inscription` crée un vrai compte (mot de passe haché) ; le SMS est simulé et le code s'affiche à l'écran.
