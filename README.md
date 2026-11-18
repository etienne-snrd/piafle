# Piafle

**L'oiseau du jour, à reconnaître au chant puis à la vue.**

Piafle est un jeu quotidien dans l'esprit de Wordle, pour les oiseaux de France. Chaque jour, un oiseau mystère : on l'entend d'abord chanter, puis sa photo se dévoile peu à peu. Tu as cinq essais pour trouver son nom.

▶ **Jouer : [piafle.netlify.app](https://piafle.netlify.app/)**

Le tout tient dans une page statique en HTML, CSS et JavaScript, sans framework, sans dépendance et sans étape de compilation, avec un décor animé en pixel art.

---

## Règles du jeu

- **Un oiseau par jour, le même pour tout le monde.** Il change à minuit, heure de Paris.
- **Cinq essais.** Tu tapes un nom (français ou latin, avec ou sans accents) et tu choisis dans la liste de suggestions.
- **Le chant est le premier indice.** On entend souvent un oiseau avant de le voir.
- **Chaque erreur révèle un nouvel indice :**

| Essais ratés | Ce qui se dévoile |
|---|---|
| 0 | Le chant de l'oiseau |
| 1 | Sa taille, son milieu de vie et une photo très pixelisée |
| 2 | Son comportement et une photo un peu moins pixelisée |
| 3 | Une photo encore plus nette |
| 4 | La photo nette : c'est le dernier essai |

- **Chaque proposition ratée donne aussi des pistes**, affichées dans l'encart « Tes essais » :
  - *même catégorie* si l'oiseau proposé appartient au même grand groupe (passereaux, rapaces diurnes, limicoles, canards…) ;
  - *cherche plus grand*, *cherche plus petit* ou *taille proche* (moins de 10 % d'écart, sur l'envergure, ou à défaut la longueur).
- **Un niveau de difficulté** (facile, moyen, difficile) est affiché pour chaque oiseau.
- **En fin de partie**, le nom de l'oiseau est révélé avec un lien vers sa page Wikipédia, un bouton qui copie ton résultat pour le partager, le temps restant avant le prochain oiseau et les crédits de la photo et du chant.

La partie en cours est enregistrée dans le navigateur (`localStorage`) : on peut fermer la page et reprendre plus tard dans la journée.

## Le décor

Autour du jeu, un paysage en pixel art s'anime : lac, montagnes, cabane d'observation, campement, et des oiseaux qui vont et viennent (mésange, rouge-gorge, pic épeiche, martin-pêcheur, grues, héron, chouette la nuit…). Il suit l'heure de Paris et passe par quatre ambiances : **aube, jour, soir et nuit**. Les pictogrammes des indices et les cadres prennent les mêmes couleurs.

Le bouton pause de l'en-tête fige le décor. Il est figé d'office si le système demande de réduire les animations.

## Lancer le jeu en local

Les données sont chargées avec `fetch`, il faut donc servir les fichiers par HTTP (ouvrir `index.html` directement ne suffit pas) :

```bash
git clone https://github.com/<ton-compte>/piafle.git
cd piafle
python3 -m http.server 8000
```

puis ouvrir <http://localhost:8000>.

### Paramètres d'adresse utiles

| Paramètre | Effet |
|---|---|
| `?moment=aube` / `jour` / `soir` / `nuit` | Force un moment de la journée pour le décor |
| `?heure=0` à `23` | Simule une heure de Paris |
| `?formule=gros-plan` | Autre déroulé des indices : gros plan sur un détail, couleurs du plumage, puis photo entière (6 essais) |
| `?anim=demo` | Accélère les allées et venues des oiseaux du décor |

Dans la console du navigateur, `Piafle.effets.envol()` rejoue l'animation de victoire.

## Organisation du code

```
index.html          structure de la page
_headers            en-têtes HTTP de sécurité (CSP…), au format Netlify
css/
  piafle.css        mise en page et style pixel art
  effets.css        animations après un essai (tremblement, bond)
js/
  jeu.js            logique du jeu, sans interface (oiseau du jour, essais, indices, partage)
  ui.js             affichage de l'état et saisie (photo pixelisée, chant, suggestions)
  effets.js         effets visuels et annonces pour lecteurs d'écran après chaque essai
  decor.js          paysage animé en pixel art
  cadre.js          cadres peints autour des panneaux (bois, branche, lierre)
  pictos.js         pictogrammes 8-bit des indices « taille » et « milieu »
  secours.js        affiche la page même si le décor ne démarre pas
data/
  species.json      les 337 espèces du jeu
polices/            polices pixel hébergées avec le site
```

`jeu.js` ne touche pas à la page : il expose `window.Piafle` (`etat()`, `proposer()`, `suggestions()`, `partage()`) et émet l'événement `piafle:change` à chaque essai. `ui.js` et `effets.js` écoutent cet événement pour mettre l'écran à jour. La logique (`creerJeu()`) peut aussi être chargée dans Node.

### Choix de l'oiseau du jour

Les espèces sont mélangées de façon déterministe (générateur pseudo-aléatoire *mulberry32* et mélange de Fisher-Yates à graine fixe). Le jour n°1 est le `DATE_LANCEMENT` défini dans `js/jeu.js`. Les espèces défilent par cycles : chacune passe une fois avant qu'une autre ne revienne. Tout le monde a donc le même oiseau, sans serveur.

### Les données

Chaque entrée de `data/species.json` décrit une espèce :

| Champ | Contenu |
|---|---|
| `id` | identifiant Wikidata |
| `nom_fr`, `nom_scientifique` | noms français et latin |
| `famille`, `ordre` | classification, qui sert aussi à calculer la « catégorie » |
| `longueur_cm`, `envergure_cm` | mensurations |
| `milieu` | jardins, villes, forêts, campagnes, zones humides, littoral ou montagnes |
| `difficulte` | 1 (facile), 2 (moyen) ou 3 (difficile) |
| `comportement` | indice écrit sur le comportement |
| `palette` | couleurs principales du plumage (formule `gros-plan`) |
| `foyer` | point de zoom sur la photo, en % (`x`, `y`, `zoom`) |
| `photos`, `sons` | médias (Wikimedia Commons, xeno-canto) avec auteur et licence |
| `wikipedia` | lien et résumé de l'article |

Pour ajouter une espèce, il suffit d'ajouter une entrée. Attention : changer la liste change aussi l'ordre de passage des oiseaux.

## Déploiement

Le site est prévu pour [Netlify](https://www.netlify.com/) : on publie le dossier tel quel, sans commande de build. Le fichier `_headers` y applique une politique de sécurité stricte : aucun script écrit dans la page, et les médias ne peuvent venir que de `upload.wikimedia.org` et `xeno-canto.org`.

N'importe quel hébergement statique convient aussi (GitHub Pages, par exemple), mais `_headers` n'y sera pas pris en compte. Pense alors à mettre à jour `ADRESSE_JEU` dans `js/jeu.js`, l'adresse utilisée dans le texte de partage.

## Crédits

- **Photos :** [Wikimedia Commons](https://commons.wikimedia.org/).
- **Chants :** [Wikimedia Commons](https://commons.wikimedia.org/) et [xeno-canto](https://xeno-canto.org/).
- L'auteur et la licence de chaque média sont affichés en fin de partie et listés dans `data/species.json`.
- **Textes et liens :** [Wikipédia](https://fr.wikipedia.org/) et [Wikidata](https://www.wikidata.org/).
- **Polices :** *Jersey 10* et *Jersey 20* (The Soft Type Project, licence OFL, voir `polices/OFL-jersey.txt`) ; *Pixelify Sans* (licence OFL), dans une version modifiée où les chiffres 2, 5 et 7 ont été redessinés.
