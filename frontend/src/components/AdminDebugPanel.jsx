import React, { useState, useEffect } from 'react';
import { useUIStore } from '../lib/store';
import { getApiUrl } from '../lib/apiUrl';
import '../styles/AdminDebugPanel.css';

const API_URL = getApiUrl();

export default function AdminDebugPanel({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('health');

    // Connection Stats
    const [gatewayStatus, setGatewayStatus] = useState(null);
    const [backendStatus, setBackendStatus] = useState('checking');
    const [lastCheck, setLastCheck] = useState(null);

    // Auto-refresh timer
    useEffect(() => {
        if (!isOpen) return;

        const checkHealth = async () => {
            try {
                // Check Backend
                const healthRes = await fetch(`${API_URL}/health`);
                if (healthRes.ok) {
                    setBackendStatus('connected');
                } else {
                    setBackendStatus('error');
                }

                // Check Gateway (now returns agent/skill info)
                const gatewayRes = await fetch(`${API_URL}/system/gateway`);
                if (gatewayRes.ok) {
                    const status = await gatewayRes.json();
                    setGatewayStatus(status);
                }

                setLastCheck(new Date());
            } catch (err) {
                console.error('Debug check failed:', err);
                setBackendStatus('offline');
                setGatewayStatus(null);
            }
        };

        checkHealth();
        const timer = setInterval(checkHealth, 5000);
        return () => clearInterval(timer);
    }, [isOpen]);

    const copySocketConfig = () => {
        const config = {
            socketUrl: API_URL.replace('http', 'ws'),
            socketPath: '/socket.io',
            auth: { agentId: 'your-agent-name' },
            skillExample: {
                name: 'MyChatHandler',
                description: 'Handles chat messages',
                trigger: 'chat'
            }
        };

        navigator.clipboard.writeText(JSON.stringify(config, null, 2));
        alert('Socket config copied! Use this to connect your agent.');
    };

    if (!isOpen) return null;

    return (
        <div className="admin-debug-overlay" onClick={onClose}>
            <div className="admin-debug-panel" onClick={e => e.stopPropagation()}>
                <div className="debug-header">
                    <div className="header-title">
                        <span className="header-icon">🛠️</span>
                        <h2>Admin Debugger</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="debug-tabs">
                    <button
                        className={`debug-tab ${activeTab === 'health' ? 'active' : ''}`}
                        onClick={() => setActiveTab('health')}
                    >
                        📡 Connection Health
                    </button>
                    <button
                        className={`debug-tab ${activeTab === 'bot' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bot')}
                    >
                        🤖 Agent Setup
                    </button>
                </div>

                <div className="debug-content">
                    {activeTab === 'health' && (
                        <div className="health-view">
                            <div className="status-card">
                                <h3>Backend API</h3>
                                <div className={`status-indicator ${backendStatus}`}>
                                    <span className="dot"></span>
                                    <span className="label">
                                        {backendStatus === 'connected' ? 'ONLINE' : backendStatus.toUpperCase()}
                                    </span>
                                </div>
                                <div className="details">URL: {API_URL}</div>
                            </div>

                            <div className="status-card">
                                <h3>Connected Agents</h3>
                                <div className={`status-indicator ${gatewayStatus?.connected ? 'connected' : 'disconnected'}`}>
                                    <span className="dot"></span>
                                    <span className="label">
                                        {gatewayStatus?.connected ? `${gatewayStatus.agents} AGENT(S)` : 'NO AGENTS'}
                                    </span>
                                </div>

                                {gatewayStatus && (
                                    <div className="gateway-details">
                                        {gatewayStatus.chatAgent && (
                                            <div className="detail-row">
                                                <span>Chat Agent:</span>
                                                <code>{gatewayStatus.chatAgent.name}</code>
                                            </div>
                                        )}
                                        <div className="detail-row">
                                            <span>Registered Skills:</span>
                                            <span>{gatewayStatus.skills?.length || 0}</span>
                                        </div>
                                        {gatewayStatus.skills?.map((s, i) => (
                                            <div className="detail-row" key={i}>
                                                <span>  /{s.trigger}</span>
                                                <code>{s.name}</code>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="last-check">
                                Last updated: {lastCheck?.toLocaleTimeString()}
                            </div>
                        </div>
                    )}

                    {activeTab === 'bot' && (
                        <div className="bot-setup-view">
                            <div className="instruction-step">
                                <span className="step-num">1</span>
                                <p>Connect your agent to MasterClaw via <strong>Socket.IO</strong>. No tokens needed — agents opt-in voluntarily.</p>
                            </div>

                            <div className="instruction-step">
                                <span className="step-num">2</span>
                                <p>Register skills by emitting <code>skill:register</code>:</p>
                                <div className="code-block">
                                    <pre>{JSON.stringify({
                                        event: 'skill:register',
                                        payload: {
                                            name: 'MyChatHandler',
                                            description: 'Handles free-form chat messages',
                                            trigger: 'chat'
                                        }
                                    }, null, 2)}</pre>
                                </div>
                                <button className="btn-copy" onClick={copySocketConfig}>📋 Copy Socket Config</button>
                            </div>

                            <div className="instruction-step">
                                <span className="step-num">3</span>
                                <p>Listen for <code>skill:execute</code> events to handle invocations, then emit <code>skill:result</code> with the response.</p>
                            </div>

                            <div className="instruction-step">
                                <span className="step-num">4</span>
                                <p>Fetch <code>/manifest.json</code> from this backend to discover available skills and connection details.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
