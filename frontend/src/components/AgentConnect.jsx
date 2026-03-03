import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../lib/apiUrl';
import './AgentConnect.css';

const API_URL = getApiUrl();

export default function AgentConnect() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('agents');
    const [agentStatus, setAgentStatus] = useState(null);
    const [swarmStatus, setSwarmStatus] = useState(null);
    const [copied, setCopied] = useState(null);
    const [pulseRing, setPulseRing] = useState(false);

    // Fetch agent + swarm status periodically when panel is open
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const [agentRes, swarmRes] = await Promise.all([
                    fetch(`${API_URL}/system/gateway`),
                    fetch(`${API_URL}/swarm/status`),
                ]);
                if (agentRes.ok) setAgentStatus(await agentRes.json());
                if (swarmRes.ok) setSwarmStatus(await swarmRes.json());
            } catch (err) {
                console.error('Failed to fetch status:', err);
            }
        };

        fetchStatus();
        const timer = setInterval(fetchStatus, isOpen ? 5000 : 30000);
        return () => clearInterval(timer);
    }, [isOpen]);

    // Pulse animation when an agent connects/disconnects
    useEffect(() => {
        if (agentStatus?.connected) {
            setPulseRing(true);
            const t = setTimeout(() => setPulseRing(false), 2000);
            return () => clearTimeout(t);
        }
    }, [agentStatus?.connected]);

    const copyToClipboard = useCallback((text, label) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(label);
            setTimeout(() => setCopied(null), 2000);
        });
    }, []);

    // ── Swarm bridge actions ──
    const swarmConnect = async () => {
        try {
            await fetch(`${API_URL}/swarm/connect`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error('Swarm connect failed:', err);
        }
    };

    const swarmDisconnect = async () => {
        try {
            await fetch(`${API_URL}/swarm/disconnect`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            console.error('Swarm disconnect failed:', err);
        }
    };

    // ── Skill Folder manifest ──
    const GATEWAY_URL = 'https://web-production-e0d96.up.railway.app';
    
    const skillFolderManifest = JSON.stringify({
        "skill.json": {
            name: "MyOpenClawSkill",
            version: "1.0.0",
            description: "OpenClaw skill — connects directly to MasterClaw backend",
            runtime: "node",
            entry: "index.js",
            triggers: ["chat"],
            connection: {
                type: "direct",
                url: "https://web-production-e0d96.up.railway.app",
                transport: "websocket",
                path: "/socket.io"
            }
        }
    }, null, 2);

    // ── Boilerplate code for OpenClaw skill ──
    const skillBoilerplate = `import { io } from 'socket.io-client';

// ── Configuration ──
const GATEWAY_URL = 'https://web-production-e0d96.up.railway.app';
const AGENT_ID = 'my-openclaw-agent';    // Give your agent a unique ID

// ── Connect to MasterClaw Gateway ──
const socket = io(GATEWAY_URL, {
  transports: ['websocket', 'polling'],
  path: '/socket.io',
  withCredentials: true,
  auth: { agentId: AGENT_ID }
});

socket.on('connect', () => {
  console.log('🤖 Connected to MasterClaw Gateway');
  console.log('Socket ID:', socket.id);

  // Register the "chat" skill — this makes your agent
  // the primary chat handler. Messages typed in the
  // MasterClaw chat window will be routed to you.
  socket.emit('skill:register', {
    name: 'OpenClaw Chat Agent',
    description: 'Handles chat messages via OpenClaw',
    trigger: 'chat',
    parameters: [{ name: 'message', type: 'string', required: true }],
    socketId: socket.id
  }, (ack) => {
    if (ack?.ok) console.log('✅ Chat skill registered — you are live!');
    else console.error('❌ Registration failed:', ack?.error || 'Unknown error');
  });
});

// ── Handle incoming chat messages ──
socket.on('chat:message', (data) => {
  const { message, conversationId, timestamp } = data;
  console.log('📩 User said:', message);

  // ───────────────────────────────────────────────────
  // 🔧 YOUR LOGIC HERE — call an LLM, query a DB, etc.
  // ───────────────────────────────────────────────────
  const reply = \`🤖 You said: \${message}\`;

  // Send the response back to the chat window
  socket.emit('chat:response', {
    type: 'assistant',
    content: reply,
    agent: 'OpenClaw Agent',
    conversationId,
    timestamp: Date.now()
  });
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
  // socket.io auto-reconnects by default
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
});

console.log('⏳ Connecting to', GATEWAY_URL, '...');`;

    const agentCount = agentStatus?.agents || 0;
    const isConnected = agentStatus?.connected || false;
    const swarmEnabled = swarmStatus?.enabled || false;
    const swarmState = swarmStatus?.state || 'disconnected';

    return (
        <>
            {/* Floating Action Button */}
            <button
                className={`agent-fab ${isConnected ? 'connected' : ''} ${pulseRing ? 'pulse' : ''}`}
                onClick={() => setIsOpen(true)}
                title="Connect Agent"
                aria-label="Connect Agent"
            >
                <div className="fab-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                </div>
                {agentCount > 0 && (
                    <span className="fab-badge">{agentCount}</span>
                )}
            </button>

            {/* Panel Overlay */}
            {isOpen && (
                <div className="agent-overlay" onClick={() => setIsOpen(false)}>
                    <div className="agent-panel" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="agent-panel-header">
                            <div className="header-left">
                                <div className={`status-orb ${isConnected ? 'live' : 'idle'}`} />
                                <div>
                                    <h2>Agent Connect</h2>
                                    <span className="header-subtitle">
                                        {isConnected ? `${agentCount} agent${agentCount !== 1 ? 's' : ''} online` : 'No agents connected'}
                                    </span>
                                </div>
                            </div>
                            <button className="panel-close" onClick={() => setIsOpen(false)}>
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="agent-tabs">
                            <button
                                className={`agent-tab ${activeTab === 'agents' ? 'active' : ''}`}
                                onClick={() => setActiveTab('agents')}
                            >
                                <span className="tab-icon">🔌</span> Agents
                            </button>
                            <button
                                className={`agent-tab ${activeTab === 'connect' ? 'active' : ''}`}
                                onClick={() => setActiveTab('connect')}
                            >
                                <span className="tab-icon">📦</span> Skill Folder
                            </button>
                            <button
                                className={`agent-tab ${activeTab === 'code' ? 'active' : ''}`}
                                onClick={() => setActiveTab('code')}
                            >
                                <span className="tab-icon">💻</span> Quick Start
                            </button>
                            <button
                                className={`agent-tab ${activeTab === 'swarm' ? 'active' : ''}`}
                                onClick={() => setActiveTab('swarm')}
                            >
                                <span className="tab-icon">🌐</span> Swarm
                            </button>
                        </div>

                        {/* Content */}
                        <div className="agent-content">

                            {/* ── Agents Tab ── */}
                            {activeTab === 'agents' && (
                                <div className="agents-list">
                                    {isConnected && agentStatus.skills?.length > 0 ? (
                                        <>
                                            <div className="connected-banner">
                                                <div className="banner-icon">✅</div>
                                                <div>
                                                    <strong>Agents Connected</strong>
                                                    <p>{agentCount} skill{agentCount !== 1 ? 's' : ''} registered and responding</p>
                                                </div>
                                            </div>

                                            {agentStatus.skills.map((skill, i) => (
                                                <div className="skill-card" key={i}>
                                                    <div className="skill-card-header">
                                                        <div className="skill-trigger">/{skill.trigger}</div>
                                                        <div className={`skill-status-dot active`} />
                                                    </div>
                                                    <div className="skill-name">{skill.name}</div>
                                                    <div className="skill-meta">
                                                        <code>{skill.socketId?.slice(0, 12)}…</code>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-icon">🤖</div>
                                            <h3>No agents connected</h3>
                                            <p>Connect an OpenClaw skill or bot to get started. Use the <strong>Quick Start</strong> tab for step-by-step instructions.</p>
                                            <button
                                                className="btn-primary"
                                                onClick={() => setActiveTab('code')}
                                            >
                                                Quick Start →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Skill Folder Tab ── */}
                            {activeTab === 'connect' && (
                                <div className="connect-view">
                                    <div className="info-card">
                                        <div className="info-icon">🚀</div>
                                        <div>
                                            <strong>OpenClaw Skill Connection</strong>
                                            <p>Share this skill folder with any OpenClaw agent. They install it, run it, and it automatically connects to your MasterClaw and starts handling chat.</p>
                                            <p className="dimmed">No tokens needed — agents opt-in voluntarily and can disconnect anytime.</p>
                                        </div>
                                    </div>

                                    <div className="folder-tree">
                                        <div className="folder-header">
                                            <span className="folder-icon">📁</span>
                                            <strong>my-openclaw-skill/</strong>
                                        </div>
                                        <div className="tree-item">
                                            <span className="file-icon">📄</span>
                                            <span>skill.json</span>
                                            <span className="tree-badge">manifest</span>
                                        </div>
                                        <div className="tree-item">
                                            <span className="file-icon">📄</span>
                                            <span>index.js</span>
                                            <span className="tree-badge">entry</span>
                                        </div>
                                        <div className="tree-item">
                                            <span className="file-icon">📄</span>
                                            <span>package.json</span>
                                            <span className="tree-badge">deps</span>
                                        </div>
                                    </div>

                                    <div className="section-label">skill.json</div>
                                    <div className="code-container">
                                        <pre>{skillFolderManifest}</pre>
                                        <button
                                            className={`copy-btn ${copied === 'manifest' ? 'copied' : ''}`}
                                            onClick={() => copyToClipboard(skillFolderManifest, 'manifest')}
                                        >
                                            {copied === 'manifest' ? '✓ Copied' : '📋 Copy'}
                                        </button>
                                    </div>

                                    <div className="section-label">Connection Details</div>
                                    <div className="connection-details">
                                        <div className="detail-item">
                                            <span className="detail-label">Gateway URL</span>
                                            <div className="detail-value-wrap">
                                                <code>https://web-production-e0d96.up.railway.app</code>
                                                <button
                                                    className={`copy-mini ${copied === 'url' ? 'copied' : ''}`}
                                                    onClick={() => copyToClipboard("https://web-production-e0d96.up.railway.app", 'url')}
                                                >
                                                    {copied === 'url' ? '✓' : '📋'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Transport</span>
                                            <code>WebSocket (Socket.IO)</code>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Path</span>
                                            <code>/socket.io</code>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Auth</span>
                                            <span className="no-auth-badge">🔓 No token required</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Chat Trigger</span>
                                            <code>chat</code>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Connection Type</span>
                                            <code>Direct WebSocket</code>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Manifest</span>
                                            <div className="detail-value-wrap">
                                                <a
                                                    href={`${API_URL}/manifest.json`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="manifest-link"
                                                >
                                                    /manifest.json ↗
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Quick Start Tab ── */}
                            {activeTab === 'code' && (
                                <div className="code-view">
                                    <div className="info-card">
                                        <div className="info-icon">💬</div>
                                        <div>
                                            <strong>Connect & Start Chatting</strong>
                                            <p>This boilerplate connects your OpenClaw agent to MasterClaw and registers a <code>chat</code> handler. Messages typed in the chat window are routed to your agent in real-time.</p>
                                        </div>
                                    </div>

                                    <div className="steps-flow">
                                        <div className="step-card">
                                            <div className="step-number">1</div>
                                            <div className="step-body">
                                                <strong>Create the skill folder</strong>
                                                <div className="cmd-block">
                                                    <code>mkdir my-skill && cd my-skill && npm init -y && npm i socket.io-client</code>
                                                    <button
                                                        className={`copy-mini ${copied === 'cmd' ? 'copied' : ''}`}
                                                        onClick={() => copyToClipboard('mkdir my-skill && cd my-skill && npm init -y && npm i socket.io-client', 'cmd')}
                                                    >
                                                        {copied === 'cmd' ? '✓' : '📋'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="step-card">
                                            <div className="step-number">2</div>
                                            <div className="step-body">
                                                <strong>Paste this into index.js</strong>
                                                <div className="code-container tall">
                                                    <pre>{skillBoilerplate}</pre>
                                                    <button
                                                        className={`copy-btn ${copied === 'code' ? 'copied' : ''}`}
                                                        onClick={() => copyToClipboard(skillBoilerplate, 'code')}
                                                    >
                                                        {copied === 'code' ? '✓ Copied' : '📋 Copy'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="step-card">
                                            <div className="step-number">3</div>
                                            <div className="step-body">
                                                <strong>Run it</strong>
                                                <div className="cmd-block">
                                                    <code>node index.js</code>
                                                    <button
                                                        className={`copy-mini ${copied === 'run' ? 'copied' : ''}`}
                                                        onClick={() => copyToClipboard('node index.js', 'run')}
                                                    >
                                                        {copied === 'run' ? '✓' : '📋'}
                                                    </button>
                                                </div>
                                                <p className="step-note">Your agent will appear in the <strong>Agents</strong> tab and start receiving chat messages ✨</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Swarm Tab ── */}
                            {activeTab === 'swarm' && (
                                <div className="swarm-view">
                                    {/* Status Banner */}
                                    <div className={`swarm-banner ${swarmEnabled ? swarmState : 'disabled'}`}>
                                        <div className="swarm-banner-icon">
                                            {swarmState === 'live' ? '🟢' :
                                                swarmState === 'connected' || swarmState === 'backfilling' ? '🟡' :
                                                    swarmState === 'reconnecting' ? '🔄' :
                                                        swarmEnabled ? '🔴' : '⚪'}
                                        </div>
                                        <div>
                                            <strong>
                                                {!swarmEnabled ? 'Swarm Bridge Not Configured' :
                                                    swarmState === 'live' ? 'Swarm Bridge Live' :
                                                        swarmState === 'backfilling' ? 'Catching Up…' :
                                                            swarmState === 'connecting' ? 'Connecting…' :
                                                                swarmState === 'reconnecting' ? `Reconnecting (attempt ${swarmStatus?.reconnectAttempt || '?'})…` :
                                                                    'Swarm Bridge Disconnected'}
                                            </strong>
                                            <p>
                                                {!swarmEnabled
                                                    ? 'Set SWARM_HUB_URL and SWARM_AGENT_ID env vars to enable.'
                                                    : swarmState === 'live'
                                                        ? 'Real-time message streaming from Swarm Hub.'
                                                        : `State: ${swarmState}`
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bridge Details */}
                                    {swarmEnabled && (
                                        <>
                                            <div className="section-label">Bridge Info</div>
                                            <div className="connection-details">
                                                <div className="detail-item">
                                                    <span className="detail-label">Hub URL</span>
                                                    <code>{swarmStatus?.hubUrl || '—'}</code>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">Agent ID</span>
                                                    <code>{swarmStatus?.agentId || '—'}</code>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">State</span>
                                                    <span className={`swarm-state-badge ${swarmState}`}>{swarmState}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">Last Message</span>
                                                    <code>{swarmStatus?.lastTimestamp ? new Date(swarmStatus.lastTimestamp).toLocaleTimeString() : 'none'}</code>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">Auth Key</span>
                                                    <span className={swarmStatus?.hasAuthKey ? 'no-auth-badge' : 'swarm-warn-badge'}>
                                                        {swarmStatus?.hasAuthKey ? '🔑 Loaded' : '⚠️ Not loaded'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Controls */}
                                            <div className="swarm-controls">
                                                {swarmState === 'disconnected' || swarmState === 'error' ? (
                                                    <button className="btn-primary" onClick={swarmConnect}>
                                                        Connect to Swarm Hub
                                                    </button>
                                                ) : (
                                                    <button className="btn-secondary" onClick={swarmDisconnect}>
                                                        Disconnect
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Architecture info */}
                                    <div className="info-card" style={{ marginTop: '1.25rem' }}>
                                        <div className="info-icon">🏗️</div>
                                        <div>
                                            <strong>WebSocket Bridge Architecture</strong>
                                            <p>The Swarm bridge opens one persistent outbound WebSocket to the Hub. Messages are streamed in real-time and injected into the chat pipeline — agents respond naturally without knowing the source channel.</p>
                                            <p className="dimmed">Auto-reconnects with exponential backoff. Cursor-based resume prevents message loss.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
