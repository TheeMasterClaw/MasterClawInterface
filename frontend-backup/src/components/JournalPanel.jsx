import React, { useState, useEffect, useMemo } from 'react';
import './JournalPanel.css';

const PROMPTS = [
  "What are you grateful for today?",
  "What did you learn today?",
  "What was the highlight of your day?",
  "What's on your mind?",
  "What are you looking forward to?",
  "What challenged you today?",
  "How are you feeling right now?",
  "What's one thing you'd do differently?",
  "What made you smile today?",
  "What are your intentions for tomorrow?"
];

const MOODS = [
  { emoji: '😄', label: 'Great', color: '#4ade80' },
  { emoji: '🙂', label: 'Good', color: '#60a5fa' },
  { emoji: '😐', label: 'Okay', color: '#fbbf24' },
  { emoji: '😔', label: 'Down', color: '#f87171' },
  { emoji: '😤', label: 'Frustrated', color: '#fb923c' },
  { emoji: '😴', label: 'Tired', color: '#a78bfa' }
];

const STORAGE_KEY = 'mc-journal-entries';

export default function JournalPanel({ isOpen, onClose }) {
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('write'); // 'write', 'timeline', 'calendar'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Load entries from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setEntries(parsed);
        calculateStreak(parsed);
      }
    } catch (err) {
      console.error('Failed to load journal entries:', err);
    }
    
    // Set random prompt
    setCurrentPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    
    // Check if there's an entry for today
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = entries.find(e => e.date === today);
    if (todayEntry) {
      setCurrentEntry(todayEntry.content);
      setSelectedMood(todayEntry.mood);
      setTags(todayEntry.tags || []);
    }
  }, [isOpen]);

  // Save entries to localStorage
  const saveEntries = (newEntries) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
      setEntries(newEntries);
      calculateStreak(newEntries);
    } catch (err) {
      console.error('Failed to save journal entries:', err);
    }
  };

  const calculateStreak = (entryList) => {
    if (entryList.length === 0) {
      setStreak(0);
      return;
    }

    const sortedDates = entryList
      .map(e => e.date)
      .sort((a, b) => new Date(b) - new Date(a));
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let currentStreak = 0;
    let checkDate = sortedDates[0] === today ? today : yesterday;
    
    for (const date of sortedDates) {
      if (date === checkDate) {
        currentStreak++;
        checkDate = new Date(new Date(checkDate) - 86400000).toISOString().split('T')[0];
      } else if (new Date(date) < new Date(checkDate)) {
        break;
      }
    }
    
    setStreak(currentStreak);
  };

  const handleSaveEntry = () => {
    if (!currentEntry.trim() && !selectedMood) return;

    const newEntry = {
      id: Date.now(),
      date: selectedDate,
      content: currentEntry.trim(),
      mood: selectedMood,
      tags: tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingIndex = entries.findIndex(e => e.date === selectedDate);
    let newEntries;
    
    if (existingIndex >= 0) {
      newEntries = [...entries];
      newEntries[existingIndex] = { ...newEntries[existingIndex], ...newEntry };
    } else {
      newEntries = [newEntry, ...entries];
    }
    
    saveEntries(newEntries);
    
    // Reset for next entry if it's a new date
    if (selectedDate !== new Date().toISOString().split('T')[0]) {
      setCurrentEntry('');
      setSelectedMood(null);
      setTags([]);
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleDeleteEntry = (id) => {
    const newEntries = entries.filter(e => e.id !== id);
    saveEntries(newEntries);
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const entry = entries.find(e => e.date === date);
    if (entry) {
      setCurrentEntry(entry.content);
      setSelectedMood(entry.mood);
      setTags(entry.tags || []);
    } else {
      setCurrentEntry('');
      setSelectedMood(null);
      setTags([]);
    }
    setViewMode('write');
  };

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.content.toLowerCase().includes(query) ||
        e.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [entries, searchQuery]);

  const getEntryCountForMonth = (year, month) => {
    return entries.filter(e => {
      const date = new Date(e.date);
      return date.getFullYear() === year && date.getMonth() === month;
    }).length;
  };

  const getMoodForDate = (dateStr) => {
    const entry = entries.find(e => e.date === dateStr);
    return entry?.mood;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStats = () => {
    const totalEntries = entries.length;
    const thisMonth = entries.filter(e => {
      const date = new Date(e.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    
    const moodCounts = {};
    entries.forEach(e => {
      if (e.mood) {
        moodCounts[e.mood.label] = (moodCounts[e.mood.label] || 0) + 1;
      }
    });
    
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    return { totalEntries, thisMonth, dominantMood, streak };
  };

  const stats = getStats();

  const renderCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return (
      <div className="journal-calendar">
        <div className="journal-calendar-header">
          {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <div className="journal-calendar-grid">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="journal-calendar-day-header">{d}</div>
          ))}
          {days.map((day, i) => {
            if (!day) return <div key={i} className="journal-calendar-day empty" />;
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const mood = getMoodForDate(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const hasEntry = entries.some(e => e.date === dateStr);
            
            return (
              <button
                key={i}
                className={`journal-calendar-day ${isToday ? 'today' : ''} ${hasEntry ? 'has-entry' : ''}`}
                style={mood ? { borderColor: mood.color } : {}}
                onClick={() => handleDateSelect(dateStr)}
              >
                {day}
                {mood && <span className="mood-dot" style={{ background: mood.color }} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="journal-panel-overlay" onClick={onClose}>
      <div className="journal-panel" onClick={e => e.stopPropagation()}>
        <div className="journal-panel-header">
          <div className="journal-title">
            <h3>📔 Journal</h3>
            <div className="journal-streak">
              <span className="streak-fire">{streak > 0 ? '🔥' : '⚡'}</span>
              <span className="streak-count">{streak} day{streak !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="journal-header-actions">
            <button 
              className={viewMode === 'write' ? 'active' : ''}
              onClick={() => setViewMode('write')}
              title="Write"
            >
              ✍️
            </button>
            <button 
              className={viewMode === 'timeline' ? 'active' : ''}
              onClick={() => setViewMode('timeline')}
              title="Timeline"
            >
              📜
            </button>
            <button 
              className={viewMode === 'calendar' ? 'active' : ''}
              onClick={() => setViewMode('calendar')}
              title="Calendar"
            >
              📅
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="journal-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.totalEntries}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.thisMonth}</span>
            <span className="stat-label">This Month</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.streak}</span>
            <span className="stat-label">Streak</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.dominantMood}</span>
            <span className="stat-label">Top Mood</span>
          </div>
        </div>

        {viewMode === 'write' && (
          <div className="journal-write-view">
            <div className="journal-date-selector">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              {selectedDate === new Date().toISOString().split('T')[0] && (
                <span className="today-badge">Today</span>
              )}
            </div>

            <div className="journal-prompt">
              <span className="prompt-label">💭 Prompt:</span>
              <p className="prompt-text">{currentPrompt}</p>
              <button 
                className="prompt-refresh"
                onClick={() => setCurrentPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])}
                title="New prompt"
              >
                🔄
              </button>
            </div>

            <div className="journal-mood-selector">
              <span className="mood-label">How are you feeling?</span>
              <div className="mood-options">
                {MOODS.map((mood) => (
                  <button
                    key={mood.label}
                    className={`mood-btn ${selectedMood?.label === mood.label ? 'selected' : ''}`}
                    onClick={() => setSelectedMood(mood)}
                    title={mood.label}
                    style={selectedMood?.label === mood.label ? { 
                      background: `${mood.color}20`,
                      borderColor: mood.color 
                    } : {}}
                  >
                    <span className="mood-emoji">{mood.emoji}</span>
                    <span className="mood-text">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="journal-textarea"
              placeholder="Write your thoughts here..."
              value={currentEntry}
              onChange={(e) => setCurrentEntry(e.target.value)}
              rows={12}
            />

            <div className="journal-tags">
              <div className="tags-list">
                {tags.map(tag => (
                  <span key={tag} className="tag">
                    #{tag}
                    <button onClick={() => handleRemoveTag(tag)}>×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="tag-input"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>

            <div className="journal-actions">
              <button 
                className="save-btn"
                onClick={handleSaveEntry}
                disabled={!currentEntry.trim() && !selectedMood}
              >
                💾 Save Entry
              </button>
            </div>
          </div>
        )}

        {viewMode === 'timeline' && (
          <div className="journal-timeline-view">
            <div className="journal-search">
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="journal-entries-list">
              {filteredEntries.length === 0 ? (
                <div className="empty-state">
                  {searchQuery ? 'No entries found' : 'No entries yet. Start writing!'}
                </div>
              ) : (
                filteredEntries.map(entry => (
                  <div 
                    key={entry.id} 
                    className="journal-entry-card"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="entry-header">
                      <span className="entry-date">{formatDate(entry.date)}</span>
                      {entry.mood && (
                        <span 
                          className="entry-mood"
                          style={{ background: `${entry.mood.color}20`, color: entry.mood.color }}
                        >
                          {entry.mood.emoji} {entry.mood.label}
                        </span>
                      )}
                    </div>
                    <p className="entry-preview">
                      {entry.content.substring(0, 150)}{entry.content.length > 150 ? '...' : ''}
                    </p>
                    {entry.tags?.length > 0 && (
                      <div className="entry-tags">
                        {entry.tags.map(tag => (
                          <span key={tag} className="entry-tag">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {viewMode === 'calendar' && (
          <div className="journal-calendar-view">
            {renderCalendar()}
            <div className="journal-calendar-legend">
              <span className="legend-item">
                <span className="legend-dot" style={{ background: '#4ade80' }} /> Great
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: '#60a5fa' }} /> Good
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: '#fbbf24' }} /> Okay
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: '#f87171' }} /> Down
              </span>
            </div>
          </div>
        )}

        {selectedEntry && (
          <div className="journal-entry-modal" onClick={() => setSelectedEntry(null)}>
            <div className="journal-entry-modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h4>{formatDate(selectedEntry.date)}</h4>
                <div className="modal-actions">
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteEntry(selectedEntry.id)}
                  >
                    🗑️
                  </button>
                  <button className="close-btn" onClick={() => setSelectedEntry(null)}>×</button>
                </div>
              </div>
              {selectedEntry.mood && (
                <div 
                  className="modal-mood"
                  style={{ background: `${selectedEntry.mood.color}20`, color: selectedEntry.mood.color }}
                >
                  {selectedEntry.mood.emoji} {selectedEntry.mood.label}
                </div>
              )}
              <p className="modal-content">{selectedEntry.content}</p>
              {selectedEntry.tags?.length > 0 && (
                <div className="modal-tags">
                  {selectedEntry.tags.map(tag => (
                    <span key={tag} className="modal-tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
