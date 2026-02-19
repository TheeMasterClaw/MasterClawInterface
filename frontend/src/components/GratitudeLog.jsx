import React, { useState, useEffect, useCallback } from 'react';
// import './GratitudeLog.css';

const GRATITUDE_PROMPTS = [
  "What made you smile today?",
  "Who are you grateful for right now?",
  "What's something beautiful you noticed?",
  "What challenge helped you grow recently?",
  "What's a small thing that brought you joy?",
  "Who helped you today, directly or indirectly?",
  "What comfort are you thankful for?",
  "What opportunity do you appreciate?",
  "What's something you love about yourself?",
  "What nature moment are you grateful for?",
  "What made you laugh recently?",
  "What are you looking forward to?",
  "What lesson are you grateful to have learned?",
  "What food or drink are you enjoying?",
  "What book, music, or art moved you?",
  "What freedom do you appreciate having?",
  "What memory brings you warmth?",
  "What skill are you glad to have?",
  "What kindness did you witness or receive?",
  "What about your body are you grateful for?"
];

const MOOD_ICONS = {
  joyful: { icon: '😄', label: 'Joyful' },
  grateful: { icon: '🙏', label: 'Grateful' },
  calm: { icon: '😌', label: 'Calm' },
  content: { icon: '😊', label: 'Content' },
  inspired: { icon: '✨', label: 'Inspired' },
  peaceful: { icon: '🕊️', label: 'Peaceful' },
  loved: { icon: '❤️', label: 'Loved' },
  hopeful: { icon: '🌅', label: 'Hopeful' }
};

export default function GratitudeLog({ isOpen, onClose }) {
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(true);
  const [streak, setStreak] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [viewMode, setViewMode] = useState('write'); // 'write' | 'history' | 'stats'
  const [editingId, setEditingId] = useState(null);

  // Load entries from localStorage
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const savedEntries = localStorage.getItem('mc-gratitude-entries');
    if (savedEntries) {
      try {
        const parsed = JSON.parse(savedEntries);
        setEntries(parsed);
        calculateStats(parsed);
      } catch (e) {
        console.error('Failed to parse gratitude entries:', e);
      }
    }

    // Set random prompt
    setCurrentPrompt(GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)]);
  }, [isOpen]);

  // Save entries to localStorage
  const saveEntries = useCallback((newEntries) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mc-gratitude-entries', JSON.stringify(newEntries));
    calculateStats(newEntries);
  }, []);

  // Calculate streak and stats
  const calculateStats = (entriesList) => {
    if (entriesList.length === 0) {
      setStreak(0);
      setTotalEntries(0);
      return;
    }

    setTotalEntries(entriesList.length);

    // Sort entries by date
    const sortedEntries = [...entriesList].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const entryDates = sortedEntries.map(e => new Date(e.date).toDateString());
    const uniqueDates = [...new Set(entryDates)];

    if (uniqueDates[0] === today) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else if (uniqueDates[0] === yesterday) {
      // Streak continues if entry was yesterday
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    setStreak(currentStreak);
  };

  const addEntry = () => {
    if (!currentEntry.trim()) return;

    const newEntry = {
      id: Date.now(),
      text: currentEntry.trim(),
      mood: selectedMood,
      date: new Date().toISOString(),
      prompt: showPrompt ? currentPrompt : null
    };

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    saveEntries(updatedEntries);

    // Reset form
    setCurrentEntry('');
    setSelectedMood(null);
    setShowPrompt(true);
    setCurrentPrompt(GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)]);
  };

  const deleteEntry = (id) => {
    const updatedEntries = entries.filter(e => e.id !== id);
    setEntries(updatedEntries);
    saveEntries(updatedEntries);
  };

  const updateEntry = (id, newText) => {
    const updatedEntries = entries.map(e => 
      e.id === id ? { ...e, text: newText } : e
    );
    setEntries(updatedEntries);
    saveEntries(updatedEntries);
    setEditingId(null);
  };

  const getTodayEntries = () => {
    const today = new Date().toDateString();
    return entries.filter(e => new Date(e.date).toDateString() === today);
  };

  const getEntriesByDate = () => {
    const grouped = {};
    entries.forEach(entry => {
      const dateKey = new Date(entry.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });
    return grouped;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (date.toDateString() === today) return 'Today';
    if (date.toDateString() === yesterday) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMoodStats = () => {
    const stats = {};
    entries.forEach(entry => {
      if (entry.mood) {
        stats[entry.mood] = (stats[entry.mood] || 0) + 1;
      }
    });
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const getWeeklyCount = () => {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return entries.filter(e => new Date(e.date).getTime() > oneWeekAgo).length;
  };

  const todayEntries = getTodayEntries();
  const entriesByDate = getEntriesByDate();
  const moodStats = getMoodStats();
  const weeklyCount = getWeeklyCount();

  if (!isOpen) return null;

  return (
    <div className="gratitude-overlay" onClick={onClose}>
      <div className="gratitude-panel" onClick={e => e.stopPropagation()}>
        <div className="gratitude-header">
          <h3>🙏 Gratitude Log</h3>
          <div className="header-actions">
            <div className="view-tabs">
              <button 
                className={viewMode === 'write' ? 'active' : ''}
                onClick={() => setViewMode('write')}
              >
                Write
              </button>
              <button 
                className={viewMode === 'history' ? 'active' : ''}
                onClick={() => setViewMode('history')}
              >
                History
              </button>
              <button 
                className={viewMode === 'stats' ? 'active' : ''}
                onClick={() => setViewMode('stats')}
              >
                Stats
              </button>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {viewMode === 'write' && (
          <div className="gratitude-write">
            {/* Stats Bar */}
            <div className="gratitude-stats-bar">
              <div className="stat-item">
                <span className="stat-icon">🔥</span>
                <span className="stat-value">{streak}</span>
                <span className="stat-label">day streak</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">✨</span>
                <span className="stat-value">{totalEntries}</span>
                <span className="stat-label">entries</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📅</span>
                <span className="stat-value">{weeklyCount}</span>
                <span className="stat-label">this week</span>
              </div>
            </div>

            {/* Prompt Card */}
            {showPrompt && (
              <div className="prompt-card">
                <div className="prompt-label">Prompt</div>
                <p className="prompt-text">{currentPrompt}</p>
                <button 
                  className="prompt-refresh"
                  onClick={() => setCurrentPrompt(GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)])}
                  title="New prompt"
                >
                  🔄
                </button>
                <button 
                  className="prompt-hide"
                  onClick={() => setShowPrompt(false)}
                  title="Hide prompt"
                >
                  ✕
                </button>
              </div>
            )}

            {!showPrompt && (
              <button 
                className="show-prompt-btn"
                onClick={() => setShowPrompt(true)}
              >
                💡 Show prompt
              </button>
            )}

            {/* Mood Selection */}
            <div className="mood-selection">
              <label>How are you feeling?</label>
              <div className="mood-options">
                {Object.entries(MOOD_ICONS).map(([key, config]) => (
                  <button
                    key={key}
                    className={`mood-btn ${selectedMood === key ? 'selected' : ''}`}
                    onClick={() => setSelectedMood(selectedMood === key ? null : key)}
                    title={config.label}
                  >
                    <span className="mood-icon">{config.icon}</span>
                    <span className="mood-label">{config.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Input */}
            <div className="entry-input-section">
              <textarea
                className="gratitude-textarea"
                placeholder="I'm grateful for..."
                value={currentEntry}
                onChange={(e) => setCurrentEntry(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <div className="input-meta">
                <span className="char-count">{currentEntry.length}/500</span>
                <button 
                  className="add-entry-btn"
                  onClick={addEntry}
                  disabled={!currentEntry.trim()}
                >
                  ✨ Add Entry
                </button>
              </div>
            </div>

            {/* Today's Entries */}
            {todayEntries.length > 0 && (
              <div className="today-entries">
                <h4>Today's Gratitude</h4>
                <div className="entries-list">
                  {todayEntries.map(entry => (
                    <div key={entry.id} className="entry-card">
                      {editingId === entry.id ? (
                        <div className="entry-edit">
                          <input
                            type="text"
                            defaultValue={entry.text}
                            onBlur={(e) => updateEntry(entry.id, e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateEntry(entry.id, e.target.value);
                              }
                            }}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>
                          <div className="entry-content">
                            {entry.mood && (
                              <span className="entry-mood">
                                {MOOD_ICONS[entry.mood]?.icon}
                              </span>
                            )}
                            <span className="entry-text">{entry.text}</span>
                          </div>
                          <div className="entry-actions">
                            <button 
                              onClick={() => setEditingId(entry.id)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => deleteEntry(entry.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quote */}
            <div className="gratitude-quote">
              <p>"Gratitude turns what we have into enough."</p>
              <span>— Aesop</span>
            </div>
          </div>
        )}

        {viewMode === 'history' && (
          <div className="gratitude-history">
            {entries.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🌱</span>
                <p>No entries yet</p>
                <span>Start your gratitude practice today!</span>
              </div>
            ) : (
              <div className="history-list">
                {Object.entries(entriesByDate).map(([date, dateEntries]) => (
                  <div key={date} className="history-date-group">
                    <div className="date-header">{formatDate(date)}</div>
                    <div className="date-entries">
                      {dateEntries.map(entry => (
                        <div key={entry.id} className="history-entry">
                          <div className="entry-time">{formatTime(entry.date)}</div>
                          <div className="entry-content">
                            {entry.mood && (
                              <span className="entry-mood">
                                {MOOD_ICONS[entry.mood]?.icon}
                              </span>
                            )}
                            <span className="entry-text">{entry.text}</span>
                          </div>
                          <button 
                            className="delete-btn"
                            onClick={() => deleteEntry(entry.id)}
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'stats' && (
          <div className="gratitude-stats">
            <div className="stats-grid">
              <div className="stat-card highlight">
                <span className="stat-card-icon">🔥</span>
                <span className="stat-card-value">{streak}</span>
                <span className="stat-card-label">Current Streak</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-icon">✨</span>
                <span className="stat-card-value">{totalEntries}</span>
                <span className="stat-card-label">Total Entries</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-icon">📅</span>
                <span className="stat-card-value">{weeklyCount}</span>
                <span className="stat-card-label">This Week</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-icon">📊</span>
                <span className="stat-card-value">
                  {entries.length > 0 ? Math.round(totalEntries / Math.max(streak, 1)) : 0}
                </span>
                <span className="stat-card-label">Avg/Day</span>
              </div>
            </div>

            {moodStats.length > 0 && (
              <div className="mood-stats-section">
                <h4>Top Moods</h4>
                <div className="mood-distribution">
                  {moodStats.map(([mood, count]) => (
                    <div key={mood} className="mood-stat-item">
                      <span className="mood-stat-icon">
                        {MOOD_ICONS[mood]?.icon}
                      </span>
                      <div className="mood-stat-bar">
                        <div 
                          className="mood-stat-fill"
                          style={{ width: `${(count / entries.length) * 100}%` }}
                        />
                      </div>
                      <span className="mood-stat-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="gratitude-tips">
              <h4>💡 Tips for Your Practice</h4>
              <ul>
                <li>Write at the same time each day to build habit</li>
                <li>Be specific - instead of "family", try "mom's encouraging text"</li>
                <li>Include challenges you're grateful for (growth!)</li>
                <li>Aim for 3-5 entries per day</li>
                <li>Read past entries when you need a boost</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Utility function to check if user has entries today (for external use)
export const hasGratitudeEntryToday = () => {
  if (typeof window === 'undefined') return false;
  
  const savedEntries = localStorage.getItem('mc-gratitude-entries');
  if (!savedEntries) return false;
  
  try {
    const entries = JSON.parse(savedEntries);
    const today = new Date().toDateString();
    return entries.some(e => new Date(e.date).toDateString() === today);
  } catch (e) {
    return false;
  }
};

// Get streak for external use
export const getGratitudeStreak = () => {
  if (typeof window === 'undefined') return 0;
  
  const savedEntries = localStorage.getItem('mc-gratitude-entries');
  if (!savedEntries) return 0;
  
  try {
    const entries = JSON.parse(savedEntries);
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    const entryDates = sortedEntries.map(e => new Date(e.date).toDateString());
    const uniqueDates = [...new Set(entryDates)];
    
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) streak++;
        else break;
      }
    }
    return streak;
  } catch (e) {
    return 0;
  }
};
