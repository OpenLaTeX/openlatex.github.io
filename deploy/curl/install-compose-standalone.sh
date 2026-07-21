#!/bin/bash
git clone https://github.com/OpenLaTeX/openlatex.github.io openlatex
git checkout 32-déploiement-compose-only-alternative-à-helm
cd openlatex/deploy/compose

# generation passwords
[ -f .env ] || (POSTGRES_PASSWORD="$(openssl rand -hex 32)" && echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> .env) && (JWT_SECRET="$(openssl rand -hex 32)" && echo "JWT_SECRET=$JWT_SECRET" >> .env) && (TEST_BYPASS_SECRET="$(openssl rand -hex 32)" && echo "TEST_BYPASS_SECRET=$TEST_BYPASS_SECRET" >> .env)
docker compose -f docker-compose.full-standalone.yml up -d
