import React, { useState, useEffect, useCallback } from 'react';
import './WaterTracker.css';

const GLASS_SIZES = {
  small: { ml: 250, label: 'Small (250ml)', icon: '🥛' },
  medium: { ml: 330, label: 'Medium (330ml)', icon: '🥤' },
  large: { ml: 500, label: 'Large (500ml)', icon: '🍶' },
  bottle: { ml: 750, label: 'Bottle (750ml)', icon: '🍼' },
  custom: { ml: 0, label: 'Custom', icon: '⚖️' }
};

const REMINDER_INTERVALS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 0, label: 'Off' }
];

const DEFAULT_DAILY_GOAL = 2500; // ml

export default function WaterTracker({ isOpen, onClose }) {
  const [intake, setIntake] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_DAILY_GOAL);
  const [reminderInterval, setReminderInterval] = useState(60);
  const [lastReminder, setLastReminder] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [streak, setStreak] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Load data from localStorage
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const today = new Date().toDateString();
    const savedData = localStorage.getItem('mc-water-tracker');
    
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        // Check if data is from today
        if (data.date === today) {
          setIntake(data.intake || []);
          setDailyGoal(data.dailyGoal || DEFAULT_DAILY_GOAL);
          setReminderInterval(data.reminderInterval || 60);
          setLastReminder(data.lastReminder ? new Date(data.lastReminder) : null);
        } else {
          // New day - check if goal was met yesterday for streak
          updateStreak(data.date, data.intake);
          // Reset for new day but keep settings
          setIntake([]);
          setDailyGoal(data.dailyGoal || DEFAULT_DAILY_GOAL);
          setReminderInterval(data.reminderInterval || 60);
          setLastReminder(null);
        }
      } catch (e) {
        console.error('Failed to parse water tracker data:', e);
      }
    }

    // Load streak separately
    const savedStreak = localStorage.getItem('mc-water-streak');
    if (savedStreak) {
      try {
        setStreak(parseInt(savedStreak, 10) || 0);
      } catch (e) {
        setStreak(0);
      }
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);

  // Save data to localStorage
  const saveData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const data = {
      date: new Date().toDateString(),
      intake,
      dailyGoal,
      reminderInterval,
      lastReminder: lastReminder?.toISOString()
    };
    localStorage.setItem('mc-water-tracker', JSON.stringify(data));
  }, [intake, dailyGoal, reminderInterval, lastReminder]);

  useEffect(() => {
    saveData();
  }, [saveData]);

  // Update streak based on previous day's completion
  const updateStreak = (prevDate, prevIntake) => {
    const prevTotal = prevIntake.reduce((sum, item) => sum + item.amount, 0);
    const prevGoal = dailyGoal;
    
    if (prevTotal >= prevGoal) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem('mc-water-streak', newStreak.toString());
    } else {
      setStreak(0);
      localStorage.setItem('mc-water-streak', '0');
    }
  };

  // Reminder logic
  useEffect(() => {
    if (!isOpen || reminderInterval === 0) return;

    const checkReminder = () => {
      const now = new Date();
      const timeSinceLastReminder = lastReminder 
        ? (now - lastReminder) / (1000 * 60) 
        : Infinity;

      if (timeSinceLastReminder >= reminderInterval) {
        // Check if daily goal is already met
        const totalIntake = intake.reduce((sum, item) => sum + item.amount, 0);
        if (totalIntake < dailyGoal) {
          showReminder();
        }
        setLastReminder(now);
      }
    };

    const interval = setInterval(checkReminder, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isOpen, reminderInterval, lastReminder, intake, dailyGoal]);

  const showReminder = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('💧 Hydration Reminder', {
        body: 'Time to drink some water! Stay hydrated.',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
    }
  };

  const addWater = (amount) => {
    const newEntry = {
      id: Date.now(),
      amount,
      timestamp: new Date().toISOString()
    };
    setIntake(prev => [...prev, newEntry]);
  };

  const removeEntry = (id) => {
    setIntake(prev => prev.filter(entry => entry.id !== id));
  };

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount, 10);
    if (amount > 0) {
      addWater(amount);
      setCustomAmount('');
      setShowCustomInput(false);
    }
  };

  const totalIntake = intake.reduce((sum, item) => sum + item.amount, 0);
  const progress = Math.min((totalIntake / dailyGoal) * 100, 100);
  const remaining = Math.max(dailyGoal - totalIntake, 0);
  const isGoalMet = totalIntake >= dailyGoal;

  const getHydrationLevel = () => {
    if (progress === 0) return { label: 'Start hydrating!', color: '#64748b', icon: '💧' };
    if (progress < 25) return { label: 'Good start', color: '#3b82f6', icon: '💧' };
    if (progress < 50) return { label: 'Keep going!', color: '#0ea5e9', icon: '💦' };
    if (progress < 75) return { label: 'Almost there!', color: '#06b6d4', icon: '🌊' };
    if (progress < 100) return { label: 'So close!', color: '#14b8a6', icon: '🏊' };
    return { label: 'Goal reached! 🎉', color: '#22c55e', icon: '⭐' };
  };

  const getTodaysHistory = () => {
    return intake.slice().reverse();
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const hydrationLevel = getHydrationLevel();

  if (!isOpen) return null;

  return (
    <div className="water-panel-overlay" onClick={onClose}>
      <div className="water-panel" onClick={e => e.stopPropagation()}>
        <div className="water-panel-header">
          <h3>💧 Water Tracker</h3>
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
          <div className="water-settings">
            <h4>Tracker Settings</h4>
            
            <div className="setting-group">
              <label>Daily Goal (ml)</label>
              <div className="goal-input-group">
                <input
                  type="number"
                  min="500"
                  max="5000"
                  step="100"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value) || DEFAULT_DAILY_GOAL)}
                />
                <span className="unit">ml</span>
              </div>
              <div className="preset-goals">
                {[1500, 2000, 2500, 3000, 3500].map(goal => (
                  <button
                    key={goal}
                    className={dailyGoal === goal ? 'active' : ''}
                    onClick={() => setDailyGoal(goal)}
                  >
                    {goal}ml
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Reminder Interval</label>
              <div className="reminder-options">
                {REMINDER_INTERVALS.map(option => (
                  <button
                    key={option.value}
                    className={reminderInterval === option.value ? 'active' : ''}
                    onClick={() => setReminderInterval(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {reminderInterval > 0 && notificationPermission !== 'granted' && (
                <button 
                  className="enable-notifications"
                  onClick={requestNotificationPermission}
                >
                  🔔 Enable Notifications
                </button>
              )}
            </div>

            <div className="setting-group">
              <label>Current Streak</label>
              <div className="streak-display">
                <span className="streak-icon">🔥</span>
                <span className="streak-count">{streak}</span>
                <span className="streak-label">day{streak !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <button className="back-btn" onClick={() => setShowSettings(false)}>
              ← Back to Tracker
            </button>
          </div>
        ) : (
          <>
            {/* Progress Section */}
            <div className="water-progress-section">
              <div className="water-visual">
                <div className="water-bottle">
                  <div 
                    className="water-level"
                    style={{ 
                      height: `${progress}%`,
                      background: `linear-gradient(to top, ${hydrationLevel.color}, ${hydrationLevel.color}88)`
                    }}
                  />
                  <div className="bottle-markings">
                    <span className="mark">100%</span>
                    <span className="mark">75%</span>
                    <span className="mark">50%</span>
                    <span className="mark">25%</span>
                  </div>
                </div>
                
                <div className="water-stats">
                  <div className="main-stat">
                    <span className="intake-amount">{totalIntake}</span>
                    <span className="intake-unit">ml</span>
                  </div>
                  <div className="goal-stat">
                    of {dailyGoal}ml goal
                  </div>
                  <div 
                    className="hydration-status"
                    style={{ color: hydrationLevel.color }}
                  >
                    <span className="status-icon">{hydrationLevel.icon}</span>
                    <span className="status-label">{hydrationLevel.label}</span>
                  </div>
                  {isGoalMet && (
                    <div className="goal-celebration">
                      🎉 Daily goal achieved! 🎉
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-bar-container">
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill"
                    style={{ 
                      width: `${progress}%`,
                      background: hydrationLevel.color
                    }}
                  />
                </div>
                <div className="progress-labels">
                  <span>{Math.round(progress)}%</span>
                  {remaining > 0 && <span>{remaining}ml to go</span>}
                </div>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="quick-add-section">
              <h4>Quick Add</h4>
              <div className="quick-add-buttons">
                {Object.entries(GLASS_SIZES).map(([key, config]) => (
                  key !== 'custom' ? (
                    <button
                      key={key}
                      className="add-water-btn"
                      onClick={() => addWater(config.ml)}
                    >
                      <span className="btn-icon">{config.icon}</span>
                      <span className="btn-label">{config.label}</span>
                    </button>
                  ) : null
                ))}
                <button
                  className="add-water-btn custom"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                >
                  <span className="btn-icon">⚖️</span>
                  <span className="btn-label">Custom</span>
                </button>
              </div>

              {showCustomInput && (
                <div className="custom-input-group">
                  <input
                    type="number"
                    placeholder="Amount in ml"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomAdd()}
                    autoFocus
                  />
                  <button onClick={handleCustomAdd}>Add</button>
                </div>
              )}
            </div>

            {/* Today's History */}
            {intake.length > 0 && (
              <div className="water-history">
                <h4>Today's Log</h4>
                <div className="history-list">
                  {getTodaysHistory().map(entry => (
                    <div key={entry.id} className="history-item">
                      <span className="history-amount">+{entry.amount}ml</span>
                      <span className="history-time">{formatTime(entry.timestamp)}</span>
                      <button 
                        className="remove-btn"
                        onClick={() => removeEntry(entry.id)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hydration Tips */}
            <div className="hydration-tips">
              <p>
                💡 <strong>Tip:</strong> {isGoalMet 
                  ? 'Great job! Staying hydrated improves energy, focus, and overall health.' 
                  : 'Drink water regularly throughout the day. Don\'t wait until you\'re thirsty!'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Utility function to check if water goal is met (for external use)
export const isWaterGoalMet = () => {
  if (typeof window === 'undefined') return false;
  
  const savedData = localStorage.getItem('mc-water-tracker');
  if (!savedData) return false;
  
  try {
    const data = JSON.parse(savedData);
    const today = new Date().toDateString();
    
    if (data.date !== today) return false;
    
    const totalIntake = (data.intake || []).reduce((sum, item) => sum + item.amount, 0);
    return totalIntake >= (data.dailyGoal || DEFAULT_DAILY_GOAL);
  } catch (e) {
    return false;
  }
};

// Get current water intake (for external use)
export const getCurrentWaterIntake = () => {
  if (typeof window === 'undefined') return 0;
  
  const savedData = localStorage.getItem('mc-water-tracker');
  if (!savedData) return 0;
  
  try {
    const data = JSON.parse(savedData);
    const today = new Date().toDateString();
    
    if (data.date !== today) return 0;
    
    return (data.intake || []).reduce((sum, item) => sum + item.amount, 0);
  } catch (e) {
    return 0;
  }
};
