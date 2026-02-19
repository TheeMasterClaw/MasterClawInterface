import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './DeepWorkTracker.css';

// Storage keys
const STORAGE_KEYS = {
  sessions: 'mc-deepwork-sessions',
  tags: 'mc-deepwork-tags',
  settings: 'mc-deepwork-settings'
};

// Default tags
const DEFAULT_TAGS = [
  { id: 'coding', name: 'Coding', color: '#6366f1', icon: '💻' },
  { id: 'design', name: 'Design', color: '#ec4899', icon: '🎨' },
  { id: 'writing', name: 'Writing', color: '#10b981', icon: '✍️' },
  { id: 'research', name: 'Research', color: '#f59e0b', icon: '🔬' },
  { id: 'planning', name: 'Planning', color: '#8b5cf6', icon: '📋' },
  { id: 'meeting', name: 'Meeting', color: '#ef4444', icon: '🤝' },
  { id: 'learning', name: 'Learning', color: '#06b6d4', icon: '📚' },
  { id: 'creative', name: 'Creative', color: '#f97316', icon: '✨' }
];

// Productivity ratings
const RATINGS = [
  { value: 1, label: 'Distracted', emoji: '😵', color: '#ef4444' },
  { value: 2, label: 'Low', emoji: '😕', color: '#f97316' },
  { value: 3, label: 'Average', emoji: '😐', color: '#eab308' },
  { value: 4, label: 'Good', emoji: '🙂', color: '#22c55e' },
  { value: 5, label: 'Flow State', emoji: '🤩', color: '#06b6d4' }
];

// Quick duration presets
const DURATION_PRESETS = [15, 25, 45, 60, 90, 120];

export default function DeepWorkTracker({ isOpen, onClose }) {
  // State
  const [sessions, setSessions] = useState([]);
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [view, setView] = useState('log'); // log, history, analytics
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    description: '',
    duration: 25,
    tags: [],
    rating: 4,
    notes: '',
    project: ''
  });
  
  // Filters
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [tagFilter, setTagFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load data from localStorage
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    
    const savedSessions = localStorage.getItem(STORAGE_KEYS.sessions);
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error('Failed to parse sessions:', e);
      }
    }
    
    const savedTags = localStorage.getItem(STORAGE_KEYS.tags);
    if (savedTags) {
      try {
        setTags(JSON.parse(savedTags));
      } catch (e) {
        console.error('Failed to parse tags:', e);
      }
    }
  }, [isOpen]);

  // Save sessions to localStorage
  const saveSessions = useCallback((newSessions) => {
    setSessions(newSessions);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(newSessions));
    }
  }, []);

  // Add new session
  const addSession = useCallback((sessionData) => {
    const newSession = {
      id: Date.now().toString(),
      ...sessionData,
      createdAt: new Date().toISOString(),
      date: new Date().toDateString()
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setIsFormOpen(false);
    resetForm();
  }, [sessions, saveSessions]);

  // Delete session
  const deleteSession = useCallback((id) => {
    if (confirm('Delete this session?')) {
      const updated = sessions.filter(s => s.id !== id);
      saveSessions(updated);
    }
  }, [sessions, saveSessions]);

  // Edit session
  const editSession = useCallback((id, updates) => {
    const updated = sessions.map(s => 
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    saveSessions(updated);
  }, [sessions, saveSessions]);

  // Reset form
  const resetForm = () => {
    setFormData({
      description: '',
      duration: 25,
      tags: [],
      rating: 4,
      notes: '',
      project: ''
    });
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description.trim()) return;
    addSession(formData);
  };

  // Toggle tag selection
  const toggleTag = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions];
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(s => {
        const sessionDate = new Date(s.createdAt);
        if (dateFilter === 'today') {
          return sessionDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
          return sessionDate >= weekAgo;
        } else if (dateFilter === 'month') {
          return sessionDate.getMonth() === now.getMonth() && 
                 sessionDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }
    
    // Tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter(s => s.tags.includes(tagFilter));
    }
    
    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(s => s.project === projectFilter);
    }
    
    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.description.toLowerCase().includes(query) ||
        s.notes?.toLowerCase().includes(query) ||
        s.project?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [sessions, dateFilter, tagFilter, projectFilter, searchQuery]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const todaySessions = sessions.filter(s => new Date(s.createdAt).toDateString() === today);
    const weekSessions = sessions.filter(s => new Date(s.createdAt) >= weekAgo);
    const monthSessions = sessions.filter(s => new Date(s.createdAt) >= monthAgo);
    
    const totalMinutes = sessions.reduce((sum, s) => sum + (parseInt(s.duration) || 0), 0);
    const todayMinutes = todaySessions.reduce((sum, s) => sum + (parseInt(s.duration) || 0), 0);
    const weekMinutes = weekSessions.reduce((sum, s) => sum + (parseInt(s.duration) || 0), 0);
    
    const avgRating = sessions.length > 0 
      ? (sessions.reduce((sum, s) => sum + (parseInt(s.rating) || 3), 0) / sessions.length).toFixed(1)
      : 0;
    
    // Tag distribution
    const tagCounts = {};
    sessions.forEach(s => {
      s.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    // Best day
    const dayCounts = {};
    sessions.forEach(s => {
      const day = new Date(s.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + (parseInt(s.duration) || 0);
    });
    const bestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    
    // Streak calculation
    let streak = 0;
    const sortedDates = [...new Set(sessions.map(s => new Date(s.createdAt).toDateString()))].sort();
    const dateSet = new Set(sortedDates);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(now - i * 24 * 60 * 60 * 1000).toDateString();
      if (dateSet.has(checkDate)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return {
      totalSessions: sessions.length,
      todaySessions: todaySessions.length,
      weekSessions: weekSessions.length,
      totalMinutes,
      todayMinutes,
      weekMinutes,
      avgRating,
      tagCounts,
      bestDay: bestDay?.[0] || '-',
      bestDayMinutes: bestDay?.[1] || 0,
      streak
    };
  }, [sessions]);

  // Get unique projects
  const projects = useMemo(() => {
    return [...new Set(sessions.map(s => s.project).filter(Boolean))];
  }, [sessions]);

  // Format duration
  const formatDuration = (mins) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Export data
  const exportData = () => {
    const data = {
      sessions,
      tags,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepwork-sessions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data
  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.sessions && Array.isArray(data.sessions)) {
          if (confirm(`Import ${data.sessions.length} sessions? This will merge with existing data.`)) {
            const merged = [...sessions, ...data.sessions].reduce((acc, s) => {
              if (!acc.find(existing => existing.id === s.id)) {
                acc.push(s);
              }
              return acc;
            }, []);
            saveSessions(merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            alert('Data imported successfully!');
          }
        }
      } catch (err) {
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="deepwork-overlay" onClick={onClose}>
      <div className="deepwork-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="deepwork-header">
          <div className="deepwork-title">
            <span className="deepwork-icon">🎯</span>
            <div>
              <h2>Deep Work Tracker</h2>
              <p className="deepwork-subtitle">Log your focus sessions & track productivity patterns</p>
            </div>
          </div>
          <div className="deepwork-header-actions">
            <button 
              className={view === 'log' ? 'active' : ''}
              onClick={() => setView('log')}
            >
              📝 Log
            </button>
            <button 
              className={view === 'history' ? 'active' : ''}
              onClick={() => setView('history')}
            >
              📚 History
            </button>
            <button 
              className={view === 'analytics' ? 'active' : ''}
              onClick={() => setView('analytics')}
            >
              📊 Analytics
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Log View */}
        {view === 'log' && (
          <div className="deepwork-content">
            {!isFormOpen ? (
              <div className="log-welcome">
                <div className="quick-stats">
                  <div className="stat-card">
                    <span className="stat-number">{analytics.todaySessions}</span>
                    <span className="stat-label">Sessions Today</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{formatDuration(analytics.todayMinutes)}</span>
                    <span className="stat-label">Deep Work Today</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{analytics.streak}</span>
                    <span className="stat-label">Day Streak 🔥</span>
                  </div>
                </div>
                
                <div className="quick-start">
                  <h3>Quick Log</h3>
                  <p>What did you just work on?</p>
                  <div className="duration-presets">
                    {DURATION_PRESETS.map(mins => (
                      <button
                        key={mins}
                        className="preset-btn"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, duration: mins }));
                          setIsFormOpen(true);
                        }}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                  <button 
                    className="custom-session-btn"
                    onClick={() => setIsFormOpen(true)}
                  >
                    ➕ Custom Session
                  </button>
                </div>
                
                {sessions.length > 0 && (
                  <div className="recent-sessions">
                    <h3>Recent Sessions</h3>
                    <div className="mini-session-list">
                      {sessions.slice(0, 5).map(session => (
                        <div key={session.id} className="mini-session">
                          <div className="mini-session-main">
                            <span className="mini-duration">{session.duration}m</span>
                            <span className="mini-desc" title={session.description}>
                              {session.description.length > 40 
                                ? session.description.slice(0, 40) + '...' 
                                : session.description}
                            </span>
                          </div>
                          <div className="mini-session-meta">
                            {session.tags.slice(0, 3).map(tagId => {
                              const tag = tags.find(t => t.id === tagId);
                              return tag ? (
                                <span key={tagId} className="mini-tag" style={{ background: tag.color }}>
                                  {tag.icon}
                                </span>
                              ) : null;
                            })}
                            <span className="mini-rating">
                              {RATINGS.find(r => r.value === session.rating)?.emoji}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form className="session-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>What did you work on? *</label>
                  <input
                    type="text"
                    placeholder="e.g., Refactored authentication system"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    autoFocus
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Duration (minutes)</label>
                    <div className="duration-input">
                      <input
                        type="number"
                        min="1"
                        max="480"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      />
                      <div className="duration-quick">
                        {[15, 25, 45, 60].map(m => (
                          <button
                            key={m}
                            type="button"
                            className={formData.duration === m ? 'active' : ''}
                            onClick={() => setFormData({ ...formData, duration: m })}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Project (optional)</label>
                    <input
                      type="text"
                      list="projects-list"
                      placeholder="e.g., MasterClaw"
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    />
                    <datalist id="projects-list">
                      {projects.map(p => <option key={p} value={p} />)}
                    </datalist>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Tags</label>
                  <div className="tags-selector">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        className={`tag-btn ${formData.tags.includes(tag.id) ? 'selected' : ''}`}
                        style={{ 
                          '--tag-color': tag.color,
                          borderColor: formData.tags.includes(tag.id) ? tag.color : 'transparent'
                        }}
                        onClick={() => toggleTag(tag.id)}
                      >
                        <span className="tag-icon">{tag.icon}</span>
                        <span className="tag-name">{tag.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>How focused were you?</label>
                  <div className="rating-selector">
                    {RATINGS.map(rating => (
                      <button
                        key={rating.value}
                        type="button"
                        className={`rating-btn ${formData.rating === rating.value ? 'selected' : ''}`}
                        style={{ '--rating-color': rating.color }}
                        onClick={() => setFormData({ ...formData, rating: rating.value })}
                      >
                        <span className="rating-emoji">{rating.emoji}</span>
                        <span className="rating-label">{rating.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Notes (optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Any insights, blockers, or achievements..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    💾 Save Session
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* History View */}
        {view === 'history' && (
          <div className="deepwork-content history-view">
            <div className="filters-bar">
              <div className="filter-group">
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              
              <div className="filter-group">
                <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                  <option value="all">All Tags</option>
                  {tags.map(t => (
                    <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                  ))}
                </select>
              </div>
              
              {projects.length > 0 && (
                <div className="filter-group">
                  <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                    <option value="all">All Projects</option>
                    {projects.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="filter-group search">
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="filter-actions">
                <button onClick={exportData} title="Export data">
                  📥 Export
                </button>
                <label className="import-btn" title="Import data">
                  📤 Import
                  <input type="file" accept=".json" onChange={importData} hidden />
                </label>
              </div>
            </div>
            
            <div className="sessions-list">
              {filteredSessions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p>No sessions found</p>
                  <span>Try adjusting your filters or log your first session</span>
                </div>
              ) : (
                <>
                  <div className="sessions-summary">
                    Showing {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
                    {' '}· {formatDuration(filteredSessions.reduce((sum, s) => sum + parseInt(s.duration), 0))} total
                  </div>
                  {filteredSessions.map(session => (
                    <div key={session.id} className="session-card">
                      <div className="session-header">
                        <div className="session-title">
                          <span className="session-duration">{session.duration}m</span>
                          <span className="session-desc">{session.description}</span>
                        </div>
                        <div className="session-actions">
                          <button 
                            className="action-btn delete"
                            onClick={() => deleteSession(session.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <div className="session-meta">
                        {session.project && (
                          <span className="meta-project">📁 {session.project}</span>
                        )}
                        <span className="meta-date">
                          {new Date(session.createdAt).toLocaleDateString()} {' '}
                          {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="session-tags-row">
                        {session.tags.map(tagId => {
                          const tag = tags.find(t => t.id === tagId);
                          return tag ? (
                            <span key={tagId} className="session-tag" style={{ background: tag.color }}>
                              {tag.icon} {tag.name}
                            </span>
                          ) : null;
                        })}
                        <span 
                          className="session-rating"
                          style={{ background: RATINGS.find(r => r.value === session.rating)?.color }}
                        >
                          {RATINGS.find(r => r.value === session.rating)?.emoji}
                        </span>
                      </div>
                      
                      {session.notes && (
                        <div className="session-notes">{session.notes}</div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Analytics View */}
        {view === 'analytics' && (
          <div className="deepwork-content analytics-view">
            <div className="analytics-grid">
              <div className="analytics-card main">
                <h3>📊 Overview</h3>
                <div className="stats-row">
                  <div className="big-stat">
                    <span className="big-number">{analytics.totalSessions}</span>
                    <span className="big-label">Total Sessions</span>
                  </div>
                  <div className="big-stat">
                    <span className="big-number">{formatDuration(analytics.totalMinutes)}</span>
                    <span className="big-label">Deep Work Time</span>
                  </div>
                  <div className="big-stat">
                    <span className="big-number">{analytics.avgRating}</span>
                    <span className="big-label">Avg Focus Rating</span>
                  </div>
                </div>
              </div>
              
              <div className="analytics-card">
                <h3>🔥 Streak</h3>
                <div className="streak-display">
                  <span className="streak-number">{analytics.streak}</span>
                  <span className="streak-label">days</span>
                </div>
                <p className="streak-subtitle">Keep it going!</p>
              </div>
              
              <div className="analytics-card">
                <h3>📈 This Week</h3>
                <div className="week-stats">
                  <div className="week-stat">
                    <span className="week-value">{analytics.weekSessions}</span>
                    <span className="week-label">sessions</span>
                  </div>
                  <div className="week-stat">
                    <span className="week-value">{formatDuration(analytics.weekMinutes)}</span>
                    <span className="week-label">focused</span>
                  </div>
                </div>
              </div>
              
              <div className="analytics-card">
                <h3>⭐ Best Day</h3>
                <div className="best-day">
                  <span className="best-day-name">{analytics.bestDay}</span>
                  <span className="best-day-time">{formatDuration(analytics.bestDayMinutes)}</span>
                </div>
              </div>
              
              <div className="analytics-card wide">
                <h3>🏷️ Tag Distribution</h3>
                {Object.keys(analytics.tagCounts).length === 0 ? (
                  <p className="no-data">No tagged sessions yet</p>
                ) : (
                  <div className="tag-distribution">
                    {Object.entries(analytics.tagCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([tagId, count]) => {
                        const tag = tags.find(t => t.id === tagId);
                        if (!tag) return null;
                        const maxCount = Math.max(...Object.values(analytics.tagCounts));
                        const percentage = (count / maxCount) * 100;
                        return (
                          <div key={tagId} className="tag-bar">
                            <div className="tag-bar-info">
                              <span className="tag-bar-icon">{tag.icon}</span>
                              <span className="tag-bar-name">{tag.name}</span>
                              <span className="tag-bar-count">{count}</span>
                            </div>
                            <div className="tag-bar-track">
                              <div 
                                className="tag-bar-fill"
                                style={{ width: `${percentage}%`, background: tag.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
              
              <div className="analytics-card wide">
                <h3>💡 Insights</h3>
                <div className="insights-list">
                  {analytics.streak >= 7 && (
                    <div className="insight positive">
                      <span className="insight-icon">🔥</span>
                      <span>Impressive {analytics.streak}-day streak! You're building a solid habit.</span>
                    </div>
                  )}
                  {analytics.avgRating >= 4 && analytics.totalSessions >= 5 && (
                    <div className="insight positive">
                      <span className="insight-icon">🌟</span>
                      <span>High average focus rating! You're finding your flow.</span>
                    </div>
                  )}
                  {analytics.totalSessions > 0 && analytics.avgRating < 3 && (
                    <div className="insight tip">
                      <span className="insight-icon">💡</span>
                      <span>Your focus ratings are lower. Try shorter sessions or the Breathing Exercise before starting.</span>
                    </div>
                  )}
                  {analytics.weekMinutes < 120 && analytics.streak > 0 && (
                    <div className="insight tip">
                      <span className="insight-icon">⏰</span>
                      <span>You've logged less than 2 hours this week. Consider blocking more deep work time.</span>
                    </div>
                  )}
                  {Object.keys(analytics.tagCounts).length === 0 && analytics.totalSessions > 0 && (
                    <div className="insight tip">
                      <span className="insight-icon">🏷️</span>
                      <span>Start tagging your sessions to see patterns in your work.</span>
                    </div>
                  )}
                  {analytics.totalSessions === 0 && (
                    <div className="insight neutral">
                      <span className="insight-icon">🚀</span>
                      <span>Log your first session to unlock personalized insights!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
