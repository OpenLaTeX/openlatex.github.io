# Restauration d'une BDD

Note : 05/02/26 - Toujours en cours d'écriture

Il y a deux cas lors de la restauration d'une BDD ;

## Cas 1 : Tout est perdu

Le serveur d'origine n'a plus rien ; c'est le pire cas.

Connectez-vous au cloud storage distant contenant les sauvegardes.

Déchiffrez-là sur la machine contenant la clé privée de chiffrement :

## Cas 2 : Il s'agit d'une transition

Lorsqu'il a été effectué la transition de DigitalOcean vers AWS, la BDD originale était toujours à disposition et était intacte.

### Transférer les données

Pour du test il est acceptable de faire un pg_dump rapide en fichier.sql clair, puis de le transférer avec :

```bash
scp /chemin/backup.sql admin@IP_AWS:/home/admin/
```

En production, on ne va pas vraiment faire ça puisqu'il y a un risque de montrer la BDD en clair dans le processus.


## Les données sont récupérées : les appliquer

### Cas 1 : fichier de sauvegarde SQL

```bash
docker exec -i postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < /home/admin/{fichier de sauvegarde si sql}
```

### Cas 2 : fichier de sauvegarde dump
```bash
docker exec -i postgres psql -U $POSTGRES_USER -d $POSTGRES_DB < /home/admin/{fichier de sauvegarde si dump}
```