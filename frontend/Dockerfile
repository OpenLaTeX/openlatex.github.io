FROM node:alpine as builder

COPY . /tobuild

WORKDIR /tobuild

RUN rm -rf .gitignore

RUN npm ci 

RUN npm run build

FROM nginx:alpine

COPY --from=builder tobuild/dist /usr/share/nginx/html

EXPOSE 80

# pour test ::
# docker build -t openlatex.fr .
# docker run --rm -it -p 9090:80 openlatex.fr
