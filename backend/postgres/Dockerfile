FROM postgres:15-alpine
# logs transmises par github secrets
COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432
