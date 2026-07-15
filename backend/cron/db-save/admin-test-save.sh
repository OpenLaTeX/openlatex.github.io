#!/bin/bash
# Test local d'une sauvegarde PostgreSQL GPG pour OpenLatex
# à executer sur le PC admin car la clé privée est requise
# en conséquence on utilise podman pour simuler un bon conteneur postgres pour tester la sauvegarde
# Usage : ./admin-test-save.sh <backup.dump.gpg>
SCRIPT_VERSION="1.0.0"

set -euo pipefail

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }
elapsed() { echo $(($(date +%s) - $1)); }

# argument obligatoire 
if [ -z "${1:-}" ]; then
    echo "Usage : $0 <backup.dump.gpg>"
    exit 1
fi

[ ! -f "$1" ] && { log "ERR : Fichier introuvable : $1"; exit 1; }
GPG_FILE="$(realpath "$1")"
DECRYPTED_FILE="${GPG_FILE%.gpg}"
CONTAINER_NAME="openlatex_test_$$"
PG_USER="postgres"
PG_DB="openlatex_test"

cleanup() {
    log " Nettoyage "
    [ -f "$DECRYPTED_FILE" ] && rm -f "$DECRYPTED_FILE" && log "Dump déchiffré supprimé"
    if podman inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
        podman rm -f "$CONTAINER_NAME" && log "Container $CONTAINER_NAME supprimé"
    fi
}
trap cleanup EXIT

START_TIME=$(date +%s)
log "=== Test de sauvegarde OpenLatex ==="
log "Script v$SCRIPT_VERSION"
log "Fichier : $GPG_FILE ($(du -h "$GPG_FILE" | cut -f1))"

# déchiffrement GPG 
log " Déchiffrement GPG "
GPG_START=$(date +%s)
gpg --decrypt --output "$DECRYPTED_FILE" --batch "$GPG_FILE"
log "Déchiffrement OK en $(elapsed $GPG_START)s : $(du -h "$DECRYPTED_FILE" | cut -f1)"

# verif structure (sans base) 
log " Vérification structure du dump "
if ! LIST_OUT=$(podman run --rm -v "$DECRYPTED_FILE:/dump.dump:ro" docker.io/library/postgres:17 pg_restore --list /dump.dump 2>&1); then
    log "ERR : Dump invalide ou corrompu"
    log "ERR : $LIST_OUT"
    exit 1
fi
TABLE_COUNT=$(echo "$LIST_OUT" | grep -c "TABLE DATA" || true)
log "Structure OK : $TABLE_COUNT table(s) de données"

# démarrage postgres éphémère 
log " Démarrage container postgres éphémère "
podman run --rm -d --name "$CONTAINER_NAME" \
    -v "$DECRYPTED_FILE:/dump.dump:ro" \
    -e POSTGRES_USER="$PG_USER" \
    -e POSTGRES_PASSWORD="testonly" \
    -e POSTGRES_DB="$PG_DB" \
    docker.io/library/postgres:17
log "Container $CONTAINER_NAME démarré"

# attente que postgres soit prêt
log "Attente de PostgreSQL..."
for i in $(seq 1 30); do
    podman exec "$CONTAINER_NAME" pg_isready -U "$PG_USER" -d "$PG_DB" && break
    [ "$i" -eq 30 ] && { log "ERR : PostgreSQL n'a pas démarré en 30s"; exit 1; }
    sleep 1
done
log "PostgreSQL prêt"

# restauration 
log " Restauration dans $PG_DB "
RESTORE_START=$(date +%s)
# pg_restore code 1 = warnings non bloquants, code 2 = erreur fatale
RESTORE_EXIT=0
RESTORE_OUT=$(podman exec "$CONTAINER_NAME" pg_restore \
    -U "$PG_USER" -d "$PG_DB" --no-owner --no-privileges /dump.dump 2>&1) || RESTORE_EXIT=$?
if [ "$RESTORE_EXIT" -gt 1 ]; then
    log "ERR : Restauration échouée (code: $RESTORE_EXIT)"
    log "ERR : $RESTORE_OUT"
    exit 1
fi
log "Restauration OK en $(elapsed $RESTORE_START)s (code: $RESTORE_EXIT)"
[ -n "$RESTORE_OUT" ] && log "Warnings : $RESTORE_OUT"

# verif données
log " Vérification données "
TABLE_COUNT=$(podman exec "$CONTAINER_NAME" psql -U "$PG_USER" -d "$PG_DB" -At \
    -c "select count(*) from information_schema.tables where table_schema='public';")
log "Tables présentes dans la base restaurée : $TABLE_COUNT"

log "--- Users et leurs projets ---"
podman exec "$CONTAINER_NAME" psql -U "$PG_USER" -d "$PG_DB" \
    -c "select u.email, u.project_count, p.name as projet, pg_size_pretty(p.total_size) as taille
        from users u
        left join projects p on p.uno = u.uno
        order by u.email, p.name;"

log "--- Fichiers par projet ---"
podman exec "$CONTAINER_NAME" psql -U "$PG_USER" -d "$PG_DB" \
    -c "select p.name as projet, count(f.fno) as nb_fichiers, pg_size_pretty(p.total_size) as taille_totale
        from projects p
        left join files f on f.pno = p.pno
        group by p.pno, p.name, p.total_size
        order by p.name;"

log "=== Test terminé avec succès en $(elapsed $START_TIME)s ==="
