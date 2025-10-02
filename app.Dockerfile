FROM node:18-alpine
WORKDIR /app
COPY ./makerspace/package.json .
RUN npm install --force
COPY ./makerspace .
EXPOSE 5050
CMD ["npm", "run", "dev"]