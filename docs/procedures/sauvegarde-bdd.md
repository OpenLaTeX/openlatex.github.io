# Sauvegarde de la BDD

## Fonctionnement automatique

Le script `backend/cron/db-save/dump_db.sh` tourne via cron (un planificateur automatique de tâches), 3 fois par jour.

Ce qu'il fait à chaque exécution :
1. Dump PostgreSQL du container `openlatex_postgres` au format custom (`-Fc`)
2. Chiffrement GPG avec la clé publique `baptiste.lavogiez@proton.me`
3. Upload vers Backblaze B2, bucket `openlatex-backups`, sous `backups/YYYY/MM/`
4. Nettoyage local : suppression des fichiers de plus de 7 jours

Rétention :
- Locale : 7 jours (`/home/admin/backups/`)
- Distante (B2) : 365 jours

Les fichiers ont la forme `openlatex_YYYYMMDD_HHMMSS.dump.gpg`.

## Lancer une sauvegarde manuellement

```bash
/home/admin/openlatex/backend/cron/db-save/dump_db.sh
```

Le script s'exécute de façon identique à la version cron. Les logs s'écrivent dans `/home/admin/backups/backup.log`.

## Vérifier l'état des sauvegardes

### Consulter les logs

```bash
tail -50 /home/admin/backups/backup.log
```

Une sauvegarde réussie se termine par une ligne `=== Sauvegarde terminée ===`.

### Lister les fichiers locaux

```bash
ls -lh /home/admin/backups/openlatex_*.dump.gpg
```

### Lister les fichiers sur B2

```bash
b2 ls openlatex-backups backups/
```

Pour un mois donné :

```bash
b2 ls openlatex-backups backups/2026/02/
```

### Tester l'intégrité d'une sauvegarde

Le script `admin-test-save.sh` déchiffre le dernier backup, le restaure dans une base de test, vérifie la structure, puis nettoie.

```bash
/home/admin/openlatex/backend/cron/db-save/admin-test-save.sh
```

Pour tester un fichier spécifique :

```bash
/home/admin/openlatex/backend/cron/db-save/admin-test-save.sh /home/admin/backups/openlatex_20260201_030000.dump.gpg
```

## En cas d'échec

Si une étape échoue (dump, chiffrement ou upload), le script envoie un email à l'admin défini via l'API Resend. L'email contient l'étape échouée, le message d'erreur, un diagnostic système et les 50 dernières lignes de log.

Si `RESEND_API_KEY` n'est pas défini dans le `.env`, l'alerte est silencieuse — seul le log est écrit.

Pour diagnostiquer manuellement :

```bash
# Vérifier l'état du container
docker inspect -f '{{.State.Status}}' openlatex_postgres

# Vérifier que PostgreSQL répond
docker exec openlatex_postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB

# Vérifier l'espace disque
df -h /home/admin/backups
```

## Envoyer un mail à chaque fois : un autre paradigme

En réalité, ne déclencher un envoi de mail qu'en cas d'échec peut être un problème. En effet, si il y a un bug avec l'envoi du mail, ça échoue silencieusement et on ne saura pas s'il y a une erreur.

Une solution serait alors de TOUJOURS prévenir du succès d'une sauvegarde, donc envoyer un mail à chaque réussite. De ce fait si l'on ne reçoit pas de mail, alors on sait qu'il y a eu un problème quelque part (problème machine, de mail, de cron job...).

Pour cela il y a une deuxième version du script qui envoie un mail à chaque succès d'une sauvegarde. 

## Pour aller plus loin

On peut imaginer d'autres modes de notification d'échec (application mobile, affichage sur un écran à part, status affiché en grand sur le site...). L'objectif très clair, c'est qu'aucun échec silencieux ne soit possible, alors on partirait du principe qu'on doit toujours être prévenu d'un succès, plutôt que d'être toujours prévenu d'un échec.
