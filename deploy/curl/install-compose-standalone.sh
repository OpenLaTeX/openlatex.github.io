#!/bin/bash
git clone https://github.com/OpenLaTeX/openlatex.github.io openlatex
cd openlatex
git checkout 32-déploiement-compose-only-alternative-à-helm
cd deploy/compose

# generation passwords
chmod +x gen-env.sh
./gen-env.sh

docker compose -f docker-compose.full-standalone.yml up -d
