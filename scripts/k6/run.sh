#!/bin/bash

set -a; source .env; set +a
k6 run -e TEST_KEY="$TEST_KEY" ./stress-compile.js
