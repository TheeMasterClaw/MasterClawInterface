'use client';

import React, { useState, useEffect, useRef } from 'react';
// import './HealthMonitor.css';

// Health monitoring component for Claude Bot integration
export default function HealthMonitor({ isOpen, onClose }) {
  const [metrics, setMetrics] = useState({
    uptime: 0,
    responseTime: [],
    errorRate: 0,
    memoryUsage: 0,
    activeConnections: 0,
    lastHeartbeat: Date.now(),
    status: 'healthy'
  });
  
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    
    // Start health monitoring
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [isOpen]);

  const startMonitoring = () => {
    // Connect to health WebSocket if available
    connectHealthStream();
    
    // Start local metrics collection
    const interval = setInterval(() => {
      collectMetrics();
    }, 5000);
    
    return () => clearInterval(interval);
  };

  const stopMonitoring = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
  };

  const connectHealthStream = () => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_HEALTH_WS_URL || 'ws://localhost:3002/health';
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleHealthUpdate(data);
      };
      
      wsRef.current.onerror = () => {
        addLog('error', 'Health stream connection failed');
      };
      
      wsRef.current.onclose = () => {
        // Attempt reconnect
        reconnectTimer.current = setTimeout(connectHealthStream, 5000);
      };
    } catch (err) {
      console.log('Health WebSocket not available');
    }
  };

  const handleHealthUpdate = (data) => {
    setMetrics(prev => ({
      ...prev,
      ...data,
      lastHeartbeat: Date.now()
    }));
    
    // Check for issues
    if (data.errorRate > 0.1) {
      addAlert('warning', 'High error rate detected', data.errorRate);
    }
    
    if (data.memoryUsage > 0.9) {
      addAlert('critical', 'Memory usage critical', data.memoryUsage);
    }
    
    if (data.status !== 'healthy') {
      addAlert('error', `Status: ${data.status}`);
    }
  };

  const collectMetrics = () => {
    // Collect browser-side metrics
    const memory = performance.memory ? {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    } : null;
    
    const navigation = performance.getEntriesByType('navigation')[0];
    
    setMetrics(prev => ({
      ...prev,
      memoryUsage: memory ? memory.used / memory.limit : 0,
      uptime: Date.now() - (window.APP_START_TIME || Date.now()),
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.startTime : 0
    }));
  };

  const addLog = (level, message, data = null) => {
    setLogs(prev => {
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level,
        message,
        data
      };
      return [newLog, ...prev].slice(0, 100); // Keep last 100
    });
  };

  const addAlert = (severity, message, value = null) => {
    setAlerts(prev => {
      // Deduplicate similar alerts
      const exists = prev.find(a => a.message === message && Date.now() - a.timestamp < 60000);
      if (exists) return prev;
      
      return [{
        id: Date.now(),
        timestamp: Date.now(),
        severity,
        message,
        value
      }, ...prev].slice(0, 20);
    });
  };

  const clearAlerts = () => setAlerts([]);
  const clearLogs = () => setLogs([]);

  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'degraded': return '#fbbf24';
      case 'unhealthy': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const exportHealthData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      metrics,
      logs: logs.slice(0, 50),
      alerts
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="health-monitor-overlay" onClick={onClose}>
      <div className="health-monitor-panel" onClick={e => e.stopPropagation()}>
        <div className="health-monitor-header">
          <h2>🏥 Health Monitor</h2>
          <div className="health-monitor-actions">
            <button onClick={exportHealthData} title="Export Report">
              📥
            </button>
            <button onClick={onClose} title="Close">
              ×
            </button>
          </div>
        </div>

        <div className="health-monitor-content">
          {/* Status Overview */}
          <section className="health-section">
            <h3>System Status</h3>
            <div className="status-grid">
              <div className="status-card" style={{ borderColor: getStatusColor(metrics.status) }}>
                <div className="status-indicator" style={{ background: getStatusColor(metrics.status) }} />
                <div className="status-label">Status</div>
                <div className="status-value">{metrics.status.toUpperCase()}</div>
              </div>
              
              <div className="status-card">
                <div className="status-label">Uptime</div>
                <div className="status-value">{formatUptime(metrics.uptime)}</div>
              </div>
              
              <div className="status-card">
                <div className="status-label">Memory</div>
                <div className="status-value">{(metrics.memoryUsage * 100).toFixed(1)}%</div>
                <div className="memory-bar">
                  <div 
                    className="memory-fill" 
                    style={{ 
                      width: `${metrics.memoryUsage * 100}%`,
                      background: metrics.memoryUsage > 0.8 ? '#ef4444' : metrics.memoryUsage > 0.6 ? '#fbbf24' : '#22c55e'
                    }}
                  />
                </div>
              </div>
              
              <div className="status-card">
                <div className="status-label">Error Rate</div>
                <div className="status-value">{(metrics.errorRate * 100).toFixed(2)}%</div>
              </div>
              
              <div className="status-card">
                <div className="status-label">Connections</div>
                <div className="status-value">{metrics.activeConnections}</div>
              </div>
              
              <div className="status-card">
                <div className="status-label">Last Heartbeat</div>
                <div className="status-value">
                  {Math.floor((Date.now() - metrics.lastHeartbeat) / 1000)}s ago
                </div>
              </div>
            </div>
          </section>

          {/* Active Alerts */}
          {alerts.length > 0 && (
            <section className="health-section">
              <div className="section-header">
                <h3>🚨 Active Alerts ({alerts.length})</h3>
                <button onClick={clearAlerts} className="clear-btn">Clear</button>
              </div>
              <div className="alerts-list">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                    <span className="alert-icon">
                      {alert.severity === 'critical' && '🔴'}
                      {alert.severity === 'warning' && '🟡'}
                      {alert.severity === 'error' && '❌'}
                    </span>
                    <span className="alert-message">{alert.message}</span>
                    {alert.value !== null && (
                      <span className="alert-value">{alert.value.toFixed ? alert.value.toFixed(3) : alert.value}</span>
                    )}
                    <span className="alert-time">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Logs */}
          <section className="health-section">
            <div className="section-header">
              <h3>📝 Recent Logs ({logs.length})</h3>
              <button onClick={clearLogs} className="clear-btn">Clear</button>
            </div>
            <div className="logs-container">
              {logs.length === 0 ? (
                <div className="empty-state">No logs yet</div>
              ) : (
                logs.slice(0, 20).map(log => (
                  <div key={log.id} className={`log-item log-${log.level}`}>
                    <span className="log-timestamp">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`log-level log-level-${log.level}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Performance Metrics */}
          <section className="health-section">
            <h3>📊 Performance</h3>
            <div className="metrics-grid">
              <div className="metric-box">
                <div className="metric-label">Avg Response Time</div>
                <div className="metric-value">
                  {metrics.avgResponseTime ? `${metrics.avgResponseTime.toFixed(0)}ms` : 'N/A'}
                </div>
              </div>
              
              <div className="metric-box">
                <div className="metric-label">Page Load Time</div>
                <div className="metric-value">
                  {metrics.pageLoadTime ? `${metrics.pageLoadTime.toFixed(0)}ms` : 'N/A'}
                </div>
              </div>
              
              <div className="metric-box">
                <div className="metric-label">Total Requests</div>
                <div className="metric-value">{metrics.totalRequests || 0}</div>
              </div>
              
              <div className="metric-box">
                <div className="metric-label">Failed Requests</div>
                <div className="metric-value" style={{ color: metrics.failedRequests > 0 ? '#ef4444' : 'inherit' }}>
                  {metrics.failedRequests || 0}
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="health-section">
            <h3>⚡ Actions</h3>
            <div className="action-buttons">
              <button onClick={() => addLog('info', 'Manual health check triggered')}>
                🔍 Run Health Check
              </button>
              <button onClick={() => window.location.reload()}>
                🔄 Restart Connection
              </button>
              <button onClick={() => localStorage.clear()}>
                🗑️ Clear Cache
              </button>
              <button onClick={() => console.log('Full metrics:', metrics)}>
                🐛 Debug to Console
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
