/**
 * OpenClaw Gateway WebSocket Client
 * Connects via Claw Bot Bridge (handles auth/CORS)
 */

const WS_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

export class GatewayClient {
  constructor(options = {}, tokenOverride = '', connectionOptions = {}) {
    // Backward compatibility: allow (url, token, options) signature.
    if (typeof options === 'string') {
      options = {
        url: options,
        token: tokenOverride,
        ...connectionOptions
      };
    }

    // Use Claw Bot bridge URL from env
    this.url = this.normalizeWsUrl(options.url || this.getBridgeUrl());
    this.sessionId = options.sessionId || this.generateSessionId();
    this.token = options.token || this.getToken();
    
    this.ws = null;
    this.isConnected = false;
    this.connectionState = 'disconnected';
    this.messageHandlers = [];
    this.errorHandlers = [];
    this.connectHandlers = [];
    this.disconnectHandlers = [];
    this.reconnectAttempt = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectDelay = options.reconnectDelay || 2000;
    this.pingInterval = null;
    this.messageQueue = [];
  }

  getBridgeUrl() {
    // Get from environment or fallback
    const bridgeUrl = import.meta.env.VITE_GATEWAY_URL || '';
    
    // Convert http/https to ws/wss
    if (bridgeUrl.startsWith('https://')) {
      return bridgeUrl.replace('https://', 'wss://');
    }
    if (bridgeUrl.startsWith('http://')) {
      return bridgeUrl.replace('http://', 'ws://');
    }
    return bridgeUrl;
  }

  normalizeWsUrl(url) {
    if (!url) return url;

    try {
      const parsed = new URL(url);
      const hasWindow = typeof window !== 'undefined';
      const pageHostname = hasWindow ? window.location.hostname : '';
      const pageProtocol = hasWindow ? window.location.protocol : '';
      const isLocalAddress = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      const runningRemotely = hasWindow && !['localhost', '127.0.0.1'].includes(pageHostname);

      // If the app is opened remotely, localhost/127 points at the user's device.
      if (isLocalAddress && runningRemotely) {
        parsed.hostname = pageHostname;
      }

      const isLocalTarget = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

      if (parsed.protocol === 'http:') parsed.protocol = 'ws:';
      if (parsed.protocol === 'https:') parsed.protocol = 'wss:';

      // Browsers block insecure ws:// from HTTPS pages except localhost.
      const shouldForceSecureWs = pageProtocol === 'https:' && parsed.protocol === 'ws:' && !isLocalTarget;
      if (shouldForceSecureWs) {
        parsed.protocol = 'wss:';
      }

      return parsed.toString().replace(/\/$/, '');
    } catch {
      return url;
    }
  }

  getToken() {
    return import.meta.env.VITE_GATEWAY_TOKEN || '';
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WS_STATES.OPEN) {
        resolve();
        return;
      }

      if (!this.url) {
        reject(new Error('Gateway URL not configured'));
        return;
      }

      const wsUrl = `${this.url}?session=${this.sessionId}&token=${this.token}`;
      const safeWsUrl = wsUrl.replace(/token=[^&]+/, 'token=***');
      
      console.log(`[Gateway] Connecting to: ${safeWsUrl}`);
      this.connectionState = 'connecting';

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[Gateway] ✅ Connected');
          this.isConnected = true;
          this.connectionState = 'connected';
          this.reconnectAttempt = 0;
          this.connectHandlers.forEach(h => h());
          this.flushMessageQueue();
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[Gateway] 📬 Message:', data);

            // Handle ping/pong
            if (data.type === 'pong') return;

            // Forward to handlers
            this.messageHandlers.forEach(h => h(data));
          } catch (err) {
            console.error('[Gateway] Parse error:', event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[Gateway] ❌ Error:', error);
          this.errorHandlers.forEach(h => h(error));
          if (this.connectionState === 'connecting') {
            reject(error);
          }
        };

        this.ws.onclose = (event) => {
          console.log(`[Gateway] ❌ Disconnected (code: ${event.code})`);
          this.isConnected = false;
          this.connectionState = 'disconnected';
          this.stopPing();
          this.disconnectHandlers.forEach(h => h(event));
          
          // Auto-reconnect
          if (event.code !== 1000) {
            this.scheduleReconnect();
          }
        };
      } catch (err) {
        this.connectionState = 'error';
        reject(err);
      }
    });
  }

  scheduleReconnect() {
    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      console.log('[Gateway] Max reconnect attempts reached');
      this.connectionState = 'failed';
      return;
    }

    this.reconnectAttempt++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempt - 1),
      30000
    );

    console.log(`[Gateway] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);
    this.connectionState = 'reconnecting';

    setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }

  startPing() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendRaw({ type: 'ping' });
      }
    }, 30000);
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(message) {
    const payload = {
      type: 'message',
      message: message,
      timestamp: new Date().toISOString()
    };

    return this.sendRaw(payload);
  }

  sendRaw(data) {
    const payload = JSON.stringify(data);

    if (this.isConnected && this.ws.readyState === WS_STATES.OPEN) {
      this.ws.send(payload);
      return true;
    } else {
      this.messageQueue.push(payload);
      console.log('[Gateway] Message queued (offline)');
      return false;
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const payload = this.messageQueue.shift();
      this.ws.send(payload);
    }
  }

  // Event handlers
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  onError(handler) {
    this.errorHandlers.push(handler);
  }

  onConnect(handler) {
    this.connectHandlers.push(handler);
  }

  onDisconnect(handler) {
    this.disconnectHandlers.push(handler);
  }

  disconnect() {
    this.stopPing();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getState() {
    return {
      isConnected: this.isConnected,
      connectionState: this.connectionState,
      reconnectAttempt: this.reconnectAttempt,
      queuedMessages: this.messageQueue.length
    };
  }
}

export default GatewayClient;
