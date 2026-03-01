import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../lib/apiUrl';
import './AgentConnect.css';

const API_URL = getApiUrl();

export default function AgentConnect() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('agents');
    const [agentStatus, setAgentStatus] = useState(null);
    const [copied, setCopied] = useState(null);
    const [pulseRing, setPulseRing] = useState(false);

    // Fetch agent status periodically when panel is open
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/system/gateway`);
                if (res.ok) {
                    const data = await res.json();
                    setAgentStatus(data);
                }
            } catch (err) {
                console.error('Failed to fetch agent status:', err);
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

    const skillFolderManifest = JSON.stringify({
        "skill.json": {
            name: "MyOpenClawSkill",
            version: "1.0.0",
            description: "An OpenClaw skill for MasterClaw",
            runtime: "node",
            entry: "index.js",
            triggers: ["chat"],
            connection: {
                url: typeof window !== 'undefined' ? window.location.origin : API_URL,
                transport: "websocket",
                path: "/socket.io"
            }
        }
    }, null, 2);

    const skillBoilerplate = `import { io } from 'socket.io-client';

// ── Connect to MasterClaw ──
const socket = io('${typeof window !== 'undefined' ? window.location.origin : API_URL}', {
  transports: ['websocket'],
  auth: { agentId: 'my-openclaw-skill' }
});

socket.on('connect', () => {
  console.log('🤖 Connected to MasterClaw');

  // Register your skill
  socket.emit('skill:register', {
    name: 'My Chat Handler',
    description: 'Handles chat messages via OpenClaw',
    trigger: 'chat'
  }, (ack) => {
    if (ack.ok) console.log('✅ Skill registered');
    else console.error('❌ Registration failed:', ack.error);
  });
});

// Handle incoming messages
socket.on('skill:execute', ({ trigger, params, requesterId, requestId }) => {
  console.log('📩 Received:', params.message);

  // Process the message and respond
  const reply = \`You said: \${params.message}\`;

  socket.emit('skill:result', {
    requesterId,
    requestId,
    trigger,
    result: { text: reply }
  });
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});`;

    const agentCount = agentStatus?.agents || 0;
    const isConnected = agentStatus?.connected || false;

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
                        </div>

                        {/* Content */}
                        <div className="agent-content">

                            {/* Agents Tab */}
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
                                            <p>Connect an OpenClaw skill or bot to get started. Use the <strong>Skill Folder</strong> tab to get the shared folder template.</p>
                                            <button
                                                className="btn-primary"
                                                onClick={() => setActiveTab('connect')}
                                            >
                                                Get Skill Folder →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Skill Folder Tab */}
                            {activeTab === 'connect' && (
                                <div className="connect-view">
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

                                    <div className="info-card">
                                        <div className="info-icon">💡</div>
                                        <div>
                                            <strong>How it works</strong>
                                            <p>Share this skill folder with any OpenClaw agent. They install it, run it, and it automatically connects to your MasterClaw.</p>
                                            <p className="dimmed">No tokens needed — agents opt-in voluntarily and can disconnect anytime.</p>
                                        </div>
                                    </div>

                                    <div className="section-label">Connection Details</div>
                                    <div className="connection-details">
                                        <div className="detail-item">
                                            <span className="detail-label">Socket URL</span>
                                            <div className="detail-value-wrap">
                                                <code>{typeof window !== 'undefined' ? window.location.origin : API_URL}</code>
                                                <button
                                                    className={`copy-mini ${copied === 'url' ? 'copied' : ''}`}
                                                    onClick={() => copyToClipboard(typeof window !== 'undefined' ? window.location.origin : API_URL, 'url')}
                                                >
                                                    {copied === 'url' ? '✓' : '📋'}
                                                </button>
                                            </div>
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

                            {/* Quick Start Tab */}
                            {activeTab === 'code' && (
                                <div className="code-view">
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
                                                <p className="step-note">Your agent will appear in the Agents tab automatically ✨</p>
                                            </div>
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
