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

# mail en cas d'echec avec resend (api d'envoi de mail, secret à définir dans GitHub secrets + script backend-deploy pour le .env)
send_alert() {
    [ -z "$RESEND_API_KEY" ] && return
    curl -s -X POST 'https://api.resend.com/emails' \
      -H "Authorization: Bearer $RESEND_API_KEY" \
      -H 'Content-Type: application/json' \
      -d '{"from":"OpenLaTeX <onboarding@resend.dev>","to":"'"$ALERT_EMAIL"'","subject":"[OpenLaTeX] Echec backup DB","text":"'"$1"'"}' \
      > /dev/null && log "Alerte envoyee"
}

log "Debut de la sauvegarde"
log "Base : $POSTGRES_DB -> $BACKUP_FILE"

if docker exec "$CONTAINER_NAME" pg_dump -U "trucmuche" -d "$POSTGRES_DB" -Fc > "$BACKUP_FILE"; then
    log "Sauvegarde reussie ($(du -h "$BACKUP_FILE" | cut -f1))"
else
    log "ERR : Echec de la sauvegarde"
    send_alert "Échec du backup PostgreSQL OpenLaTeX le $(date '+%Y-%m-%d %H:%M:%S')"
    exit 1
fi

# Nettoyage des anciennes sauvegardes
log "Nettoyage des sauvegardes de plus de $RETENTION_DAYS jours"
find "$BACKUP_DIR" -name "openlatex_*.dump" -mtime +$RETENTION_DAYS -delete

REMAINING=$(find "$BACKUP_DIR" -name "openlatex_*.dump" | wc -l)
log "Sauvegardes conservees : $REMAINING"
log "Sauvegarde terminee"
