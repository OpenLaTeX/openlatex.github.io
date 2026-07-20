# image docker du worker de compilation LaTeX
# La couche texlive-full (~4 GB) est dans l'image de base - rebuild via build-compiler-base.yml
FROM ghcr.io/openlatex/openlatex-texlive-base:latest

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY compiler/queue-worker/worker.js ./
COPY compiler/queue-worker/lib/ ./lib/

RUN mkdir -p /tmp && chmod 1777 /tmp

USER node

CMD ["node", "worker.js"]
