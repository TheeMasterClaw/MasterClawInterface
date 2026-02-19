import React, { useState, useEffect, useCallback } from 'react';
// import './SleepTracker.css';

const SLEEP_QUALITY = [
  { value: 1, label: 'Poor', emoji: '😴', color: '#ef4444' },
  { value: 2, label: 'Fair', emoji: '😑', color: '#f97316' },
  { value: 3, label: 'Good', emoji: '😐', color: '#eab308' },
  { value: 4, label: 'Very Good', emoji: '🙂', color: '#22c55e' },
  { value: 5, label: 'Excellent', emoji: '😊', color: '#10b981' }
];

const SLEEP_GOALS = [
  { value: 6, label: '6 hours' },
  { value: 7, label: '7 hours' },
  { value: 8, label: '8 hours' },
  { value: 9, label: '9 hours' }
];

export default function SleepTracker({ isOpen, onClose }) {
  const [sleepLogs, setSleepLogs] = useState([]);
  const [sleepGoal, setSleepGoal] = useState(8);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Form state
  const [bedTime, setBedTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');

  // Load data from localStorage
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const savedData = localStorage.getItem('mc-sleep-tracker');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setSleepLogs(data.logs || []);
        setSleepGoal(data.sleepGoal || 8);
      } catch (e) {
        console.error('Failed to parse sleep tracker data:', e);
      }
    }
  }, [isOpen]);

  // Save data to localStorage
  const saveData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const data = {
      logs: sleepLogs,
      sleepGoal
    };
    localStorage.setItem('mc-sleep-tracker', JSON.stringify(data));
  }, [sleepLogs, sleepGoal]);

  useEffect(() => {
    saveData();
  }, [saveData]);

  const calculateDuration = (bed, wake) => {
    const bedDate = new Date(bed);
    const wakeDate = new Date(wake);
    
    // If wake time is before bed time, assume next day
    if (wakeDate < bedDate) {
      wakeDate.setDate(wakeDate.getDate() + 1);
    }
    
    const diffMs = wakeDate - bedDate;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 10) / 10;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!bedTime || !wakeTime) return;
    
    const duration = calculateDuration(bedTime, wakeTime);
    
    const newLog = {
      id: Date.now(),
      bedTime,
      wakeTime,
      duration,
      quality,
      notes,
      date: new Date().toISOString()
    };
    
    setSleepLogs(prev => [newLog, ...prev]);
    
    // Reset form
    setBedTime('');
    setWakeTime('');
    setQuality(3);
    setNotes('');
    setShowLogForm(false);
  };

  const deleteLog = (id) => {
    setSleepLogs(prev => prev.filter(log => log.id !== id));
  };

  const getRecentLogs = () => {
    return sleepLogs.slice(0, 7);
  };

  const getSleepStats = () => {
    const last7Days = sleepLogs.slice(0, 7);
    const last30Days = sleepLogs.slice(0, 30);
    
    const avgDuration7 = last7Days.length > 0 
      ? last7Days.reduce((sum, log) => sum + log.duration, 0) / last7Days.length 
      : 0;
    
    const avgDuration30 = last30Days.length > 0 
      ? last30Days.reduce((sum, log) => sum + log.duration, 0) / last30Days.length 
      : 0;
    
    const avgQuality7 = last7Days.length > 0 
      ? last7Days.reduce((sum, log) => sum + log.quality, 0) / last7Days.length 
      : 0;
    
    const goalMetCount = last7Days.filter(log => log.duration >= sleepGoal).length;
    const goalMetPercentage = last7Days.length > 0 ? (goalMetCount / last7Days.length) * 100 : 0;
    
    return {
      avgDuration7: Math.round(avgDuration7 * 10) / 10,
      avgDuration30: Math.round(avgDuration30 * 10) / 10,
      avgQuality7: Math.round(avgQuality7 * 10) / 10,
      goalMetPercentage: Math.round(goalMetPercentage),
      totalLogs: sleepLogs.length
    };
  };

  const getQualityLabel = (value) => {
    return SLEEP_QUALITY.find(q => q.value === value) || SLEEP_QUALITY[2];
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const stats = getSleepStats();
  const recentLogs = getRecentLogs();

  // Generate chart data for last 7 days
  const getChartData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const log = sleepLogs.find(l => new Date(l.date).toDateString() === dateStr);
      
      data.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        duration: log ? log.duration : 0,
        quality: log ? log.quality : 0,
        hasLog: !!log
      });
    }
    return data;
  };

  const chartData = getChartData();
  const maxDuration = Math.max(...chartData.map(d => d.duration), sleepGoal);

  if (!isOpen) return null;

  return (
    <div className="sleep-panel-overlay" onClick={onClose}>
      <div className="sleep-panel" onClick={e => e.stopPropagation()}>
        <div className="sleep-panel-header">
          <h3>🌙 Sleep Tracker</h3>
          <div className="header-actions">
            <button 
              className="stats-btn"
              onClick={() => setShowStats(!showStats)}
              title="Statistics"
            >
              📊
            </button>
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
          <div className="sleep-settings">
            <h4>Sleep Settings</h4>
            
            <div className="setting-group">
              <label>Daily Sleep Goal</label>
              <div className="goal-options">
                {SLEEP_GOALS.map(goal => (
                  <button
                    key={goal.value}
                    className={sleepGoal === goal.value ? 'active' : ''}
                    onClick={() => setSleepGoal(goal.value)}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-info">
              <p>💡 <strong>Tip:</strong> Adults typically need 7-9 hours of sleep per night for optimal health.</p>
            </div>

            <button className="back-btn" onClick={() => setShowSettings(false)}>
              ← Back to Tracker
            </button>
          </div>
        ) : showStats ? (
          <div className="sleep-stats">
            <h4>Sleep Statistics</h4>
            
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{stats.avgDuration7}h</span>
                <span className="stat-label">Avg (7 days)</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.avgDuration30}h</span>
                <span className="stat-label">Avg (30 days)</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.avgQuality7}</span>
                <span className="stat-label">Avg Quality</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.goalMetPercentage}%</span>
                <span className="stat-label">Goal Met</span>
              </div>
            </div>

            <div className="chart-section">
              <h5>Last 7 Days</h5>
              <div className="sleep-chart">
                {chartData.map((data, index) => (
                  <div key={index} className="chart-bar-container">
                    <div className="chart-bar-wrapper">
                      <div 
                        className={`chart-bar ${data.hasLog ? 'has-data' : ''}`}
                        style={{ 
                          height: data.hasLog ? `${(data.duration / maxDuration) * 100}%` : '4px',
                          backgroundColor: data.hasLog ? getQualityLabel(data.quality).color : 'rgba(255,255,255,0.1)'
                        }}
                        title={data.hasLog ? `${data.duration}h - ${getQualityLabel(data.quality).label}` : 'No data'}
                      />
                      {sleepGoal > 0 && (
                        <div 
                          className="goal-line"
                          style={{ bottom: `${(sleepGoal / maxDuration) * 100}%` }}
                        />
                      )}
                    </div>
                    <span className="chart-day">{data.day}</span>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
                  <span>Excellent</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#22c55e' }}></span>
                  <span>Very Good</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#eab308' }}></span>
                  <span>Good</span>
                </div>
                <div className="legend-item">
                  <span className="legend-line"></span>
                  <span>Goal ({sleepGoal}h)</span>
                </div>
              </div>
            </div>

            <button className="back-btn" onClick={() => setShowStats(false)}>
              ← Back to Tracker
            </button>
          </div>
        ) : showLogForm ? (
          <form className="sleep-form" onSubmit={handleSubmit}>
            <h4>Log Sleep</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label>Bed Time</label>
                <input
                  type="datetime-local"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Wake Time</label>
                <input
                  type="datetime-local"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {bedTime && wakeTime && (
              <div className="duration-preview">
                <span>💤 Duration: </span>
                <strong>{calculateDuration(bedTime, wakeTime)} hours</strong>
              </div>
            )}

            <div className="form-group">
              <label>Sleep Quality</label>
              <div className="quality-selector">
                {SLEEP_QUALITY.map(q => (
                  <button
                    key={q.value}
                    type="button"
                    className={quality === q.value ? 'active' : ''}
                    onClick={() => setQuality(q.value)}
                    style={{ '--quality-color': q.color }}
                  >
                    <span className="quality-emoji">{q.emoji}</span>
                    <span className="quality-label">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did you sleep? Dreams? Factors affecting sleep?"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowLogForm(false)}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                Save Sleep Log
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Summary Section */}
            <div className="sleep-summary">
              <div className="summary-main">
                <div className="sleep-score">
                  <span className="score-value">{stats.avgDuration7}</span>
                  <span className="score-unit">h</span>
                </div>
                <div className="sleep-goal-status">
                  <span className="goal-label">Avg this week</span>
                  <span className="goal-target">Goal: {sleepGoal}h</span>
                </div>
              </div>
              
              {recentLogs.length > 0 && (
                <div className="last-sleep">
                  <span className="last-label">Last night:</span>
                  <span className="last-value">
                    {recentLogs[0].duration}h 
                    <span 
                      className="quality-badge"
                      style={{ backgroundColor: getQualityLabel(recentLogs[0].quality).color + '20', color: getQualityLabel(recentLogs[0].quality).color }}
                    >
                      {getQualityLabel(recentLogs[0].quality).emoji} {getQualityLabel(recentLogs[0].quality).label}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Quick Log Button */}
            <div className="quick-log-section">
              <button className="log-sleep-btn" onClick={() => setShowLogForm(true)}>
                <span className="btn-icon">🌙</span>
                <span className="btn-text">Log Last Night's Sleep</span>
              </button>
            </div>

            {/* Recent Logs */}
            {recentLogs.length > 0 && (
              <div className="recent-logs">
                <h4>Recent Logs</h4>
                <div className="logs-list">
                  {recentLogs.map(log => {
                    const qualityInfo = getQualityLabel(log.quality);
                    return (
                      <div key={log.id} className="log-item">
                        <div className="log-main">
                          <div className="log-date">{formatDate(log.date)}</div>
                          <div className="log-details">
                            <span className="log-duration">{log.duration}h</span>
                            <span 
                              className="log-quality"
                              style={{ color: qualityInfo.color }}
                            >
                              {qualityInfo.emoji} {qualityInfo.label}
                            </span>
                          </div>
                          <div className="log-times">
                            {formatTime(log.bedTime)} → {formatTime(log.wakeTime)}
                          </div>
                          {log.notes && <div className="log-notes">{log.notes}</div>}
                        </div>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteLog(log.id)}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sleep Tips */}
            <div className="sleep-tips">
              <p>
                💡 <strong>Sleep Tip:</strong> {stats.avgDuration7 < sleepGoal 
                  ? 'Try to maintain a consistent sleep schedule, even on weekends.' 
                  : 'Great job! Consistent sleep helps improve memory, mood, and overall health.'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Utility function to check if sleep goal was met recently
export const isSleepGoalMet = (hours = 24) => {
  if (typeof window === 'undefined') return false;
  
  const savedData = localStorage.getItem('mc-sleep-tracker');
  if (!savedData) return false;
  
  try {
    const data = JSON.parse(savedData);
    const recentLogs = data.logs || [];
    
    if (recentLogs.length === 0) return false;
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    return recentLogs.some(log => {
      const logDate = new Date(log.date);
      return logDate >= cutoffTime && log.duration >= (data.sleepGoal || 8);
    });
  } catch (e) {
    return false;
  }
};

// Get current sleep average
export const getSleepAverage = (days = 7) => {
  if (typeof window === 'undefined') return 0;
  
  const savedData = localStorage.getItem('mc-sleep-tracker');
  if (!savedData) return 0;
  
  try {
    const data = JSON.parse(savedData);
    const logs = (data.logs || []).slice(0, days);
    
    if (logs.length === 0) return 0;
    
    const avg = logs.reduce((sum, log) => sum + log.duration, 0) / logs.length;
    return Math.round(avg * 10) / 10;
  } catch (e) {
    return 0;
  }
};
