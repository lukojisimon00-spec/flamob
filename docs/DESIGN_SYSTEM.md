# FLAMOB — identité visuelle et design system

## Marque
- **Nom** : FLAMOB (Flash + Mobile). **Promesse** : rendre les services financiers plus accessibles et plus proches.
- **Signature** : « Vos services financiers, plus proches. » (proposition de communication, pas une promesse de service).

## Logo (concept v1 — à affiner avant usage imprimé)
Symbole « F » géométrique : barre supérieure et fût en éclair (rapidité), barre médiane cyan et traînée
(mouvement), deux ondes de signal (mobile, connectivité). Aucun symbole bancaire générique.

| Variante | Fichier / composant |
|---|---|
| Logo principal (symbole + mot-symbole) | `<Logo />`, `public/brand/flamob-logo-light.svg` |
| Version sombre | `<Logo tone="onDark" />`, `public/brand/flamob-logo-dark.svg` |
| Symbole seul | `<LogoMark />`, `public/brand/flamob-symbol.svg`, `flamob-symbol-dark.svg` |
| Icône d'application | `public/brand/flamob-app-icon-full.svg`, `public/icons/icon-192/512.png`, `icon-maskable-512.png` |
| Favicon (simplifié : sans ondes ni traînée, lisible à 16 px) | `src/app/icon.svg`, `src/app/apple-icon.png` |

Le mot-symbole des fichiers SVG utilise du texte Manrope ExtraBold : **vectoriser le texte** avant usage hors web.
Les PNG sont rendus depuis les SVG (pas d'images générées par IA).

## Couleurs (jetons dans `src/app/globals.css`)
| Jeton | Valeur | Usage |
|---|---|---|
| `navy` | #10243A | Couleur primaire, texte principal, en-têtes, boutons principaux |
| `navy-700` | #174B73 | Survol, icônes secondaires |
| `cyan` | #20B8C9 | Accent de marque (fonds, indicateurs, barres) — **pas pour du texte sur blanc** (contraste 2,3:1) |
| `cyan-700` | #0B7480 | Variante accessible pour liens et texte d'accent |
| `canvas` / `surface` | #F5F7FA / #FFFFFF | Fond de page / cartes |
| `ink`, `ink-soft`, `muted` | navy, #334155, #64748B | Hiérarchie du texte |
| `success`, `warning`, `danger`, `info` (+ `-bg`) | — | **États uniquement**, toujours avec icône ou libellé |

## Typographie
- **Manrope** (variable) : Bold titres, Semibold titres de section et libellés, Medium navigation, Regular texte.
- **IBM Plex Mono** : références, identifiants, codes de reçu, montants et données chiffrées.

## Composants (`src/components/ui`, `src/components/domain`)
Button/ButtonLink, Card, Badge, SimTag (« Simulé »/« Fictif »), Field/Input/Select/Textarea/Checkbox/SubmitButton
(ActionForm conserve les saisies et affiche les erreurs par champ), Alert, SimulationNotice, EmptyState, Skeleton,
PageHeader, StatTile, DescriptionList, Table, Tabs, Pagination, FilterBar/SearchInput/FilterSelect, ConfirmDialog,
BarChart (mono-série accessible), icônes SVG ; navigation inférieure (client/agent), barre latérale (admin) ;
Receipt, TransactionRow, BankCard, AgentCard, ApplicationStatusBadge/Progress/Timeline, assistants d'opération et de demande.

## Règles
Mobile d'abord (cibles ≥ 44 px, navigation inférieure), peu d'ombres, pas de dégradés décoratifs, pas d'emojis,
toute donnée non réelle porte un marqueur « Simulé »/« Fictif », aucun contrôle inerte. Toute nouvelle couleur
passe par un jeton.
