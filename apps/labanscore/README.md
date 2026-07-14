# LabanScore — Portée de Labanotation en direct / Live Labanotation score

**FR** — Application web (HTML/CSS/JS sans dépendance, aucune donnée transmise) pour créer une
portée de **Labanotation** synchronisée avec une vidéo déroulante, sur le modèle de LabanWrestle
(EMBODIAI). Le système de notation suit Ann Hutchinson Guest, *Labanotation: The System of
Analyzing and Recording Movement* (4ᵉ éd.) :

- portée verticale lue **de bas en haut**, ligne centrale séparant les côtés gauche/droit ;
- colonnes depuis le centre : **appui (pas), geste de jambe, corps, bras, tête** ;
- la **forme** du signe donne la direction (place, avant, arrière, côtés, diagonales),
  la **teinte** donne le niveau (noir = bas, point = moyen, hachures = haut) ;
- la **longueur** du signe donne la durée (durée = temps) ; barres de mesure selon le tempo.

Fonctions : vidéo locale **ou lien** (YouTube — l'iframe d'intégration officielle est pilotée
directement par son protocole postMessage, aucun script tiers n'est chargé — ou URL vidéo
directe mp4/webm) avec ralenti et image par image, **notation en direct** (maintenir
le bouton d'une colonne pendant la lecture : la longueur du signe suit le temps d'appui), édition
à la souris (déplacer, redimensionner, supprimer), signes de tour et de tenue, **bibliothèque des
signes** (27 signes de direction + complémentaires), aimantation aux temps, annuler/rétablir,
**portées nommées** sauvegardées localement, export/import **JSON**, export **SVG** et
**impression paginée par systèmes**, bibliographie intégrée, interface bilingue **FR/EN**
(`?lang=en`). Aucune donnée n'est transmise, sauf lors de la lecture d'un lien externe.

**EN** — Dependency-free web app to write a **Labanotation** staff in sync with a scrolling
video, in the style of LabanWrestle (EMBODIAI). Notation follows Ann Hutchinson Guest's
*Labanotation* (4th ed.): vertical staff read bottom-to-top, body columns outward from the
centre line, direction by sign shape, level by shading, duration by sign length. Features: local
video **or link** (YouTube — the official embed iframe is driven directly over its postMessage
protocol, no third-party script is loaded — or a direct mp4/webm URL) with slow motion and
frame stepping, live notation (hold a column button while the video
plays), mouse editing, turn/hold signs, a **sign library** (27 direction signs + extras), beat
snapping, undo/redo, **named scores** saved locally, JSON import/export, SVG export,
**paginated printing** by systems, built-in bibliography, bilingual FR/EN UI. No data leaves the
browser except when playing an external link.

## Utilisation / Usage

Ouvrir `index.html` dans un navigateur moderne (ou servir le dossier statiquement, p. ex.
`python3 -m http.server`). Aucune étape de build. / Open `index.html` in a modern browser (or
serve the folder statically). No build step.
