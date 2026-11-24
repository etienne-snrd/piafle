-- Clés des lots du tampon déjà versés dans la base.
--
-- La fonction planifiée import-quotidien valide d'abord les insertions, puis
-- vide le tampon. Si elle est interrompue entre les deux, les lots restent
-- dans le tampon : cette table lui permet de les reconnaître le lendemain et
-- de ne pas les compter deux fois. Une clé ne dit rien d'un joueur : elle
-- est tirée au hasard à la réception de chaque lot. Les clés sont oubliées
-- au bout d'un mois.
CREATE TABLE lots_importes (
  cle  text    PRIMARY KEY,
  jour integer NOT NULL
);
CREATE INDEX lots_importes_jour ON lots_importes (jour);
