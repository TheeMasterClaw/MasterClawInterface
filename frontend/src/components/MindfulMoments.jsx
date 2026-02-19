'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
// import './MindfulMoments.css';

const MEDITATION_PRESETS = [
  { id: 'quick', name: 'Quick Reset', duration: 5, description: '5 minutes to center yourself' },
  { id: 'standard', name: 'Daily Practice', duration: 10, description: 'Standard 10-minute session' },
  { id: 'deep', name: 'Deep Dive', duration: 20, description: '20 minutes for deeper practice' },
  { id: 'extended', name: 'Extended Journey', duration: 30, description: '30 minutes of extended practice' },
  { id: 'custom', name: 'Custom', duration: 15, description: 'Set your own duration' }
];

const AMBIENT_SOUNDS = [
  { id: 'none', name: 'Silence', icon: '🔇' },
  { id: 'rain', name: 'Gentle Rain', icon: '🌧️' },
  { id: 'waves', name: 'Ocean Waves', icon: '🌊' },
  { id: 'forest', name: 'Forest Birds', icon: '🌲' },
  { id: 'bowl', name: 'Singing Bowl', icon: '🥣' },
  { id: 'white', name: 'White Noise', icon: '🌫️' }
];

const BELL_SOUNDS = [
  { id: 'soft', name: 'Soft Bell', icon: '🔔' },
  { id: 'bowl', name: 'Tibetan Bowl', icon: '🥣' },
  { id: 'chime', name: 'Chime', icon: '✨' },
  { id: 'gong', name: 'Gong', icon: '🎵' }
];

const GUIDANCE_TYPES = [
  { id: 'unguided', name: 'Unguided', description: 'Silent practice' },
  { id: 'breathing', name: 'Breathing Focus', description: 'Follow your breath' },
  { id: 'body', name: 'Body Scan', description: 'Progressive relaxation' },
  { id: 'loving', name: 'Loving-Kindness', description: 'Metta practice' }
];

export default function MindfulMoments({ isOpen, onClose }) {
  const [view, setView] = useState('home'); // home, timer, history, stats
  const [selectedPreset, setSelectedPreset] = useState(MEDITATION_PRESETS[1]);
  const [customDuration, setCustomDuration] = useState(15);
  const [selectedAmbient, setSelectedAmbient] = useState(AMBIENT_SOUNDS[0]);
  const [selectedBell, setSelectedBell] = useState(BELL_SOUNDS[0]);
  const [selectedGuidance, setSelectedGuidance] = useState(GUIDANCE_TYPES[0]);
  
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [breathPhase, setBreathPhase] = useState('inhale'); // inhale, hold, exhale
  
  const intervalRef = useRef(null);
  const breathIntervalRef = useRef(null);
  const audioContextRef = useRef(null);

  // Load session history
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-meditation-sessions');
      if (saved) {
        try {
          setSessionHistory(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse meditation history:', e);
        }
      }
    }
  }, [isOpen]);

  // Save session history
  const saveHistory = useCallback((history) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-meditation-sessions', JSON.stringify(history.slice(-100)));
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Breathing guidance animation
  useEffect(() => {
    if (isRunning && selectedGuidance.id === 'breathing') {
      breathIntervalRef.current = setInterval(() => {
        setBreathPhase(prev => {
          if (prev === 'inhale') return 'hold';
          if (prev === 'hold') return 'exhale';
          return 'inhale';
        });
      }, 4000); // 4 seconds per phase
    } else {
      setBreathPhase('inhale');
    }

    return () => {
      if (breathIntervalRef.current) {
        clearInterval(breathIntervalRef.current);
      }
    };
  }, [isRunning, selectedGuidance]);

  const playBell = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different bell types
      const frequencies = {
        soft: 528,
        bowl: 432,
        chime: 880,
        gong: 144
      };
      
      oscillator.frequency.value = frequencies[selectedBell.id] || 528;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 3);
    } catch (e) {
      console.log('Audio not available');
    }
  };

  const handleStart = () => {
    const duration = selectedPreset.id === 'custom' ? customDuration : selectedPreset.duration;
    setTimeLeft(duration * 60);
    setIsRunning(true);
    setIsPaused(false);
    setView('timer');
    playBell();
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setView('home');
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
  };

  const handleSessionComplete = () => {
    setIsRunning(false);
    playBell();
    
    const duration = selectedPreset.id === 'custom' ? customDuration : selectedPreset.duration;
    const newSession = {
      id: Date.now(),
      date: new Date().toISOString(),
      duration,
      preset: selectedPreset.name,
      guidance: selectedGuidance.name,
      ambient: selectedAmbient.name
    };
    
    const updated = [...sessionHistory, newSession];
    setSessionHistory(updated);
    saveHistory(updated);
    
    // Play completion bell twice
    setTimeout(() => playBell(), 1000);
    
    setView('complete');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTodaySessions = () => {
    const today = new Date().toDateString();
    return sessionHistory.filter(s => new Date(s.date).toDateString() === today);
  };

  const getCurrentStreak = () => {
    if (sessionHistory.length === 0) return 0;
    
    const dates = [...new Set(sessionHistory.map(s => new Date(s.date).toDateString()))].sort(
      (a, b) => new Date(b) - new Date(a)
    );
    
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    
    for (let i = 0; i < dates.length; i++) {
      if (i === 0 && (dates[i] === today || dates[i] === yesterday)) {
        streak = 1;
        continue;
      }
      const current = new Date(dates[i]);
      const prev = new Date(dates[i - 1]);
      const diffDays = Math.round((prev - current) / 86400000);
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getTotalMinutes = () => {
    return sessionHistory.reduce((acc, s) => acc + s.duration, 0);
  };

  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const sessions = sessionHistory.filter(s => new Date(s.date).toDateString() === dateStr);
      const minutes = sessions.reduce((acc, s) => acc + s.duration, 0);
      weekData.push({
        day: days[date.getDay()],
        minutes,
        sessions: sessions.length
      });
    }
    return weekData;
  };

  const clearHistory = () => {
    if (confirm('Clear all meditation history?')) {
      setSessionHistory([]);
      saveHistory([]);
    }
  };

  if (!isOpen) return null;

  const todaySessions = getTodaySessions();
  const currentStreak = getCurrentStreak();
  const totalMinutes = getTotalMinutes();
  const weeklyData = getWeeklyData();

  return (
    <div className="mindful-panel-overlay" onClick={onClose}>
      <div className="mindful-panel" onClick={e => e.stopPropagation()}>
        <div className="mindful-panel-header">
          <h3>🧘 Mindful Moments</h3>
          <div className="header-actions">
            <button 
              className={`view-btn ${view === 'home' ? 'active' : ''}`}
              onClick={() => setView('home')}
            >
              Home
            </button>
            <button 
              className={`view-btn ${view === 'history' ? 'active' : ''}`}
              onClick={() => setView('history')}
            >
              History
            </button>
            <button 
              className={`view-btn ${view === 'stats' ? 'active' : ''}`}
              onClick={() => setView('stats')}
            >
              Stats
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {view === 'home' && (
          <div className="mindful-home">
            {/* Quick Stats */}
            <div className="mindful-stats-row">
              <div className="stat-card">
                <span className="stat-icon">🔥</span>
                <span className="stat-value">{currentStreak}</span>
                <span className="stat-label">Day Streak</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">⏱️</span>
                <span className="stat-value">{totalMinutes}</span>
                <span className="stat-label">Total Minutes</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🧘</span>
                <span className="stat-value">{todaySessions.length}</span>
                <span className="stat-label">Today</span>
              </div>
            </div>

            {/* Duration Presets */}
            <div className="section">
              <h4>Choose Duration</h4>
              <div className="preset-grid">
                {MEDITATION_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    className={`preset-card ${selectedPreset.id === preset.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPreset(preset)}
                  >
                    <span className="preset-name">{preset.name}</span>
                    <span className="preset-duration">{preset.id === 'custom' ? `${customDuration} min` : `${preset.duration} min`}</span>
                    <span className="preset-desc">{preset.description}</span>
                  </button>
                ))}
              </div>
              
              {selectedPreset.id === 'custom' && (
                <div className="custom-duration">
                  <label>Duration (minutes):</label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                  />
                  <span className="duration-value">{customDuration} min</span>
                </div>
              )}
            </div>

            {/* Guidance Type */}
            <div className="section">
              <h4>Guidance Type</h4>
              <div className="guidance-grid">
                {GUIDANCE_TYPES.map(guidance => (
                  <button
                    key={guidance.id}
                    className={`guidance-card ${selectedGuidance.id === guidance.id ? 'selected' : ''}`}
                    onClick={() => setSelectedGuidance(guidance)}
                  >
                    <span className="guidance-name">{guidance.name}</span>
                    <span className="guidance-desc">{guidance.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ambient Sound */}
            <div className="section">
              <h4>Ambient Sound</h4>
              <div className="ambient-grid">
                {AMBIENT_SOUNDS.map(sound => (
                  <button
                    key={sound.id}
                    className={`ambient-card ${selectedAmbient.id === sound.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAmbient(sound)}
                  >
                    <span className="ambient-icon">{sound.icon}</span>
                    <span className="ambient-name">{sound.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bell Sound */}
            <div className="section">
              <h4>Start/End Bell</h4>
              <div className="bell-grid">
                {BELL_SOUNDS.map(bell => (
                  <button
                    key={bell.id}
                    className={`bell-card ${selectedBell.id === bell.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBell(bell)}
                  >
                    <span className="bell-icon">{bell.icon}</span>
                    <span className="bell-name">{bell.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button className="start-meditation-btn" onClick={handleStart}>
              <span className="btn-icon">🧘</span>
              <span className="btn-text">Begin Session</span>
              <span className="btn-duration">{selectedPreset.id === 'custom' ? customDuration : selectedPreset.duration} min</span>
            </button>
          </div>
        )}

        {view === 'timer' && (
          <div className="meditation-timer">
            <div className="timer-container">
              {/* Breathing Animation */}
              {selectedGuidance.id === 'breathing' && (
                <div className={`breathing-circle ${breathPhase}`}>
                  <div className="breath-inner">
                    <span className="breath-text">
                      {breathPhase === 'inhale' && 'Breathe In'}
                      {breathPhase === 'hold' && 'Hold'}
                      {breathPhase === 'exhale' && 'Breathe Out'}
                    </span>
                  </div>
                </div>
              )}
              
              {selectedGuidance.id !== 'breathing' && (
                <div className="meditation-circle">
                  <svg viewBox="0 0 200 200">
                    <circle
                      className="circle-bg"
                      cx="100"
                      cy="100"
                      r="90"
                    />
                    <circle
                      className="circle-progress"
                      cx="100"
                      cy="100"
                      r="90"
                      style={{
                        strokeDasharray: 2 * Math.PI * 90,
                        strokeDashoffset: 2 * Math.PI * 90 * (timeLeft / ((selectedPreset.id === 'custom' ? customDuration : selectedPreset.duration) * 60))
                      }}
                    />
                  </svg>
                  <div className="timer-display">
                    <span className="timer-time">{formatTime(timeLeft)}</span>
                    <span className="timer-guidance">{selectedGuidance.name}</span>
                  </div>
                </div>
              )}

              <div className="timer-controls">
                <button className="control-btn stop" onClick={handleStop}>
                  ⏹️ Stop
                </button>
                <button className="control-btn pause" onClick={handlePause}>
                  {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
              </div>

              <div className="session-info">
                <span className="ambient-indicator">
                  {selectedAmbient.icon} {selectedAmbient.name}
                </span>
              </div>
            </div>
          </div>
        )}

        {view === 'complete' && (
          <div className="session-complete">
            <div className="complete-icon">🙏</div>
            <h4>Session Complete</h4>
            <p className="complete-message">
              You meditated for {selectedPreset.id === 'custom' ? customDuration : selectedPreset.duration} minutes.
              Great job taking time for yourself!
            </p>
            <div className="complete-stats">
              <div className="complete-stat">
                <span className="stat-label">Current Streak</span>
                <span className="stat-value">{currentStreak} days</span>
              </div>
              <div className="complete-stat">
                <span className="stat-label">Total Sessions</span>
                <span className="stat-value">{sessionHistory.length}</span>
              </div>
            </div>
            <button className="complete-btn" onClick={() => setView('home')}>
              Return Home
            </button>
          </div>
        )}

        {view === 'history' && (
          <div className="history-view">
            <h4>Session History</h4>
            {sessionHistory.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🧘</span>
                <p>No meditation sessions yet</p>
                <p className="empty-hint">Start your first session to build your practice!</p>
              </div>
            ) : (
              <>
                <div className="history-list">
                  {[...sessionHistory].reverse().map(session => (
                    <div key={session.id} className="history-item">
                      <div className="history-icon">🧘</div>
                      <div className="history-info">
                        <span className="history-preset">{session.preset}</span>
                        <span className="history-meta">
                          {new Date(session.date).toLocaleDateString()} • {session.guidance}
                        </span>
                      </div>
                      <div className="history-duration">{session.duration} min</div>
                    </div>
                  ))}
                </div>
                <button className="clear-history-btn" onClick={clearHistory}>
                  Clear History
                </button>
              </>
            )}
          </div>
        )}

        {view === 'stats' && (
          <div className="stats-view">
            <h4>Your Progress</h4>
            
            <div className="stats-summary">
              <div className="summary-card">
                <span className="summary-value">{currentStreak}</span>
                <span className="summary-label">Current Streak</span>
              </div>
              <div className="summary-card highlight">
                <span className="summary-value">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span>
                <span className="summary-label">Total Time</span>
              </div>
              <div className="summary-card">
                <span className="summary-value">{sessionHistory.length}</span>
                <span className="summary-label">Sessions</span>
              </div>
            </div>

            <div className="weekly-chart">
              <h5>Last 7 Days</h5>
              <div className="chart-bars">
                {weeklyData.map((day, i) => (
                  <div key={i} className="chart-bar-wrapper">
                    <div 
                      className={`chart-bar ${day.minutes > 0 ? 'has-data' : ''}`}
                      style={{ 
                        height: `${Math.max(10, Math.min(100, (day.minutes / 60) * 100))}%`,
                        opacity: day.minutes > 0 ? 0.5 + (day.minutes / 60) * 0.5 : 0.2
                      }}
                    />
                    <span className="chart-label">{day.day}</span>
                    {day.minutes > 0 && (
                      <span className="chart-tooltip">{day.minutes} min</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="insights">
              <h5>Insights</h5>
              <div className="insight-cards">
                <div className="insight-card">
                  <span className="insight-icon">🎯</span>
                  <span className="insight-text">
                    {sessionHistory.length > 0 
                      ? `Average session: ${Math.round(totalMinutes / sessionHistory.length)} min`
                      : 'Start meditating to see insights'}
                  </span>
                </div>
                <div className="insight-card">
                  <span className="insight-icon">📅</span>
                  <span className="insight-text">
                    {currentStreak > 0
                      ? `${currentStreak} day streak! Keep it up!`
                      : 'Build a streak by meditating daily'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
