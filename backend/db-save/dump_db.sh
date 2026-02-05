#!/bin/bash
# Script de sauvegarde automatique PostgreSQL pour OpenLatex (Docker)
# adapté de la SAÉ matrix-scripts (https://github.com/blavogiez/matrix-scripts)
SCRIPT_VERSION="1.1.0"



# Charger les variables depuis .env
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
source "$SCRIPT_DIR/../.env"

# config
BACKUP_DIR="/home/admin/backups"
RETENTION_DAYS=7
CONTAINER_NAME="openlatex_postgres"
ALERT_EMAIL="baptiste.lavogiez@proton.me"

# config chiffrement + stockage distant
GPG_RECIPIENT="baptiste.lavogiez@proton.me"
B2_BUCKET_NAME="openlatex-backups"
REMOTE_RETENTION_DAYS=365  # 365 pour test

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/openlatex_${DATE}.dump"
LOG_FILE="${BACKUP_DIR}/backup.log"

# config pour lancement sous cron
export PATH="/home/admin/.local/bin:$PATH" #chemin pour trouver b2
export HOME=/home/admin
export GNUPGHOME=/home/admin/.gnupg

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# retourne le temps écoulé depuis $1 (en secondes)
elapsed() {
    echo $(($(date +%s) - $1))
}

# timestamp de début pour durée totale
START_TIME=$(date +%s)

# étape courante (pour le mail d'erreur)
CURRENT_STEP="initialisation"

# diagnostic complet du système
diagnostic() {
    echo "=== Environnement ==="
    echo "Script : v$SCRIPT_VERSION"
    echo "Hostname : $(hostname)"
    echo "User : $(whoami)"
    echo "Date : $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Timezone : ${TZ:-$(cat /etc/timezone 2>/dev/null || echo 'non défini')}"
    echo "CRON_TIMEZONE : ${CRON_TIMEZONE:-non défini}"
    echo ""
    echo "=== Services ==="
    echo "Docker : $(systemctl is-active docker 2>/dev/null || echo 'N/A')"
    echo "Container $CONTAINER_NAME : $(docker inspect -f '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo 'non trouvé')"
    UPTIME=$(docker inspect -f '{{.State.StartedAt}}' "$CONTAINER_NAME" 2>/dev/null)
    [ -n "$UPTIME" ] && echo "Container uptime depuis : $UPTIME"
    echo "PostgreSQL : $(docker exec "$CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" 2>&1 || echo 'down')"
    echo ""
    echo "=== Stockage ==="
    echo "Disque local :"
    df -h "$BACKUP_DIR" | tail -1 | awk '{print "  Utilisé : "$3" / "$2" ("$5")  -  Disponible : "$4}'
    echo "Sauvegardes locales : $(find "$BACKUP_DIR" -name "openlatex_*.dump.gpg" 2>/dev/null | wc -l)"
    echo ""
    echo "=== Versions ==="
    echo "GPG : $(gpg --version 2>/dev/null | head -1 || echo 'non installé')"
    echo "B2 CLI : $(b2 version 2>/dev/null || echo 'non installé')"
    echo "Docker : $(docker --version 2>/dev/null || echo 'non installé')"
}

# envoi mail en cas d'erreur
send_alert() {
    local error_msg="$1"
    [ -z "$RESEND_API_KEY" ] && { log "WARN : RESEND_API_KEY non défini, alerte non envoyée"; return; }

    DIAG=$(diagnostic | awk '{printf "%s\\n", $0}')
    LOGS=$(tail -50 "$LOG_FILE" | awk '{printf "%s\\n", $0}')
    ELAPSED=$(elapsed $START_TIME)

    MSG="[OpenLaTeX] Échec backup DB\\n"
    MSG+="\\n"
    MSG+="=== Résumé ===\\n"
    MSG+="Étape échouée : ${CURRENT_STEP}\\n"
    MSG+="Erreur : ${error_msg}\\n"
    MSG+="Durée avant échec : ${ELAPSED}s\\n"
    MSG+="Fichier backup : ${BACKUP_FILE:-N/A}\\n"
    MSG+="\\n"
    MSG+="=== Procédure de sauvegarde ===\\n"
    MSG+="1. [$([ "$CURRENT_STEP" = "dump" ] && echo "ÉCHEC" || echo "OK")] Dump PostgreSQL via Docker\\n"
    MSG+="2. [$([ "$CURRENT_STEP" = "chiffrement" ] && echo "ÉCHEC" || echo "---")] Chiffrement GPG\\n"
    MSG+="3. [$([ "$CURRENT_STEP" = "upload" ] && echo "ÉCHEC" || echo "---")] Upload vers Backblaze B2\\n"
    MSG+="4. [---] Nettoyage local\\n"
    MSG+="\\n"
    MSG+="${DIAG}\\n"
    MSG+="\\n"
    MSG+="=== Derniers logs (50 lignes) ===\\n"
    MSG+="${LOGS}\\n"
    MSG+="\\n"
    MSG+="=== Actions suggérées ===\\n"
    MSG+="- Vérifier les logs complets : ${LOG_FILE}\\n"
    MSG+="- Vérifier l'état du container : docker logs ${CONTAINER_NAME}\\n"
    MSG+="- Relancer manuellement : ${SCRIPT_DIR}/dump_db.sh\\n"

    SUBJECT="[OpenLaTeX] Échec backup DB - étape : ${CURRENT_STEP}"

    curl -s -X POST 'https://api.resend.com/emails' \
      -H "Authorization: Bearer $RESEND_API_KEY" \
      -H 'Content-Type: application/json' \
      -d '{"from":"OpenLaTeX <onboarding@resend.dev>","to":"'"$ALERT_EMAIL"'","subject":"'"$SUBJECT"'","text":"'"$MSG"'"}' \
      > /dev/null && log "Alerte email envoyée à $ALERT_EMAIL"
}

log "=== Début sauvegarde ==="
log "Script v$SCRIPT_VERSION | Host : $(hostname) | User : $(whoami)"
log "Timezone : ${TZ:-$(cat /etc/timezone 2>/dev/null || 'N/A')} | CRON_TIMEZONE : ${CRON_TIMEZONE:-N/A}"
log "Base : $POSTGRES_DB -> $BACKUP_FILE"

# vérifications préalables
log "--- Vérifications préalables ---"
DOCKER_STATUS=$(docker inspect -f '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "non trouvé")
log "Container $CONTAINER_NAME : $DOCKER_STATUS"
if [ "$DOCKER_STATUS" != "running" ]; then
    log "ERR : Container non démarré"
    CURRENT_STEP="vérification container"
    send_alert "Container $CONTAINER_NAME non démarré (statut : $DOCKER_STATUS)"
    exit 1
fi

PG_READY=$(docker exec "$CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" 2>&1)
log "PostgreSQL : $PG_READY"

DISK_AVAIL=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')
log "Espace disque disponible : $DISK_AVAIL"

# dump postgresql
CURRENT_STEP="dump"
log "--- Dump PostgreSQL ---"
DUMP_START=$(date +%s)
DUMP_ERR=$(docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc 2>&1 > "$BACKUP_FILE")
DUMP_EXIT=$?
if [ $DUMP_EXIT -eq 0 ]; then
    DUMP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    DUMP_DURATION=$(elapsed $DUMP_START)
    log "Dump réussi : $DUMP_SIZE en ${DUMP_DURATION}s"
else
    log "ERR : Échec du dump PostgreSQL"
    log "ERR : Code retour : $DUMP_EXIT"
    log "ERR : Sortie stderr : $DUMP_ERR"
    send_alert "Échec du dump PostgreSQL (code: $DUMP_EXIT, erreur: $DUMP_ERR)"
    exit 1
fi

# chiffrement gpg par clé publique du .env reconstruit par secrets
CURRENT_STEP="chiffrement"
log "--- Chiffrement GPG ---"
log "GPG version : $(gpg --version 2>/dev/null | head -1)"
log "Destinataire : $GPG_RECIPIENT"
GPG_START=$(date +%s)
GPG_OUT=$(gpg --encrypt --recipient "$GPG_RECIPIENT" --trust-model always --batch --yes "$BACKUP_FILE" 2>&1)
GPG_EXIT=$?
if [ $GPG_EXIT -eq 0 ]; then
    ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
    GPG_SIZE=$(du -h "$ENCRYPTED_FILE" | cut -f1)
    GPG_DURATION=$(elapsed $GPG_START)
    log "Chiffrement réussi : $GPG_SIZE en ${GPG_DURATION}s"
    rm -f "$BACKUP_FILE"
    log "Fichier non chiffré supprimé"
else
    log "ERR : Échec du chiffrement GPG"
    log "ERR : Code retour : $GPG_EXIT"
    log "ERR : Sortie : $GPG_OUT"
    send_alert "Échec chiffrement GPG (code: $GPG_EXIT, erreur: $GPG_OUT)"
    exit 1
fi

# upload vers backblaze b2
CURRENT_STEP="upload"
log "--- Upload Backblaze B2 ---"
log "B2 CLI : $(b2 version 2>/dev/null || echo 'version inconnue')"
log "Bucket : $B2_BUCKET_NAME"
REMOTE_PATH="backups/$(date +%Y/%m)/$(basename "$ENCRYPTED_FILE")"
log "Destination : $REMOTE_PATH"
B2_START=$(date +%s)
B2_OUT=$(b2 upload-file "$B2_BUCKET_NAME" "$ENCRYPTED_FILE" "$REMOTE_PATH" 2>&1)
B2_EXIT=$?
if [ $B2_EXIT -eq 0 ]; then
    B2_DURATION=$(elapsed $B2_START)
    log "Upload B2 réussi en ${B2_DURATION}s : $REMOTE_PATH"
else
    log "ERR : Échec upload B2"
    log "ERR : Code retour : $B2_EXIT"
    log "ERR : Sortie : $B2_OUT"
    send_alert "Échec upload vers Backblaze B2 (code: $B2_EXIT, bucket: $B2_BUCKET_NAME, erreur: $B2_OUT)"
    exit 1
fi

# nettoyage des anciennes sauvegardes
CURRENT_STEP="nettoyage"
log "--- Nettoyage local ---"
log "Rétention : $RETENTION_DAYS jours"
OLD_FILES=$(find "$BACKUP_DIR" -name "openlatex_*.dump.gpg" -mtime +$RETENTION_DAYS 2>/dev/null)
OLD_COUNT=$(echo "$OLD_FILES" | grep -c . || echo 0)
if [ "$OLD_COUNT" -gt 0 ]; then
    log "Suppression de $OLD_COUNT fichier(s) ancien(s)"
    find "$BACKUP_DIR" -name "openlatex_*.dump.gpg" -mtime +$RETENTION_DAYS -delete
else
    log "Aucun fichier à supprimer"
fi

REMAINING=$(find "$BACKUP_DIR" -name "openlatex_*.dump.gpg" | wc -l)
DISK_AFTER=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')
log "Sauvegardes locales conservées : $REMAINING"
log "Espace disque après opération : $DISK_AFTER"

# résumé final
TOTAL_DURATION=$(elapsed $START_TIME)
log "=== Sauvegarde terminée ==="
log "Durée totale : ${TOTAL_DURATION}s | Fichier : $(basename "$ENCRYPTED_FILE") ($GPG_SIZE)"
