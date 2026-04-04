FROM node:22-alpine

WORKDIR /app

COPY collab/package*.json ./
RUN npm install --omit=dev

COPY shared/ ./shared/
COPY collab/ ./

USER node

EXPOSE 7000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
