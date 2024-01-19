FROM node:latest

RUN npm install -g serve
WORKDIR /app

COPY src /app/src
COPY public /app/public
COPY package.json /app/
COPY package-lock.json /app/
COPY tsconfig.json /app/

RUN npm install
RUN npm run build

CMD serve -s build