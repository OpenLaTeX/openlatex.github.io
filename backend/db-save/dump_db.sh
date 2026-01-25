#!/bin/bash
# Script de sauvegarde automatique PostgreSQL pour OpenLatex (Docker)
# adapté de la SAÉ matrix-scripts (https://github.com/blavogiez/matrix-scripts) 

# Charger les variables depuis .env
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
source "$SCRIPT_DIR/../.env"

# config
BACKUP_DIR="/var/backups/postgresql"
RETENTION_DAYS=7
CONTAINER_NAME="openlatex_postgres"

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/openlatex_${DATE}.dump"
LOG_FILE="${BACKUP_DIR}/backup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Debut de la sauvegarde"
log "Base : $POSTGRES_DB -> $BACKUP_FILE"

if docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$BACKUP_FILE"; then
    log "Sauvegarde reussie ($(du -h "$BACKUP_FILE" | cut -f1))"
else
    log "ERR : Echec de la sauvegarde"
    exit 1
fi

# Nettoyage des anciennes sauvegardes
log "Nettoyage des sauvegardes de plus de $RETENTION_DAYS jours"
find "$BACKUP_DIR" -name "openlatex_*.dump" -mtime +$RETENTION_DAYS -delete

REMAINING=$(find "$BACKUP_DIR" -name "openlatex_*.dump" | wc -l)
log "Sauvegardes conservees : $REMAINING"
log "Sauvegarde terminee"
