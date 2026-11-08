"""Construit data/species.json à partir de data/especes.csv.

Pour chaque espèce de la liste, le script interroge des sources libres :

- Wikidata : identifiant, photos, enregistrements sonores, famille, ordre,
  envergure et longueur ;
- Wikimedia Commons : adresse des fichiers, auteur et licence de chaque média ;
- Wikipédia en français : le résumé de l'article.

Il n'utilise que la bibliothèque standard de Python : rien à installer.

Utilisation (depuis la racine du dépôt) :

    python3 scripts/construire_donnees.py

Les requêtes sont groupées (jusqu'à 50 éléments par requête) pour rester
sous les limites des API Wikimedia : une trentaine de requêtes suffisent
pour 100 espèces. Les réponses sont gardées dans data/cache/ : relancer le
script ne refait pas les requêtes déjà faites. Supprime ce dossier pour
tout rafraîchir.
"""

import csv
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
FICHIER_ESPECES = RACINE / "data" / "especes.csv"
FICHIER_SORTIE = RACINE / "data" / "species.json"
DOSSIER_CACHE = RACINE / "data" / "cache"

# Wikimedia demande un User-Agent qui identifie le projet.
USER_AGENT = "piafle-data-script/0.1 (https://github.com/etienne-snrd/piafle)"

# Pause entre deux requêtes, pour respecter les limites des API Wikimedia.
PAUSE_SECONDES = 1.0
NOMBRE_ESSAIS = 8

# Identifiants Wikidata des rangs taxonomiques qui nous intéressent.
RANG_FAMILLE = "Q35409"
RANG_ORDRE = "Q36602"

# Unités Wikidata (longueurs).
UNITES_EN_CM = {
    "http://www.wikidata.org/entity/Q174728": 1,  # centimètre
    "http://www.wikidata.org/entity/Q11573": 100,  # mètre
    "http://www.wikidata.org/entity/Q174789": 0.1,  # millimètre
}

# Nombre de médias gardés par espèce, et largeur des photos (en pixels).
PHOTOS_PAR_ESPECE = 3
SONS_PAR_ESPECE = 2
LARGEUR_PHOTO = 1024


# --------------------------------------------------------------------------
# Accès réseau, avec cache sur disque
# --------------------------------------------------------------------------

def api_mediawiki(site, **parametres):
    """Interroge l'API d'un site Wikimedia (www.wikidata.org, commons…).

    La réponse est gardée en cache. En cas de « trop de requêtes » (429),
    on attend le délai demandé par le serveur, puis on réessaie.
    """
    parametres.update({"format": "json", "formatversion": "2"})
    url = f"https://{site}/w/api.php?" + urllib.parse.urlencode(sorted(parametres.items()))

    DOSSIER_CACHE.mkdir(parents=True, exist_ok=True)
    fichier_cache = DOSSIER_CACHE / (hashlib.sha1(url.encode("utf-8")).hexdigest() + ".json")
    if fichier_cache.exists():
        return json.loads(fichier_cache.read_text(encoding="utf-8"))

    requete = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for tentative in range(1, NOMBRE_ESSAIS + 1):
        time.sleep(PAUSE_SECONDES)
        try:
            with urllib.request.urlopen(requete, timeout=60) as reponse:
                donnees = json.load(reponse)
            break
        except urllib.error.HTTPError as erreur:
            if erreur.code not in (429, 503) or tentative == NOMBRE_ESSAIS:
                raise
            attente = int(erreur.headers.get("Retry-After") or 10 * tentative) + 1
            print(f"    (API saturée, nouvel essai dans {attente} s)")
            time.sleep(attente)

    if "error" in donnees:
        raise RuntimeError(f"erreur de l'API {site} : {donnees['error']}")
    fichier_cache.write_text(json.dumps(donnees), encoding="utf-8")
    return donnees


def par_paquets(elements, taille):
    """Découpe une liste en paquets de `taille` éléments au plus."""
    for debut in range(0, len(elements), taille):
        yield elements[debut:debut + taille]


# --------------------------------------------------------------------------
# Wikidata
# --------------------------------------------------------------------------

def entites_par_id(identifiants):
    """Télécharge des éléments Wikidata par identifiant (Q…), 50 à la fois."""
    resultat = {}
    for paquet in par_paquets(sorted(set(identifiants)), 50):
        reponse = api_mediawiki(
            "www.wikidata.org",
            action="wbgetentities",
            ids="|".join(paquet),
            props="claims|labels|sitelinks",
            languages="fr|la|en",
            sitefilter="frwiki",
        )
        resultat.update(reponse["entities"])
    return resultat


def entites_par_titre_wikipedia(titres):
    """Trouve les éléments Wikidata liés à des articles de Wikipédia FR."""
    resultat = {}
    for paquet in par_paquets(sorted(set(titres)), 50):
        reponse = api_mediawiki(
            "www.wikidata.org",
            action="wbgetentities",
            sites="frwiki",
            titles="|".join(paquet),
            props="claims|labels|sitelinks",
            languages="fr|la|en",
            sitefilter="frwiki",
        )
        for element in reponse["entities"].values():
            if "missing" not in element:
                resultat[element["id"]] = element
    return resultat


def qid_par_nom_scientifique(nom_scientifique):
    """Dernier recours : cherche une espèce par son nom scientifique (P225)."""
    reponse = api_mediawiki(
        "www.wikidata.org",
        action="query",
        list="search",
        srsearch=f'haswbstatement:"P225={nom_scientifique}"',
    )
    resultats = reponse["query"]["search"]
    return resultats[0]["title"] if resultats else None


def valeurs(element, propriete):
    """Liste les valeurs d'une propriété Wikidata (ex. P18 = image)."""
    resultat = []
    for affirmation in element.get("claims", {}).get(propriete, []):
        if affirmation.get("rank") == "deprecated":
            continue
        valeur = affirmation["mainsnak"].get("datavalue", {}).get("value")
        if valeur is not None:
            resultat.append(valeur)
    return resultat


def premiere_valeur(element, propriete):
    liste = valeurs(element, propriete)
    return liste[0] if liste else None


def mesure_en_cm(element, propriete):
    """Lit une longueur Wikidata (envergure, longueur) et la convertit en cm."""
    for valeur in valeurs(element, propriete):
        facteur = UNITES_EN_CM.get(valeur.get("unit"))
        if facteur:
            return round(float(valeur["amount"]) * facteur, 1)
    return None


def libelle(element):
    """Nom français d'un élément Wikidata (ou, à défaut, latin ou anglais)."""
    libelles = element.get("labels", {})
    for langue in ("fr", "la", "en"):
        if langue in libelles:
            return libelles[langue]["value"]
    return None


def parent(element):
    """Identifiant du taxon parent (P171), ou None."""
    valeur = premiere_valeur(element, "P171")
    return valeur["id"] if valeur else None


def charger_classification(especes):
    """Télécharge les taxons parents, niveau par niveau, jusqu'aux ordres.

    Renvoie un dictionnaire {identifiant: élément} contenant tous les
    ancêtres utiles (genres, familles, ordres…).
    """
    connus = {}
    a_charger = {parent(e) for e in especes.values()} - {None}
    for _ in range(8):  # espèce → genre → (sous-famille) → famille → … → ordre
        a_charger -= set(connus)
        if not a_charger:
            break
        nouveaux = entites_par_id(a_charger)
        connus.update(nouveaux)
        a_charger = set()
        for element in nouveaux.values():
            rangs = [v["id"] for v in valeurs(element, "P105")]
            if RANG_ORDRE not in rangs and parent(element):
                a_charger.add(parent(element))
    return connus


def famille_et_ordre(element, taxons):
    """Remonte la classification d'une espèce jusqu'à sa famille et son ordre."""
    famille = ordre = None
    courant = element
    for _ in range(8):
        courant = taxons.get(parent(courant))
        if courant is None:
            break
        rangs = [v["id"] for v in valeurs(courant, "P105")]
        nom = {"fr": libelle(courant), "scientifique": premiere_valeur(courant, "P225")}
        if RANG_FAMILLE in rangs and famille is None:
            famille = nom
        if RANG_ORDRE in rangs:
            ordre = nom
            break
    return famille, ordre


# --------------------------------------------------------------------------
# Wikimedia Commons : adresses et crédits des médias
# --------------------------------------------------------------------------

def nettoyer_html(texte):
    """Retire les balises HTML des métadonnées Commons (auteurs, licences)."""
    texte = re.sub(r"<[^>]+>", "", texte or "")
    return " ".join(texte.split())


def medias_commons(noms_fichiers):
    """Adresse, auteur et licence de fichiers Commons, 50 à la fois."""
    resultat = {}
    for paquet in par_paquets(sorted(set(noms_fichiers)), 50):
        reponse = api_mediawiki(
            "commons.wikimedia.org",
            action="query",
            titles="|".join(f"File:{nom}" for nom in paquet),
            prop="imageinfo",
            iiprop="url|extmetadata|mime",
            iiurlwidth=str(LARGEUR_PHOTO),
            iiextmetadatafilter="Artist|LicenseShortName|LicenseUrl",
        )
        # Commons peut réécrire les titres (espaces, majuscules) : on garde la correspondance.
        renommages = {
            n["to"]: n["from"] for n in reponse["query"].get("normalized", [])
        }
        for page in reponse["query"]["pages"]:
            if "imageinfo" not in page:
                continue
            info = page["imageinfo"][0]
            meta = info.get("extmetadata", {})
            titre = renommages.get(page["title"], page["title"])
            nom = titre.split(":", 1)[1]
            est_image = (info.get("mime") or "").startswith("image/")
            resultat[nom] = {
                "fichier": nom,
                "url": url_propre(info.get("thumburl") if est_image and info.get("thumburl") else info["url"]),
                "page": info.get("descriptionurl"),
                "type": info.get("mime"),
                "auteur": nettoyer_html(meta.get("Artist", {}).get("value")),
                "licence": nettoyer_html(meta.get("LicenseShortName", {}).get("value")),
                "licence_url": meta.get("LicenseUrl", {}).get("value"),
            }
    return resultat


def sons_par_recherche(nom_scientifique):
    """Cherche sur Commons des enregistrements dont le titre cite l'espèce.

    Sert quand Wikidata ne liste aucun son (P51) pour l'espèce.
    """
    reponse = api_mediawiki(
        "commons.wikimedia.org",
        action="query",
        list="search",
        srnamespace="6",
        srlimit=str(SONS_PAR_ESPECE),
        srsearch=f'intitle:"{nom_scientifique}" filetype:audio',
    )
    return [r["title"].split(":", 1)[1] for r in reponse["query"]["search"]]


def url_propre(url):
    """Adresse stable d'un média : domaine upload.wikimedia.org, sans paramètres de suivi."""
    url = url.split("?", 1)[0]
    return url.replace("https://thumb.wikimedia.org/", "https://upload.wikimedia.org/")


def cle_commons(nom):
    """Forme normalisée d'un nom de fichier Commons (espaces, 1re majuscule)."""
    nom = nom.replace("_", " ").strip()
    return nom[:1].upper() + nom[1:]


# --------------------------------------------------------------------------
# Wikipédia : résumé des articles
# --------------------------------------------------------------------------

def resumes_wikipedia(titres):
    """Introduction des articles de Wikipédia FR, 20 à la fois."""
    resultat = {}
    for paquet in par_paquets(sorted(set(titres)), 20):
        reponse = api_mediawiki(
            "fr.wikipedia.org",
            action="query",
            prop="extracts",
            exintro="1",
            explaintext="1",
            exlimit="20",
            redirects="1",
            titles="|".join(paquet),
        )
        # Un titre peut être une redirection : on retient le titre demandé.
        renvois = {}
        for cle in ("normalized", "redirects"):
            for r in reponse["query"].get(cle, []):
                renvois[r["from"]] = r["to"]
        pages = {
            page["title"]: {"titre": page["title"], "resume": (page.get("extract") or "").strip()}
            for page in reponse["query"]["pages"]
        }
        for titre in paquet:
            cible = titre
            while cible in renvois:  # normalisation, puis redirection
                cible = renvois[cible]
            if cible in pages:
                resultat[titre] = pages[cible]
    return resultat


def url_wikipedia(titre):
    return "https://fr.wikipedia.org/wiki/" + urllib.parse.quote(titre.replace(" ", "_"))


# --------------------------------------------------------------------------
# Assemblage
# --------------------------------------------------------------------------

def trouver_especes(lignes):
    """Associe chaque ligne du CSV à son élément Wikidata.

    On cherche d'abord par le nom français (titre de l'article Wikipédia),
    en groupant les requêtes, puis on vérifie que le nom scientifique
    correspond. Sinon, on cherche par le nom scientifique.
    """
    trouves = entites_par_titre_wikipedia([l["nom_fr"] for l in lignes])
    par_nom_scientifique = {premiere_valeur(e, "P225"): e for e in trouves.values()}

    especes, manquants = {}, []
    for ligne in lignes:
        element = par_nom_scientifique.get(ligne["nom_scientifique"])
        if element:
            especes[ligne["nom_scientifique"]] = element
        else:
            manquants.append(ligne)

    if manquants:
        print(f"Recherche par nom scientifique pour {len(manquants)} espèce(s)…")
        qids = {}
        for ligne in manquants:
            qid = qid_par_nom_scientifique(ligne["nom_scientifique"])
            if qid:
                qids[ligne["nom_scientifique"]] = qid
        elements = entites_par_id(qids.values())
        for nom_scientifique, qid in qids.items():
            especes[nom_scientifique] = elements[qid]
    return especes


def main():
    with FICHIER_ESPECES.open(encoding="utf-8") as fichier:
        lignes = list(csv.DictReader(fichier))
    print(f"{len(lignes)} espèces dans {FICHIER_ESPECES.relative_to(RACINE)}")

    print("1/4 Wikidata : espèces…")
    especes = trouver_especes(lignes)

    print("2/4 Wikidata : familles et ordres…")
    taxons = charger_classification(especes)

    print("3/4 Commons : photos et sons…")
    fichiers_sons = {}
    for nom_scientifique, element in especes.items():
        fichiers_sons[nom_scientifique] = (
            valeurs(element, "P51")[:SONS_PAR_ESPECE] or sons_par_recherche(nom_scientifique)
        )
    fichiers = []
    for nom_scientifique, element in especes.items():
        fichiers += valeurs(element, "P18")[:PHOTOS_PAR_ESPECE]
        fichiers += fichiers_sons[nom_scientifique]
    medias = {cle_commons(nom): info for nom, info in medias_commons(fichiers).items()}

    print("4/4 Wikipédia : résumés…")
    # Sans lien vers Wikipédia FR sur Wikidata, on essaie le nom français.
    noms_fr = {l["nom_scientifique"]: l["nom_fr"] for l in lignes}
    titres = {
        nom: e.get("sitelinks", {}).get("frwiki", {}).get("title") or noms_fr[nom]
        for nom, e in especes.items()
    }
    resumes = resumes_wikipedia(list(titres.values()))

    sortie, introuvables = [], []
    for ligne in lignes:
        element = especes.get(ligne["nom_scientifique"])
        if element is None:
            introuvables.append(ligne["nom_fr"])
            continue
        famille, ordre = famille_et_ordre(element, taxons)
        article = resumes.get(titres[ligne["nom_scientifique"]], {"titre": None, "resume": ""})
        photos = [medias.get(cle_commons(f)) for f in valeurs(element, "P18")[:PHOTOS_PAR_ESPECE]]
        sons = [medias.get(cle_commons(f)) for f in fichiers_sons[ligne["nom_scientifique"]]]
        sortie.append({
            "id": element["id"],
            "nom_fr": ligne["nom_fr"],
            "nom_scientifique": ligne["nom_scientifique"],
            "milieu": ligne["milieu"],
            "famille": famille,
            "ordre": ordre,
            "longueur_cm": mesure_en_cm(element, "P2043"),
            "envergure_cm": mesure_en_cm(element, "P2050"),
            "photos": [p for p in photos if p],
            "sons": [s for s in sons if s],
            "wikipedia": {
                "titre": article["titre"],
                "url": url_wikipedia(article["titre"]) if article["resume"] else None,
                "resume": article["resume"],
            },
        })

    FICHIER_SORTIE.write_text(
        json.dumps(sortie, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    # Bilan : ce qui manque et devra être complété à la main.
    print(f"\n{len(sortie)} espèces écrites dans {FICHIER_SORTIE.relative_to(RACINE)}")
    for titre, test in [
        ("sans photo", lambda e: not e["photos"]),
        ("sans son", lambda e: not e["sons"]),
        ("sans famille", lambda e: not e["famille"]),
        ("sans taille (longueur ni envergure)", lambda e: not (e["longueur_cm"] or e["envergure_cm"])),
        ("sans résumé Wikipédia", lambda e: not e["wikipedia"]["resume"]),
    ]:
        manquants = [e["nom_fr"] for e in sortie if test(e)]
        if manquants:
            print(f"- {len(manquants)} {titre} : {', '.join(manquants)}")
    if introuvables:
        print(f"- {len(introuvables)} introuvable(s) sur Wikidata : {', '.join(introuvables)}")
    return 1 if introuvables else 0


if __name__ == "__main__":
    sys.exit(main())
