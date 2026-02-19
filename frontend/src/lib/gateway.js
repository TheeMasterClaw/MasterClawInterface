import { io } from 'socket.io-client';

export class GatewayClient {
  constructor(options = {}, tokenOverride = '', connectionOptions = {}) {
    if (typeof options === 'string') {
      options = {
        url: options,
        token: tokenOverride,
        ...connectionOptions
      };
    }

    this.url = this.normalizeHttpUrl(options.url || this.getBridgeUrl());
    this.sessionId = options.sessionId || this.generateSessionId();
    this.token = options.token || this.getToken();

    this.socket = null;
    this.isConnected = false;
    this.connectionState = 'disconnected';
    this.messageHandlers = [];
    this.errorHandlers = [];
    this.connectHandlers = [];
    this.disconnectHandlers = [];
    this.messageQueue = [];
    this.maxQueueSize = options.maxQueueSize || 100;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectDelay = options.reconnectDelay || 2000;
  }

  getBridgeUrl() {
    return process.env.NEXT_PUBLIC_GATEWAY_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  normalizeHttpUrl(url) {
    if (!url) return url;

    try {
      const parsed = new URL(url);
      const isLocalAddress = ['localhost', '127.0.0.1'].includes(parsed.hostname);
      const runningRemotely = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname);

      if (isLocalAddress && runningRemotely) {
        parsed.hostname = window.location.hostname;
      }

      if (parsed.protocol === 'ws:') parsed.protocol = 'http:';
      if (parsed.protocol === 'wss:') parsed.protocol = 'https:';

      return parsed.toString().replace(/\/$/, '');
    } catch {
      return url;
    }
  }

  getToken() {
    return process.env.NEXT_PUBLIC_GATEWAY_TOKEN || '';
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (!this.url) {
        reject(new Error('Gateway URL not configured'));
        return;
      }

      this.connectionState = 'connecting';
      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        // Enable credentials for CORS
        withCredentials: true,
        auth: {
          token: this.token,
          sessionId: this.sessionId
        }
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.connectionState = 'connected';
        this.connectHandlers.forEach((h) => h());
        this.flushMessageQueue();
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        this.connectionState = reason === 'io client disconnect' ? 'disconnected' : 'reconnecting';
        this.disconnectHandlers.forEach((h) => h({ reason }));
      });

      this.socket.on('connect_error', (error) => {
        this.connectionState = 'error';
        this.errorHandlers.forEach((h) => h(error));
        reject(error);
      });

      this.socket.on('chat:response', (data) => {
        this.messageHandlers.forEach((h) => h(data));
      });

      this.socket.on('chat:error', (error) => {
        this.errorHandlers.forEach((h) => h(error));
      });
    });
  }

  send(message) {
    const payload = { message, timestamp: new Date().toISOString() };

    if (!this.isConnected || !this.socket) {
      if (this.messageQueue.length >= this.maxQueueSize) {
        this.messageQueue.shift();
      }
      this.messageQueue.push(payload);
      return false;
    }

    this.socket.emit('chat:message', payload, (ack) => {
      if (ack && !ack.ok) {
        this.errorHandlers.forEach((h) => h(ack));
      }
    });
    return true;
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const payload = this.messageQueue.shift();
      this.socket.emit('chat:message', payload);
    }
  }

  onMessage(handler) {
    if (typeof handler === 'function') this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  onError(handler) {
    if (typeof handler === 'function') this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter((h) => h !== handler);
    };
  }

  onConnect(handler) {
    if (typeof handler === 'function') this.connectHandlers.push(handler);
    return () => {
      this.connectHandlers = this.connectHandlers.filter((h) => h !== handler);
    };
  }

  onDisconnect(handler) {
    if (typeof handler === 'function') this.disconnectHandlers.push(handler);
    return () => {
      this.disconnectHandlers = this.disconnectHandlers.filter((h) => h !== handler);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.isConnected = false;
    this.connectionState = 'disconnected';
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getState() {
    return {
      isConnected: this.isConnected,
      connectionState: this.connectionState,
      queuedMessages: this.messageQueue.length
    };
  }
}

export default GatewayClient;
