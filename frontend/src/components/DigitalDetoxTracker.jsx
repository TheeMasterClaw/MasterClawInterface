import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// import './DigitalDetoxTracker.css';

const PRESETS = {
  mindful: { work: 45, break: 10, dailyLimit: 8 },
  balanced: { work: 30, break: 5, dailyLimit: 6 },
  strict: { work: 25, break: 5, dailyLimit: 4 },
  custom: { work: 45, break: 10, dailyLimit: 8 }
};

const BREAK_ACTIVITIES = [
  { icon: '🚶', label: 'Take a walk', description: 'Step outside for fresh air' },
  { icon: '👀', label: 'Eye exercises', description: '20-20-20 rule: look 20ft away for 20s' },
  { icon: '🧘', label: 'Stretch', description: 'Do some light stretching' },
  { icon: '💧', label: 'Hydrate', description: 'Drink a glass of water' },
  { icon: '🌱', label: 'Nature', description: 'Look at plants or sky' },
  { icon: '🧠', label: 'Meditate', description: 'Take 10 deep breaths' },
  { icon: '📖', label: 'Read', description: 'Read a physical book' },
  { icon: '✍️', label: 'Journal', description: 'Write down your thoughts' }
];

export default function DigitalDetoxTracker({ isOpen, onClose }) {
  const [preset, setPreset] = useState('balanced');
  const [customSettings, setCustomSettings] = useState({ ...PRESETS.custom });
  const [isTracking, setIsTracking] = useState(false);
  const [screenTimeToday, setScreenTimeToday] = useState(0);
  const [offlineTimeToday, setOfflineTimeToday] = useState(0);
  const [currentSessionStart, setCurrentSessionStart] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakTimer, setBreakTimer] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [activeReminder, setActiveReminder] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [goals, setGoals] = useState({
    dailyLimit: 6 * 60, // 6 hours in minutes
    breakReminder: 30,  // remind every 30 minutes
    offlineGoal: 2 * 60 // 2 hours offline goal
  });
  const [blockedApps, setBlockedApps] = useState([
    { name: 'Social Media', icon: '📱', limit: 30, used: 15 },
    { name: 'Entertainment', icon: '🎬', limit: 60, used: 45 },
    { name: 'Gaming', icon: '🎮', limit: 45, used: 0 },
    { name: 'News', icon: '📰', limit: 20, used: 12 }
  ]);

  const reminderIntervalRef = useRef(null);
  const sessionIntervalRef = useRef(null);
  const breakIntervalRef = useRef(null);

  const currentSettings = preset === 'custom' ? customSettings : PRESETS[preset];

  // Load data from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-detox-data');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const today = new Date().toDateString();
          
          // Check if data is from today
          if (data.date === today) {
            setScreenTimeToday(data.screenTimeToday || 0);
            setOfflineTimeToday(data.offlineTimeToday || 0);
            setSessionHistory(data.sessionHistory || []);
          } else {
            // Save yesterday's data to history
            if (data.date) {
              const history = JSON.parse(localStorage.getItem('mc-detox-history') || '[]');
              history.push({
                date: data.date,
                screenTime: data.screenTimeToday || 0,
                offlineTime: data.offlineTimeToday || 0
              });
              localStorage.setItem('mc-detox-history', JSON.stringify(history.slice(-30)));
            }
            // Reset for new day
            setScreenTimeToday(0);
            setOfflineTimeToday(0);
            setSessionHistory([]);
          }
          
          if (data.goals) setGoals(data.goals);
          if (data.preset) setPreset(data.preset);
          if (data.customSettings) setCustomSettings(data.customSettings);
        } catch (e) {
          console.error('Failed to parse detox data:', e);
        }
      }
    }
  }, [isOpen]);

  // Save data to localStorage
  const saveData = useCallback(() => {
    if (typeof window !== 'undefined') {
      const data = {
        date: new Date().toDateString(),
        screenTimeToday,
        offlineTimeToday,
        sessionHistory,
        goals,
        preset,
        customSettings
      };
      localStorage.setItem('mc-detox-data', JSON.stringify(data));
    }
  }, [screenTimeToday, offlineTimeToday, sessionHistory, goals, preset, customSettings]);

  useEffect(() => {
    if (isOpen) {
      saveData();
    }
  }, [isOpen, saveData]);

  // Start tracking screen time
  const startTracking = () => {
    setIsTracking(true);
    setCurrentSessionStart(Date.now());
    
    // Set up break reminder
    reminderIntervalRef.current = setInterval(() => {
      setActiveReminder({
        type: 'break',
        message: "Time for a mindful break! 👁️",
        timestamp: Date.now()
      });
      setShowBreakModal(true);
    }, goals.breakReminder * 60 * 1000);

    // Update screen time every minute
    sessionIntervalRef.current = setInterval(() => {
      setScreenTimeToday(prev => prev + 1);
    }, 60 * 1000);
  };

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    
    if (currentSessionStart) {
      const sessionDuration = Math.floor((Date.now() - currentSessionStart) / (60 * 1000));
      const newSession = {
        id: Date.now(),
        start: new Date(currentSessionStart).toISOString(),
        duration: sessionDuration,
        type: 'screen'
      };
      setSessionHistory(prev => [...prev, newSession]);
    }
    
    setCurrentSessionStart(null);
    
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
    }
    
    setActiveReminder(null);
  };

  // Start a break
  const startBreak = () => {
    setIsOnBreak(true);
    setBreakStartTime(Date.now());
    setBreakTimer(currentSettings.break * 60);
    stopTracking();
    
    breakIntervalRef.current = setInterval(() => {
      setBreakTimer(prev => {
        if (prev <= 1) {
          endBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // End break
  const endBreak = () => {
    setIsOnBreak(false);
    
    if (breakStartTime) {
      const breakDuration = Math.floor((Date.now() - breakStartTime) / (60 * 1000));
      setOfflineTimeToday(prev => prev + breakDuration);
      
      const newSession = {
        id: Date.now(),
        start: new Date(breakStartTime).toISOString(),
        duration: breakDuration,
        type: 'offline'
      };
      setSessionHistory(prev => [...prev, newSession]);
    }
    
    setBreakStartTime(null);
    
    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
    }
    
    setShowBreakModal(false);
    startTracking();
  };

  // Toggle tracking
  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reminderIntervalRef.current) clearInterval(reminderIntervalRef.current);
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
    };
  }, []);

  // Format time
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatSeconds = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress
  const screenTimeProgress = Math.min(100, (screenTimeToday / goals.dailyLimit) * 100);
  const offlineTimeProgress = Math.min(100, (offlineTimeToday / goals.offlineGoal) * 100);

  // Get week history
  const getWeekHistory = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const history = JSON.parse(localStorage.getItem('mc-detox-history') || '[]');
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const dayData = history.find(h => h.date === dateStr);
      if (i === 0) {
        // Today
        weekData.push({
          date: dateStr,
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          screenTime: screenTimeToday,
          offlineTime: offlineTimeToday
        });
      } else {
        weekData.push({
          date: dateStr,
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          screenTime: dayData?.screenTime || 0,
          offlineTime: dayData?.offlineTime || 0
        });
      }
    }
    
    return weekData;
  }, [screenTimeToday, offlineTimeToday, isOpen]);

  // Handle preset change
  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      setGoals(prev => ({
        ...prev,
        dailyLimit: PRESETS[newPreset].dailyLimit * 60,
        breakReminder: PRESETS[newPreset].work
      }));
    }
  };

  // Handle custom settings change
  const handleCustomChange = (field, value) => {
    const numValue = parseInt(value) || 1;
    setCustomSettings(prev => ({ ...prev, [field]: numValue }));
    if (preset === 'custom') {
      if (field === 'dailyLimit') {
        setGoals(prev => ({ ...prev, dailyLimit: numValue * 60 }));
      }
      if (field === 'work') {
        setGoals(prev => ({ ...prev, breakReminder: numValue }));
      }
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (screenTimeProgress >= 100) return '#ef4444';
    if (screenTimeProgress >= 75) return '#f59e0b';
    return '#22c55e';
  };

  // Get recommendation
  const getRecommendation = () => {
    if (screenTimeProgress >= 100) {
      return "⚠️ Daily limit reached! Time to disconnect and recharge.";
    }
    if (screenTimeProgress >= 75) {
      return "⚡ You're at 75% of your daily goal. Consider taking a longer break.";
    }
    if (offlineTimeProgress >= 100) {
      return "🌟 Amazing! You've hit your offline time goal. Great digital balance!";
    }
    if (isTracking) {
      return "💡 Tip: Every 20 minutes, look at something 20 feet away for 20 seconds.";
    }
    return "🎯 Start tracking to build healthier digital habits.";
  };

  if (!isOpen) return null;

  return (
    <div className="detox-panel-overlay" onClick={onClose}>
      <div className="detox-panel" onClick={e => e.stopPropagation()}>
        <div className="detox-panel-header">
          <h3>🧘 Digital Detox Tracker</h3>
          <div className="header-actions">
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              ⚙️
            </button>
            <button 
              className="stats-btn"
              onClick={() => setShowStats(!showStats)}
              title="Statistics"
            >
              📊
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showSettings ? (
          <div className="detox-settings">
            <h4>Digital Wellness Settings</h4>
            
            <div className="preset-selector">
              <label>Wellness Preset:</label>
              <div className="preset-buttons">
                <button 
                  className={preset === 'mindful' ? 'active' : ''}
                  onClick={() => handlePresetChange('mindful')}
                >
                  🧘 Mindful
                </button>
                <button 
                  className={preset === 'balanced' ? 'active' : ''}
                  onClick={() => handlePresetChange('balanced')}
                >
                  ⚖️ Balanced
                </button>
                <button 
                  className={preset === 'strict' ? 'active' : ''}
                  onClick={() => handlePresetChange('strict')}
                >
                  🔒 Strict
                </button>
                <button 
                  className={preset === 'custom' ? 'active' : ''}
                  onClick={() => handlePresetChange('custom')}
                >
                  ⚙️ Custom
                </button>
              </div>
            </div>

            {preset === 'custom' && (
              <div className="custom-settings">
                <div class="setting-row">
                  <label>Break reminder (min):</label>
                  <input 
                    type="number" 
                    min="5" 
                    max="120"
                    value={customSettings.work}
                    onChange={(e) => handleCustomChange('work', e.target.value)}
                  />
                </div>
                <div className="setting-row">
                  <label>Break duration (min):</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="60"
                    value={customSettings.break}
                    onChange={(e) => handleCustomChange('break', e.target.value)}
                  />
                </div>
                <div className="setting-row">
                  <label>Daily limit (hours):</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="16"
                    value={customSettings.dailyLimit}
                    onChange={(e) => handleCustomChange('dailyLimit', e.target.value)}
                  />
                </div>
              </div>
            )}

            <button className="back-btn" onClick={() => setShowSettings(false)}>
              ← Back
            </button>
          </div>
        ) : showStats ? (
          <div className="detox-stats">
            <h4>📊 Weekly Overview</h4>
            
            <div className="week-chart">
              {getWeekHistory.map((day, i) => {
                const maxScreen = Math.max(...getWeekHistory.map(d => d.screenTime), goals.dailyLimit);
                const screenHeight = maxScreen > 0 ? (day.screenTime / maxScreen) * 100 : 0;
                const offlineHeight = day.offlineTime > 0 ? Math.min(100, (day.offlineTime / 120) * 100) : 0;
                
                return (
                  <div key={i} className="day-bar">
                    <div className="bar-container">
                      <div 
                        className="bar-screen"
                        style={{ height: `${screenHeight}%` }}
                        title={`${day.day}: ${formatTime(day.screenTime)} screen time`}
                      />
                      {offlineHeight > 0 && (
                        <div 
                          className="bar-offline"
                          style={{ height: `${offlineHeight}%` }}
                          title={`${day.day}: ${formatTime(day.offlineTime)} offline`}
                        />
                      )}
                    </div>
                    <span className="day-label">{day.day}</span>
                  </div>
                );
              })}
            </div>

            <div className="stats-summary">
              <div className="stat-item">
                <span className="stat-value">{formatTime(screenTimeToday)}</span>
                <span className="stat-label">Today</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {formatTime(Math.floor(getWeekHistory.reduce((a, b) => a + b.screenTime, 0) / 7))}
                </span>
                <span className="stat-label">Daily Avg</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{formatTime(offlineTimeToday)}</span>
                <span className="stat-label">Offline Today</span>
              </div>
            </div>

            <button className="back-btn" onClick={() => setShowStats(false)}>
              ← Back
            </button>
          </div>
        ) : (
          <>
            {/* Main Timer Display */}
            <div className="detox-main">
              <div 
                className={`detox-status-ring ${isTracking ? 'tracking' : ''} ${isOnBreak ? 'on-break' : ''}`}
                style={{ '--status-color': getStatusColor() }}
              >
                <div className="status-content">
                  {isOnBreak ? (
                    <>
                      <div className="break-timer">{formatSeconds(breakTimer)}</div>
                      <div className="status-label">On Break ☕</div>
                    </>
                  ) : (
                    <>
                      <div className="screen-time">{formatTime(screenTimeToday)}</div>
                      <div className="status-label">
                        {isTracking ? 'Tracking 👁️' : 'Paused ⏸️'}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bars */}
              <div className="progress-section">
                <div className="progress-item">
                  <div className="progress-header">
                    <span>📱 Screen Time</span>
                    <span>{Math.round(screenTimeProgress)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill screen"
                      style={{ width: `${screenTimeProgress}%`, backgroundColor: getStatusColor() }}
                    />
                  </div>
                  <div className="progress-goal">
                    Goal: {formatTime(goals.dailyLimit)}
                  </div>
                </div>

                <div className="progress-item">
                  <div className="progress-header">
                    <span>🌿 Offline Time</span>
                    <span>{Math.round(offlineTimeProgress)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill offline"
                      style={{ width: `${offlineTimeProgress}%` }}
                    />
                  </div>
                  <div className="progress-goal">
                    Goal: {formatTime(goals.offlineGoal)}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="recommendation">
                <p>{getRecommendation()}</p>
              </div>

              {/* App Usage */}
              <div className="app-usage-section">
                <h4>📱 App Limits</h4>
                <div className="app-list">
                  {blockedApps.map((app, i) => {
                    const progress = Math.min(100, (app.used / app.limit) * 100);
                    return (
                      <div key={i} className="app-item">
                        <div className="app-header">
                          <span className="app-icon">{app.icon}</span>
                          <span className="app-name">{app.name}</span>
                          <span className="app-time">{app.used}/{app.limit}m</span>
                        </div>
                        <div className="app-progress-bar">
                          <div 
                            className="app-progress-fill"
                            style={{ 
                              width: `${progress}%`,
                              backgroundColor: progress >= 100 ? '#ef4444' : '#6366f1'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Controls */}
              <div className="detox-controls">
                {isOnBreak ? (
                  <button 
                    className="detox-btn end-break"
                    onClick={endBreak}
                  >
                    ▶️ End Break
                  </button>
                ) : (
                  <>
                    <button 
                      className={`detox-btn ${isTracking ? 'pause' : 'start'}`}
                      onClick={toggleTracking}
                    >
                      {isTracking ? '⏸️ Pause' : '▶️ Start Tracking'}
                    </button>
                    {isTracking && (
                      <button 
                        className="detox-btn break"
                        onClick={() => setShowBreakModal(true)}
                      >
                        ☕ Take Break
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Break Modal */}
        {showBreakModal && !isOnBreak && (
          <div className="break-modal-overlay" onClick={() => setShowBreakModal(false)}>
            <div className="break-modal" onClick={e => e.stopPropagation()}>
              <h4>☕ Time for a Break</h4>
              <p className="break-subtitle">Choose an activity for your {currentSettings.break}-minute break:</p>
              
              <div className="break-activities">
                {BREAK_ACTIVITIES.map((activity, i) => (
                  <button 
                    key={i}
                    className="activity-option"
                    onClick={startBreak}
                  >
                    <span className="activity-icon">{activity.icon}</span>
                    <span className="activity-label">{activity.label}</span>
                    <span className="activity-desc">{activity.description}</span>
                  </button>
                ))}
              </div>

              <div className="break-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowBreakModal(false)}
                >
                  Skip Break
                </button>
                <button 
                  className="btn-primary"
                  onClick={startBreak}
                >
                  Start Break
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
