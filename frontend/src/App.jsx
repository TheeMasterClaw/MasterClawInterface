import React, { useState, useEffect } from 'react';
import Avatar from './components/Avatar';
import Welcome from './screens/Welcome';
import Dashboard from './screens/Dashboard';
import ModeSelector from './components/ModeSelector';
import './App.css';

export default function App() {
  const [phase, setPhase] = useState('welcome'); // welcome, mode-select, dashboard
  const [mode, setMode] = useState(null); // text, voice, hybrid, context
  const [hasGreeted, setHasGreeted] = useState(false);

  // Trigger welcome greeting on mount
  useEffect(() => {
    if (!hasGreeted) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setHasGreeted(true);
        playWelcome();
      }, 500);
    }
  }, [hasGreeted]);

  const playWelcome = async () => {
    // Will call backend to synthesize "Welcome, Rex. Let's take over the world together."
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Welcome, Rex. Let\'s take over the world together.' })
      });
      const data = await response.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
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

  return (
    <div className="app">
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
