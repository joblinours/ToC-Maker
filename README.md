# ToC-Maker

Un plugin Obsidian pour générer ou rafraîchir, en un clic droit, une note de table des matières dans n'importe quel dossier.

## Fonctionnalités
- Clic droit sur un dossier > **Generate TOC** : crée ou met à jour la note (titre par défaut `Table of content`).
- Liste tous les fichiers Markdown du dossier (hors exclusions) et leurs titres H1–H6 avec indentation par onglets.
- Command palette : **Generate TOC for active file's folder**.
- Exclusions par motifs simples (ex. `img`, `assets`).

## Réglages
- **Note title** : nom du fichier et titre H1 générés.
- **Maximum heading depth** : profondeur H1–H6 (défaut H3).
- **Exclude patterns** : sous-chaînes séparées par des virgules, appliquées aux chemins complets.
- **Afficher le dossier primaire** : préfixe chaque note par son dossier principal.

## Installation (manuelle)
1. `npm install`
2. `npm run build`
3. Copier `manifest.json` et `main.js` dans votre vault : `.obsidian/plugins/toc-maker/`
4. Activer *ToC-Maker* dans les Community plugins d'Obsidian.

## Utilisation
1. Clic droit sur un dossier > **Generate TOC**
2. Ajuster les réglages (titre, profondeur Hx, exclusions, préfixe dossier) puis regénérer si besoin.

## Développement
- `npm run dev` : watch + rebuild
- `npm run build` : bundle de production
