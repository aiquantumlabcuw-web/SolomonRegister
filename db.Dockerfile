FROM mongo:latest

WORKDIR /

COPY ./database/mongo-init.js /docker-entrypoint-initdb.d/mongo-init.js

EXPOSE 27017