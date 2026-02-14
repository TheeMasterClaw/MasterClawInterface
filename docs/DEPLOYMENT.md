# MC Deployment Guide

## Development

### Quick Start
```bash
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

## Production Deployment

### Option 1: Standalone (Single Machine)

#### Prerequisites
- Node.js 18+
- npm or yarn
- Port 3000 (frontend) and 3001 (backend) available

#### Build
```bash
npm run build
```

#### Environment
```bash
cp .env.example .env
# Edit .env with production settings
```

#### Start
```bash
npm start
```

Or use a process manager (recommended):

```bash
# With PM2
npm install -g pm2
pm2 start npm --name mc -- start
pm2 save
pm2 startup
```

#### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name mc.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Then redirect 80 → 443 with SSL (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d mc.yourdomain.com
```

---

### Option 2: Docker

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build frontend
COPY frontend ./frontend
WORKDIR ./frontend
RUN npm ci && npm run build
WORKDIR /app

# Copy backend
COPY backend ./backend

# Expose ports
EXPOSE 3000 3001

# Run backend (frontend served from there)
ENV NODE_ENV=production
CMD ["node", "backend/src/index.js"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  mc:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    volumes:
      - ./data:/app/backend/data
    restart: unless-stopped
```

#### Run
```bash
docker-compose up -d
```

---

### Option 3: OpenClaw Integration (Recommended)

MC can integrate with OpenClaw gateway for:
- Federated task/memory storage
- Cross-device sync
- Enhanced voice capabilities

#### Setup
1. Install OpenClaw on your machine
2. Configure gateway token in `.env`
3. MC will automatically sync to OpenClaw backend

```env
OPENCLAW_GATEWAY_URL=http://localhost:3000
OPENCLAW_GATEWAY_TOKEN=your-token-here
```

#### Architecture
```
MC Web App ← → OpenClaw Gateway ← → Storage
```

---


### Option 4: Vercel (Frontend) + Railway (Gateway/API)

This is the most stable cloud setup for Socket.IO:

- Deploy `frontend/` to Vercel (HTTPS)
- Deploy `backend/` to Railway (HTTPS/WSS)
- Frontend connects to Railway using `https://...` (Socket.IO upgrades to `wss://` automatically)

#### Required environment variables

**Vercel (frontend build env):**
```env
VITE_GATEWAY_URL=https://your-railway-app.up.railway.app
```

**Railway (backend runtime env):**
```env
PORT=3001
FRONTEND_URL=https://master-claw-interface.vercel.app,http://localhost:5173,http://localhost:3000
```

> Do not use `ws://` URLs in production frontend code. Always use the Railway `https://` origin.

## Configuration

### Environment Variables

**Server**
```env
PORT=3001
NODE_ENV=production

# Body Size Limits (security - prevents DoS via large payloads)
BODY_LIMIT_GENERAL=100kb      # General API endpoints
BODY_LIMIT_TTS=1mb            # TTS endpoint (allows larger text)
FRONTEND_URL=https://master-claw-interface.vercel.app,http://localhost:5173,http://localhost:3000
```

**Database**
```env
DATABASE_PATH=./data/mc.db
# Future: encryption
# DATABASE_ENCRYPTION_KEY=...
```

**Google Calendar** (optional)
```env
GOOGLE_CALENDAR_API_KEY=...
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
```

**Text-to-Speech**
```env
TTS_PROVIDER=openai
OPENAI_API_KEY=sk-...
# OR
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
```

**Frontend (Vercel)**
```env
VITE_GATEWAY_URL=https://your-railway-app.up.railway.app
```

**OpenClaw Integration** (optional)
```env
OPENCLAW_GATEWAY_URL=http://gateway:3000
OPENCLAW_GATEWAY_TOKEN=...
```

---

## Backups

### Backup Database
```bash
# Manual backup
cp data/mc.db data/mc.db.backup

# Automated backup (cron)
0 2 * * * cp /path/to/mc/data/mc.db /path/to/backups/mc.db.$(date +\%Y\%m\%d)
```

### Backup Settings & Code
```bash
# Backup .env and data
tar -czf mc-backup-$(date +%Y%m%d).tar.gz .env data/
```

---

## Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Logs
```bash
# PM2
pm2 logs mc

# Docker
docker-compose logs -f mc

# Tail raw logs
tail -f /var/log/mc.log
```

### Key Metrics to Monitor
- Request latency (should be <100ms for local)
- Database size (starts at ~2MB)
- Memory usage (typically <100MB)
- CPU (idle when not processing)

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3001
lsof -i :3001
# Kill it
kill -9 <PID>
```

### Database Lock
```bash
# SQLite can lock during heavy writes
# Solution: Wait or restart
rm data/mc.db-wal
```

### TTS Not Working
- Check API key in `.env`
- Fallback to text mode (no TTS)
- Test: `curl -X POST http://localhost:3001/tts -d '{"text":"test"}'`

### Frontend Not Connecting to Backend
- Check CORS headers
- Verify backend is running on 3001
- Check reverse proxy configuration

---

## Scaling

### Single Machine
Works fine for personal use (1-5 users).

### Multiple Machines
For distributed setup:
1. Use shared PostgreSQL or Firestore instead of SQLite
2. Deploy frontend to CDN
3. Deploy backend on multiple nodes with load balancing
4. Use Redis for session management

---

## Security Checklist

- [ ] HTTPS enabled (Let's Encrypt)
- [ ] `.env` file excluded from version control
- [ ] Database backups encrypted
- [ ] API authentication added (if multi-user)
- [ ] CORS restricted to trusted origins
- [ ] Rate limiting enabled
- [ ] Request body size limits configured (BODY_LIMIT_GENERAL, BODY_LIMIT_TTS)
- [ ] SQL injection prevention (parameterized queries—already done)
- [ ] XSS prevention (React does this)
- [ ] CSRF tokens for state-changing requests
- [ ] Regular security updates (npm audit, node updates)

---

## Performance Tuning

### Frontend
```javascript
// Enable compression in nginx
gzip on;
gzip_types text/plain application/json;

// Add CDN for static assets
```

### Backend
```javascript
// Add database indexes
db.exec(`
  CREATE INDEX idx_tasks_dueDate ON tasks(dueDate);
  CREATE INDEX idx_events_startTime ON calendar_events(startTime);
`);

// Implement pagination for large result sets
```

---

## Maintenance

### Weekly
- Check logs for errors
- Verify backups completed
- Monitor disk usage

### Monthly
- Update dependencies: `npm update`
- Review security advisories: `npm audit`
- Clean up old backups

### Yearly
- Full security audit
- Capacity planning
- Feature planning with Rex

---

## Disaster Recovery

If something breaks:

1. **Check logs** — `pm2 logs mc` or `docker-compose logs mc`
2. **Restore from backup** — `cp data/mc.db.backup data/mc.db`
3. **Restart** — `pm2 restart mc` or `docker-compose restart mc`
4. **Verify** — `curl http://localhost:3001/health`

If database is corrupted:
```bash
# Rebuild from backup
rm data/mc.db*
cp data/mc.db.backup data/mc.db
npm run migrate  # Future: setup script
```

---

Built with intention. Privacy by default. Power when needed.
