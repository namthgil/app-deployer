FROM node:20-alpine

RUN apk add --no-cache nginx

# Nginx config
COPY nginx.conf /etc/nginx/nginx.conf
COPY htpasswd /etc/nginx/htpasswd

# Deployer API
WORKDIR /app
COPY server.js .
COPY public/ public/

# Apps will live here (mountable volume)
RUN mkdir -p /var/www/apps

# Entrypoint starts both nginx and node
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
