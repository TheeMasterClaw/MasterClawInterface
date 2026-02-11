import React, { useState, useEffect } from 'react';
import './Settings.css';

// Default values from build-time env vars
const DEFAULT_GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || '';
const DEFAULT_GATEWAY_TOKEN = import.meta.env.VITE_GATEWAY_TOKEN || '';

export default function Settings({ onClose, onSave, connectionStatus = 'unknown' }) {
  const [settings, setSettings] = useState({
    ttsProvider: 'openai',
    ttsVoice: 'alloy',
    gatewayUrl: '',
    gatewayToken: '',
    theme: 'dark',
    notifications: true
  });

  const [saved, setSaved] = useState(false);
  const [showDefaults, setShowDefaults] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('mc-settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('mc-settings', JSON.stringify(settings));
    setSaved(true);
    if (onSave) onSave(settings);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults? This will clear your custom gateway configuration.')) {
      localStorage.removeItem('mc-settings');
      setSettings({
        ttsProvider: 'openai',
        ttsVoice: 'alloy',
        gatewayUrl: '',
        gatewayToken: '',
        theme: 'dark',
        notifications: true
      });
      setSaved(true);
      if (onSave) onSave({});
      setTimeout(() => {
        setSaved(false);
        window.location.reload();
      }, 1000);
    }
  };

  const getEffectiveValue = (key) => {
    return settings[key] || {
      gatewayUrl: DEFAULT_GATEWAY_URL,
      gatewayToken: DEFAULT_GATEWAY_TOKEN
    }[key] || '';
  };

  const ttsVoices = {
    openai: [
      { id: 'alloy', name: 'Alloy (Neutral)' },
      { id: 'echo', name: 'Echo (Male)' },
      { id: 'fable', name: 'Fable (Male, British)' },
      { id: 'onyx', name: 'Onyx (Male)' },
      { id: 'nova', name: 'Nova (Female)' },
      { id: 'shimmer', name: 'Shimmer (Female)' }
    ],
    elevenlabs: [
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
      { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
      { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
      { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' }
    ]
  };

  const statusColors = {
    connected: '#22c55e',
    reconnecting: '#fbbf24',
    connecting: '#3b82f6',
    offline: '#ef4444',
    error: '#ef4444',
    unconfigured: '#94a3b8'
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          {/* Connection Status */}
          <section className="settings-section">
            <h3>🔌 Connection Status</h3>
            <div className="connection-info">
              <div className="status-badge" style={{ 
                backgroundColor: `${statusColors[connectionStatus]}20`,
                borderColor: `${statusColors[connectionStatus]}50`,
                color: statusColors[connectionStatus]
              }}>
                {connectionStatus === 'connected' && '🟢 Connected'}
                {connectionStatus === 'reconnecting' && '🔄 Reconnecting...'}
                {connectionStatus === 'connecting' && '⏳ Connecting...'}
                {connectionStatus === 'offline' && '🔴 Offline'}
                {connectionStatus === 'error' && '❌ Error'}
                {connectionStatus === 'unconfigured' && '⚙️ Not Configured'}
                {connectionStatus === 'unknown' && '⚪ Unknown'}
              </div>
              
              <div className="current-endpoint">
                <small>Active Gateway:</small>
                <code>{getEffectiveValue('gatewayUrl') || 'Not set'}</code>
              </div>
            </div>
          </section>

          {/* Gateway Settings */}
          <section className="settings-section">
            <h3>🔧 Gateway Configuration</h3>
            
            <div className="settings-field">
              <label>Gateway URL</label>
              <input 
                type="text"
                value={settings.gatewayUrl}
                onChange={(e) => handleChange('gatewayUrl', e.target.value)}
                placeholder={DEFAULT_GATEWAY_URL || "https://your-gateway.ngrok.io"}
              />
              <small>
                {settings.gatewayUrl ? 'Custom URL set' : `Using default: ${DEFAULT_GATEWAY_URL || 'none'}`}
              </small>
            </div>

            <div className="settings-field">
              <label>Gateway Token</label>
              <input 
                type="password"
                value={settings.gatewayToken}
                onChange={(e) => handleChange('gatewayToken', e.target.value)}
                placeholder={DEFAULT_GATEWAY_TOKEN ? '••••••••' : "Your gateway token"}
              />
              <small>
                {settings.gatewayToken ? 'Custom token set' : (DEFAULT_GATEWAY_TOKEN ? 'Using default token' : 'No token configured')}
              </small>
            </div>

            {(!DEFAULT_GATEWAY_URL || showDefaults) && (
              <div className="settings-note">
                <small>
                  💡 <strong>No default gateway configured.</strong> Set your gateway URL above or 
                  rebuild with VITE_GATEWAY_URL environment variable.
                </small>
              </div>
            )}
          </section>

          {/* TTS Settings */}
          <section className="settings-section">
            <h3>🗣️ Voice (TTS)</h3>
            
            <div className="settings-field">
              <label>Provider</label>
              <select 
                value={settings.ttsProvider}
                onChange={(e) => handleChange('ttsProvider', e.target.value)}
              >
                <option value="openai">OpenAI</option>
                <option value="elevenlabs">ElevenLabs</option>
              </select>
            </div>

            <div className="settings-field">
              <label>Voice</label>
              <select 
                value={settings.ttsVoice}
                onChange={(e) => handleChange('ttsVoice', e.target.value)}
              >
                {ttsVoices[settings.ttsProvider]?.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Appearance */}
          <section className="settings-section">
            <h3>🎨 Appearance</h3>
            
            <div className="settings-field">
              <label>Theme</label>
              <select 
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
              >
                <option value="dark">Dark (Default)</option>
                <option value="light">Light</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-checkbox">
                <input 
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleChange('notifications', e.target.checked)}
                />
                Enable browser notifications
              </label>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button className="settings-reset-btn" onClick={handleReset}>
            Reset to Defaults
          </button>
          {saved && <span className="settings-saved">✓ Saved!</span>}
          <button className="settings-save-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
