import React, { useState, useEffect, useRef, useCallback } from 'react';
// import './SystemMonitor.css';
import { getApiUrl } from '../lib/apiUrl.js';

// Default refresh interval (ms)
const DEFAULT_REFRESH_INTERVAL = 2000;
const HISTORY_LENGTH = 30; // Number of data points to keep for charts

// Generate mock system data when backend is unavailable
const generateMockData = () => ({
  cpu: {
    usage: Math.floor(Math.random() * 60) + 10,
    cores: 4,
    temperature: Math.floor(Math.random() * 30) + 40,
    frequency: 2.4 + Math.random() * 1.2
  },
  memory: {
    total: 16384,
    used: Math.floor(Math.random() * 8000) + 4000,
    free: 0,
    percentage: 0
  },
  disk: {
    total: 512000,
    used: Math.floor(Math.random() * 300000) + 100000,
    free: 0,
    percentage: 0
  },
  network: {
    download: Math.floor(Math.random() * 10000),
    upload: Math.floor(Math.random() * 5000),
    totalDownload: Math.floor(Math.random() * 1000000000),
    totalUpload: Math.floor(Math.random() * 500000000)
  },
  uptime: Math.floor(Date.now() / 1000) - 3600,
  timestamp: Date.now()
});

// Calculate derived values
const calculateDerivedValues = (data) => {
  if (data.memory) {
    data.memory.percentage = Math.round((data.memory.used / data.memory.total) * 100);
    data.memory.free = data.memory.total - data.memory.used;
  }
  if (data.disk) {
    data.disk.percentage = Math.round((data.disk.used / data.disk.total) * 100);
    data.disk.free = data.disk.total - data.disk.used;
  }
  return data;
};

// Format bytes to human readable
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Format uptime
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Simple sparkline component
const Sparkline = ({ data, color, height = 40 }) => {
  if (!data || data.length === 0) return <div className="sparkline-empty" style={{ height }} />;
  
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
      <polygon
        fill={`${color}22`}
        points={`0,100 ${points} 100,100`}
      />
    </svg>
  );
};

// Circular progress component
const CircularProgress = ({ value, color, size = 80, strokeWidth = 8, label, sublabel }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="circular-progress-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="circular-progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div className="circular-progress-content">
        <span className="circular-progress-value">{Math.round(value)}%</span>
        {label && <span className="circular-progress-label">{label}</span>}
        {sublabel && <span className="circular-progress-sublabel">{sublabel}</span>}
      </div>
    </div>
  );
};

export default function SystemMonitor({ isOpen, onClose }) {
  const [systemData, setSystemData] = useState(null);
  const [history, setHistory] = useState({
    cpu: [],
    memory: [],
    network: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(DEFAULT_REFRESH_INTERVAL);
  const [isPaused, setIsPaused] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef(null);
  const API_URL = getApiUrl();

  // Fetch system data
  const fetchSystemData = useCallback(async () => {
    if (isPaused) return;

    try {
      let data;
      
      if (useMockData) {
        data = generateMockData();
      } else {
        try {
          const response = await fetch(`${API_URL}/system/stats`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          data = await response.json();
        } catch (err) {
          // Fallback to mock data on error
          data = generateMockData();
          setUseMockData(true);
        }
      }
      
      data = calculateDerivedValues(data);
      setSystemData(data);
      setError(null);
      
      // Update history
      setHistory(prev => ({
        cpu: [...prev.cpu.slice(-HISTORY_LENGTH + 1), data.cpu?.usage || 0],
        memory: [...prev.memory.slice(-HISTORY_LENGTH + 1), data.memory?.percentage || 0],
        network: [...prev.network.slice(-HISTORY_LENGTH + 1), (data.network?.download || 0) / 100]
      }));
      
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [API_URL, isPaused, useMockData]);

  // Setup polling
  useEffect(() => {
    if (!isOpen) return;

    fetchSystemData();
    intervalRef.current = setInterval(fetchSystemData, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, refreshInterval, fetchSystemData]);

  // Get color based on usage percentage
  const getUsageColor = (percentage) => {
    if (percentage < 50) return '#22c55e'; // green
    if (percentage < 75) return '#eab308'; // yellow
    if (percentage < 90) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  // Get temperature color
  const getTempColor = (temp) => {
    if (temp < 50) return '#22c55e';
    if (temp < 70) return '#eab308';
    if (temp < 85) return '#f97316';
    return '#ef4444';
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="system-panel-overlay" onClick={onClose}>
        <div className="system-panel" onClick={e => e.stopPropagation()}>
          <div className="system-panel-header">
            <h3>🖥️ System Monitor</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="system-loading">
            <div className="loading-spinner" />
            <p>Initializing system sensors...</p>
          </div>
        </div>
      </div>
    );
  }

  const cpuColor = systemData?.cpu ? getUsageColor(systemData.cpu.usage) : '#64748b';
  const memColor = systemData?.memory ? getUsageColor(systemData.memory.percentage) : '#64748b';
  const diskColor = systemData?.disk ? getUsageColor(systemData.disk.percentage) : '#64748b';

  return (
    <div className="system-panel-overlay" onClick={onClose}>
      <div className="system-panel" onClick={e => e.stopPropagation()}>
        <div className="system-panel-header">
          <h3>🖥️ System Monitor</h3>
          <div className="header-actions">
            {useMockData && <span className="mock-badge">Demo Mode</span>}
            <button 
              className={`pause-btn ${isPaused ? 'paused' : ''}`}
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? '▶️' : '⏸️'}
            </button>
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              ⚙️
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showSettings ? (
          <div className="system-settings">
            <h4>Monitor Settings</h4>
            
            <div className="setting-group">
              <label>Refresh Interval</label>
              <div className="interval-options">
                {[1000, 2000, 5000, 10000].map(interval => (
                  <button
                    key={interval}
                    className={refreshInterval === interval ? 'active' : ''}
                    onClick={() => setRefreshInterval(interval)}
                  >
                    {interval < 1000 ? `${interval}ms` : `${interval / 1000}s`}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Data Source</label>
              <div className="data-source-toggle">
                <button
                  className={!useMockData ? 'active' : ''}
                  onClick={() => setUseMockData(false)}
                >
                  Live System
                </button>
                <button
                  className={useMockData ? 'active' : ''}
                  onClick={() => setUseMockData(true)}
                >
                  Demo Data
                </button>
              </div>
            </div>

            <button className="back-btn" onClick={() => setShowSettings(false)}>
              ← Back to Monitor
            </button>
          </div>
        ) : (
          <>
            {/* Main Stats Grid */}
            <div className="system-stats-grid">
              {/* CPU */}
              <div className="stat-card cpu-card">
                <div className="stat-card-header">
                  <span className="stat-icon">🧠</span>
                  <span className="stat-title">CPU</span>
                </div>
                <div className="stat-card-content">
                  <CircularProgress 
                    value={systemData?.cpu?.usage || 0}
                    color={cpuColor}
                    size={100}
                    label="Usage"
                    sublabel={`${systemData?.cpu?.cores || 4} cores`}
                  />
                  <div className="stat-details">
                    <div className="stat-row">
                      <span className="stat-label">Temperature</span>
                      <span 
                        className="stat-value"
                        style={{ color: getTempColor(systemData?.cpu?.temperature || 0) }}
                      >
                        {systemData?.cpu?.temperature || 0}°C
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Frequency</span>
                      <span className="stat-value">
                        {(systemData?.cpu?.frequency || 0).toFixed(2)} GHz
                      </span>
                    </div>
                  </div>
                </div>
                <Sparkline data={history.cpu} color={cpuColor} />
              </div>

              {/* Memory */}
              <div className="stat-card memory-card">
                <div className="stat-card-header">
                  <span className="stat-icon">💾</span>
                  <span className="stat-title">Memory</span>
                </div>
                <div className="stat-card-content">
                  <CircularProgress 
                    value={systemData?.memory?.percentage || 0}
                    color={memColor}
                    size={100}
                    label="Used"
                    sublabel={`${formatBytes((systemData?.memory?.used || 0) * 1024 * 1024)}`}
                  />
                  <div className="stat-details">
                    <div className="stat-row">
                      <span className="stat-label">Total</span>
                      <span className="stat-value">
                        {formatBytes((systemData?.memory?.total || 0) * 1024 * 1024)}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Free</span>
                      <span className="stat-value">
                        {formatBytes((systemData?.memory?.free || 0) * 1024 * 1024)}
                      </span>
                    </div>
                  </div>
                </div>
                <Sparkline data={history.memory} color={memColor} />
              </div>

              {/* Disk */}
              <div className="stat-card disk-card">
                <div className="stat-card-header">
                  <span className="stat-icon">💿</span>
                  <span className="stat-title">Storage</span>
                </div>
                <div className="stat-card-content">
                  <CircularProgress 
                    value={systemData?.disk?.percentage || 0}
                    color={diskColor}
                    size={100}
                    label="Used"
                    sublabel={`${formatBytes((systemData?.disk?.used || 0) * 1024 * 1024)}`}
                  />
                  <div className="stat-details">
                    <div className="stat-row">
                      <span className="stat-label">Total</span>
                      <span className="stat-value">
                        {formatBytes((systemData?.disk?.total || 0) * 1024 * 1024)}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Free</span>
                      <span className="stat-value">
                        {formatBytes((systemData?.disk?.free || 0) * 1024 * 1024)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="disk-bar-container">
                  <div className="disk-bar-bg">
                    <div 
                      className="disk-bar-fill"
                      style={{ 
                        width: `${systemData?.disk?.percentage || 0}%`,
                        background: diskColor
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Network */}
              <div className="stat-card network-card">
                <div className="stat-card-header">
                  <span className="stat-icon">🌐</span>
                  <span className="stat-title">Network</span>
                </div>
                <div className="stat-card-content network-content">
                  <div className="network-current">
                    <div className="network-speed down">
                      <span className="speed-icon">⬇️</span>
                      <span className="speed-value">
                        {formatBytes(systemData?.network?.download || 0)}/s
                      </span>
                      <span className="speed-label">Download</span>
                    </div>
                    <div className="network-speed up">
                      <span className="speed-icon">⬆️</span>
                      <span className="speed-value">
                        {formatBytes(systemData?.network?.upload || 0)}/s
                      </span>
                      <span className="speed-label">Upload</span>
                    </div>
                  </div>
                  <div className="network-total">
                    <div className="total-row">
                      <span>Total Downloaded</span>
                      <span>{formatBytes(systemData?.network?.totalDownload || 0)}</span>
                    </div>
                    <div className="total-row">
                      <span>Total Uploaded</span>
                      <span>{formatBytes(systemData?.network?.totalUpload || 0)}</span>
                    </div>
                  </div>
                </div>
                <Sparkline data={history.network} color="#3b82f6" />
              </div>
            </div>

            {/* System Info Footer */}
            <div className="system-footer">
              <div className="system-info">
                <span className="uptime">
                  ⏱️ Uptime: {formatUptime(Math.floor(Date.now() / 1000) - (systemData?.uptime || Math.floor(Date.now() / 1000)))}
                </span>
                <span className="last-update">
                  Last update: {new Date(systemData?.timestamp || Date.now()).toLocaleTimeString()}
                </span>
              </div>
              <div className="system-actions">
                <button 
                  className="refresh-btn"
                  onClick={fetchSystemData}
                  disabled={isPaused}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="system-tips">
              <p>
                💡 <strong>Tip:</strong> {
                  systemData?.cpu?.usage > 80 
                    ? 'High CPU usage detected. Consider closing unnecessary applications.' 
                    : systemData?.memory?.percentage > 80
                    ? 'Memory usage is high. Closing unused tabs may help improve performance.'
                    : systemData?.disk?.percentage > 90
                    ? 'Storage is nearly full. Consider cleaning up files to free space.'
                    : 'System is running smoothly. Keep monitoring for optimal performance.'
                }
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Utility to get current system summary (for external use)
export const getSystemSummary = () => {
  if (typeof window === 'undefined') return null;
  
  const saved = localStorage.getItem('mc-system-last');
  if (!saved) return null;
  
  try {
    return JSON.parse(saved);
  } catch (e) {
    return null;
  }
};
