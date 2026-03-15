#!/bin/bash

set -a; source .env; set +a

ssh -fNL 9090:openlatex_prometheus:9090 admin@"$SERVER_HOST"
TUNNEL_PID=$!

cleanup() {
  kill "$TUNNEL_PID" 2>/dev/null
}
trap cleanup EXIT

K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
k6 run --out experimental-prometheus-rw \
  -e TEST_KEY="$TEST_KEY" \
  ./stress-compile.js
