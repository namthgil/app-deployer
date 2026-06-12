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
4. Hit **Deploy** (you'll be prompted for credentials — see below)
5. App is instantly live at `http://yourserver/calculator`

## Authentication

All mutating API calls (`POST /api/deploy`, `DELETE /api/apps/:name`) are gated by HTTP Basic Auth. `GET` requests (listing, viewing apps) are open.

Default credentials:

```
username: aaa
password: bbb
```

To change them, edit `htpasswd` and rebuild. The file supports nginx's standard formats (`{PLAIN}`, `{SHA}`, apr1, crypt). For a stronger hash:

```bash
htpasswd -nB myuser >> htpasswd     # bcrypt (apache2-utils)
openssl passwd -apr1                # apr1
```

## Port

Host port is controlled by the `HOST_PORT` env var (defaults to `80`). Edit `.env`:

```
HOST_PORT=8080
```

Or set inline:

```bash
HOST_PORT=8080 docker compose up -d
```

The container always listens on `80` internally.

## Apps Storage

Apps are stored in `./apps/` on the host (mounted as a volume), so they survive container restarts and rebuilds.

## Reverse Proxy

If you're putting this behind another Nginx/Traefik/Caddy proxy, just point it at the container's published port.

## Rebuild After Changes

```bash
docker compose up -d --build
```
