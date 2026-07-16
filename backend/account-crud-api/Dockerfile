# image docker du backend Node.js (auth + projets). Leger, sans texlive.
# Auparavant le backend Node.js comprenait le compilateur et la gestion des comptes, sauf que la distribution texlive-full (4GB nécessaires) ralentissait les reconstructions d'image, alors que le côté compilation changeait plus rarement que la gestion des comptes.
# plus optimisé donc
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

#COPY shared/ ./shared/
COPY account-crud-api/ ./

USER node

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
