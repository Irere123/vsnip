FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json .

COPY . .

RUN npm run build

ENV NODE_ENV production
CMD [ "node", "dist/index.js" ]
USER node
