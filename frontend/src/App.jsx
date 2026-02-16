import React, { useState, useEffect } from 'react';
import Avatar from './components/Avatar';
import Welcome from './screens/Welcome';
import Dashboard from './screens/Dashboard';
import ModeSelector from './components/ModeSelector';
import Settings from './components/Settings';
import HealthMonitor from './components/HealthMonitor';
import QuickLinksPanel from './components/QuickLinksPanel';
import ActivityLogPanel from './components/ActivityLogPanel';
import FocusTimer from './components/FocusTimer';
import WeatherPanel from './components/WeatherPanel';
import HabitTracker from './components/HabitTracker';
import DailyQuote from './components/DailyQuote';
import TimeTracker from './components/TimeTracker';
import MoodTracker from './components/MoodTracker';
import BreathingExercise from './components/BreathingExercise';
import ProductivityAnalytics from './components/ProductivityAnalytics';
import NotesPanel from './components/NotesPanel';
import JournalPanel from './components/JournalPanel';
import WaterTracker from './components/WaterTracker';
import QuestLog from './components/QuestLog';
import SnippetsPanel from './components/SnippetsPanel';
import Navbar from './components/Navbar';
import './App.css';

// Browser detection
const isBrowser = typeof window !== 'undefined';

export default function App() {
  const [phase, setPhase] = useState('welcome');
  const [hasGreeted, setHasGreeted] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [showSettings, setShowSettings] = useState(false);
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [showQuickLinksPanel, setShowQuickLinksPanel] = useState(false);
  const [showActivityLogPanel, setShowActivityLogPanel] = useState(false);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [showWeatherPanel, setShowWeatherPanel] = useState(false);
  const [showHabitTracker, setShowHabitTracker] = useState(false);
  const [showDailyQuote, setShowDailyQuote] = useState(false);
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [showProductivityAnalytics, setShowProductivityAnalytics] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showJournalPanel, setShowJournalPanel] = useState(false);
  const [showWaterTracker, setShowWaterTracker] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showSnippetsPanel, setShowSnippetsPanel] = useState(false);

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
      const API_URL = import.meta.env.VITE_GATEWAY_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

  const handleBack = () => {
    if (phase === 'dashboard') {
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
      {/* Navbar - always visible across all phases */}
      <Navbar 
        phase={phase}
        connectionStatus={connectionStatus}
        onBack={handleBack}
        onSettingsClick={() => setShowSettings(true)}
        onHealthClick={() => setShowHealthMonitor(true)}
        onLinksClick={() => setShowQuickLinksPanel(true)}
        onActivityClick={() => setShowActivityLogPanel(true)}
        onFocusClick={() => setShowFocusTimer(true)}
        onWeatherClick={() => setShowWeatherPanel(true)}
        onHabitClick={() => setShowHabitTracker(true)}
        onQuoteClick={() => setShowDailyQuote(true)}
        onTimeClick={() => setShowTimeTracker(true)}
        onMoodClick={() => setShowMoodTracker(true)}
        onBreathingClick={() => setShowBreathingExercise(true)}
        onProductivityClick={() => setShowProductivityAnalytics(true)}
        onNotesClick={() => setShowNotesPanel(true)}
        onJournalClick={() => setShowJournalPanel(true)}
        onWaterClick={() => setShowWaterTracker(true)}
        onQuestLogClick={() => setShowQuestLog(true)}
        onSnippetsClick={() => setShowSnippetsPanel(true)}
      />

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

      {showActivityLogPanel && (
        <ActivityLogPanel
          isOpen={showActivityLogPanel}
          onClose={() => setShowActivityLogPanel(false)}
        />
      )}

      {showFocusTimer && (
        <FocusTimer
          isOpen={showFocusTimer}
          onClose={() => setShowFocusTimer(false)}
        />
      )}

      {showWeatherPanel && (
        <WeatherPanel
          isOpen={showWeatherPanel}
          onClose={() => setShowWeatherPanel(false)}
        />
      )}

      {showHabitTracker && (
        <HabitTracker
          isOpen={showHabitTracker}
          onClose={() => setShowHabitTracker(false)}
        />
      )}

      {showDailyQuote && (
        <DailyQuote
          isOpen={showDailyQuote}
          onClose={() => setShowDailyQuote(false)}
        />
      )}

      {showTimeTracker && (
        <TimeTracker
          isOpen={showTimeTracker}
          onClose={() => setShowTimeTracker(false)}
        />
      )}

      {showMoodTracker && (
        <MoodTracker
          isOpen={showMoodTracker}
          onClose={() => setShowMoodTracker(false)}
        />
      )}

      {showBreathingExercise && (
        <BreathingExercise
          isOpen={showBreathingExercise}
          onClose={() => setShowBreathingExercise(false)}
        />
      )}

      {showProductivityAnalytics && (
        <ProductivityAnalytics
          isOpen={showProductivityAnalytics}
          onClose={() => setShowProductivityAnalytics(false)}
        />
      )}

      {showNotesPanel && (
        <NotesPanel
          isOpen={showNotesPanel}
          onClose={() => setShowNotesPanel(false)}
        />
      )}

      {showJournalPanel && (
        <JournalPanel
          isOpen={showJournalPanel}
          onClose={() => setShowJournalPanel(false)}
        />
      )}

      {showWaterTracker && (
        <WaterTracker
          isOpen={showWaterTracker}
          onClose={() => setShowWaterTracker(false)}
        />
      )}

      {showQuestLog && (
        <QuestLog
          isOpen={showQuestLog}
          onClose={() => setShowQuestLog(false)}
        />
      )}

      {showSnippetsPanel && (
        <SnippetsPanel
          isOpen={showSnippetsPanel}
          onClose={() => setShowSnippetsPanel(false)}
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
          onContinue={() => setPhase('dashboard')}
          avatar={<Avatar />}
        />
      )}

      {phase === 'dashboard' && (
        <Dashboard 
          mode="hybrid" 
          avatar={<Avatar />} 
          onConnectionStatusChange={setConnectionStatus}
        />
      )}
    </div>
  );
}
