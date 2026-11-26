-- Requêtes du dashboard Metabase de Piafle, une par carte.
--
-- Chaque requête se colle dans une question SQL native de Metabase. Le
-- titre de la carte et la visualisation conseillée sont indiqués au-dessus.
--
-- Filtre facultatif {{depuis}} : variable de type « Date » dans Metabase.
-- Le bloc [[ … ]] est ignoré tant que le filtre est vide.
--
-- Le jour de jeu en cours (heure de Paris) se calcule comme dans js/jeu.js :
--   (now() AT TIME ZONE 'Europe/Paris')::date - DATE '2026-11-08'
-- « Hier » est le dernier jour complet : l'import de 4 h 15 l'a versé.
--
-- Les tables étant petites, ouvrir le dashboard ne réveille la base qu'une
-- fois, quel que soit le nombre de cartes.


-- ===================================================================
-- A. Vue d'ensemble
-- ===================================================================

-- A1. Parties hier
-- Visualisation : Nombre.
SELECT count(*) AS parties_hier
FROM fins
WHERE jour = (now() AT TIME ZONE 'Europe/Paris')::date - DATE '2026-11-08' - 1;


-- A2. Les 7 derniers jours, comparés aux 7 précédents
-- Visualisation : Tendance (une carte par indicateur : parties, réussite,
-- essais moyens, part mobile, part chant). La ligne la plus récente est
-- comparée à la précédente.
WITH bornes AS (
  SELECT (now() AT TIME ZONE 'Europe/Paris')::date - DATE '2026-11-08' - 1 AS hier
)
SELECT date_du_jour(CASE WHEN f.jour > b.hier - 7 THEN b.hier ELSE b.hier - 7 END) AS fin_de_periode,
       count(*) AS parties,
       round(100.0 * avg(f.gagne::int), 1) AS reussite_pct,
       round(avg(f.essais) FILTER (WHERE f.gagne), 2) AS essais_moyens_si_gagne,
       round(100.0 * avg((f.appareil = 'mobile')::int), 1) AS mobile_pct,
       round(100.0 * avg(f.chant::int), 1) AS chant_ecoute_pct
FROM fins f, bornes b
WHERE f.jour BETWEEN b.hier - 13 AND b.hier
GROUP BY 1
ORDER BY 1;


-- A3. Santé de l'import : dernier jour en base
-- Visualisation : Tableau. « jours_de_retard » doit valoir 1 : au-delà,
-- l'import de la nuit n'a pas tourné.
SELECT date_du_jour(max(jour)) AS dernier_jour_en_base,
       (now() AT TIME ZONE 'Europe/Paris')::date - date_du_jour(max(jour)) AS jours_de_retard
FROM fins;


-- A4. Santé de l'import : lots reçus par jour (30 derniers jours)
-- Visualisation : Barres. Un lot correspond à un envoi d'un joueur ; un
-- jour à zéro signale une panne de la collecte ou de l'import.
SELECT date_du_jour(jour) AS date, count(*) AS lots
FROM lots_importes
GROUP BY jour
ORDER BY jour;


-- ===================================================================
-- B. Audience et fidélité
-- ===================================================================
-- Un joueur termine au plus une partie par jour : les parties d'un jour
-- sont aussi le nombre de joueurs actifs ce jour-là.

-- B1. Parties par jour, selon l'ancienneté du joueur
-- Visualisation : Barres empilées (x : date, série : anciennete).
-- La hauteur totale donne les joueurs actifs du jour.
SELECT date_du_jour(jour) AS date,
       CASE
         WHEN anciennete = 1 THEN '1 : première partie'
         WHEN anciennete <= 7 THEN '2 à 7'
         WHEN anciennete <= 30 THEN '8 à 30'
         ELSE 'plus de 30'
       END AS anciennete,
       count(*) AS parties
FROM fins
WHERE TRUE
  [[AND date_du_jour(jour) >= {{depuis}}]]
GROUP BY jour, 2
ORDER BY jour, min(anciennete);


-- B2. Taux de retour
-- Visualisation : Ligne. Joueurs déjà venus actifs ce jour-là, rapportés
-- aux joueurs connus avant ce jour (actifs du premier jour mesuré, plus
-- les premières parties depuis). Sans identifiant, c'est une estimation :
-- les joueurs arrivés avant la mesure et absents le premier jour ne sont
-- pas comptés, ce qui gonfle le taux les premières semaines.
WITH par_jour AS (
  SELECT jour,
         count(*) AS parties,
         count(*) FILTER (WHERE anciennete = 1) AS premieres,
         count(*) FILTER (WHERE anciennete > 1) AS habitues
  FROM fins
  GROUP BY jour
),
connus AS (
  SELECT jour,
         habitues,
         -- Joueurs connus avant ce jour.
         sum(CASE WHEN jour = (SELECT min(jour) FROM fins) THEN parties ELSE premieres END)
           OVER (ORDER BY jour ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS connus_avant
  FROM par_jour
)
SELECT date_du_jour(jour) AS date,
       habitues,
       connus_avant,
       round(100.0 * habitues / connus_avant, 1) AS retour_pct
FROM connus
WHERE connus_avant > 0
  [[AND date_du_jour(jour) >= {{depuis}}]]
ORDER BY jour;


-- B3. Séries de victoires en cours (7 derniers jours)
-- Visualisation : Barres. Série en cours à la fin de la partie : 0 après
-- une défaite.
SELECT CASE
         WHEN serie = 0 THEN '0 : perdu'
         WHEN serie = 1 THEN '1'
         WHEN serie <= 3 THEN '2 à 3'
         WHEN serie <= 7 THEN '4 à 7'
         WHEN serie <= 30 THEN '8 à 30'
         ELSE 'plus de 30'
       END AS serie,
       count(*) AS parties,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS part_pct
FROM fins
WHERE jour >= (now() AT TIME ZONE 'Europe/Paris')::date - DATE '2026-11-08' - 7
GROUP BY 1
ORDER BY min(serie);


-- ===================================================================
-- C. Réussite et essais
-- ===================================================================

-- C1. Réussite par jour, avec l'oiseau du jour
-- Visualisation : Combo (barres : parties, ligne : reussite_pct) ou
-- Tableau pour lire le nom de l'oiseau.
SELECT date_du_jour(f.jour) AS date,
       f.oiseau,
       e.difficulte AS niveau_attribue,
       count(*) AS parties,
       round(100.0 * avg(f.gagne::int), 1) AS reussite_pct,
       round(avg(f.essais) FILTER (WHERE f.gagne), 2) AS essais_moyens_si_gagne
FROM fins f
LEFT JOIN especes e ON e.nom = f.oiseau
WHERE TRUE
  [[AND date_du_jour(f.jour) >= {{depuis}}]]
GROUP BY f.jour, f.oiseau, e.difficulte
ORDER BY f.jour;


-- C2. Répartition des parties : trouvé à quel essai, et grâce à quel indice
-- Visualisation : Barres. Essai 1 : le chant seul ; 2 : taille, milieu et
-- photo très pixelisée ; 3 : comportement et photo moins pixelisée ;
-- 4 : photo plus nette ; 5 : photo nette.
SELECT CASE
         WHEN NOT gagne THEN '6. perdu'
         WHEN essais = 1 THEN '1. chant'
         WHEN essais = 2 THEN '2. taille, milieu'
         WHEN essais = 3 THEN '3. comportement'
         WHEN essais = 4 THEN '4. photo plus nette'
         ELSE '5. photo nette'
       END AS resultat,
       count(*) AS parties,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS part_pct
FROM fins
WHERE TRUE
  [[AND date_du_jour(jour) >= {{depuis}}]]
GROUP BY 1
ORDER BY 1;


-- C3. Effet du chant
-- Visualisation : Barres (x : chant_ecoute, y : reussite_pct).
SELECT CASE WHEN chant THEN 'chant écouté' ELSE 'chant non écouté' END AS chant_ecoute,
       count(*) AS parties,
       round(100.0 * avg(gagne::int), 1) AS reussite_pct,
       round(avg(essais) FILTER (WHERE gagne), 2) AS essais_moyens_si_gagne
FROM fins
WHERE TRUE
  [[AND date_du_jour(jour) >= {{depuis}}]]
GROUP BY chant
ORDER BY chant DESC;


-- C4. Mobile contre ordinateur
-- Visualisation : Barres (x : appareil, y : reussite_pct).
SELECT appareil,
       count(*) AS parties,
       round(100.0 * avg(gagne::int), 1) AS reussite_pct,
       round(avg(essais) FILTER (WHERE gagne), 2) AS essais_moyens_si_gagne,
       round(100.0 * avg(chant::int), 1) AS chant_ecoute_pct
FROM fins
WHERE TRUE
  [[AND date_du_jour(jour) >= {{depuis}}]]
GROUP BY appareil
ORDER BY appareil;
