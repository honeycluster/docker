FROM node:alpine as build

WORKDIR /app

COPY ./ ./

RUN npm install
RUN npm run c


FROM node:alpine

WORKDIR /app

COPY package.json ./

COPY --from=build /app/dist ./dist

RUN npm install