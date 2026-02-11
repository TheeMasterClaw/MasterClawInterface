import React, { useState, useEffect } from 'react';
import Avatar from './components/Avatar';
import Welcome from './screens/Welcome';
import Dashboard from './screens/Dashboard';
import ModeSelector from './components/ModeSelector';
import Settings from './components/Settings';
import './App.css';

export default function App() {
  const [phase, setPhase] = useState('welcome');
  const [mode, setMode] = useState(null);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [showSettings, setShowSettings] = useState(false);

  // Load theme on mount
  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
    const savedTheme = settings.theme || 'dark';
    
    if (savedTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme class to body
  useEffect(() => {
    document.body.className = theme === 'light' ? 'theme-light' : '';
  }, [theme]);

  // Trigger welcome greeting on mount
  useEffect(() => {
    if (!hasGreeted) {
      setTimeout(() => {
        setHasGreeted(true);
        playWelcome();
      }, 500);
    }
  }, [hasGreeted]);

  const playWelcome = async () => {
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

      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)} 
          onSave={() => window.location.reload()}
          connectionStatus="unknown"
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
