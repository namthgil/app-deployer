#!/bin/sh
set -e

# Start Nginx in background
nginx -g "daemon off;" &

# Start Node deployer API
cd /app
APPS_DIR=${APPS_DIR:-/var/www/apps} PORT=4200 node server.js
