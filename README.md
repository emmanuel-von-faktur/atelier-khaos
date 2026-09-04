# Atelier Khaos — panorama 360°

Visite immersive de l’atelier, en WebGL (Three.js). Glisser pour regarder, pincer ou molette pour zoomer.

Police d’affichage : **Fette UNZ Fraktur** (Peter Wiegel, OFL).

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre `http://localhost:8080`.

## Fichiers média à ajouter

Les faces du cube (`public/pano/cube_{r,l,u,d,f,b}.jpg`) et la police (`public/fonts/FetteUNZFraktur.ttf`) sont trop lourdes pour cet export. Recopie-les depuis l’app Grok publiée, dans les mêmes chemins.

## Stack

- TanStack Start + React 19
- Three.js (skybox cubique)
- Tailwind CSS v4
