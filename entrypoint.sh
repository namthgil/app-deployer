#!/bin/sh
set -e

# Validate nginx config first — fail fast with a clear error
nginx -t

# Start Node deployer API in background
cd /app
APPS_DIR=${APPS_DIR:-/var/www/apps} PORT=4200 node server.js &
NODE_PID=$!

# Forward signals so `docker stop` exits cleanly (no 10s wait → 137)
trap 'kill -TERM $NODE_PID 2>/dev/null; nginx -s quit 2>/dev/null; wait $NODE_PID 2>/dev/null' TERM INT

# Run nginx in foreground (PID 1's main process)
exec nginx -g "daemon off;"
