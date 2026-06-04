# Build stage — compile the Angular app
FROM node:23-alpine AS build
WORKDIR /app

# Copy manifests first for layer caching
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Runtime stage — serve with nginx + runtime API_URL injection
FROM nginx:alpine AS final

# Copy Angular output to nginx html root
COPY --from=build /app/dist/Web/browser /usr/share/nginx/html

# Copy nginx config template — API_URL is substituted at container start.
# The official nginx image processes *.conf.template files in /etc/nginx/templates/
# automatically via envsubst before nginx starts.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# API_URL must be provided at runtime:
#   Docker Compose: API_URL=http://onboarding-service:5100
#   Azure:          API_URL=https://<onboarding-service-fqdn>
ENV API_URL=http://onboarding-service:5100

EXPOSE 80
