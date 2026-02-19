'use client';

import React, { useState, useEffect } from 'react';
// import './ProductivityAnalytics.css';

const isBrowser = typeof window !== 'undefined';

const STORAGE_KEY = 'mc-productivity-data';

const ACHIEVEMENTS = [
  { id: 'first_focus', name: 'First Steps', description: 'Complete your first focus session', icon: '🌱', condition: (stats) => stats.totalSessions >= 1 },
  { id: 'focus_5', name: 'Getting Warm', description: 'Complete 5 focus sessions', icon: '🔥', condition: (stats) => stats.totalSessions >= 5 },
  { id: 'focus_25', name: 'Focus Warrior', description: 'Complete 25 focus sessions', icon: '⚔️', condition: (stats) => stats.totalSessions >= 25 },
  { id: 'focus_100', name: 'Centurion', description: 'Complete 100 focus sessions', icon: '👑', condition: (stats) => stats.totalSessions >= 100 },
  { id: 'streak_3', name: 'On Fire', description: '3 day focus streak', icon: '🔥', condition: (stats) => stats.currentStreak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day focus streak', icon: '📅', condition: (stats) => stats.currentStreak >= 7 },
  { id: 'streak_30', name: 'Monthly Master', description: '30 day focus streak', icon: '🏆', condition: (stats) => stats.currentStreak >= 30 },
  { id: 'hours_10', name: 'Deep Diver', description: '10 hours of focused time', icon: '🤿', condition: (stats) => stats.totalMinutes >= 600 },
  { id: 'hours_50', name: 'Half Century', description: '50 hours of focused time', icon: '⏰', condition: (stats) => stats.totalMinutes >= 3000 },
  { id: 'hours_100', name: 'Century Club', description: '100 hours of focused time', icon: '💯', condition: (stats) => stats.totalMinutes >= 6000 },
];

const loadProductivityData = () => {
  if (!isBrowser) return { sessions: [], dailyGoals: {}, preferences: { dailyGoalMinutes: 120 } };
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { sessions: [], dailyGoals: {}, preferences: { dailyGoalMinutes: 120 } };
  } catch {
    return { sessions: [], dailyGoals: {}, preferences: { dailyGoalMinutes: 120 } };
  }
};

const saveProductivityData = (data) => {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const formatDate = (date) => date.toISOString().split('T')[0];

const getWeekDates = (offset = 0) => {
  const dates = [];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (offset * 7));
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const calculateStats = (sessions) => {
  const now = new Date();
  const today = formatDate(now);
  
  const todaySessions = sessions.filter(s => s.date === today);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  const thisWeekSessions = sessions.filter(s => new Date(s.date) >= thisWeekStart);
  const weekMinutes = thisWeekSessions.reduce((sum, s) => sum + s.duration, 0);
  
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  
  // Calculate streak
  let currentStreak = 0;
  let checkDate = new Date(now);
  
  while (true) {
    const dateStr = formatDate(checkDate);
    const daySessions = sessions.filter(s => s.date === dateStr);
    if (daySessions.length > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (dateStr === today) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 0;
  const sortedDates = [...new Set(sessions.map(s => s.date))].sort();
  
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak);
  
  // Find best day
  const dayMinutes = {};
  sessions.forEach(s => {
    dayMinutes[s.date] = (dayMinutes[s.date] || 0) + s.duration;
  });
  const bestDay = Object.entries(dayMinutes).sort((a, b) => b[1] - a[1])[0];
  
  // Hour distribution
  const hourDistribution = new Array(24).fill(0);
  sessions.forEach(s => {
    if (s.hour !== undefined) {
      hourDistribution[s.hour] += s.duration;
    }
  });
  const bestHour = hourDistribution.indexOf(Math.max(...hourDistribution));
  
  return {
    todayMinutes,
    weekMinutes,
    totalSessions,
    totalMinutes,
    currentStreak,
    bestStreak,
    bestDay: bestDay ? { date: bestDay[0], minutes: bestDay[1] } : null,
    bestHour: bestHour >= 0 ? bestHour : null,
    hourDistribution
  };
};

const WeeklyChart = ({ sessions, weekDates }) => {
  const maxMinutes = 240; // 4 hours max for scale
  
  const getDayData = (date) => {
    const dateStr = formatDate(date);
    const daySessions = sessions.filter(s => s.date === dateStr);
    return daySessions.reduce((sum, s) => sum + s.duration, 0);
  };
  
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="weekly-chart">
      {weekDates.map((date, idx) => {
        const minutes = getDayData(date);
        const height = Math.min((minutes / maxMinutes) * 100, 100);
        const isToday = formatDate(date) === formatDate(new Date());
        
        return (
          <div key={idx} className="chart-bar-wrapper">
            <div className="chart-bar-container">
              <div 
                className={`chart-bar ${isToday ? 'today' : ''} ${minutes > 0 ? 'filled' : ''}`}
                style={{ height: `${height}%` }}
              >
                {minutes > 0 && <span className="chart-value">{Math.round(minutes)}m</span>}
              </div>
            </div>
            <span className={`chart-label ${isToday ? 'today' : ''}`}>{dayLabels[idx]}</span>
          </div>
        );
      })}
    </div>
  );
};

const HourDistribution = ({ hourDistribution }) => {
  const maxValue = Math.max(...hourDistribution, 1);
  const peakHours = hourDistribution.map((m, h) => ({ hour: h, minutes: m }))
    .filter(h => h.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5);
  
  return (
    <div className="hour-distribution">
      <div className="hour-chart">
        {Array.from({ length: 12 }, (_, i) => i * 2).map(hour => {
          const height = Math.min((hourDistribution[hour] / maxValue) * 100, 100);
          return (
            <div key={hour} className="hour-bar-wrapper">
              <div className="hour-bar-container">
                <div 
                  className={`hour-bar ${height > 0 ? 'filled' : ''}`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="hour-label">{hour}h</span>
            </div>
          );
        })}
      </div>
      {peakHours.length > 0 && (
        <div className="peak-hours">
          <span className="peak-label">Peak hours:</span>
          {peakHours.map((h, i) => (
            <span key={h.hour} className="peak-hour">
              {h.hour}:00{h.minutes > 60 && ` (${Math.floor(h.minutes / 60)}h ${h.minutes % 60}m)`}
              {i < peakHours.length - 1 && ', '}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const AchievementBadge = ({ achievement, unlocked }) => (
  <div className={`achievement-badge ${unlocked ? 'unlocked' : 'locked'}`}>
    <div className="achievement-icon">{achievement.icon}</div>
    <div className="achievement-info">
      <span className="achievement-name">{achievement.name}</span>
      <span className="achievement-desc">{achievement.description}</span>
    </div>
  </div>
);

const GoalProgress = ({ current, goal, label }) => {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <div className="goal-progress">
      <div className="goal-header">
        <span className="goal-label">{label}</span>
        <span className="goal-value">{Math.round(current)}/{goal} min</span>
      </div>
      <div className="progress-bar-container">
        <div 
          className={`progress-bar ${percentage >= 100 ? 'complete' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default function ProductivityAnalytics({ isOpen, onClose }) {
  const [data, setData] = useState({ sessions: [], dailyGoals: {}, preferences: { dailyGoalMinutes: 120 } });
  const [activeTab, setActiveTab] = useState('overview');
  const [weekOffset, setWeekOffset] = useState(0);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(120);
  
  useEffect(() => {
    if (isOpen) {
      setData(loadProductivityData());
    }
  }, [isOpen]);
  
  const stats = calculateStats(data.sessions);
  const weekDates = getWeekDates(weekOffset);
  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.condition(stats));
  const lockedAchievements = ACHIEVEMENTS.filter(a => !a.condition(stats));
  
  const handleGoalSave = () => {
    const newData = { ...data, preferences: { ...data.preferences, dailyGoalMinutes: tempGoal } };
    setData(newData);
    saveProductivityData(newData);
    setIsEditingGoal(false);
  };
  
  const handleAddTestSession = () => {
    const now = new Date();
    const newSession = {
      id: Date.now(),
      date: formatDate(now),
      hour: now.getHours(),
      duration: 25,
      completed: true,
      timestamp: now.toISOString()
    };
    const newData = { ...data, sessions: [...data.sessions, newSession] };
    setData(newData);
    saveProductivityData(newData);
  };
  
  const handleClearData = () => {
    if (confirm('Clear all productivity data? This cannot be undone.')) {
      const emptyData = { sessions: [], dailyGoals: {}, preferences: { dailyGoalMinutes: 120 } };
      setData(emptyData);
      saveProductivityData(emptyData);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="productivity-overlay" onClick={onClose}>
      <div className="productivity-panel" onClick={e => e.stopPropagation()}>
        <div className="productivity-header">
          <div className="productivity-title">
            <span className="title-icon">📊</span>
            <h2>Productivity Analytics</h2>
          </div>
          <div className="productivity-actions">
            <button className="action-btn test-btn" onClick={handleAddTestSession} title="Add test session">
              + Test
            </button>
            <button className="action-btn clear-btn" onClick={handleClearData} title="Clear all data">
              🗑️
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>
        
        <div className="productivity-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
        
        <div className="productivity-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card primary">
                  <span className="stat-value">{stats.totalSessions}</span>
                  <span className="stat-label">Total Sessions</span>
                </div>
                <div className="stat-card primary">
                  <span className="stat-value">{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</span>
                  <span className="stat-label">Total Focus Time</span>
                </div>
                <div className="stat-card secondary">
                  <span className="stat-value">{stats.currentStreak}</span>
                  <span className="stat-label">Current Streak</span>
                </div>
                <div className="stat-card secondary">
                  <span className="stat-value">{stats.bestStreak}</span>
                  <span className="stat-label">Best Streak</span>
                </div>
                <div className="stat-card secondary">
                  <span className="stat-value">{stats.bestHour !== null ? `${stats.bestHour}:00` : '--'}</span>
                  <span className="stat-label">Peak Hour</span>
                </div>
                <div className="stat-card secondary">
                  <span className="stat-value">
                    {stats.bestDay ? new Date(stats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
                  </span>
                  <span className="stat-label">Best Day</span>
                  {stats.bestDay && <span className="stat-sub">{Math.floor(stats.bestDay.minutes / 60)}h {stats.bestDay.minutes % 60}m</span>}
                </div>
              </div>
              
              <div className="goals-section">
                <div className="section-header">
                  <h3>📈 Daily Goals</h3>
                  {!isEditingGoal ? (
                    <button className="edit-goal-btn" onClick={() => { setTempGoal(data.preferences.dailyGoalMinutes); setIsEditingGoal(true); }}>
                      Edit
                    </button>
                  ) : (
                    <div className="goal-edit">
                      <input 
                        type="number" 
                        value={tempGoal} 
                        onChange={(e) => setTempGoal(parseInt(e.target.value) || 0)}
                        min="15"
                        max="480"
                      />
                      <button onClick={handleGoalSave}>Save</button>
                      <button onClick={() => setIsEditingGoal(false)}>Cancel</button>
                    </div>
                  )}
                </div>
                <GoalProgress 
                  current={stats.todayMinutes} 
                  goal={data.preferences.dailyGoalMinutes} 
                  label="Today" 
                />
                <GoalProgress 
                  current={stats.weekMinutes} 
                  goal={data.preferences.dailyGoalMinutes * 5} 
                  label="This Week (Mon-Fri)" 
                />
              </div>
              
              <div className="weekly-section">
                <div className="section-header">
                  <h3>📅 Weekly Activity</h3>
                  <div className="week-nav">
                    <button onClick={() => setWeekOffset(weekOffset - 1)}>←</button>
                    <span>{weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} Weeks Ago`}</span>
                    <button onClick={() => setWeekOffset(Math.min(weekOffset + 1, 0))} disabled={weekOffset === 0}>→</button>
                  </div>
                </div>
                <WeeklyChart sessions={data.sessions} weekDates={weekDates} />
              </div>
              
              <div className="hour-section">
                <h3>⏰ Focus by Hour</h3>
                <HourDistribution hourDistribution={stats.hourDistribution} />
              </div>
            </div>
          )}
          
          {activeTab === 'achievements' && (
            <div className="achievements-tab">
              <div className="achievements-summary">
                <div className="achievement-progress">
                  <div className="progress-ring">
                    <svg viewBox="0 0 100 100">
                      <circle className="progress-ring-bg" cx="50" cy="50" r="45" />
                      <circle 
                        className="progress-ring-fill" 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        style={{ 
                          strokeDasharray: `${2 * Math.PI * 45}`,
                          strokeDashoffset: `${2 * Math.PI * 45 * (1 - unlockedAchievements.length / ACHIEVEMENTS.length)}`
                        }}
                      />
                    </svg>
                    <div className="progress-text">
                      <span className="progress-value">{unlockedAchievements.length}</span>
                      <span className="progress-total">/{ACHIEVEMENTS.length}</span>
                    </div>
                  </div>
                  <span className="progress-label">Achievements Unlocked</span>
                </div>
              </div>
              
              {unlockedAchievements.length > 0 && (
                <div className="achievements-section">
                  <h4>🏆 Unlocked</h4>
                  <div className="achievements-grid">
                    {unlockedAchievements.map(a => (
                      <AchievementBadge key={a.id} achievement={a} unlocked={true} />
                    ))}
                  </div>
                </div>
              )}
              
              {lockedAchievements.length > 0 && (
                <div className="achievements-section">
                  <h4>🔒 Locked</h4>
                  <div className="achievements-grid">
                    {lockedAchievements.map(a => (
                      <AchievementBadge key={a.id} achievement={a} unlocked={false} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="history-tab">
              {data.sessions.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>No focus sessions yet.</p>
                  <p className="empty-hint">Use the Focus Timer to track your productivity!</p>
                </div>
              ) : (
                <div className="sessions-list">
                  {[...data.sessions].reverse().map(session => (
                    <div key={session.id} className="session-item">
                      <div className="session-date">
                        {new Date(session.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="session-time">
                        {session.hour !== undefined ? `${session.hour}:00` : '--:--'}
                      </div>
                      <div className="session-duration">
                        {Math.floor(session.duration / 60)}h {session.duration % 60}m
                      </div>
                      <div className="session-status">
                        {session.completed ? '✅' : '⏸️'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export helper for other components to log sessions
export const logFocusSession = (durationMinutes, completed = true) => {
  if (!isBrowser) return;
  
  const data = loadProductivityData();
  const now = new Date();
  
  const newSession = {
    id: Date.now(),
    date: formatDate(now),
    hour: now.getHours(),
    duration: durationMinutes,
    completed,
    timestamp: now.toISOString()
  };
  
  data.sessions.push(newSession);
  saveProductivityData(data);
  
  return newSession;
};

export const getTodayProgress = () => {
  const data = loadProductivityData();
  const today = formatDate(new Date());
  const todaySessions = data.sessions.filter(s => s.date === today);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  
  return {
    minutes: todayMinutes,
    goal: data.preferences?.dailyGoalMinutes || 120,
    sessions: todaySessions.length,
    percentage: Math.min((todayMinutes / (data.preferences?.dailyGoalMinutes || 120)) * 100, 100)
  };
};
