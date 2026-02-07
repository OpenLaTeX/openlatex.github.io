# image docker du service de compilation LaTeX (texlive-full ~4GB)
FROM node:22-slim

RUN apt-get update && apt-get install -y \
    texlive-full \
    && rm -rf /var/lib/apt/lists/*

RUN which pdflatex && pdflatex --version

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY compiler/ ./

RUN mkdir -p /tmp && chmod 1777 /tmp

USER node

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
