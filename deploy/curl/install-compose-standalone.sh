#!/bin/bash
git clone https://github.com/OpenLaTeX/openlatex.github.io openlatex
cd openlatex
git checkout 56-frontend-rebuild
cd deploy/compose

# generation passwords
chmod +x gen-env.sh
./gen-env.sh

docker compose -f docker-compose.full-standalone.yml up -d
