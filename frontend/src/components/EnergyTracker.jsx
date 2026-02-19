'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import './EnergyTracker.css';

const ENERGY_LEVELS = [
  { value: 1, label: 'Exhausted', emoji: '😫', color: '#ef4444', description: 'Running on empty' },
  { value: 2, label: 'Low', emoji: '😴', color: '#f97316', description: 'Struggling to focus' },
  { value: 3, label: 'Moderate', emoji: '😐', color: '#eab308', description: 'Getting by' },
  { value: 4, label: 'Good', emoji: '🙂', color: '#22c55e', description: 'Feeling capable' },
  { value: 5, label: 'Peak', emoji: '⚡', color: '#10b981', description: 'In the zone!' }
];

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const FACTORS = [
  { id: 'sleep', label: 'Sleep', icon: '😴' },
  { id: 'exercise', label: 'Exercise', icon: '💪' },
  { id: 'caffeine', label: 'Caffeine', icon: '☕' },
  { id: 'meal', label: 'Heavy Meal', icon: '🍽️' },
  { id: 'stress', label: 'Stress', icon: '😰' },
  { id: 'hydration', label: 'Hydrated', icon: '💧' },
  { id: 'fresh_air', label: 'Fresh Air', icon: '🌿' },
  { id: 'social', label: 'Socializing', icon: '👥' }
];

export default function EnergyTracker({ isOpen, onClose }) {
  const [energyLogs, setEnergyLogs] = useState([]);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [viewMode, setViewMode] = useState('today'); // today, week, month
  
  // Form state
  const [selectedLevel, setSelectedLevel] = useState(3);
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [notes, setNotes] = useState('');
  const [customTime, setCustomTime] = useState('');

  // Load data from localStorage
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const savedData = localStorage.getItem('mc-energy-tracker');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setEnergyLogs(data.logs || []);
      } catch (e) {
        console.error('Failed to parse energy tracker data:', e);
      }
    }
  }, [isOpen]);

  // Save data to localStorage
  const saveData = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mc-energy-tracker', JSON.stringify({ logs: energyLogs }));
  }, [energyLogs]);

  useEffect(() => {
    saveData();
  }, [saveData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const timestamp = customTime ? new Date(customTime) : new Date();
    
    const newLog = {
      id: Date.now(),
      level: selectedLevel,
      factors: selectedFactors,
      notes: notes.trim(),
      timestamp: timestamp.toISOString()
    };

    setEnergyLogs(prev => [newLog, ...prev]);
    
    // Reset form
    setSelectedLevel(3);
    setSelectedFactors([]);
    setNotes('');
    setCustomTime('');
    setShowLogForm(false);
  };

  const deleteLog = (id) => {
    setEnergyLogs(prev => prev.filter(log => log.id !== id));
  };

  const toggleFactor = (factorId) => {
    setSelectedFactors(prev => 
      prev.includes(factorId) 
        ? prev.filter(f => f !== factorId)
        : [...prev, factorId]
    );
  };

  const getEnergyInfo = (value) => ENERGY_LEVELS.find(e => e.value === value) || ENERGY_LEVELS[2];

  const getTodayLogs = useCallback(() => {
    const today = new Date().toDateString();
    return energyLogs.filter(log => new Date(log.timestamp).toDateString() === today);
  }, [energyLogs]);

  const getWeekLogs = useCallback(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return energyLogs.filter(log => new Date(log.timestamp) >= weekAgo);
  }, [energyLogs]);

  const getMonthLogs = useCallback(() => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return energyLogs.filter(log => new Date(log.timestamp) >= monthAgo);
  }, [energyLogs]);

  const getCurrentLogs = () => {
    switch (viewMode) {
      case 'week': return getWeekLogs();
      case 'month': return getMonthLogs();
      default: return getTodayLogs();
    }
  };

  const calculateStats = useCallback(() => {
    const logs = getCurrentLogs();
    if (logs.length === 0) return null;

    const avgEnergy = logs.reduce((sum, log) => sum + log.level, 0) / logs.length;
    
    // Group by hour for pattern analysis
    const hourlyData = {};
    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      if (!hourlyData[hour]) hourlyData[hour] = [];
      hourlyData[hour].push(log.level);
    });

    // Find peak and low energy hours
    let peakHour = null;
    let lowHour = null;
    let peakAvg = 0;
    let lowAvg = 5;

    Object.entries(hourlyData).forEach(([hour, levels]) => {
      const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
      if (avg > peakAvg) {
        peakAvg = avg;
        peakHour = parseInt(hour);
      }
      if (avg < lowAvg) {
        lowAvg = avg;
        lowHour = parseInt(hour);
      }
    });

    // Factor analysis
    const factorImpact = {};
    logs.forEach(log => {
      log.factors.forEach(factor => {
        if (!factorImpact[factor]) factorImpact[factor] = { count: 0, totalEnergy: 0 };
        factorImpact[factor].count++;
        factorImpact[factor].totalEnergy += log.level;
      });
    });

    // Sort factors by average energy when present
    const sortedFactors = Object.entries(factorImpact)
      .map(([factor, data]) => ({
        factor,
        avgEnergy: data.totalEnergy / data.count,
        count: data.count
      }))
      .sort((a, b) => b.avgEnergy - a.avgEnergy);

    return {
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      totalLogs: logs.length,
      peakHour,
      peakAvg: Math.round(peakAvg * 10) / 10,
      lowHour,
      lowAvg: Math.round(lowAvg * 10) / 10,
      factorImpact: sortedFactors
    };
  }, [getCurrentLogs]);

  const stats = calculateStats();
  const currentLogs = getCurrentLogs();

  // Generate today's hourly chart data
  const getHourlyChartData = () => {
    const today = new Date().toDateString();
    const todayLogs = energyLogs.filter(log => new Date(log.timestamp).toDateString() === today);
    
    const data = [];
    for (let hour = 6; hour <= 23; hour++) {
      const hourLogs = todayLogs.filter(log => new Date(log.timestamp).getHours() === hour);
      const avgEnergy = hourLogs.length > 0 
        ? hourLogs.reduce((sum, log) => sum + log.level, 0) / hourLogs.length 
        : 0;
      
      data.push({
        hour,
        label: `${hour}:00`,
        energy: avgEnergy,
        hasData: hourLogs.length > 0
      });
    }
    return data;
  };

  const hourlyData = getHourlyChartData();

  // Get trend over last 7 days
  const getWeeklyTrend = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const dayLogs = energyLogs.filter(log => new Date(log.timestamp).toDateString() === dateStr);
      const avgEnergy = dayLogs.length > 0
        ? dayLogs.reduce((sum, log) => sum + log.level, 0) / dayLogs.length
        : 0;
      
      data.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        energy: avgEnergy,
        count: dayLogs.length
      });
    }
    return data;
  };

  const weeklyTrend = getWeeklyTrend();

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="energy-panel-overlay" onClick={onClose}>
      <div className="energy-panel" onClick={e => e.stopPropagation()}>
        <div className="energy-panel-header">
          <h3>⚡ Energy Tracker</h3>
          <div className="header-actions">
            <button 
              className="insights-btn"
              onClick={() => setShowInsights(!showInsights)}
              title="Insights"
            >
              💡
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

        {/* View Mode Tabs */}
        <div className="view-mode-tabs">
          <button 
            className={viewMode === 'today' ? 'active' : ''}
            onClick={() => setViewMode('today')}
          >
            Today
          </button>
          <button 
            className={viewMode === 'week' ? 'active' : ''}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button 
            className={viewMode === 'month' ? 'active' : ''}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
        </div>

        {showInsights ? (
          <div className="energy-insights">
            <h4>🔍 Energy Insights</h4>
            
            {stats ? (
              <>
                <div className="insight-cards">
                  <div className="insight-card">
                    <span className="insight-icon">⏰</span>
                    <div className="insight-content">
                      <span className="insight-label">Peak Energy Time</span>
                      <span className="insight-value">
                        {stats.peakHour !== null ? `${stats.peakHour}:00 (${stats.peakAvg} avg)` : 'Not enough data'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="insight-card">
                    <span className="insight-icon">📉</span>
                    <div className="insight-content">
                      <span className="insight-label">Low Energy Time</span>
                      <span className="insight-value">
                        {stats.lowHour !== null ? `${stats.lowHour}:00 (${stats.lowAvg} avg)` : 'Not enough data'}
                      </span>
                    </div>
                  </div>
                </div>

                {stats.factorImpact.length > 0 && (
                  <div className="factor-insights">
                    <h5>Factor Impact Analysis</h5>
                    <p className="insight-hint">
                      Based on your logs, here's how different factors correlate with your energy:
                    </p>
                    <div className="factor-list">
                      {stats.factorImpact.map(({ factor, avgEnergy, count }) => {
                        const factorInfo = FACTORS.find(f => f.id === factor);
                        return (
                          <div key={factor} className="factor-item">
                            <span className="factor-icon">{factorInfo?.icon || '•'}</span>
                            <span className="factor-name">{factorInfo?.label || factor}</span>
                            <div className="factor-bar-container">
                              <div 
                                className="factor-bar"
                                style={{ 
                                  width: `${(avgEnergy / 5) * 100}%`,
                                  backgroundColor: getEnergyInfo(Math.round(avgEnergy)).color
                                }}
                              />
                            </div>
                            <span className="factor-avg">{avgEnergy.toFixed(1)}</span>
                            <span className="factor-count">({count}x)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="insight-tips">
                  <h5>💡 Recommendations</h5>
                  <ul>
                    {stats.peakHour !== null && (
                      <li>Schedule important tasks around {stats.peakHour}:00 when your energy peaks</li>
                    )}
                    {stats.avgEnergy < 3 && (
                      <li>Your average energy is on the lower side. Consider reviewing sleep and nutrition habits.</li>
                    )}
                    <li>Log energy levels consistently to get more accurate insights</li>
                    <li>Try to identify patterns between activities and energy crashes</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="empty-insights">
                <span className="empty-icon">📊</span>
                <p>Not enough data yet. Start logging your energy levels to see insights!</p>
              </div>
            )}

            <button className="back-btn" onClick={() => setShowInsights(false)}>
              ← Back to Tracker
            </button>
          </div>
        ) : showStats ? (
          <div className="energy-stats">
            <h4>📊 Energy Statistics</h4>
            
            {stats ? (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-value">{stats.avgEnergy}</span>
                    <span className="stat-label">Avg Energy</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats.totalLogs}</span>
                    <span className="stat-label">Total Logs</span>
                  </div>
                  {stats.peakHour !== null && (
                    <div className="stat-card highlight">
                      <span className="stat-value">{stats.peakHour}:00</span>
                      <span className="stat-label">Peak Hour</span>
                    </div>
                  )}
                </div>

                {/* Weekly Trend Chart */}
                <div className="chart-section">
                  <h5>7-Day Trend</h5>
                  <div className="trend-chart">
                    {weeklyTrend.map((day, index) => (
                      <div key={index} className="trend-bar-container">
                        <div className="trend-bar-wrapper">
                          <div 
                            className={`trend-bar ${day.count > 0 ? 'has-data' : ''}`}
                            style={{ 
                              height: day.energy > 0 ? `${(day.energy / 5) * 100}%` : '4px',
                              backgroundColor: day.energy > 0 ? getEnergyInfo(Math.round(day.energy)).color : 'rgba(255,255,255,0.1)'
                            }}
                          />
                        </div>
                        <span className="trend-day">{day.day}</span>
                        {day.count > 0 && (
                          <span className="trend-value">{day.energy.toFixed(1)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-stats">
                <span className="empty-icon">📈</span>
                <p>No data yet. Start tracking to see your statistics!</p>
              </div>
            )}

            <button className="back-btn" onClick={() => setShowStats(false)}>
              ← Back to Tracker
            </button>
          </div>
        ) : showLogForm ? (
          <form className="energy-form" onSubmit={handleSubmit}>
            <h4>Log Energy Level</h4>
            
            <div className="form-group">
              <label>How's your energy right now?</label>
              <div className="energy-selector">
                {ENERGY_LEVELS.map(level => (
                  <button
                    key={level.value}
                    type="button"
                    className={selectedLevel === level.value ? 'active' : ''}
                    onClick={() => setSelectedLevel(level.value)}
                    style={{ '--energy-color': level.color }}
                  >
                    <span className="energy-emoji">{level.emoji}</span>
                    <span className="energy-label">{level.label}</span>
                    <span className="energy-desc">{level.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Affecting Factors (optional)</label>
              <div className="factors-grid">
                {FACTORS.map(factor => (
                  <button
                    key={factor.id}
                    type="button"
                    className={selectedFactors.includes(factor.id) ? 'active' : ''}
                    onClick={() => toggleFactor(factor.id)}
                  >
                    <span className="factor-icon">{factor.icon}</span>
                    <span className="factor-label">{factor.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Time (optional - defaults to now)</label>
              <input
                type="datetime-local"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What are you working on? How do you feel?"
                rows={2}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowLogForm(false)}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                Save Energy Log
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Current Energy Summary */}
            <div className="energy-summary">
              {currentLogs.length > 0 ? (
                <>
                  <div className="current-energy">
                    {viewMode === 'today' ? (
                      <>
                        <div className="energy-display">
                          {(() => {
                            const latest = currentLogs[0];
                            const info = getEnergyInfo(latest.level);
                            return (
                              <>
                                <span className="energy-big-emoji">{info.emoji}</span>
                                <div className="energy-big-info">
                                  <span className="energy-big-level">{info.label}</span>
                                  <span className="energy-big-time">
                                    {formatTime(latest.timestamp)}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <div className="energy-today-avg">
                          <span className="avg-label">Today's Average</span>
                          <span className="avg-value">
                            {(currentLogs.reduce((sum, log) => sum + log.level, 0) / currentLogs.length).toFixed(1)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="period-summary">
                        <span className="summary-label">
                          {viewMode === 'week' ? 'This Week' : 'This Month'} Average
                        </span>
                        <span className="summary-value">
                          {(currentLogs.reduce((sum, log) => sum + log.level, 0) / currentLogs.length).toFixed(1)}
                        </span>
                        <span className="summary-count">
                          {currentLogs.length} logs
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Today's Hourly Chart */}
                  {viewMode === 'today' && (
                    <div className="hourly-chart-section">
                      <h5>Today's Energy Curve</h5>
                      <div className="hourly-chart">
                        {hourlyData.map((data, index) => (
                          <div key={index} className="hour-bar-container">
                            <div className="hour-bar-wrapper">
                              <div 
                                className={`hour-bar ${data.hasData ? 'has-data' : ''}`}
                                style={{ 
                                  height: data.energy > 0 ? `${(data.energy / 5) * 100}%` : '4px',
                                  backgroundColor: data.energy > 0 ? getEnergyInfo(Math.round(data.energy)).color : 'rgba(255,255,255,0.1)'
                                }}
                                title={data.hasData ? `Energy: ${data.energy.toFixed(1)}` : 'No data'}
                              />
                            </div>
                            {index % 3 === 0 && (
                              <span className="hour-label">{data.label}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-summary">
                  <span className="empty-emoji">⚡</span>
                  <p>No energy logs yet for this {viewMode}</p>
                  <p className="empty-hint">Start tracking to understand your energy patterns!</p>
                </div>
              )}
            </div>

            {/* Quick Log Button */}
            <div className="quick-log-section">
              <button className="log-energy-btn" onClick={() => setShowLogForm(true)}>
                <span className="btn-icon">⚡</span>
                <span className="btn-text">Log Current Energy</span>
              </button>
            </div>

            {/* Recent Logs */}
            {currentLogs.length > 0 && (
              <div className="recent-logs">
                <h4>Recent Logs</h4>
                <div className="logs-list">
                  {currentLogs.slice(0, 10).map(log => {
                    const energyInfo = getEnergyInfo(log.level);
                    return (
                      <div key={log.id} className="log-item">
                        <div 
                          className="log-energy-indicator"
                          style={{ backgroundColor: energyInfo.color }}
                        >
                          {energyInfo.emoji}
                        </div>
                        <div className="log-content">
                          <div className="log-header">
                            <span className="log-level">{energyInfo.label}</span>
                            <span className="log-time">
                              {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                            </span>
                          </div>
                          {log.factors.length > 0 && (
                            <div className="log-factors">
                              {log.factors.map(f => {
                                const factorInfo = FACTORS.find(fact => fact.id === f);
                                return (
                                  <span key={f} className="factor-tag">
                                    {factorInfo?.icon} {factorInfo?.label}
                                  </span>
                                );
                              })}
                            </div>
                          )}
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

            {/* Energy Tips */}
            <div className="energy-tips">
              <p>
                💡 <strong>Tip:</strong> {currentLogs.length === 0 
                  ? 'Log your energy 3-4 times daily to identify your peak performance hours.' 
                  : stats?.avgEnergy < 3 
                    ? 'Your energy has been low. Consider a quick walk, hydration, or a power nap.' 
                    : 'Great energy! Use this time for your most important tasks.'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Utility function to get current energy level
export const getCurrentEnergyLevel = () => {
  if (typeof window === 'undefined') return null;
  
  const savedData = localStorage.getItem('mc-energy-tracker');
  if (!savedData) return null;
  
  try {
    const data = JSON.parse(savedData);
    const todayLogs = data.logs?.filter(log => 
      new Date(log.timestamp).toDateString() === new Date().toDateString()
    );
    
    if (todayLogs.length === 0) return null;
    
    // Return most recent
    return todayLogs.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
  } catch (e) {
    return null;
  }
};

// Utility function to get optimal work hours
export const getOptimalWorkHours = () => {
  if (typeof window === 'undefined') return [];
  
  const savedData = localStorage.getItem('mc-energy-tracker');
  if (!savedData) return [];
  
  try {
    const data = JSON.parse(savedData);
    const logs = data.logs || [];
    
    if (logs.length < 5) return [];
    
    // Group by hour and calculate average
    const hourlyAvgs = {};
    logs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      if (!hourlyAvgs[hour]) hourlyAvgs[hour] = { sum: 0, count: 0 };
      hourlyAvgs[hour].sum += log.level;
      hourlyAvgs[hour].count++;
    });
    
    // Find hours with avg >= 4
    const optimalHours = Object.entries(hourlyAvgs)
      .filter(([hour, data]) => data.count >= 2 && (data.sum / data.count) >= 4)
      .map(([hour]) => parseInt(hour))
      .sort((a, b) => a - b);
    
    return optimalHours;
  } catch (e) {
    return [];
  }
};
