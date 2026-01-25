#!/bin/bash
# Script de sauvegarde automatique PostgreSQL pour OpenLatex (Docker)
# adapté de la SAÉ matrix-scripts (https://github.com/blavogiez/matrix-scripts)

# Charger les variables depuis .env
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
source "$SCRIPT_DIR/../.env"

# config
BACKUP_DIR="/home/deployer/backups"
RETENTION_DAYS=7
CONTAINER_NAME="openlatex_postgres"
ALERT_EMAIL="baptiste.lavogiez@proton.me"

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/openlatex_${DATE}.dump"
LOG_FILE="${BACKUP_DIR}/backup.log"

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
    LOGS=$(tail -5 "$LOG_FILE" | awk '{printf "%s\\n", $0}')
    MSG="[OpenLaTeX] Echec backup DB\n\n=== Diagnostic ===\n${DIAG}\n=== Logs ===\n${LOGS}"
    curl -s -X POST 'https://api.resend.com/emails' \
      -H "Authorization: Bearer $RESEND_API_KEY" \
      -H 'Content-Type: application/json' \
      -d '{"from":"OpenLaTeX <onboarding@resend.dev>","to":"'"$ALERT_EMAIL"'","subject":"[OpenLaTeX] Echec backup DB","text":"'"$MSG"'"}' \
      > /dev/null && log "Alerte envoyee"
}

log "=== Debut sauvegarde ==="
log "Base : $POSTGRES_DB -> $BACKUP_FILE"

if docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$BACKUP_FILE"; then
    log "Sauvegarde reussie ($(du -h "$BACKUP_FILE" | cut -f1))"
else
    log "ERR : Echec de la sauvegarde"
    send_alert "Echec du backup PostgreSQL"
    exit 1
fi

# Nettoyage des anciennes sauvegardes
log "Nettoyage des sauvegardes de plus de $RETENTION_DAYS jours"
find "$BACKUP_DIR" -name "openlatex_*.dump" -mtime +$RETENTION_DAYS -delete

REMAINING=$(find "$BACKUP_DIR" -name "openlatex_*.dump" | wc -l)
log "Sauvegardes conservees : $REMAINING"
log "Sauvegarde terminee"
