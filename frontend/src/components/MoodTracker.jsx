import React, { useState, useEffect, useMemo } from 'react';
import './MoodTracker.css';

const MOODS = [
  { emoji: '😫', label: 'Awful', color: '#dc2626', value: 1 },
  { emoji: '😔', label: 'Bad', color: '#ea580c', value: 2 },
  { emoji: '😕', label: 'Okay', color: '#ca8a04', value: 3 },
  { emoji: '🙂', label: 'Good', color: '#16a34a', value: 4 },
  { emoji: '🤩', label: 'Amazing', color: '#0891b2', value: 5 },
];

const MOOD_TAGS = [
  'Work', 'Sleep', 'Exercise', 'Social', 'Weather',
  'Health', 'Family', 'Productivity', 'Creativity', 'Relaxation',
  'Food', 'Nature', 'Learning', 'Music', 'Reading'
];

export default function MoodTracker({ isOpen, onClose }) {
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'stats', 'timeline'
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  
  // Form state
  const [moodValue, setMoodValue] = useState(3);
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  // Load entries from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-mood-entries');
      if (saved) {
        try {
          setEntries(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse mood entries:', e);
        }
      }
    }
  }, [isOpen]);

  // Save entries to localStorage
  const saveEntries = (updatedEntries) => {
    setEntries(updatedEntries);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-mood-entries', JSON.stringify(updatedEntries));
    }
  };

  // Get date key
  const getDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Get today's entry
  const getTodayEntry = () => {
    const today = getDateKey(new Date());
    return entries.find(e => e.date === today);
  };

  // Get entry for specific date
  const getEntryForDate = (date) => {
    const dateKey = getDateKey(date);
    return entries.find(e => e.date === dateKey);
  };

  // Save mood entry
  const saveMoodEntry = () => {
    const dateKey = getDateKey(selectedDate);
    const existingIndex = entries.findIndex(e => e.date === dateKey);
    
    const newEntry = {
      id: existingIndex >= 0 ? entries[existingIndex].id : Date.now().toString(),
      date: dateKey,
      mood: moodValue,
      note: note.trim(),
      tags: selectedTags,
      createdAt: existingIndex >= 0 ? entries[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updated;
    if (existingIndex >= 0) {
      updated = [...entries];
      updated[existingIndex] = newEntry;
    } else {
      updated = [newEntry, ...entries];
    }
    
    saveEntries(updated);
    setShowEntryForm(false);
    setEditingEntry(null);
    resetForm();
  };

  // Delete entry
  const deleteEntry = (id) => {
    if (confirm('Delete this mood entry?')) {
      const updated = entries.filter(e => e.id !== id);
      saveEntries(updated);
      if (editingEntry?.id === id) {
        setShowEntryForm(false);
        setEditingEntry(null);
        resetForm();
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setMoodValue(3);
    setNote('');
    setSelectedTags([]);
  };

  // Open form for editing
  const editEntry = (entry) => {
    setEditingEntry(entry);
    setMoodValue(entry.mood);
    setNote(entry.note || '');
    setSelectedTags(entry.tags || []);
    setSelectedDate(new Date(entry.date));
    setShowEntryForm(true);
  };

  // Open form for new entry
  const newEntry = (date = new Date()) => {
    setSelectedDate(date);
    const existing = getEntryForDate(date);
    if (existing) {
      editEntry(existing);
    } else {
      resetForm();
      setEditingEntry(null);
      setShowEntryForm(true);
    }
  };

  // Toggle tag selection
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Get mood by value
  const getMoodByValue = (value) => {
    return MOODS.find(m => m.value === value) || MOODS[2];
  };

  // Get days for calendar view
  const getCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Check if date is today
  const isToday = (date) => {
    return getDateKey(date) === getDateKey(new Date());
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    
    const today = new Date();
    const last7Days = entries.filter(e => {
      const entryDate = new Date(e.date);
      const diffDays = (today - entryDate) / (1000 * 60 * 60 * 24);
      return diffDays < 7;
    });
    
    const last30Days = entries.filter(e => {
      const entryDate = new Date(e.date);
      const diffDays = (today - entryDate) / (1000 * 60 * 60 * 24);
      return diffDays < 30;
    });
    
    const averageMood = (entriesList) => {
      if (entriesList.length === 0) return 0;
      return entriesList.reduce((sum, e) => sum + e.mood, 0) / entriesList.length;
    };
    
    const currentStreak = () => {
      let streak = 0;
      const checkDate = new Date(today);
      
      while (true) {
        const dateKey = getDateKey(checkDate);
        const entry = entries.find(e => e.date === dateKey);
        
        if (entry) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (getDateKey(checkDate) === getDateKey(today)) {
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    };
    
    return {
      total: entries.length,
      streak: currentStreak(),
      avg7Days: averageMood(last7Days).toFixed(1),
      avg30Days: averageMood(last30Days).toFixed(1),
      avgAllTime: averageMood(entries).toFixed(1),
    };
  }, [entries]);

  // Get tag stats
  const tagStats = useMemo(() => {
    const tagCounts = {};
    const tagMoods = {};
    
    entries.forEach(entry => {
      (entry.tags || []).forEach(tag => {
        if (!tagCounts[tag]) {
          tagCounts[tag] = 0;
          tagMoods[tag] = 0;
        }
        tagCounts[tag]++;
        tagMoods[tag] += entry.mood;
      });
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        avgMood: (tagMoods[tag] / count).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  const todayEntry = getTodayEntry();
  const calendarDays = getCalendarDays();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  if (!isOpen) return null;

  return (
    <div className="mood-panel-overlay" onClick={onClose}>
      <div className="mood-panel" onClick={e => e.stopPropagation()}>
        <div className="mood-panel-header">
          <h3>🧠 Mood Tracker</h3>
          <div className="header-actions">
            <button 
              className="new-entry-btn"
              onClick={() => newEntry()}
            >
              + Log Mood
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Today's Mood Summary */}
        <div className="today-mood-section">
          {todayEntry ? (
            <div className="today-mood-display">
              <div 
                className="mood-emoji-large"
                style={{ color: getMoodByValue(todayEntry.mood).color }}
              >
                {getMoodByValue(todayEntry.mood).emoji}
              </div>
              <div className="today-mood-info">
                <span className="today-mood-label">Today</span>
                <span className="today-mood-value">
                  Feeling {getMoodByValue(todayEntry.mood).label.toLowerCase()}
                </span>
                {todayEntry.note && (
                  <span className="today-mood-note">"{todayEntry.note}"</span>
                )}
              </div>
              <button 
                className="edit-today-btn"
                onClick={() => editEntry(todayEntry)}
              >
                Edit
              </button>
            </div>
          ) : (
            <div className="today-mood-empty">
              <span className="empty-emoji">🤔</span>
              <span>How are you feeling today?</span>
              <button onClick={() => newEntry()}>Log your mood</button>
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="view-toggle">
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
            📊 Stats
          </button>
          <button 
            className={viewMode === 'timeline' ? 'active' : ''}
            onClick={() => setViewMode('timeline')}
          >
            📜 Timeline
          </button>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="calendar-view">
            <div className="calendar-nav">
              <button 
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
              >
                ←
              </button>
              <span className="month-title">
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </span>
              <button 
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
              >
                →
              </button>
            </div>
            
            <div className="mood-calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-label">{day}</div>
              ))}
              {calendarDays.map((date, i) => {
                if (!date) {
                  return <div key={i} className="calendar-day empty" />;
                }
                
                const entry = getEntryForDate(date);
                const mood = entry ? getMoodByValue(entry.mood) : null;
                
                return (
                  <div 
                    key={i} 
                    className={`calendar-day ${isToday(date) ? 'today' : ''} ${entry ? 'has-entry' : ''}`}
                    onClick={() => newEntry(date)}
                  >
                    <span className="day-number">{date.getDate()}</span>
                    {mood && (
                      <span 
                        className="day-mood-emoji"
                        style={{ color: mood.color }}
                      >
                        {mood.emoji}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats View */}
        {viewMode === 'stats' && (
          <div className="stats-view">
            {stats ? (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-value">{stats.streak}</span>
                    <span className="stat-label">Day Streak 🔥</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats.total}</span>
                    <span className="stat-label">Total Entries</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats.avg7Days}</span>
                    <span className="stat-label">7-Day Avg</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats.avgAllTime}</span>
                    <span className="stat-label">All-Time Avg</span>
                  </div>
                </div>

                {tagStats.length > 0 && (
                  <div className="tag-stats">
                    <h4>🏷️ Tag Analysis</h4>
                    <div className="tag-list">
                      {tagStats.map(({ tag, count, avgMood }) => {
                        const moodColor = getMoodByValue(Math.round(parseFloat(avgMood))).color;
                        return (
                          <div key={tag} className="tag-item">
                            <span className="tag-name">{tag}</span>
                            <div className="tag-bar-container">
                              <div 
                                className="tag-bar"
                                style={{ 
                                  width: `${Math.min(100, (count / tagStats[0].count) * 100)}%`,
                                  backgroundColor: moodColor,
                                  opacity: 0.7
                                }}
                              />
                            </div>
                            <span className="tag-count">{count}</span>
                            <span 
                              className="tag-avg"
                              style={{ color: moodColor }}
                            >
                              {avgMood}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mood-legend">
                  <h4>🎭 Mood Scale</h4>
                  <div className="legend-moods">
                    {MOODS.map(mood => (
                      <div key={mood.value} className="legend-item">
                        <span style={{ color: mood.color }}>{mood.emoji}</span>
                        <span>{mood.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-stats">
                <span className="empty-emoji">📊</span>
                <p>No mood data yet</p>
                <span>Start logging to see your patterns</span>
              </div>
            )}
          </div>
        )}

        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <div className="timeline-view">
            {entries.length > 0 ? (
              <div className="timeline-list">
                {entries.slice(0, 30).map(entry => {
                  const mood = getMoodByValue(entry.mood);
                  const date = new Date(entry.date);
                  
                  return (
                    <div key={entry.id} className="timeline-item">
                      <div 
                        className="timeline-mood-indicator"
                        style={{ backgroundColor: mood.color }}
                      />
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-date">
                            {date.toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                          <span 
                            className="timeline-mood"
                            style={{ color: mood.color }}
                          >
                            {mood.emoji} {mood.label}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="timeline-note">{entry.note}</p>
                        )}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="timeline-tags">
                            {entry.tags.map(tag => (
                              <span key={tag} className="timeline-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button 
                        className="edit-entry-btn"
                        onClick={() => editEntry(entry)}
                      >
                        ✏️
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-timeline">
                <span className="empty-emoji">📜</span>
                <p>No entries yet</p>
                <button onClick={() => newEntry()}>Create your first entry</button>
              </div>
            )}
          </div>
        )}

        {/* Entry Form Modal */}
        {showEntryForm && (
          <div className="mood-form-overlay" onClick={() => setShowEntryForm(false)}>
            <div className="mood-form" onClick={e => e.stopPropagation()}>
              <h4>
                {editingEntry ? '✏️ Edit Entry' : '✨ How are you feeling?'}
              </h4>
              
              <div className="selected-date">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>

              {/* Mood Selector */}
              <div className="mood-selector">
                {MOODS.map(mood => (
                  <button
                    key={mood.value}
                    className={`mood-option ${moodValue === mood.value ? 'selected' : ''}`}
                    onClick={() => setMoodValue(mood.value)}
                    style={{ 
                      backgroundColor: moodValue === mood.value ? `${mood.color}30` : 'transparent',
                      borderColor: moodValue === mood.value ? mood.color : undefined
                    }}
                  >
                    <span className="mood-emoji">{mood.emoji}</span>
                    <span className="mood-label">{mood.label}</span>
                  </button>
                ))}
              </div>

              {/* Note Input */}
              <div className="form-group">
                <label>Note (optional)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={3}
                />
              </div>

              {/* Tags */}
              <div className="form-group">
                <label>Tags</label>
                <div className="tag-selector">
                  {MOOD_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-option ${selectedTags.includes(tag) ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                {editingEntry && (
                  <button 
                    type="button" 
                    className="btn-delete"
                    onClick={() => deleteEntry(editingEntry.id)}
                  >
                    🗑️ Delete
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowEntryForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={saveMoodEntry}
                >
                  {editingEntry ? 'Save Changes' : 'Log Mood'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
