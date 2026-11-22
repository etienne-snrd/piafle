-- Requêtes types des analytics de Piafle, une par question.
--
-- Tables (voir netlify/database/migrations/) :
--   fins     une ligne par partie terminée
--   erreurs  une ligne par essai faux
--   especes  liste des oiseaux du jeu, avec la difficulté attribuée à la main
-- date_du_jour(jour) donne la date d'un n° de jour.
--
-- Chaque consultation réveille la base, facturée au temps éveillé : mieux
-- vaut lancer plusieurs requêtes d'un coup, puis se déconnecter.


-- Q1. Taux de réussite, par jour…
SELECT date_du_jour(jour) AS date,
       oiseau,
       count(*) AS parties,
       round(100.0 * avg(gagne::int), 1) AS reussite_pct
FROM fins
GROUP BY jour, oiseau
ORDER BY jour DESC;

-- … et en moyenne sur toute la période.
SELECT count(*) AS parties,
       round(100.0 * avg(gagne::int), 1) AS reussite_pct
FROM fins;


-- Q2. Répartition du nombre d'essais (1 à 5, et perdu).
SELECT CASE WHEN gagne THEN essais::text ELSE 'perdu' END AS resultat,
       count(*) AS parties,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS part_pct
FROM fins
GROUP BY 1
ORDER BY 1;


-- Q3. Effet du chant : réussite selon qu'il a été écouté ou non.
SELECT chant AS chant_ecoute,
       count(*) AS parties,
       round(100.0 * avg(gagne::int), 1) AS reussite_pct,
       round(avg(essais) FILTER (WHERE gagne), 2) AS essais_moyens_si_gagne
FROM fins
GROUP BY chant;


-- Q4. Mobile contre ordinateur : réussite et nombre d'essais.
SELECT appareil,
       count(*) AS parties,
       round(100.0 * avg(gagne::int), 1) AS reussite_pct,
       round(avg(essais) FILTER (WHERE gagne), 2) AS essais_moyens_si_gagne
FROM fins
GROUP BY appareil;


-- Q5. Difficulté réelle de chaque oiseau, comparée au niveau attribué à la
-- main. Score mesuré : nombre moyen d'essais, une partie perdue comptant 6.
-- Les oiseaux en tête sont les plus durs ; « ecart » signale ceux dont le
-- niveau semble mal choisi.
WITH mesure AS (
  SELECT oiseau,
         count(*) AS parties,
         round(100.0 * avg(gagne::int), 1) AS reussite_pct,
         avg(CASE WHEN gagne THEN essais ELSE 6 END) AS score
  FROM fins
  GROUP BY oiseau
)
SELECT m.oiseau,
       e.difficulte AS niveau_attribue,
       m.parties,
       m.reussite_pct,
       round(m.score, 2) AS score,
       -- Niveau mesuré : tiers des oiseaux classés par score.
       ntile(3) OVER (ORDER BY m.score) AS niveau_mesure,
       ntile(3) OVER (ORDER BY m.score) - e.difficulte AS ecart
FROM mesure m
JOIN especes e ON e.nom = m.oiseau
ORDER BY m.score DESC;


-- Q6. À quel essai, donc après quel indice, on trouve l'oiseau.
-- Essai 1 : le chant seul ; 2 : taille, milieu et photo très pixelisée ;
-- 3 : comportement et photo moins pixelisée ; 4 : photo plus nette ;
-- 5 : photo nette.
SELECT essais AS essai_gagnant,
       CASE essais
         WHEN 1 THEN 'chant'
         WHEN 2 THEN 'taille, milieu, photo très pixelisée'
         WHEN 3 THEN 'comportement, photo moins pixelisée'
         WHEN 4 THEN 'photo plus nette'
         WHEN 5 THEN 'photo nette'
       END AS dernier_indice,
       count(*) AS parties,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS part_pct
FROM fins
WHERE gagne
GROUP BY essais
ORDER BY essais;


-- Q7. Top 5 des noms proposés à tort, pour chaque oiseau à trouver.
SELECT oiseau, propose, fois
FROM (
  SELECT oiseau,
         propose,
         count(*) AS fois,
         row_number() OVER (PARTITION BY oiseau ORDER BY count(*) DESC, propose) AS rang
  FROM erreurs
  GROUP BY oiseau, propose
) classement
WHERE rang <= 5
ORDER BY oiseau, rang;


-- Q9. Nombre de parties terminées par jour.
SELECT date_du_jour(jour) AS date, count(*) AS parties
FROM fins
GROUP BY jour
ORDER BY jour DESC;


-- Q10. Nouveaux joueurs contre habitués, par tranche d'ancienneté
-- (n° de la partie du joueur).
SELECT CASE
         WHEN anciennete = 1 THEN '1 : première partie'
         WHEN anciennete <= 7 THEN '2 à 7'
         WHEN anciennete <= 30 THEN '8 à 30'
         ELSE 'plus de 30'
       END AS anciennete,
       count(*) AS parties,
       round(100.0 * avg(gagne::int), 1) AS reussite_pct
FROM fins
GROUP BY 1
ORDER BY min(anciennete);

-- Part des nouveaux joueurs, jour par jour.
SELECT date_du_jour(jour) AS date,
       count(*) AS parties,
       count(*) FILTER (WHERE anciennete = 1) AS premieres_parties
FROM fins
GROUP BY jour
ORDER BY jour DESC;


-- Q11. Tenue des séries de victoires (série en cours à la fin de la partie).
SELECT CASE
         WHEN serie = 0 THEN '0 : série cassée'
         WHEN serie = 1 THEN '1'
         WHEN serie <= 3 THEN '2 à 3'
         WHEN serie <= 7 THEN '4 à 7'
         WHEN serie <= 30 THEN '8 à 30'
         ELSE 'plus de 30'
       END AS serie,
       count(*) AS parties
FROM fins
GROUP BY 1
ORDER BY min(serie);
