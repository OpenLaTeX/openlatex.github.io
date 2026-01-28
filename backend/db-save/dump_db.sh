#!/bin/bash
# Script de sauvegarde automatique PostgreSQL pour OpenLatex (Docker)
# adapté de la SAÉ matrix-scripts (https://github.com/blavogiez/matrix-scripts)
#
# Exemple de logs typiques
# [2026-01-28 22:21:01] === Début sauvegarde ===
# [2026-01-28 22:21:01] Base : openlatex_db -> /home/deployer/backups/openlatex_20260128_222101.dump
# [2026-01-28 22:21:03] Sauvegarde réussie (3.8M)
# [2026-01-28 22:21:03] Chiffrement GPG...
# [2026-01-28 22:21:03] Chiffrement réussi (3.8M)
# [2026-01-28 22:21:03] Upload vers B2...
# [2026-01-28 22:21:05] Upload B2 réussi: backups/2026/01/openlatex_20260128_222101.dump.gpg
# [2026-01-28 22:21:05] Nettoyage des sauvegardes locales de plus de 7 jours
# [2026-01-28 22:21:05] Sauvegardes conservées : 9
# [2026-01-28 22:21:05] Sauvegarde terminée
# [2026-01-28 22:22:01] === Début sauvegarde ===
# [2026-01-28 22:22:01] Base : openlatex_db -> /home/deployer/backups/openlatex_20260128_222201.dump
# [2026-01-28 22:22:02] Sauvegarde réussie (3.8M)
# [2026-01-28 22:22:02] Chiffrement GPG...
# [2026-01-28 22:22:02] Chiffrement réussi (3.8M)
# [2026-01-28 22:22:02] Upload vers B2...
# [2026-01-28 22:22:04] Upload B2 réussi: backups/2026/01/openlatex_20260128_222201.dump.gpg
# [2026-01-28 22:22:04] Nettoyage des sauvegardes locales de plus de 7 jours
# [2026-01-28 22:22:04] Sauvegardes conservées : 10
# [2026-01-28 22:22:04] Sauvegarde terminée



# Charger les variables depuis .env
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
source "$SCRIPT_DIR/../.env"

# config
BACKUP_DIR="/home/deployer/backups"
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
export PATH="/home/deployer/.local/bin:$PATH" #chemin pour trouver b2
export HOME=/home/deployer
export GNUPGHOME=/home/deployer/.gnupg

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# diagnostic en cas d'échec
diagnostic() {
    echo "Docker: $(systemctl is-active docker)"
    echo "Container: $(docker ps --format '{{.Names}}' | grep -c "^${CONTAINER_NAME}$") running"
    echo "PostgreSQL: $(docker exec "$CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" 2>&1 || echo 'down')"
    echo "Disque: $(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4 " dispo"}')"
}

# envoi mail en cas d'erreur
send_alert() {
    [ -z "$RESEND_API_KEY" ] && return
    NL=$'\n'
    DIAG=$(diagnostic | awk '{printf "%s\\n", $0}')
    LOGS=$(tail -50 "$LOG_FILE" | awk '{printf "%s\\n", $0}')
    MSG="[OpenLaTeX] Echec backup DB\n\n=== Diagnostic ===\n${DIAG}\n=== Logs ===\n${LOGS}"
    curl -s -X POST 'https://api.resend.com/emails' \
      -H "Authorization: Bearer $RESEND_API_KEY" \
      -H 'Content-Type: application/json' \
      -d '{"from":"OpenLaTeX <onboarding@resend.dev>","to":"'"$ALERT_EMAIL"'","subject":"[OpenLaTeX] Echec backup DB","text":"'"$MSG"'"}' \
      > /dev/null && log "Alerte envoyée"
}

log "=== Début sauvegarde ==="
log "Base : $POSTGRES_DB -> $BACKUP_FILE"

if docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$BACKUP_FILE"; then
    log "Sauvegarde réussie ($(du -h "$BACKUP_FILE" | cut -f1))"
else
    log "ERR : Échec de la sauvegarde"
    send_alert "Echec du backup PostgreSQL"
    exit 1
fi

# chiffrement gpg par clé publique du .env reconstruit par secrets
log "Chiffrement GPG..."
if gpg --encrypt --recipient "$GPG_RECIPIENT" --trust-model always --batch --yes "$BACKUP_FILE"; then
    ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
    log "Chiffrement réussi ($(du -h "$ENCRYPTED_FILE" | cut -f1))"
    rm -f "$BACKUP_FILE"  # supprimer le dump non chiffré
else
    log "ERR : Échec du chiffrement GPG"
    send_alert "Echec chiffrement GPG"
    exit 1
fi

# upload vers backblaze b2
log "Upload vers B2..."
REMOTE_PATH="backups/$(date +%Y/%m)/$(basename "$ENCRYPTED_FILE")"
if b2 upload-file "$B2_BUCKET_NAME" "$ENCRYPTED_FILE" "$REMOTE_PATH" ; then
    log "Upload B2 réussi: $REMOTE_PATH"
else
    log "ERR : Échec upload B2"
    send_alert "Echec upload B2"
    exit 1
fi

# nettoyage des anciennes sauvegardes
log "Nettoyage des sauvegardes locales de plus de $RETENTION_DAYS jours"
find "$BACKUP_DIR" -name "openlatex_*.dump.gpg" -mtime +$RETENTION_DAYS -delete

REMAINING=$(find "$BACKUP_DIR" -name "openlatex_*.dump.gpg" | wc -l)
log "Sauvegardes conservées : $REMAINING"
log "Sauvegarde terminée"
