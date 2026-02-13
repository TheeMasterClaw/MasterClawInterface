import React, { useState, useEffect } from 'react';
import Avatar from './components/Avatar';
import Welcome from './screens/Welcome';
import Dashboard from './screens/Dashboard';
import ModeSelector from './components/ModeSelector';
import Settings from './components/Settings';
import HealthMonitor from './components/HealthMonitor';
import QuickLinksPanel from './components/QuickLinksPanel';
import './App.css';

// Browser detection
const isBrowser = typeof window !== 'undefined';

export default function App() {
  const [phase, setPhase] = useState('welcome');
  const [mode, setMode] = useState(null);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [showSettings, setShowSettings] = useState(false);
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [showQuickLinksPanel, setShowQuickLinksPanel] = useState(false);

  // Load theme on mount
  useEffect(() => {
    if (!isBrowser) return;

    try {
      const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
      const savedTheme = settings.theme || 'dark';

      if (savedTheme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      } else {
        setTheme(savedTheme);
      }
    } catch (e) {
      console.error('Failed to load theme:', e);
    }
  }, []);

  // Apply theme class to body
  useEffect(() => {
    if (!isBrowser) return;
    document.body.className = theme === 'light' ? 'theme-light' : '';
  }, [theme]);

  // Trigger welcome greeting on mount
  useEffect(() => {
    if (!isBrowser || hasGreeted) return;

    const timer = setTimeout(() => {
      setHasGreeted(true);
      playWelcome();
    }, 500);

    return () => clearTimeout(timer);
  }, [hasGreeted]);

  const playWelcome = async () => {
    if (!isBrowser) return;

    try {
      const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
      const provider = settings.ttsProvider || 'openai';
      const voice = settings.ttsVoice || 'alloy';
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Welcome, Rex. Let\'s take over the world together.',
          provider,
          voice
        })
      });
      const data = await response.json();
      if (data.audioUrl) {
        const audio = new Audio(`${API_URL.replace(/\/$/, '')}${data.audioUrl}`);
        audio.play();
      }
    } catch (err) {
      console.log('TTS unavailable, proceeding with silent greeting');
    }
  };

  const handleModeSelected = (selectedMode) => {
    setMode(selectedMode);
    setPhase('dashboard');
  };

  const handleBack = () => {
    if (phase === 'dashboard') {
      setPhase('mode-select');
    } else if (phase === 'mode-select') {
      setPhase('welcome');
    }
  };

  const handleSaveSettings = () => {
    if (isBrowser) {
      window.location.reload();
    }
  };

  return (
    <div className={`app app--${theme}`}>
      {/* Settings button - always visible */}
      <button
        className="global-settings-btn"
        onClick={() => setShowSettings(true)}
        title="Settings"
      >
        ⚙️
      </button>

      {/* Health Monitor button - always visible */}
      <button
        className="global-health-btn"
        onClick={() => setShowHealthMonitor(true)}
        title="Health Monitor"
      >
        🏥
      </button>

      {/* Quick Links button - always visible */}
      <button
        className="global-links-btn"
        onClick={() => setShowQuickLinksPanel(true)}
        title="Quick Links"
      >
        🔗
      </button>

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          connectionStatus="unknown"
        />
      )}

      {showHealthMonitor && (
        <HealthMonitor
          isOpen={showHealthMonitor}
          onClose={() => setShowHealthMonitor(false)}
        />
      )}

      {showQuickLinksPanel && (
        <QuickLinksPanel
          isOpen={showQuickLinksPanel}
          onClose={() => setShowQuickLinksPanel(false)}
        />
      )}

      {/* Back button for non-welcome screens */}
      {phase !== 'welcome' && (
        <button
          className="back-button"
          onClick={handleBack}
          title="Go back"
        >
          ←
        </button>
      )}

      {phase === 'welcome' && (
        <Welcome
          onContinue={() => setPhase('mode-select')}
          avatar={<Avatar />}
        />
      )}

      {phase === 'mode-select' && (
        <ModeSelector onSelect={handleModeSelected} avatar={<Avatar />} />
      )}

      {phase === 'dashboard' && mode && (
        <Dashboard mode={mode} avatar={<Avatar />} />
      )}
    </div>
  );
}
