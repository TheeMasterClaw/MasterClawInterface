/**
 * OpenClaw Gateway WebSocket Client
 * Connects directly to the OpenClaw gateway via ngrok
 */

export class GatewayClient {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.ws = null;
    this.isConnected = false;
    this.messageHandlers = [];
    this.errorHandlers = [];
    this.connectHandlers = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        // WebSocket URL - try both ws and wss
        const wsUrl = this.url
          .replace(/^https?/, 'ws')
          .replace(/\/$/, '') + `?token=${this.token}`;

        console.log('Connecting to gateway:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Connected to OpenClaw gateway');
          this.isConnected = true;
          this.connectHandlers.forEach(h => h());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📬 Message from gateway:', data);
            this.messageHandlers.forEach(h => h(data));
          } catch (err) {
            console.error('Failed to parse message:', event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Gateway error:', error);
          this.errorHandlers.forEach(h => h(error));
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('❌ Disconnected from gateway');
          this.isConnected = false;
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  send(message) {
    if (!this.isConnected) {
      console.error('Not connected to gateway');
      return false;
    }

    try {
      this.ws.send(
        JSON.stringify({
          type: 'message',
          message: message,
          timestamp: new Date().toISOString()
        })
      );
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      return false;
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

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export default GatewayClient;
