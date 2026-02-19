import React, { useState, useEffect, useMemo } from 'react';
// import './DailyWins.css';

const WIN_CATEGORIES = [
  { id: 'personal', label: 'Personal Growth', icon: '🌱', color: '#22c55e' },
  { id: 'work', label: 'Work & Career', icon: '💼', color: '#3b82f6' },
  { id: 'health', label: 'Health & Wellness', icon: '💪', color: '#f97316' },
  { id: 'learning', label: 'Learning', icon: '📚', color: '#8b5cf6' },
  { id: 'creative', label: 'Creative', icon: '🎨', color: '#ec4899' },
  { id: 'social', label: 'Social & Relationships', icon: '💝', color: '#f43f5e' },
  { id: 'home', label: 'Home & Life', icon: '🏠', color: '#06b6d4' },
  { id: 'challenge', label: 'Overcame Challenge', icon: '🔥', color: '#eab308' }
];

const WIN_IMPACTS = [
  { value: 1, label: 'Small Win', emoji: '✨', description: 'A nice little victory' },
  { value: 2, label: 'Good Win', emoji: '🌟', description: 'Worth celebrating' },
  { value: 3, label: 'Big Win', emoji: '🏆', description: 'Major accomplishment' },
  { value: 5, label: 'Epic Win', emoji: '🚀', description: 'Game changer!' }
];

const QUICK_WINS = [
  'Completed a task I\'ve been procrastinating',
  'Helped someone today',
  'Learned something new',
  'Stuck to a healthy habit',
  'Had a difficult conversation',
  'Finished a project milestone',
  'Made time for self-care',
  'Solved a tricky problem',
  'Received positive feedback',
  'Stepped outside my comfort zone',
  'Created something meaningful',
  'Maintained focus for deep work'
];

export default function DailyWins({ isOpen, onClose }) {
  const [wins, setWins] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('list'); // list, calendar, stats
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('7'); // days
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    impact: 2,
    date: new Date().toISOString().split('T')[0],
    mood: 'good'
  });

  // Load wins from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-daily-wins');
      if (saved) {
        try {
          setWins(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse daily wins:', e);
        }
      } else {
        // Add some sample wins
        const today = new Date();
        const sampleWins = [
          {
            id: '1',
            title: 'Shipped new feature to MasterClaw',
            description: 'Added the Daily Wins tracker component with full functionality',
            category: 'work',
            impact: 3,
            date: today.toISOString().split('T')[0],
            mood: 'great',
            createdAt: today.toISOString()
          },
          {
            id: '2',
            title: 'Morning workout completed',
            description: '30 minutes of cardio and strength training',
            category: 'health',
            impact: 2,
            date: new Date(today.getTime() - 86400000).toISOString().split('T')[0],
            mood: 'good',
            createdAt: new Date(today.getTime() - 86400000).toISOString()
          },
          {
            id: '3',
            title: 'Helped a colleague debug their code',
            description: 'Spent an hour pair programming and teaching',
            category: 'social',
            impact: 2,
            date: new Date(today.getTime() - 172800000).toISOString().split('T')[0],
            mood: 'good',
            createdAt: new Date(today.getTime() - 172800000).toISOString()
          }
        ];
        setWins(sampleWins);
        localStorage.setItem('mc-daily-wins', JSON.stringify(sampleWins));
      }
    }
  }, [isOpen]);

  // Save wins to localStorage
  const saveWins = (updatedWins) => {
    setWins(updatedWins);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-daily-wins', JSON.stringify(updatedWins));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) return;

    const newWin = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    saveWins([newWin, ...wins]);
    resetForm();
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'personal',
      impact: 2,
      date: new Date().toISOString().split('T')[0],
      mood: 'good'
    });
  };

  const deleteWin = (id) => {
    if (confirm('Remove this win?')) {
      saveWins(wins.filter(w => w.id !== id));
    }
  };

  const useQuickWin = (text) => {
    setFormData({ ...formData, title: text });
  };

  // Get filtered and sorted wins
  const filteredWins = useMemo(() => {
    let result = [...wins];

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter(w => w.category === filterCategory);
    }

    // Filter by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(filterDateRange));
    result = result.filter(w => new Date(w.date) >= cutoffDate);

    // Sort by date descending, then by impact
    result.sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.impact - a.impact;
    });

    return result;
  }, [wins, filterCategory, filterDateRange]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalWins = wins.length;
    const totalImpact = wins.reduce((sum, w) => sum + w.impact, 0);
    const winsByCategory = {};
    const winsByDate = {};
    const streak = calculateStreak(wins);

    wins.forEach(w => {
      winsByCategory[w.category] = (winsByCategory[w.category] || 0) + 1;
      winsByDate[w.date] = (winsByDate[w.date] || 0) + 1;
    });

    const today = new Date().toISOString().split('T')[0];
    const winsToday = winsByDate[today] || 0;

    return {
      totalWins,
      totalImpact,
      winsByCategory,
      winsByDate,
      streak,
      winsToday,
      averageImpact: totalWins > 0 ? (totalImpact / totalWins).toFixed(1) : 0
    };
  }, [wins]);

  function calculateStreak(winsData) {
    if (winsData.length === 0) return 0;
    
    const dates = [...new Set(winsData.map(w => w.date))].sort().reverse();
    if (dates.length === 0) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const curr = new Date(dates[i - 1]);
      const prev = new Date(dates[i]);
      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  const getCategoryLabel = (id) => WIN_CATEGORIES.find(c => c.id === id)?.label || id;
  const getCategoryIcon = (id) => WIN_CATEGORIES.find(c => c.id === id)?.icon || '🏆';
  const getCategoryColor = (id) => WIN_CATEGORIES.find(c => c.id === id)?.color || '#6366f1';
  const getImpactLabel = (value) => WIN_IMPACTS.find(i => i.value === value)?.label || 'Win';
  const getImpactEmoji = (value) => WIN_IMPACTS.find(i => i.value === value)?.emoji || '✨';

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    
    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  // Generate calendar data
  const generateCalendarData = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      const dayWins = wins.filter(w => w.date === dateStr);
      const totalImpact = dayWins.reduce((sum, w) => sum + w.impact, 0);
      
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        wins: dayWins.length,
        impact: totalImpact,
        isToday: i === 0
      });
    }
    return days;
  };

  if (!isOpen) return null;

  return (
    <div className="daily-wins-overlay" onClick={onClose}>
      <div className="daily-wins-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="daily-wins-header">
          <div className="daily-wins-title">
            <span className="daily-wins-icon">🏆</span>
            <div>
              <h2>Daily Wins</h2>
              <p className="daily-wins-subtitle">Celebrate your victories, big and small</p>
            </div>
          </div>
          <button className="daily-wins-close" onClick={onClose}>×</button>
        </div>

        {/* Stats Bar */}
        <div className="daily-wins-stats-bar">
          <div className="stat-item">
            <span className="stat-value">{stats.totalWins}</span>
            <span className="stat-label">Total Wins</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-value">{stats.streak}</span>
            <span className="stat-label">Day Streak 🔥</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.winsToday}</span>
            <span className="stat-label">Today</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.totalImpact}</span>
            <span className="stat-label">Impact Points</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="daily-wins-tabs">
          <button 
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            📋 List
          </button>
          <button 
            className={viewMode === 'calendar' ? 'active' : ''}
            onClick={() => setViewMode('calendar')}
          >
            📅 Calendar
          </button>
          <button 
            className={viewMode === 'stats' ? 'active' : ''}
            onClick={() => setViewMode('stats')}
          >
            📊 Insights
          </button>
        </div>

        {/* Toolbar */}
        <div className="daily-wins-toolbar">
          <div className="toolbar-filters">
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {WIN_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            <select 
              value={filterDateRange} 
              onChange={(e) => setFilterDateRange(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
              <option value="9999">All time</option>
            </select>
          </div>
          <button 
            className="add-win-btn"
            onClick={() => { setShowAddForm(true); resetForm(); }}
          >
            + Log a Win
          </button>
        </div>

        {/* Content */}
        <div className="daily-wins-content">
          {/* List View */}
          {viewMode === 'list' && (
            <>
              {filteredWins.length === 0 ? (
                <div className="wins-empty">
                  <div className="empty-icon">🏆</div>
                  <h3>No wins recorded yet</h3>
                  <p>Start celebrating your victories! Even small wins matter.</p>
                  <button onClick={() => setShowAddForm(true)}>Log Your First Win</button>
                </div>
              ) : (
                <div className="wins-list">
                  {filteredWins.map(win => (
                    <div 
                      key={win.id} 
                      className="win-card"
                      style={{ '--win-color': getCategoryColor(win.category) }}
                    >
                      <div className="win-card-header">
                        <div className="win-category-badge" style={{ backgroundColor: getCategoryColor(win.category) + '20', color: getCategoryColor(win.category) }}>
                          {getCategoryIcon(win.category)}
                        </div>
                        <div className="win-impact-badge" title={getImpactLabel(win.impact)}>
                          {getImpactEmoji(win.impact)}
                        </div>
                      </div>
                      
                      <h4 className="win-title">{win.title}</h4>
                      
                      {win.description && (
                        <p className="win-description">{win.description}</p>
                      )}
                      
                      <div className="win-card-footer">
                        <span className="win-date">{formatDate(win.date)}</span>
                        <span className="win-category-label">{getCategoryLabel(win.category)}</span>
                        <button 
                          className="win-delete-btn"
                          onClick={() => deleteWin(win.id)}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <div className="wins-calendar">
              <div className="calendar-grid">
                {generateCalendarData().map(day => (
                  <div 
                    key={day.date} 
                    className={`calendar-day ${day.isToday ? 'today' : ''} ${day.wins > 0 ? 'has-wins' : ''}`}
                    title={`${day.dayName}, ${day.date}: ${day.wins} win${day.wins !== 1 ? 's' : ''}`}
                  >
                    <span className="day-name">{day.dayName}</span>
                    <span className="day-num">{day.dayNum}</span>
                    {day.wins > 0 && (
                      <div className="day-wins-indicator">
                        {day.impact >= 5 ? '🚀' : day.impact >= 3 ? '🏆' : day.impact >= 2 ? '🌟' : '✨'}
                        {day.wins > 1 && <span className="win-count">{day.wins}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="calendar-legend">
                <span><span className="legend-dot small">✨</span> Small Win</span>
                <span><span className="legend-dot medium">🌟</span> Good Win</span>
                <span><span className="legend-dot big">🏆</span> Big Win</span>
                <span><span className="legend-dot epic">🚀</span> Epic Win</span>
              </div>
            </div>
          )}

          {/* Stats View */}
          {viewMode === 'stats' && (
            <div className="wins-stats-view">
              <div className="stats-section">
                <h4>🏆 Wins by Category</h4>
                <div className="category-bars">
                  {WIN_CATEGORIES.map(cat => {
                    const count = stats.winsByCategory[cat.id] || 0;
                    if (count === 0) return null;
                    const maxCount = Math.max(...Object.values(stats.winsByCategory));
                    const pct = (count / maxCount) * 100;
                    
                    return (
                      <div key={cat.id} className="category-bar-item">
                        <div className="category-bar-header">
                          <span>{cat.icon} {cat.label}</span>
                          <span>{count}</span>
                        </div>
                        <div className="category-bar">
                          <div 
                            className="category-bar-fill"
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="stats-grid">
                <div className="stats-card">
                  <h5>Average Impact</h5>
                  <div className="stats-big-number">{stats.averageImpact}</div>
                  <p>Points per win</p>
                </div>
                <div className="stats-card">
                  <h5>Best Category</h5>
                  <div className="stats-big-text">
                    {Object.entries(stats.winsByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] 
                      ? getCategoryIcon(Object.entries(stats.winsByCategory).sort((a, b) => b[1] - a[1])[0][0])
                      : '-'
                    }
                  </div>
                  <p>
                    {Object.entries(stats.winsByCategory).sort((a, b) => b[1] - a[1])[0]?.[0]
                      ? getCategoryLabel(Object.entries(stats.winsByCategory).sort((a, b) => b[1] - a[1])[0][0])
                      : 'No wins yet'
                    }
                  </p>
                </div>
              </div>

              <div className="motivation-quote">
                <blockquote>
                  "Success is the sum of small efforts, repeated day in and day out."
                </blockquote>
                <cite>— Robert Collier</cite>
              </div>
            </div>
          )}
        </div>

        {/* Add Win Form Modal */}
        {showAddForm && (
          <div className="win-form-overlay" onClick={() => setShowAddForm(false)}>
            <form className="win-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <h3>🏆 Log Your Win</h3>
              
              <div className="form-group">
                <label>What did you accomplish? *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Completed project, Helped a friend, Learned something new"
                  required
                  autoFocus
                />
              </div>

              <div className="quick-wins">
                <label>Quick picks:</label>
                <div className="quick-win-chips">
                  {QUICK_WINS.map((text, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="quick-win-chip"
                      onClick={() => useQuickWin(text)}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {WIN_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>How big was this win?</label>
                <div className="impact-selector">
                  {WIN_IMPACTS.map(impact => (
                    <button
                      key={impact.value}
                      type="button"
                      className={`impact-btn ${formData.impact === impact.value ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, impact: impact.value })}
                    >
                      <span className="impact-emoji">{impact.emoji}</span>
                      <span className="impact-label">{impact.label}</span>
                      <span className="impact-desc">{impact.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Details (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add more context about your win..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  🎉 Log Win
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
