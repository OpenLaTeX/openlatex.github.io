FROM node:24-alpine AS builder

COPY . /tobuild

WORKDIR /tobuild

RUN npm ci 
RUN npm run check
RUN npm run build

FROM nginx:alpine

COPY --from=builder /tobuild/dist /usr/share/nginx/html

EXPOSE 80
