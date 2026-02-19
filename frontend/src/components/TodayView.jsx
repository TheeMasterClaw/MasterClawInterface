import React, { useState, useEffect } from 'react';
import './TodayView.css';
import { getApiUrl } from '../lib/apiUrl.js';

const API_URL = getApiUrl();

const MOOD_EMOJIS = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😄'
};

const MOOD_LABELS = {
  1: 'Rough',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Great'
};

const MOOD_COLORS = {
  1: '#ff6b6b',
  2: '#feca57',
  3: '#48dbfb',
  4: '#1dd1a1',
  5: '#5f27cd'
};

export default function TodayView({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen) {
      fetchTodayData();
      fetchWeekData();
    }
  }, [isOpen]);

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/today`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch today data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeekData = async () => {
    try {
      const response = await fetch(`${API_URL}/today/week`);
      const result = await response.json();
      setWeekData(result.weekData || []);
    } catch (err) {
      console.error('Failed to fetch week data:', err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#1dd1a1';
    if (score >= 60) return '#48dbfb';
    if (score >= 40) return '#feca57';
    return '#ff6b6b';
  };

  const getScoreRingColor = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'needs-work';
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const handleQuickAction = (actionId) => {
    // Close this view and trigger the appropriate panel
    onClose();
    // Dispatch custom event for the parent to handle
    window.dispatchEvent(new CustomEvent('todayViewAction', { 
      detail: { action: actionId } 
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="today-view-overlay" onClick={onClose}>
      <div className="today-view-panel" onClick={e => e.stopPropagation()}>
        <div className="today-view-header">
          <div className="header-title">
            <span className="header-icon">📅</span>
            <div>
              <h2>Today</h2>
              <p className="header-date">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button className="refresh-btn" onClick={() => { fetchTodayData(); fetchWeekData(); }} title="Refresh">
              🔄
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {loading ? (
          <div className="today-view-loading">
            <div className="loading-spinner">⏳</div>
            <p>Loading your day...</p>
          </div>
        ) : data ? (
          <>
            {/* Day Score Ring */}
            <div className={`day-score-section ${getScoreRingColor(data.dayScore)}`}>
              <div className="score-ring-container">
                <svg viewBox="0 0 120 120" className="score-ring">
                  <circle className="ring-bg" cx="60" cy="60" r="54" />
                  <circle 
                    className="ring-progress" 
                    cx="60" 
                    cy="60" 
                    r="54"
                    style={{
                      strokeDasharray: `${2 * Math.PI * 54}`,
                      strokeDashoffset: `${2 * Math.PI * 54 * (1 - data.dayScore / 100)}`,
                      stroke: getScoreColor(data.dayScore)
                    }}
                  />
                </svg>
                <div className="score-content">
                  <span className="score-value" style={{ color: getScoreColor(data.dayScore) }}>
                    {data.dayScore}
                  </span>
                  <span className="score-label">Day Score</span>
                </div>
              </div>
              
              <div className="score-message">
                <p className="status-text">{data.dayMessage}</p>
                <div className="week-streak">
                  {weekData.map((day, idx) => (
                    <div 
                      key={idx} 
                      className={`day-pill ${day.score >= 60 ? 'good' : ''} ${idx === 6 ? 'today' : ''}`}
                      title={`${day.dayName}: ${day.score} points`}
                      style={{ '--score-color': getScoreColor(day.score) }}
                    >
                      {day.dayName.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="today-tabs">
              <button 
                className={`today-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📊 Overview
              </button>
              <button 
                className={`today-tab ${activeTab === 'habits' ? 'active' : ''}`}
                onClick={() => setActiveTab('habits')}
              >
                ✓ Habits
              </button>
              <button 
                className={`today-tab ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                📈 Activity
              </button>
            </div>

            {/* Tab Content */}
            <div className="today-content">
              
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="overview-grid">
                  {/* Mood Card */}
                  <div className={`metric-card mood ${data.summary.mood ? 'has-data' : ''}`}>
                    <div className="metric-header">
                      <span className="metric-icon">😊</span>
                      <span className="metric-title">Mood</span>
                    </div>
                    {data.summary.mood ? (
                      <div className="metric-content">
                        <div 
                          className="mood-display"
                          style={{ color: MOOD_COLORS[data.summary.mood.level] }}
                        >
                          <span className="mood-emoji">{MOOD_EMOJIS[data.summary.mood.level]}</span>
                          <span className="mood-label">{MOOD_LABELS[data.summary.mood.level]}</span>
                        </div>
                        {data.summary.mood.note && (
                          <p className="mood-note">{data.summary.mood.note}</p>
                        )}
                      </div>
                    ) : (
                      <div className="metric-empty">
                        <p>Not logged yet</p>
                        <button className="btn-link" onClick={() => handleQuickAction('mood')}>
                          Log now →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Water Card */}
                  <div className="metric-card water">
                    <div className="metric-header">
                      <span className="metric-icon">💧</span>
                      <span className="metric-title">Water</span>
                    </div>
                    <div className="metric-content">
                      <div className="water-progress">
                        <div className="water-visual">
                          <div 
                            className="water-level"
                            style={{ height: `${data.summary.water.progress}%` }}
                          />
                          <span className="water-amount">
                            {Math.round(data.summary.water.current / 100) / 10}L
                          </span>
                        </div>
                        <div className="water-stats">
                          <span className="water-percent">{data.summary.water.progress}%</span>
                          <span className="water-goal">Goal: {data.summary.water.goal / 1000}L</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Focus Card */}
                  <div className="metric-card focus">
                    <div className="metric-header">
                      <span className="metric-icon">🎯</span>
                      <span className="metric-title">Focus Time</span>
                    </div>
                    <div className="metric-content">
                      <div className="focus-display">
                        <span className="focus-minutes">{data.summary.focus.minutes}</span>
                        <span className="focus-unit">minutes</span>
                      </div>
                      <p className="focus-sessions">
                        {data.summary.focus.sessions} session{data.summary.focus.sessions !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Tasks Card */}
                  <div className="metric-card tasks">
                    <div className="metric-header">
                      <span className="metric-icon">✓</span>
                      <span className="metric-title">Tasks</span>
                    </div>
                    <div className="metric-content">
                      <div className="tasks-stats">
                        <div className="task-stat completed">
                          <span className="task-count">{data.summary.tasks.completed}</span>
                          <span className="task-label">Done</span>
                        </div>
                        <div className="task-divider">/</div>
                        <div className="task-stat pending">
                          <span className="task-count">{data.summary.tasks.pending}</span>
                          <span className="task-label">To do</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Journal Card */}
                  <div className={`metric-card journal ${data.summary.journal.hasEntry ? 'has-data' : ''}`}>
                    <div className="metric-header">
                      <span className="metric-icon">📔</span>
                      <span className="metric-title">Journal</span>
                    </div>
                    {data.summary.journal.hasEntry ? (
                      <div className="metric-content">
                        <p className="journal-preview">{data.summary.journal.preview}...</p>
                        <span className="status-badge done">✓ Written</span>
                      </div>
                    ) : (
                      <div className="metric-empty">
                        <p>No entry yet</p>
                        <button className="btn-link" onClick={() => handleQuickAction('journal')}>
                          Write now →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gratitude Card */}
                  <div className={`metric-card gratitude ${data.summary.gratitude.count > 0 ? 'has-data' : ''}`}>
                    <div className="metric-header">
                      <span className="metric-icon">🙏</span>
                      <span className="metric-title">Gratitude</span>
                    </div>
                    {data.summary.gratitude.count > 0 ? (
                      <div className="metric-content">
                        <ul className="gratitude-list">
                          {data.summary.gratitude.items.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                        {data.summary.gratitude.count > 3 && (
                          <p className="more-items">+{data.summary.gratitude.count - 3} more</p>
                        )}
                      </div>
                    ) : (
                      <div className="metric-empty">
                        <p>Nothing logged</p>
                        <button className="btn-link" onClick={() => handleQuickAction('gratitude')}>
                          Add gratitude →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Wins Card */}
                  <div className={`metric-card wins ${data.summary.wins.count > 0 ? 'has-data' : ''}`}>
                    <div className="metric-header">
                      <span className="metric-icon">🏆</span>
                      <span className="metric-title">Wins</span>
                    </div>
                    {data.summary.wins.count > 0 ? (
                      <div className="metric-content">
                        <ul className="wins-list">
                          {data.summary.wins.items.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                        {data.summary.wins.count > 3 && (
                          <p className="more-items">+{data.summary.wins.count - 3} more</p>
                        )}
                      </div>
                    ) : (
                      <div className="metric-empty">
                        <p>No wins yet</p>
                        <button className="btn-link" onClick={() => handleQuickAction('win')}>
                          Log a win →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Habits Tab */}
              {activeTab === 'habits' && (
                <div className="habits-view">
                  <div className="habits-progress">
                    <div className="progress-bar-large">
                      <div 
                        className="progress-fill"
                        style={{ width: `${data.summary.habits.progress}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {data.summary.habits.completed} / {data.summary.habits.total} habits completed
                    </span>
                  </div>

                  <div className="habits-list">
                    {data.summary.habits.items.length === 0 ? (
                      <div className="empty-habits">
                        <p>No habits set up yet</p>
                      </div>
                    ) : (
                      data.summary.habits.items.map(habit => (
                        <div 
                          key={habit.id} 
                          className={`habit-item ${habit.completed ? 'completed' : ''}`}
                        >
                          <div 
                            className="habit-icon"
                            style={{ background: habit.color + '20', color: habit.color }}
                          >
                            {habit.icon}
                          </div>
                          
                          <div className="habit-info">
                            <span className="habit-name">{habit.name}</span>
                            <span className="habit-streak">
                              {habit.streak > 0 ? `🔥 ${habit.streak} day streak` : 'Start your streak!'}
                            </span>
                          </div>
                          
                          <div className={`habit-status ${habit.completed ? 'done' : ''}`}>
                            {habit.completed ? '✓' : '○'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="activity-view">
                  {data.recentActivity.length === 0 ? (
                    <div className="empty-activity">
                      <div className="empty-icon">📝</div>
                      <p>No activity logged yet today</p>
                      <p className="empty-hint">Start tracking to see your activity here!</p>
                    </div>
                  ) : (
                    <div className="activity-timeline">
                      {data.recentActivity.map((activity, idx) => (
                        <div key={idx} className={`activity-item ${activity.type}`}>
                          <div className="activity-icon">{activity.icon}</div>
                          <div className="activity-content">
                            <p className="activity-text">{activity.text}</p>
                            <span className="activity-time">{formatTime(activity.time)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-bar">
              <span className="quick-actions-label">Quick Add:</span>
              <div className="quick-actions-buttons">
                {data.quickActions.map(action => (
                  <button
                    key={action.id}
                    className="quick-action-btn"
                    onClick={() => handleQuickAction(action.id)}
                  >
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-label">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="today-view-error">
            <p>Failed to load today's data</p>
            <button className="btn-primary" onClick={fetchTodayData}>Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
