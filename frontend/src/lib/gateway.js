/**
 * OpenClaw Gateway WebSocket Client
 * Connects directly to the OpenClaw gateway with auto-reconnect
 */

const WS_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
};

export class GatewayClient {
  constructor(url, token, options = {}) {
    this.url = url;
    this.token = token;
    this.ws = null;
    this.isConnected = false;
    this.connectionState = 'disconnected';
    this.messageHandlers = [];
    this.errorHandlers = [];
    this.connectHandlers = [];
    this.disconnectHandlers = [];
    this.reconnectAttempt = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 3000;
    this.reconnectDelayMax = options.reconnectDelayMax || 30000;
    this.reconnectTimer = null;
    this.pingInterval = null;
    this.lastPing = null;
    this.messageQueue = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WS_STATES.OPEN) {
        resolve();
        return;
      }

      try {
        // WebSocket URL - convert http/https to ws/wss
        let wsUrl = this.url
          .replace(/^https/, 'wss')
          .replace(/^http/, 'ws')
          .replace(/\/$/, '');
        
        // Add token to URL for auth
        const separator = wsUrl.includes('?') ? '&' : '?';
        wsUrl += `${separator}token=${this.token}`;

        console.log('[Gateway] Connecting to:', wsUrl.replace(/token=[^\u0026]+/, 'token=***'));
        this.connectionState = 'connecting';

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[Gateway] ✅ Connected');
          this.isConnected = true;
          this.connectionState = 'connected';
          this.reconnectAttempt = 0;
          this.connectHandlers.forEach(h => h());
          
          // Start ping interval
          this.startPing();
          
          // Flush queued messages
          this.flushMessageQueue();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[Gateway] 📬 Message:', data);

            // Handle ping/pong
            if (data.type === 'pong') {
              this.lastPing = Date.now();
              return;
            }

            // Handle authentication challenge
            if (data.event === 'connect.challenge') {
              console.log('[Gateway] 🔐 Auth challenge received');
              return;
            }

            // Handle regular messages
            this.messageHandlers.forEach(h => h(data));
          } catch (err) {
            console.error('[Gateway] Failed to parse message:', event.data);
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
          
          // Auto-reconnect unless intentionally closed
          if (event.code !== 1000 && event.code !== 1001) {
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
      this.reconnectDelayMax
    );

    console.log(`[Gateway] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);
    this.connectionState = 'reconnecting';

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Reconnect failed, will try again if attempts remain
      });
    }, delay);
  }

  startPing() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        this.lastPing = Date.now();
      }
    }, 30000); // Ping every 30 seconds
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(message) {
    const payload = JSON.stringify({
      type: 'message',
      message: message,
      timestamp: new Date().toISOString()
    });

    if (this.isConnected && this.ws.readyState === WS_STATES.OPEN) {
      this.ws.send(payload);
      return true;
    } else {
      // Queue message for when connection returns
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
    // Clear reconnect timer to prevent auto-reconnect
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopPing();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
  }

  getState() {
    return {
      isConnected: this.isConnected,
      connectionState: this.connectionState,
      reconnectAttempt: this.reconnectAttempt,
      lastPing: this.lastPing,
      queuedMessages: this.messageQueue.length
    };
  }
}

export default GatewayClient;
