# Piafle

**L'oiseau du jour, à reconnaître au chant puis à la vue.**

Piafle est un jeu quotidien dans l'esprit de Wordle, pour les oiseaux de France. Chaque jour, un oiseau mystère : on l'entend d'abord chanter, puis sa photo se dévoile peu à peu. Le joueur a cinq essais pour trouver son nom.

▶ **Jouer : [piafle.netlify.app](https://piafle.netlify.app/)**

---

## Règles du jeu

- **Un oiseau par jour, le même pour tout le monde.** Il change à minuit, heure de Paris.
- **Cinq essais.** Tu tapes un nom (français ou latin, avec ou sans accents) et tu choisis dans la liste de suggestions.
- **Le chant est le premier indice.** On entend souvent un oiseau avant de le voir ;).
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
  mesure.js         mesure d'audience : envoie les essais faux et la fin de partie
data/
  species.json      les 337 espèces du jeu
polices/            polices pixel hébergées avec le site
netlify/
  functions/
    evenement.mjs         reçoit et valide les événements (/api/evenement)
    import-quotidien.mjs  verse chaque nuit les événements dans la base
  lib/evenements.mjs      validation partagée par les deux fonctions
  database/migrations/    tables de la base (Postgres)
analytics/
  requetes.sql      requêtes types pour lire les statistiques
package.json        dépendances des fonctions Netlify (le site n'en a aucune)
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
| `photos`, `sons` | médias (Wikimedia Commons, xeno-canto) avec auteur et licence |
| `wikipedia` | lien et résumé de l'article |

Pour ajouter une espèce, il suffit d'ajouter une entrée. Attention : changer la liste change aussi l'ordre de passage des oiseaux.

## Mesure d'audience et vie privée

Piafle mesure comment les joueurs s'en sortent (taux de réussite, oiseaux vraiment difficiles, confusions fréquentes), avec une solution maison, sans outil tiers. Le cadre visé est l'exemption de consentement de la CNIL pour la mesure d'audience : pas de cookie, pas d'identifiant, pas de bandeau.

### Ce qui est collecté

Deux événements, sans rien qui les relie entre eux ni à un joueur :

| Événement | Quand | Champs |
|---|---|---|
| `erreur` | à chaque essai faux | n° du jour, oiseau à trouver, nom proposé |
| `fin` | en fin de partie | n° du jour, oiseau, gagné ou perdu, nombre d'essais, chant écouté ou non, mobile ou ordinateur, n° de partie du joueur, série en cours |

Le n° de partie et la série sont lus dans les statistiques que le navigateur garde déjà (`localStorage`). Ne sont **jamais** stockés : l'adresse IP, l'heure (seul le n° du jour est gardé), le navigateur. Les données ne sont ni vendues ni partagées et sont supprimées au bout de **25 mois**. Les données sont hébergées par Netlify, aux États-Unis (la région n'est pas au choix sur le plan Personal) ; Netlify garde l'adresse IP dans ses journaux techniques jusqu'à 7 jours. Tout cela est expliqué aux joueurs dans la fenêtre « À propos », en bas de page.

Rien n'est envoyé en développement local.

### Comment ça marche

```
js/mesure.js ──POST──▶ /api/evenement ──▶ Netlify Blobs (tampon)
                                                 │ chaque nuit
                                                 ▼
                     DBeaver ◀──SQL── Netlify Database (Postgres)
```

- **Navigateur** (`js/mesure.js`) : écoute `piafle:change` et envoie en arrière-plan (`sendBeacon`, ou `fetch` avec `keepalive`). Une marque dans le `localStorage` évite tout doublon au rechargement. Un échec d'envoi est ignoré : le jeu n'attend jamais la mesure.
- **Réception** (`/api/evenement`) : même domaine que le site, donc aucun changement de CSP. La fonction valide chaque lot : jour courant ou veille, oiseau du jour **recalculé côté serveur** avec `jeu.js` (le navigateur ne l'envoie pas), nom proposé parmi les 337 espèces, bornes et cohérence (perdu = 5 essais et série remise à zéro). Elle répond toujours `204`, lot accepté ou non. Une limite de débit Netlify bloque les envois en rafale.
- **Tampon puis base** : les lots valides sont déposés dans Netlify Blobs. Une fonction planifiée les verse chaque nuit dans Netlify Database, puis vide le tampon. La base est facturée au temps où elle est éveillée : une seule écriture par jour la réveille une seule fois. Les prévisualisations de déploiement ont leur propre tampon et leur propre branche de base.
- **Base** : Postgres standard (pilote `postgres`, migrations SQL dans `netlify/database/migrations/`), pour pouvoir changer d'hébergeur sans réécrire le code. Le paquet `@netlify/database` ne sert qu'à lire la chaîne de connexion, et indique à Netlify de relier la base au site (migrations appliquées à chaque déploiement, branche de base pour chaque prévisualisation).

### Lire les statistiques

`analytics/requetes.sql` contient une requête par question (réussite, répartition des essais, effet du chant, mobile contre ordinateur, difficulté réelle contre niveau attribué, confusions par oiseau, fidélité, séries). On les lance dans un client SQL comme DBeaver, avec la chaîne de connexion de la base (tableau de bord Netlify, rubrique *Database*). Chaque consultation réveille la base : mieux vaut regrouper ses requêtes, puis se déconnecter.

### Couper la collecte

Mettre la variable d'environnement `ANALYTICS_ACTIF` à `non` dans Netlify, puis redéployer : la fonction de réception ignore alors tout ce qu'elle reçoit.

## Crédits

- **Photos :** [Wikimedia Commons](https://commons.wikimedia.org/).
- **Chants :** [Wikimedia Commons](https://commons.wikimedia.org/) et [xeno-canto](https://xeno-canto.org/).
- L'auteur et la licence de chaque média sont affichés en fin de partie et listés dans `data/species.json`.
- **Textes et liens :** [Wikipédia](https://fr.wikipedia.org/) et [Wikidata](https://www.wikidata.org/).
- **Polices :** *Jersey 10* et *Jersey 20* (The Soft Type Project, licence OFL, voir `polices/OFL-jersey.txt`) ; *Pixelify Sans* (licence OFL), dans une version modifiée où les chiffres 2, 5 et 7 ont été redessinés.
