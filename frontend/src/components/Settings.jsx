import React, { useState, useEffect } from 'react';
import './Settings.css';

export default function Settings({ onClose, onSave }) {
  const [settings, setSettings] = useState({
    ttsProvider: 'openai',
    ttsVoice: 'alloy',
    gatewayUrl: '',
    gatewayToken: '',
    theme: 'dark',
    notifications: true
  });

  const [saved, setSaved] = useState(false);

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

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
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

          {/* Gateway Settings */}
          <section className="settings-section">
            <h3>🔌 OpenClaw Gateway</h3>
            
            <div className="settings-field">
              <label>Gateway URL</label>
              <input 
                type="text"
                value={settings.gatewayUrl}
                onChange={(e) => handleChange('gatewayUrl', e.target.value)}
                placeholder="https://your-gateway.ngrok.io"
              />
              <small>Leave empty to use default</small>
            </div>

            <div className="settings-field">
              <label>Gateway Token</label>
              <input 
                type="password"
                value={settings.gatewayToken}
                onChange={(e) => handleChange('gatewayToken', e.target.value)}
                placeholder="Your gateway token"
              />
              <small>Leave empty to use default</small>
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
                Enable notifications
              </label>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          {saved && <span className="settings-saved">✓ Saved!</span>}
          <button className="settings-save-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
