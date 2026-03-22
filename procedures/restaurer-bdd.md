# Restauration d'une BDD

Il y a deux cas lors de la restauration d'une BDD ;

## Cas 1 : Tout est perdu

Le serveur d'origine n'a plus rien ; c'est le pire cas.

### Télécharger la sauvegarde depuis Backblaze B2

Les sauvegardes distantes sont dans le bucket `openlatex-backups`, sous `backups/YYYY/MM/`.

Lister les fichiers disponibles :

```bash
b2 ls openlatex-backups backups/
```

Télécharger le fichier voulu :

```bash
b2 download-file-by-name openlatex-backups backups/2026/02/openlatex_20260201_030000.dump.gpg /home/admin/openlatex_20260201_030000.dump.gpg
```

### Déchiffrer le fichier

Le déchiffrement nécessite la clé privée GPG correspondante (`baptiste.lavogiez@proton.me`).

```bash
gpg --decrypt --output /home/admin/openlatex_20260201_030000.dump /home/admin/openlatex_20260201_030000.dump.gpg
```

Passer ensuite à la section **Les données sont récupérées : les appliquer**.

## Cas 2 : Il s'agit d'une transition

Lorsqu'il a été effectué la transition de DigitalOcean vers AWS, la BDD originale était toujours à disposition et était intacte.

### Transférer les données

Pour du test il est acceptable de faire un pg_dump rapide en fichier.sql clair (*même si le format dump est plus rapide, ça peut être l'occasion de découvrir comment la sauvegarde se fait puisque c'est en clair*), puis de le transférer avec :

```bash
scp /chemin/backup.sql admin@IP_AWS:/home/admin/
```

En production, on ne va pas vraiment faire ça puisqu'il y a un risque de montrer la BDD en clair dans le processus de communication entre l'ancien et le nouveau serveur.

La bonne méthode est de passer par le script de sauvegarde sur l'ancien serveur, puis de télécharger le fichier chiffré depuis B2 sur le nouveau serveur. Se référer alors au Cas 1 pour le téléchargement et le déchiffrement.

---

## Les données sont récupérées : les appliquer

Le fichier de sauvegarde est au format `dump` custom PostgreSQL (`-Fc`). On utilise `pg_restore`, pas `psql`.

### Fichier de sauvegarde au format dump (production)

```bash
docker exec -i openlatex_postgres pg_restore -U $POSTGRES_USER -d $POSTGRES_DB --no-owner --role=$POSTGRES_USER < /home/admin/openlatex_20260201_030000.dump
```

`pg_restore` peut retourner le code 1 pour des warnings non bloquants ; c'est normal. Le code 2 indique une erreur fatale.

### Fichier de sauvegarde au format SQL (test uniquement)

```bash
docker exec -i openlatex_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < /home/admin/backup.sql
```
