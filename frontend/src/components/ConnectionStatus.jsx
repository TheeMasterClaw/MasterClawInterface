'use client';

import React, { useState, useEffect } from 'react';
import './ConnectionStatus.css';

export default function ConnectionStatus({ gatewayClient }) {
  const [isConnected, setIsConnected] = useState(false);
  const [agentCount, setAgentCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!gatewayClient) return;

    const updateStatus = () => {
      setIsConnected(gatewayClient.isConnected?.() || false);
      setAgentCount(gatewayClient.agentCount || 0);
    };

    updateStatus();
    
    // Subscribe to connection events
    const handleConnect = () => {
      setIsConnected(true);
      updateStatus();
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
      setAgentCount(0);
    };

    gatewayClient.on?.('connect', handleConnect);
    gatewayClient.on?.('disconnect', handleDisconnect);

    // Poll for updates
    const interval = setInterval(updateStatus, 5000);

    return () => {
      gatewayClient.off?.('connect', handleConnect);
      gatewayClient.off?.('disconnect', handleDisconnect);
      clearInterval(interval);
    };
  }, [gatewayClient]);

  const handleClick = () => {
    if (!isConnected) {
      // Trigger connection dialog
      window.dispatchEvent(new CustomEvent('open-agent-connect'));
    } else {
      setShowDetails(!showDetails);
    }
  };

  return (
    <div className="connection-status-wrapper">
      <button 
        className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
        onClick={handleClick}
        title={isConnected ? `${agentCount} agent(s) connected` : 'Click to connect OpenClaw'}
      >
        <span className="status-dot" />
        <span className="status-text">
          {isConnected 
            ? `🟢 ${agentCount} Agent${agentCount !== 1 ? 's' : ''}` 
            : '🔴 Connect OpenClaw'}
        </span>
        {!isConnected && (
          <span className="connect-hint">Click to connect →</span>
        )}
      </button>

      {showDetails && isConnected && (
        <div className="connection-dropdown mc-animate-fade-in">
          <div className="dropdown-header">
            <span>Connected Agents</span>
            <button 
              className="close-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(false);
              }}
            >
              ×
            </button>
          </div>
          <div className="dropdown-content">
            <div className="agent-info">
              <div className="agent-icon">🤖</div>
              <div className="agent-details">
                <div className="agent-name">OpenClaw Agent</div>
                <div className="agent-status">Ready to chat</div>
              </div>
            </div>
            <div className="dropdown-actions">
              <button 
                className="mc-btn mc-btn-secondary mc-btn-sm"
                onClick={() => window.dispatchEvent(new CustomEvent('open-agent-connect'))}
              >
                Manage Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
