# App Deployer

A self-hosted app launcher. Drop HTML files via a web UI → instantly live at `http://yourserver/appname`.

## Quick Start

```bash
git clone <this-repo> app-deployer
cd app-deployer
docker compose up -d
```

Visit `http://localhost` (or your server's hostname/IP).

## Usage

1. Open `http://yourserver` — you'll see the deploy UI
2. Type an app name (e.g. `calculator`)
3. Drop your HTML file
4. Hit **Deploy**
5. App is instantly live at `http://yourserver/calculator`

## Ports

- Port `80` — Nginx (UI + all apps)

To run on a different port, edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"   # host:container
```

## Apps Storage

Apps are stored in `./apps/` on the host (mounted as a volume), so they survive container restarts and rebuilds.

## Custom Port / Reverse Proxy

If you're putting this behind another Nginx/Traefik/Caddy proxy, just point it at this container's port 80.

## Rebuild After Changes

```bash
docker compose up -d --build
```
