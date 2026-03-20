# Sauvegarde de la BDD

## Fonctionnement automatique

Le script `backend/db-save/dump_db.sh` tourne via cron, 3 fois par jour.

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
/home/admin/backend/db-save/dump_db.sh
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
/home/admin/backend/db-save/admin-test-save.sh
```

Pour tester un fichier spécifique :

```bash
/home/admin/backend/db-save/admin-test-save.sh /home/admin/backups/openlatex_20260201_030000.dump.gpg
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
