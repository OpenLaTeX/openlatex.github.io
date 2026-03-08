# image docker du service de compilation LaTeX
# La couche texlive-full (~4 GB) est dans l'image de base — rebuild via build-compiler-base.yml
FROM ghcr.io/openlatex/openlatex-texlive-base:latest

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY compiler/ ./

RUN mkdir -p /tmp && chmod 1777 /tmp

USER node

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
