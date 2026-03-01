# Self-Hosting MasterClawInterface with Caddy

Run the full MasterClawInterface stack on your own server with **automatic HTTPS**, **no CORS pain**, and **zero ngrok dependency**.

## Architecture

```
Internet → Caddy (:443)
              ├─ /tasks, /chat, /socket.io, etc. → Express backend (:3001)
              └─ everything else                 → static frontend files
```

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Docker** + **Docker Compose** | [Install Docker](https://docs.docker.com/get-docker/) |
| A **domain name** pointing at your server | e.g. `mc.example.com` → your server IP |
| Ports **80** and **443** open | Required for Let's Encrypt + HTTPS |

> **Local-only?** Replace `YOUR_DOMAIN` with `localhost` in the Caddyfile. Caddy will use a self-signed cert.

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/TheeMasterClaw/MasterClawInterface.git
cd MasterClawInterface

# 2. Configure environment
cp .env.production .env
# Edit .env — replace YOUR_DOMAIN with your actual domain

# 3. Set your domain in the Caddyfile
sed -i 's/YOUR_DOMAIN/mc.example.com/g' Caddyfile   # replace with yours

# 4. Build the frontend (static export)
cd frontend && npm install && npm run build && cd ..

# 5. Launch
docker compose up -d

# 6. Check logs
docker compose logs -f
```

Your app is now live at `https://mc.example.com` 🚀

## How It Works

| URL Pattern | Routed To |
|-------------|-----------|
| `/tasks`, `/chat`, `/projects`, etc. | Express backend (:3001) |
| `/socket.io/*` | WebSocket → Express (:3001) |
| `/health` | Backend health check |
| Everything else | Static frontend files |

Caddy handles:
- **Automatic HTTPS** via Let's Encrypt (real domains) or self-signed certs (localhost)
- **HTTP → HTTPS redirect**
- **WebSocket upgrade** for Socket.IO
- **Security headers** (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- **HTTP/3** support

## Updating

```bash
git pull
cd frontend && npm install && npm run build && cd ..
docker compose up -d --build
```

## Stopping

```bash
docker compose down        # stop services
docker compose down -v     # stop + delete volumes (⚠️ deletes DB + certs)
```

## Nginx Alternative

If you prefer Nginx, create an `nginx.conf` with equivalent rules:

```nginx
server {
    listen 80;
    server_name mc.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mc.example.com;

    # SSL certs (use certbot)
    ssl_certificate     /etc/letsencrypt/live/mc.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mc.example.com/privkey.pem;

    # Backend API routes
    location ~ ^/(tasks|calendar|time|tts|chat|skills|snippets|system|projects|resources|contacts|today|learning|travel|watchlist|meals|reading|subscriptions|gifts|habits|routines|goals|skills-tracker|health|security|socket-test) {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Frontend (static files)
    location / {
        root /path/to/MasterClawInterface/frontend/dist;
        try_files $uri $uri.html /index.html;
    }
}
```

> With Nginx you need to manage TLS certificates yourself (e.g., via `certbot`). Caddy handles this automatically.
