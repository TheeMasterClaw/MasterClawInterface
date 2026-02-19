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
    const [reconnecting, setReconnecting] = useState(false);

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

                // Check Gateway
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

    const handleReconnect = async () => {
        if (reconnecting) return;
        setReconnecting(true);

        try {
            await fetch(`${API_URL}/system/gateway/reconnect`, { method: 'POST' });
            await new Promise(r => setTimeout(r, 1000)); // Wait a sec
            // Trigger a check immediately after
            const gatewayRes = await fetch(`${API_URL}/system/gateway`);
            if (gatewayRes.ok) {
                const status = await gatewayRes.json();
                setGatewayStatus(status);
            }
        } catch (err) {
            console.error('Reconnect failed:', err);
        } finally {
            setReconnecting(false);
        }
    };

    const copyConfig = () => {
        const config = {
            gatewayUrl: API_URL.replace('http', 'ws'),
            gatewayToken: "YOUR_OPENCLAW_GATEWAY_TOKEN_HERE",
            botName: "Clawbot"
        };

        navigator.clipboard.writeText(JSON.stringify(config, null, 2));
        alert('Config template copied! Fill in the token from your backend .env file.');
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
                        🤖 Bot Setup
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
                                <h3>Clawnest Gateway</h3>
                                <div className={`status-indicator ${gatewayStatus?.connected ? 'connected' : 'disconnected'}`}>
                                    <span className="dot"></span>
                                    <span className="label">
                                        {gatewayStatus?.connected ? 'CONNECTED' : 'DISCONNECTED'}
                                    </span>
                                </div>

                                {gatewayStatus && (
                                    <div className="gateway-details">
                                        <div className="detail-row">
                                            <span>Target URL:</span>
                                            <code>{gatewayStatus.url || 'Not Configured'}</code>
                                        </div>
                                        <div className="detail-row">
                                            <span>Transport:</span>
                                            <span>{gatewayStatus.transport || '-'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>Queue:</span>
                                            <span>{gatewayStatus.queueLength} messages</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>Socket ID:</span>
                                            <code>{gatewayStatus.socketId || '-'}</code>
                                        </div>
                                    </div>
                                )}

                                <div className="actions">
                                    <button
                                        className="btn-reconnect"
                                        onClick={handleReconnect}
                                        disabled={reconnecting}
                                    >
                                        {reconnecting ? 'Reconnecting...' : '🔄 Force Reconnect'}
                                    </button>
                                </div>
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
                                <p>Ensure your <strong>MasterClaw Backend</strong> is running and accessible.</p>
                            </div>

                            <div className="instruction-step">
                                <span className="step-num">2</span>
                                <p>Configure your <strong>Clawbot</strong> with the following settings:</p>
                                <div className="code-block">
                                    <pre>{JSON.stringify({
                                        gatewayUrl: API_URL.replace('http', 'ws'),
                                        gatewayToken: "See backend .env"
                                    }, null, 2)}</pre>
                                </div>
                                <button className="btn-copy" onClick={copyConfig}>📋 Copy JSON Template</button>
                            </div>

                            <div className="instruction-step">
                                <span className="step-num">3</span>
                                <p>The token must match <code>OPENCLAW_GATEWAY_TOKEN</code> in your backend <code>.env</code> file.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
