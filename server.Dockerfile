FROM node:18-alpine

ARG USERNAME
ARG PASSWORD

WORKDIR /server

COPY ./makerspace_node/package.json  ./
RUN npm install --force

COPY ./makerspace_node .

# RUN echo -e "\nURI=\"mongodb://${USERNAME}:${PASSWORD}@mongodb:27017/makerspace?authSource=admin\"" >> ./.env

RUN mkdir -p ./uploads

EXPOSE 3000

CMD ["npm", "run", "server"]