import React, { useState, useEffect, useRef, useCallback } from 'react';
import './FocusTimer.css';

const PRESETS = {
  pomodoro: { work: 25, break: 5, longBreak: 15, sessions: 4 },
  short: { work: 15, break: 3, longBreak: 10, sessions: 4 },
  long: { work: 50, break: 10, longBreak: 30, sessions: 4 },
  custom: { work: 25, break: 5, longBreak: 15, sessions: 4 }
};

export default function FocusTimer({ isOpen, onClose }) {
  const [preset, setPreset] = useState('pomodoro');
  const [mode, setMode] = useState('work'); // work, break, longBreak
  const [timeLeft, setTimeLeft] = useState(PRESETS.pomodoro.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [customSettings, setCustomSettings] = useState({ ...PRESETS.custom });
  const [sessionHistory, setSessionHistory] = useState([]);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  const currentSettings = preset === 'custom' ? customSettings : PRESETS[preset];

  // Load session history from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-focus-sessions');
      if (saved) {
        try {
          setSessionHistory(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse session history:', e);
        }
      }
    }
  }, [isOpen]);

  // Save session history
  const saveSessionHistory = useCallback((history) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-focus-sessions', JSON.stringify(history.slice(-50))); // Keep last 50
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    playNotificationSound();

    if (mode === 'work') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);
      
      // Record completed session
      const newSession = {
        id: Date.now(),
        type: 'work',
        duration: currentSettings.work,
        completedAt: new Date().toISOString()
      };
      const updatedHistory = [...sessionHistory, newSession];
      setSessionHistory(updatedHistory);
      saveSessionHistory(updatedHistory);

      // Switch to break or long break
      if (newCompleted % currentSettings.sessions === 0) {
        setMode('longBreak');
        setTimeLeft(currentSettings.longBreak * 60);
      } else {
        setMode('break');
        setTimeLeft(currentSettings.break * 60);
      }
    } else {
      // Break finished, back to work
      setMode('work');
      setTimeLeft(currentSettings.work * 60);
    }
  };

  const playNotificationSound = () => {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio notification not available');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(currentSettings[mode] * 60);
  };

  const skipSession = () => {
    setIsRunning(false);
    if (mode === 'work') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);
      if (newCompleted % currentSettings.sessions === 0) {
        setMode('longBreak');
        setTimeLeft(currentSettings.longBreak * 60);
      } else {
        setMode('break');
        setTimeLeft(currentSettings.break * 60);
      }
    } else {
      setMode('work');
      setTimeLeft(currentSettings.work * 60);
    }
  };

  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    setIsRunning(false);
    const settings = newPreset === 'custom' ? customSettings : PRESETS[newPreset];
    setMode('work');
    setTimeLeft(settings.work * 60);
    setCompletedSessions(0);
  };

  const handleCustomChange = (field, value) => {
    const numValue = parseInt(value) || 1;
    const newSettings = { ...customSettings, [field]: numValue };
    setCustomSettings(newSettings);
    if (preset === 'custom') {
      setIsRunning(false);
      if (mode === 'work') setTimeLeft(newSettings.work * 60);
      else if (mode === 'break') setTimeLeft(newSettings.break * 60);
      else setTimeLeft(newSettings.longBreak * 60);
    }
  };

  const getProgress = () => {
    const totalTime = currentSettings[mode] * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getTodaySessions = () => {
    const today = new Date().toDateString();
    return sessionHistory.filter(s => new Date(s.completedAt).toDateString() === today);
  };

  const getTotalFocusTime = () => {
    const today = new Date().toDateString();
    return sessionHistory
      .filter(s => new Date(s.completedAt).toDateString() === today && s.type === 'work')
      .reduce((acc, s) => acc + s.duration, 0);
  };

  const clearHistory = () => {
    setSessionHistory([]);
    saveSessionHistory([]);
    setCompletedSessions(0);
  };

  if (!isOpen) return null;

  const progress = getProgress();
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const todaySessions = getTodaySessions();
  const totalFocusMinutes = getTotalFocusTime();

  return (
    <div className="focus-panel-overlay" onClick={onClose}>
      <div className="focus-panel" onClick={e => e.stopPropagation()}>
        <div className="focus-panel-header">
          <h3>🎯 Focus Timer</h3>
          <div className="header-actions">
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
          <div className="focus-settings">
            <h4>Timer Settings</h4>
            
            <div className="preset-selector">
              <label>Presets:</label>
              <div className="preset-buttons">
                <button 
                  className={preset === 'pomodoro' ? 'active' : ''}
                  onClick={() => handlePresetChange('pomodoro')}
                >
                  Pomodoro (25/5)
                </button>
                <button 
                  className={preset === 'short' ? 'active' : ''}
                  onClick={() => handlePresetChange('short')}
                >
                  Short (15/3)
                </button>
                <button 
                  className={preset === 'long' ? 'active' : ''}
                  onClick={() => handlePresetChange('long')}
                >
                  Long (50/10)
                </button>
                <button 
                  className={preset === 'custom' ? 'active' : ''}
                  onClick={() => handlePresetChange('custom')}
                >
                  Custom
                </button>
              </div>
            </div>

            {preset === 'custom' && (
              <div className="custom-settings">
                <div className="setting-row">
                  <label>Work (min):</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="120"
                    value={customSettings.work}
                    onChange={(e) => handleCustomChange('work', e.target.value)}
                  />
                </div>
                <div className="setting-row">
                  <label>Break (min):</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="60"
                    value={customSettings.break}
                    onChange={(e) => handleCustomChange('break', e.target.value)}
                  />
                </div>
                <div className="setting-row">
                  <label>Long Break (min):</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="120"
                    value={customSettings.longBreak}
                    onChange={(e) => handleCustomChange('longBreak', e.target.value)}
                  />
                </div>
                <div className="setting-row">
                  <label>Sessions before long break:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={customSettings.sessions}
                    onChange={(e) => handleCustomChange('sessions', e.target.value)}
                  />
                </div>
              </div>
            )}

            <button className="back-btn" onClick={() => setShowSettings(false)}>
              ← Back to Timer
            </button>
          </div>
        ) : (
          <>
            <div className="timer-display">
              <div className={`timer-ring ${mode}`}>
                <svg viewBox="0 0 260 260">
                  <circle
                    className="ring-bg"
                    cx="130"
                    cy="130"
                    r="120"
                  />
                  <circle
                    className="ring-progress"
                    cx="130"
                    cy="130"
                    r="120"
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset
                    }}
                  />
                </svg>
                <div className="timer-content">
                  <div className="timer-time">{formatTime(timeLeft)}</div>
                  <div className={`timer-mode ${mode}`}>
                    {mode === 'work' && '🔥 Focus'}
                    {mode === 'break' && '☕ Break'}
                    {mode === 'longBreak' && '🌴 Long Break'}
                  </div>
                </div>
              </div>
            </div>

            <div className="session-dots">
              {Array.from({ length: currentSettings.sessions }).map((_, i) => (
                <div 
                  key={i} 
                  className={`session-dot ${i < completedSessions % currentSettings.sessions ? 'completed' : ''}`}
                />
              ))}
            </div>

            <div className="timer-controls">
              <button 
                className={`timer-btn ${isRunning ? 'pause' : 'start'}`}
                onClick={toggleTimer}
              >
                {isRunning ? '⏸️ Pause' : '▶️ Start'}
              </button>
              <button className="timer-btn reset" onClick={resetTimer}>
                🔄 Reset
              </button>
              <button className="timer-btn skip" onClick={skipSession}>
                ⏭️ Skip
              </button>
            </div>

            <div className="stats-section">
              <h4>📊 Today's Stats</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{todaySessions.filter(s => s.type === 'work').length}</span>
                  <span className="stat-label">Sessions</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{totalFocusMinutes}</span>
                  <span className="stat-label">Focus Min</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {Math.floor(totalFocusMinutes / currentSettings.work)}
                  </span>
                  <span className="stat-label">Pomodoros</span>
                </div>
              </div>
              {sessionHistory.length > 0 && (
                <button className="clear-history" onClick={clearHistory}>
                  Clear History
                </button>
              )}
            </div>

            <div className="focus-tips">
              <p>💡 <strong>Tip:</strong> {mode === 'work' 
                ? 'Stay focused on one task. Avoid distractions!' 
                : 'Step away from the screen. Stretch, hydrate, rest your eyes.'}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
