# Stage 1: Build React/Vite app
FROM node:20-slim AS build

WORKDIR /app

# Copy package files for installing dependencies
COPY package.json package-lock.json /app/
RUN npm ci

# Copy all source files and build
COPY . /app
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy built static files to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom Nginx config that handles API routing/proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
