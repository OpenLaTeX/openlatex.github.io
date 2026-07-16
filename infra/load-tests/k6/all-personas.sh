#!/bin/bash
# Trafic simulé sur /compile
# adapté du cron job : ici on test toutes les personas dans la CI

cd "$(dirname "$0")"

BASE_URL="https://openlatex.blavogiez.fr"

# quelques personas aux comportements de compilation différents
run_persona() {
  local persona=$1 base=$2
  local min=$(( base * 2 / 3 ))
  local max=$(( base * 4 / 3 ))
  local burst=$(( min + RANDOM % (max - min + 1) ))
  echo "[$(date -Iseconds)] persona=$persona burst_rate=$burst"
  k6 run -e TEST_KEY="$TEST_BYPASS_SECRET" -e BASE_URL="$BASE_URL" -e BURST_RATE="$burst" stress-compile.js
}

PERSONA=$1

case "$PERSONA" in
  Alice)    run_persona Alice 15 ;;
  Bob)      run_persona Bob 60 ;;
  Charlie)  run_persona Charlie 200 ;;
  Grouped)  run_persona Grouped 275 ;;
esac
