FROM node:18-slim


RUN apt-get update && apt-get install -y \
    texlive-full \
    && rm -rf /var/lib/apt/lists/*


RUN which pdflatex && pdflatex --version

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p /tmp && chmod 777 /tmp

EXPOSE 8000

#verif en ligne
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000', (r) => {process.exit(r.statusCode === 404 ? 0 : 1)})"

CMD ["npm", "start"]
