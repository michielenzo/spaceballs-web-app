# Stage 1: Build the React application
FROM node:latest as build-stage

WORKDIR /app

COPY package.json /app/
COPY package-lock.json /app/
COPY tsconfig.json /app/
COPY src /app/src
COPY public /app/public
COPY .env.production /app/
COPY .env.development /app/

RUN npm install
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the built app from the previous stage
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Expose HTTP for internal reverse-proxy traffic
EXPOSE 80
