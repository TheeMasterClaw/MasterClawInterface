# CORS & Deployment Fix Summary

## Issues Fixed

1. **CORS blocked for `/tts` and `/chat/history`** - Missing proper origin validation and preflight handling
2. **Socket.IO websocket failing** - CORS config not matching REST API, only websocket transport enabled
3. **CSS 404 (`index-DqlbDCG4.css`)** - Vercel rewrite rules catching static assets

---

## Files Changed

### 1. `backend/src/index.js` (REST API CORS Fix)

**Changes:**
- Added explicit `ALLOWED_ORIGINS` array with production Vercel URLs
- Implemented proper CORS origin validation function
- Added explicit `app.options('*', cors(corsOptions))` for preflight handling
- Added CORS logging at server startup

**Key Code:**
```javascript
const ALLOWED_ORIGINS = [
  'https://master-claw-interface.vercel.app',
  'https://master-claw-interface-git-main-rex-deus-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
];

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked for origin: ${origin}`);
    return callback(new Error(`CORS blocked: ${origin} not in allowed list`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Critical for preflight
```

### 2. `backend/src/socket.js` (Socket.IO CORS Fix)

**Changes:**
- Added same `ALLOWED_ORIGINS` array as REST API
- Added `transports: ['websocket', 'polling']` for fallback compatibility
- Added connection stability config (pingTimeout, pingInterval)
- Added connection state recovery

**Key Code:**
```javascript
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'], // Enable fallback
  pingTimeout: 60000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});
```

### 3. `frontend/src/lib/gateway.js` (Socket.IO Client Fix)

**Changes:**
- Changed from `transports: ['websocket']` to `transports: ['websocket', 'polling']`
- Added `withCredentials: true` for CORS credentials support

**Key Code:**
```javascript
this.socket = io(this.url, {
  transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
  path: '/socket.io',
  reconnection: true,
  reconnectionAttempts: this.maxReconnectAttempts,
  reconnectionDelay: this.reconnectDelay,
  withCredentials: true, // Enable for CORS credentials
  auth: {
    token: this.token,
    sessionId: this.sessionId
  }
});
```

### 4. `vercel.json` (CSS 404 Fix)

**Changes:**
- Added explicit rewrite rules for `/assets/*` to prevent SPA routing interference
- Added rewrite rule for `favicon.ico`
- Added cache headers for static assets
- SPA fallback only applies after static asset checks

**Key Code:**
```json
{
  "rewrites": [
    {
      "source": "/assets/(.*)",
      "destination": "/assets/$1"
    },
    {
      "source": "/favicon.ico",
      "destination": "/favicon.ico"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 5. `.env.example` (Documentation Update)

**Changes:**
- Added clearer comments about FRONTEND_URL format
- Documented that VITE_GATEWAY_URL should match Railway backend in production

### 6. `frontend/.env.example` (Documentation Update)

**Changes:**
- Updated to use Railway URL for both API and Gateway in production
- Added notes about Vercel environment variable configuration

---

## Deployment Checklist

### Railway Backend

1. **Set Environment Variables:**
   ```
   FRONTEND_URL=https://master-claw-interface.vercel.app
   PORT=3001
   NODE_ENV=production
   ```

2. **Deploy:**
   ```bash
   git add .
   git commit -m "fix: CORS and Socket.IO configuration"
   git push railway main
   ```

3. **Verify CORS:**
   - Check Railway logs for: `🌐 CORS allowed origins: ...`
   - Should list your Vercel URL

### Vercel Frontend

1. **Set Environment Variables** (in Vercel Dashboard):
   ```
   VITE_API_URL=https://web-production-e0d96.up.railway.app
   VITE_GATEWAY_URL=https://web-production-e0d96.up.railway.app
   VITE_GATEWAY_TOKEN=your-gateway-token-here
   ```

2. **Deploy:**
   ```bash
   git push origin main
   # Or trigger deploy from Vercel dashboard
   ```

3. **Verify Build:**
   - Check that CSS file loads without 404
   - Check Network tab for successful asset loading

---

## Verification Steps

### Test REST API CORS
```bash
# Test preflight
curl -X OPTIONS -H "Origin: https://master-claw-interface.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -I https://web-production-e0d96.up.railway.app/chat/history

# Should return: 204 No Content + Access-Control-Allow-Origin header

# Test actual request
curl -H "Origin: https://master-claw-interface.vercel.app" \
  https://web-production-e0d96.up.railway.app/health

# Should return: {"status":"ok",...} + CORS headers
```

### Test Socket.IO CORS
1. Open browser DevTools on Vercel frontend
2. Look for WebSocket connection in Network tab
3. Should connect to `wss://web-production-e0d96.up.railway.app/socket.io/`
4. If websocket fails, should fallback to polling (XHR requests)

### Test CSS Loading
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Check Network tab for CSS file
3. Should load `/assets/index-XXXXXX.css` with 200 status
4. Response should contain actual CSS, not HTML

---

## Troubleshooting

### Still getting CORS errors?

1. **Check Railway logs** for blocked origin warnings
2. **Verify FRONTEND_URL** env var is set correctly
3. **Check browser DevTools** - look at the exact origin in the error message
4. **Add additional origins** if using preview deployments:
   ```javascript
   // In backend/src/index.js, add to ALLOWED_ORIGINS:
   'https://master-claw-interface-git-your-branch-rex-deus-projects.vercel.app'
   ```

### WebSocket still failing?

1. **Check if Railway supports websockets** (some plans may limit this)
2. **Verify client is using polling fallback** - check Network tab for XHR to `/socket.io/`
3. **Check for proxy/firewall issues** - some corporate networks block websockets

### CSS still 404?

1. **Check Vercel build output** - ensure CSS is in `dist/assets/`
2. **Verify vercel.json rewrites** are applied (check Vercel dashboard)
3. **Check for case sensitivity** - Linux is case-sensitive, macOS/Windows aren't

---

## Code Diff Summary

```diff
# backend/src/index.js
+ const ALLOWED_ORIGINS = [...]  // Explicit origin list
+ const corsOptions = { origin: fn, ... }  // Proper validation
+ app.options('*', cors(corsOptions))  // Preflight handling
+ console.log(`🌐 CORS allowed origins: ...`)  // Debug logging

# backend/src/socket.js
+ const ALLOWED_ORIGINS = [...]  // Same as REST API
+ transports: ['websocket', 'polling']  // Fallback support
+ pingTimeout, pingInterval, connectionStateRecovery  // Stability

# frontend/src/lib/gateway.js
- transports: ['websocket']
+ transports: ['websocket', 'polling']
+ withCredentials: true

# vercel.json
+ "rewrites": [ assets rule, favicon rule, catch-all ]
+ "headers": [ cache control for assets ]
```
