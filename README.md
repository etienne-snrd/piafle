# Piafle

Un jeu quotidien pour apprendre à reconnaître les oiseaux de France, à la vue et au chant.

Chaque jour, un oiseau mystère, le même pour tout le monde, à trouver en 6 essais. Chaque essai raté révèle un indice (détail de photo, taille, chant, habitat…). La partie se termine par une fiche sur l'espèce.

## Structure prévue

- `data/` : liste des espèces et données générées
- `scripts/` : script Python de préparation des données (photos, sons, textes)
- `site/` : le jeu (HTML, CSS, JavaScript), publié sur GitHub Pages

## Générer les données

```
python3 scripts/construire_donnees.py
```

Le script lit `data/especes.csv` et écrit `data/species.json` : pour chaque espèce, famille, ordre, taille, photos et sons (avec auteur et licence) et le résumé Wikipédia. Il n'utilise que la bibliothèque standard de Python. Les réponses des API sont gardées dans `data/cache/` (ignoré par git), donc une relance est rapide. À la fin, il affiche ce qui manque (photo, son, taille) pour compléter à la main.

## Crédits

Photos : Wikimedia Commons. Sons : xeno-canto. Textes : Wikipédia. Chaque média est crédité avec son auteur et sa licence dans le jeu.
