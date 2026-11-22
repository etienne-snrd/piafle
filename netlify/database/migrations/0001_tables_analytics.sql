-- Tables des analytics de Piafle.
--
-- Aucune ligne ne porte d'identifiant de joueur ou de partie, ni d'heure :
-- seul le n° du jour de jeu est gardé. Les lignes sont supprimées au bout
-- de 25 mois par la fonction planifiée import-quotidien.

-- Une ligne par partie terminée.
CREATE TABLE fins (
  jour       integer  NOT NULL CHECK (jour >= 1),
  oiseau     text     NOT NULL,
  gagne      boolean  NOT NULL,
  essais     smallint NOT NULL CHECK (essais BETWEEN 1 AND 5),
  chant      boolean  NOT NULL,
  appareil   text     NOT NULL CHECK (appareil IN ('mobile', 'ordinateur')),
  anciennete integer  NOT NULL CHECK (anciennete >= 1),
  serie      integer  NOT NULL CHECK (serie >= 0)
);
CREATE INDEX fins_jour ON fins (jour);
CREATE INDEX fins_oiseau ON fins (oiseau);

-- Une ligne par essai faux.
CREATE TABLE erreurs (
  jour    integer NOT NULL CHECK (jour >= 1),
  oiseau  text    NOT NULL,
  propose text    NOT NULL
);
CREATE INDEX erreurs_jour ON erreurs (jour);
CREATE INDEX erreurs_oiseau ON erreurs (oiseau);

-- Copie de la liste des oiseaux du jeu (data/species.json), tenue à jour
-- par la fonction planifiée : sert à croiser la difficulté attribuée à la
-- main (1 facile, 2 moyen, 3 difficile) avec la difficulté mesurée.
CREATE TABLE especes (
  nom              text PRIMARY KEY,
  nom_scientifique text NOT NULL,
  difficulte       smallint NOT NULL CHECK (difficulte BETWEEN 1 AND 3)
);

-- Date (heure de Paris) d'un n° de jour : le jour n°1 est le 9 novembre 2026,
-- DATE_LANCEMENT dans js/jeu.js.
CREATE FUNCTION date_du_jour(jour integer) RETURNS date
  LANGUAGE sql IMMUTABLE
  AS $$ SELECT DATE '2026-11-08' + jour $$;
