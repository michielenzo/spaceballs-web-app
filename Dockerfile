# Stage 1: Build the React application
FROM node:latest as build-stage

WORKDIR /app

COPY package.json /app/
COPY package-lock.json /app/
COPY tsconfig.json /app/
COPY src /app/src
COPY public /app/public

RUN npm install
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Create a directory for the SSL certificates
RUN mkdir -p /etc/nginx/ssl

# Copy the built app from the previous stage
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy your SSL certificate and key into the Docker image
COPY ssl/certificate.pem /etc/nginx/ssl/certificate.pem
COPY ssl/private.key /etc/nginx/ssl/private.key

# Expose port 3000 for the app and port 443 for SSL
EXPOSE 443 80