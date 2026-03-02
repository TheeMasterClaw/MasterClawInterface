import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { readFileSync } from 'fs';
import { createPrivateKey, sign } from 'node:crypto';

/**
 * SwarmBridge — Persistent WebSocket client to the Swarm Hub.
 *
 * Manages:
 *  • Outbound WebSocket connection to wss://swarm.perkos.xyz/ws/agents/{agentId}
 *  • Ed25519 auth on connect (optional — skipped if no key)
 *  • Cursor-based resume via `?since=` query param
 *  • Exponential backoff reconnect with jitter
 *  • State machine: disconnected → connecting → backfilling → live → error
 *
 * Events emitted:
 *  • 'message'      (msg)              — a standard Swarm message
 *  • 'connected'    ()                 — WebSocket open
 *  • 'live'         ()                 — backfill done, now streaming real-time
 *  • 'disconnected' ({ code, reason }) — WebSocket closed
 *  • 'reconnecting' ({ attempt, delay })
 *  • 'error'        (err)
 */
export class SwarmBridge extends EventEmitter {
    /**
     * @param {Object} options
     * @param {string} options.hubUrl           - Hub base URL (ws:// or wss://)
     * @param {string} options.agentId          - Agent ID to subscribe to
     * @param {string} [options.privateKeyPath] - Path to Ed25519 PEM private key
     * @param {boolean} [options.autoReconnect=true]
     * @param {number}  [options.reconnectBaseMs=5000]
     * @param {number}  [options.reconnectMaxMs=60000]
     * @param {number}  [options.reconnectJitter=0.1]
     * @param {number}  [options.pingIntervalMs=30000]
     */
    constructor(options = {}) {
        super();

        const {
            hubUrl,
            agentId,
            privateKeyPath = null,
            autoReconnect = true,
            reconnectBaseMs = 5000,
            reconnectMaxMs = 60000,
            reconnectJitter = 0.1,
            pingIntervalMs = 30000,
        } = options;

        if (!hubUrl) throw new Error('SwarmBridge: hubUrl is required');
        if (!agentId) throw new Error('SwarmBridge: agentId is required');

        // Normalise protocol
        this.hubUrl = hubUrl.replace(/^http/, 'ws');
        this.agentId = agentId;
        this.autoReconnect = autoReconnect;
        this.reconnectBaseMs = reconnectBaseMs;
        this.reconnectMaxMs = reconnectMaxMs;
        this.reconnectJitter = reconnectJitter;
        this.pingIntervalMs = pingIntervalMs;

        // State
        this.ws = null;
        this.state = 'disconnected';
        this.lastTimestamp = 0;
        this.reconnectAttempt = 0;
        this._reconnectTimer = null;
        this._pingInterval = null;

        // Ed25519 key (optional)
        this._privateKey = null;
        if (privateKeyPath) {
            try {
                const pem = readFileSync(privateKeyPath, 'utf-8');
                this._privateKey = createPrivateKey({ key: pem, format: 'pem', type: 'pkcs8' });
                console.log('[SwarmBridge] Ed25519 key loaded');
            } catch (err) {
                console.warn(`[SwarmBridge] Could not load private key (${err.message}) — auth disabled`);
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Connection Lifecycle                                               */
    /* ------------------------------------------------------------------ */

    /**
     * Open the WebSocket to Swarm Hub.
     * @param {number} [since=0] - Resume cursor (epoch ms, exclusive)
     */
    async connect(since = 0) {
        if (this.state === 'connecting' || this.state === 'live') return;

        this.state = 'connecting';
        this.lastTimestamp = since || this.lastTimestamp;

        try {
            const url = this._buildUrl();
            this.ws = new WebSocket(url, {
                handshakeTimeout: 10000,
                perMessageDeflate: false,
            });
            this._attachHandlers();
        } catch (err) {
            this.state = 'error';
            this.emit('error', err);
            this._scheduleReconnect();
        }
    }

    /** Graceful disconnect — stops reconnect loop. */
    disconnect() {
        this._clearTimers();
        this.autoReconnect = false; // prevent reconnect loop on intentional disconnect

        if (this.ws) {
            this.ws.removeAllListeners();
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close(1000, 'Client disconnect');
            } else {
                this.ws.terminate();
            }
            this.ws = null;
        }

        this.state = 'disconnected';
        this.emit('disconnected', { code: 1000, reason: 'Client disconnect' });
    }

    /* ------------------------------------------------------------------ */
    /*  WebSocket Event Handlers                                           */
    /* ------------------------------------------------------------------ */

    /** @private */
    _attachHandlers() {
        this.ws.on('open', () => this._onOpen());
        this.ws.on('message', (data) => this._onMessage(data));
        this.ws.on('close', (code, reason) => this._onClose(code, reason));
        this.ws.on('error', (err) => this._onError(err));
        this.ws.on('ping', () => this.ws?.pong());
    }

    /** @private */
    _onOpen() {
        this.state = 'backfilling';
        this.reconnectAttempt = 0;
        this._startPing();
        this.emit('connected');
        console.log(`[SwarmBridge] Connected to ${this.hubUrl} (agent: ${this.agentId})`);
    }

    /** @private */
    _onMessage(data) {
        try {
            const msg = JSON.parse(data.toString());
            this._handleProtocol(msg);
        } catch (err) {
            this.emit('error', new Error(`[SwarmBridge] Invalid JSON: ${err.message}`));
        }
    }

    /** @private */
    _onClose(code, reason) {
        this._clearTimers();
        this.state = 'disconnected';
        const reasonStr = reason?.toString?.() || '';
        this.emit('disconnected', { code, reason: reasonStr });
        console.log(`[SwarmBridge] Disconnected (code=${code}, reason=${reasonStr})`);

        if (this.autoReconnect && code !== 1000) {
            this._scheduleReconnect();
        }
    }

    /** @private */
    _onError(err) {
        this.state = 'error';
        this.emit('error', err);
    }

    /* ------------------------------------------------------------------ */
    /*  Protocol Handling                                                  */
    /* ------------------------------------------------------------------ */

    /** @private */
    _handleProtocol(msg) {
        // Sentinel: backfill complete → live
        if (msg.type === 'live') {
            this.state = 'live';
            this.emit('live');
            console.log(`[SwarmBridge] Live mode (agent: ${this.agentId})`);
            return;
        }

        // Hub error
        if (msg.type === 'error') {
            this.emit('error', new Error(`[SwarmHub] ${msg.message || msg.code || 'Unknown error'}`));
            if (msg.code === 'UNAUTHORIZED') {
                this.autoReconnect = false; // Don't retry auth failures
            }
            return;
        }

        // Standard message — advance cursor and emit
        if (msg.id && msg.timestamp) {
            this.lastTimestamp = msg.timestamp;
            this.emit('message', msg);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  URL Construction & Auth                                            */
    /* ------------------------------------------------------------------ */

    /** @private */
    _buildUrl() {
        const params = new URLSearchParams({
            since: this.lastTimestamp.toString(),
        });

        // Add Ed25519 signature if key is available
        if (this._privateKey) {
            const nonce = Date.now().toString();
            const payload = `${this.agentId}:${nonce}`;
            const sig = sign(null, Buffer.from(payload, 'utf-8'), this._privateKey);
            params.set('nonce', nonce);
            params.set('sig', sig.toString('base64url'));
        }

        return `${this.hubUrl}/ws/agents/${this.agentId}?${params}`;
    }

    /* ------------------------------------------------------------------ */
    /*  Reconnect Logic                                                    */
    /* ------------------------------------------------------------------ */

    /** @private */
    _scheduleReconnect() {
        if (!this.autoReconnect) return;

        const delay = this._calcBackoff();
        this.reconnectAttempt++;

        this.emit('reconnecting', { attempt: this.reconnectAttempt, delay });
        console.log(`[SwarmBridge] Reconnecting in ${delay}ms (attempt #${this.reconnectAttempt})`);

        this._reconnectTimer = setTimeout(() => {
            this.connect().catch((err) => {
                console.error('[SwarmBridge] Reconnect failed:', err);
                this._scheduleReconnect();
            });
        }, delay);
    }

    /** @private */
    _calcBackoff() {
        const exponential = this.reconnectBaseMs * Math.pow(2, this.reconnectAttempt);
        const capped = Math.min(exponential, this.reconnectMaxMs);
        const jitter = capped * this.reconnectJitter * (Math.random() * 2 - 1);
        return Math.floor(capped + jitter);
    }

    /* ------------------------------------------------------------------ */
    /*  Keepalive                                                          */
    /* ------------------------------------------------------------------ */

    /** @private */
    _startPing() {
        this._pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.ping();
            }
        }, this.pingIntervalMs);
    }

    /** @private */
    _clearTimers() {
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        if (this._pingInterval) {
            clearInterval(this._pingInterval);
            this._pingInterval = null;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Status / Utilities                                                 */
    /* ------------------------------------------------------------------ */

    /** Get a snapshot of the bridge state. */
    getState() {
        return {
            state: this.state,
            agentId: this.agentId,
            hubUrl: this.hubUrl,
            lastTimestamp: this.lastTimestamp,
            reconnectAttempt: this.reconnectAttempt,
            connected: this.ws?.readyState === WebSocket.OPEN,
            hasAuthKey: !!this._privateKey,
        };
    }

    isLive() {
        return this.state === 'live';
    }
}

/* ====================================================================== */
/*  Singleton management — one bridge per process                         */
/* ====================================================================== */

/** @type {SwarmBridge|null} */
let _bridge = null;

/**
 * Initialise the Swarm bridge from environment variables.
 * Safe to call multiple times — only creates one bridge.
 *
 * Env vars:
 *  - SWARM_HUB_URL        (required to enable) e.g. wss://swarm.perkos.xyz
 *  - SWARM_AGENT_ID       (required to enable) e.g. LKnzKzTPKA28LLFpgf8h
 *  - SWARM_PRIVATE_KEY_PATH (optional) path to Ed25519 PEM
 *  - SWARM_AUTO_RECONNECT  (optional, default "true")
 *
 * @param {Object} [overrides] - Override env-based config
 * @returns {SwarmBridge|null} The bridge instance, or null if not configured
 */
export function initSwarmBridge(overrides = {}) {
    if (_bridge) return _bridge;

    const hubUrl = overrides.hubUrl || process.env.SWARM_HUB_URL;
    const agentId = overrides.agentId || process.env.SWARM_AGENT_ID;

    if (!hubUrl || !agentId) {
        console.log('[SwarmBridge] Not configured (SWARM_HUB_URL / SWARM_AGENT_ID not set)');
        return null;
    }

    _bridge = new SwarmBridge({
        hubUrl,
        agentId,
        privateKeyPath: overrides.privateKeyPath || process.env.SWARM_PRIVATE_KEY_PATH || null,
        autoReconnect: (overrides.autoReconnect ?? process.env.SWARM_AUTO_RECONNECT) !== 'false',
    });

    return _bridge;
}

/**
 * Get the current bridge instance (or null if not initialised).
 * @returns {SwarmBridge|null}
 */
export function getSwarmBridge() {
    return _bridge;
}

/**
 * Tear down the bridge (for testing / shutdown).
 */
export function destroySwarmBridge() {
    if (_bridge) {
        _bridge.disconnect();
        _bridge.removeAllListeners();
        _bridge = null;
    }
}
