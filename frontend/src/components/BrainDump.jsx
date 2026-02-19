'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import './BrainDump.css';

const CATEGORIES = {
  worry: { label: 'Worry', icon: '😰', color: '#f59e0b', description: 'Things causing anxiety' },
  idea: { label: 'Idea', icon: '💡', color: '#3b82f6', description: 'Creative thoughts & inspiration' },
  task: { label: 'Task', icon: '✅', color: '#22c55e', description: 'Things to do later' },
  reminder: { label: 'Reminder', icon: '⏰', color: '#8b5cf6', description: 'Don\'t forget this' },
  thought: { label: 'Thought', icon: '💭', color: '#64748b', description: 'Random musings' }
};

const WORRY_TIME_PRESETS = [
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '20 min', minutes: 20 },
  { label: '30 min', minutes: 30 }
];

export default function BrainDump({ isOpen, onClose }) {
  const [entries, setEntries] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('thought');
  const [filter, setFilter] = useState('all');
  const [showWorryTime, setShowWorryTime] = useState(false);
  const [worryTimeMinutes, setWorryTimeMinutes] = useState(15);
  const [worryTimeActive, setWorryTimeActive] = useState(false);
  const [worryTimeRemaining, setWorryTimeRemaining] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);

  // Load data from localStorage
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const savedData = localStorage.getItem('mc-brain-dump');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setEntries(data.entries || []);
        setProcessedCount(data.processedCount || 0);
        setArchivedCount(data.archivedCount || 0);
      } catch (e) {
        console.error('Failed to parse brain dump data:', e);
      }
    }
  }, [isOpen]);

  // Save data to localStorage
  const saveData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const data = {
      entries,
      processedCount,
      archivedCount,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('mc-brain-dump', JSON.stringify(data));
  }, [entries, processedCount, archivedCount]);

  useEffect(() => {
    saveData();
  }, [saveData]);

  // Worry time timer
  useEffect(() => {
    let interval;
    if (worryTimeActive && worryTimeRemaining > 0) {
      interval = setInterval(() => {
        setWorryTimeRemaining(prev => {
          if (prev <= 1) {
            setWorryTimeActive(false);
            // Play subtle notification sound or show notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🧠 Worry Time Complete', {
                body: 'Time to release those worries and move forward.',
                icon: '/favicon.ico'
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [worryTimeActive, worryTimeRemaining]);

  const addEntry = () => {
    if (!inputValue.trim()) return;

    const newEntry = {
      id: Date.now(),
      text: inputValue.trim(),
      category: selectedCategory,
      createdAt: new Date().toISOString(),
      processed: false,
      archived: false
    };

    setEntries(prev => [newEntry, ...prev]);
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addEntry();
    }
  };

  const markAsProcessed = (id) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, processed: true, processedAt: new Date().toISOString() } : entry
    ));
    setProcessedCount(prev => prev + 1);
  };

  const archiveEntry = (id) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, archived: true, archivedAt: new Date().toISOString() } : entry
    ));
    setArchivedCount(prev => prev + 1);
  };

  const deleteEntry = (id) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const restoreEntry = (id) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, archived: false, archivedAt: null } : entry
    ));
    setArchivedCount(prev => Math.max(0, prev - 1));
  };

  const clearAllArchived = () => {
    if (window.confirm('Are you sure you want to permanently delete all archived entries?')) {
      setEntries(prev => prev.filter(entry => !entry.archived));
    }
  };

  const startWorryTime = () => {
    setWorryTimeActive(true);
    setWorryTimeRemaining(worryTimeMinutes * 60);
    setShowWorryTime(false);
  };

  const stopWorryTime = () => {
    setWorryTimeActive(false);
    setWorryTimeRemaining(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return !entry.archived;
    if (filter === 'archived') return entry.archived;
    if (filter === 'processed') return entry.processed && !entry.archived;
    if (filter === 'unprocessed') return !entry.processed && !entry.archived;
    return entry.category === filter && !entry.archived;
  });

  const activeEntries = entries.filter(e => !e.archived);
  const stats = {
    total: activeEntries.length,
    processed: activeEntries.filter(e => e.processed).length,
    unprocessed: activeEntries.filter(e => !e.processed).length,
    worries: activeEntries.filter(e => e.category === 'worry').length,
    ideas: activeEntries.filter(e => e.category === 'idea').length,
    tasks: activeEntries.filter(e => e.category === 'task').length
  };

  if (!isOpen) return null;

  return (
    <div className="brain-dump-overlay" onClick={onClose}>
      <div className="brain-dump-panel" onClick={e => e.stopPropagation()}>
        <div className="brain-dump-header">
          <h3>🧠 Brain Dump</h3>
          <div className="header-actions">
            {!showWorryTime && !worryTimeActive && (
              <button 
                className="worry-time-btn"
                onClick={() => setShowWorryTime(true)}
                title="Schedule Worry Time"
              >
                😰 Worry Time
              </button>
            )}
            {worryTimeActive && (
              <div className="worry-time-active">
                <span className="worry-time-timer">{formatTime(worryTimeRemaining)}</span>
                <button onClick={stopWorryTime} className="stop-worry-btn">Stop</button>
              </div>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showWorryTime && (
          <div className="worry-time-setup">
            <h4>😰 Scheduled Worry Time</h4>
            <p>Set aside dedicated time to process your worries. When the timer ends, consciously let them go.</p>
            <div className="worry-time-presets">
              {WORRY_TIME_PRESETS.map(preset => (
                <button
                  key={preset.minutes}
                  className={worryTimeMinutes === preset.minutes ? 'active' : ''}
                  onClick={() => setWorryTimeMinutes(preset.minutes)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="worry-time-actions">
              <button className="start-worry-btn" onClick={startWorryTime}>
                ▶️ Start Worry Time
              </button>
              <button className="cancel-btn" onClick={() => setShowWorryTime(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="brain-dump-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-card">
            <span className="stat-number" style={{ color: '#22c55e' }}>{stats.processed}</span>
            <span className="stat-label">Processed</span>
          </div>
          <div className="stat-card">
            <span className="stat-number" style={{ color: '#f59e0b' }}>{stats.worries}</span>
            <span className="stat-label">Worries</span>
          </div>
          <div className="stat-card">
            <span className="stat-number" style={{ color: '#3b82f6' }}>{stats.ideas}</span>
            <span className="stat-label">Ideas</span>
          </div>
          <div className="stat-card">
            <span className="stat-number" style={{ color: '#22c55e' }}>{stats.tasks}</span>
            <span className="stat-label">Tasks</span>
          </div>
        </div>

        {/* Input Section */}
        <div className="brain-dump-input-section">
          <div className="category-selector">
            {Object.entries(CATEGORIES).map(([key, config]) => (
              <button
                key={key}
                className={`category-btn ${selectedCategory === key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(key)}
                title={config.description}
                style={{ 
                  '--category-color': config.color,
                  borderColor: selectedCategory === key ? config.color : 'transparent'
                }}
              >
                <span className="category-icon">{config.icon}</span>
                <span className="category-label">{config.label}</span>
              </button>
            ))}
          </div>
          <div className="input-group">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`What's on your mind? (${CATEGORIES[selectedCategory].label.toLowerCase()}...)`}
              rows={3}
              autoFocus
            />
            <button 
              className="add-entry-btn"
              onClick={addEntry}
              disabled={!inputValue.trim()}
              style={{ backgroundColor: CATEGORIES[selectedCategory].color }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </button>
          <button 
            className={filter === 'unprocessed' ? 'active' : ''}
            onClick={() => setFilter('unprocessed')}
          >
            Active ({stats.unprocessed})
          </button>
          <button 
            className={filter === 'processed' ? 'active' : ''}
            onClick={() => setFilter('processed')}
          >
            Done ({activeEntries.filter(e => e.processed).length})
          </button>
          <button 
            className={filter === 'worry' ? 'active' : ''}
            onClick={() => setFilter('worry')}
          >
            😰 Worries
          </button>
          <button 
            className={filter === 'idea' ? 'active' : ''}
            onClick={() => setFilter('idea')}
          >
            💡 Ideas
          </button>
          <button 
            className={filter === 'archived' ? 'active' : ''}
            onClick={() => setFilter('archived')}
          >
            🗃️ Archived ({entries.filter(e => e.archived).length})
          </button>
        </div>

        {/* Entries List */}
        <div className="entries-list">
          {filteredEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧘</div>
              <p>
                {filter === 'all' 
                  ? "Your mind is clear! Add thoughts above to declutter your brain."
                  : filter === 'archived'
                  ? "No archived entries yet."
                  : "No entries match this filter."}
              </p>
              <small>Tip: Use Brain Dump to quickly offload thoughts without organizing them. Process them later when you have mental space.</small>
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div 
                key={entry.id} 
                className={`entry-item ${entry.processed ? 'processed' : ''} ${entry.archived ? 'archived' : ''}`}
              >
                <div 
                  className="entry-category-indicator"
                  style={{ backgroundColor: CATEGORIES[entry.category].color }}
                />
                <div className="entry-content">
                  <div className="entry-header">
                    <span className="entry-category">
                      {CATEGORIES[entry.category].icon} {CATEGORIES[entry.category].label}
                    </span>
                    <span className="entry-time">{formatDate(entry.createdAt)}</span>
                  </div>
                  <p className="entry-text">{entry.text}</p>
                  {entry.processed && (
                    <span className="processed-badge">✅ Processed</span>
                  )}
                </div>
                <div className="entry-actions">
                  {!entry.archived && !entry.processed && (
                    <button 
                      className="action-btn process"
                      onClick={() => markAsProcessed(entry.id)}
                      title="Mark as processed"
                    >
                      ✅
                    </button>
                  )}
                  {!entry.archived && (
                    <button 
                      className="action-btn archive"
                      onClick={() => archiveEntry(entry.id)}
                      title="Archive"
                    >
                      🗃️
                    </button>
                  )}
                  {entry.archived && (
                    <button 
                      className="action-btn restore"
                      onClick={() => restoreEntry(entry.id)}
                      title="Restore"
                    >
                      🔄
                    </button>
                  )}
                  <button 
                    className="action-btn delete"
                    onClick={() => deleteEntry(entry.id)}
                    title="Delete permanently"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Archived Footer */}
        {filter === 'archived' && entries.some(e => e.archived) && (
          <div className="archived-footer">
            <button className="clear-archived-btn" onClick={clearAllArchived}>
              🗑️ Clear All Archived
            </button>
          </div>
        )}

        {/* Tips Section */}
        <div className="brain-dump-tips">
          <p>
            💡 <strong>How to use Brain Dump:</strong> When your mind feels cluttered, quickly jot down everything swirling in your head. 
            Don't organize yet—just dump. Return later to process, convert to tasks, or archive.
          </p>
          {stats.worries > 3 && !worryTimeActive && (
            <p className="worry-suggestion">
              😰 <strong>Feeling overwhelmed?</strong> You have {stats.worries} worries stored. 
              Try "Worry Time" to process them in a dedicated session.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility function to get active brain dump count
export const getActiveBrainDumpCount = () => {
  if (typeof window === 'undefined') return 0;
  
  const savedData = localStorage.getItem('mc-brain-dump');
  if (!savedData) return 0;
  
  try {
    const data = JSON.parse(savedData);
    return (data.entries || []).filter(e => !e.archived).length;
  } catch (e) {
    return 0;
  }
};

// Utility to check if user has unprocessed worries
export const hasUnprocessedWorries = () => {
  if (typeof window === 'undefined') return false;
  
  const savedData = localStorage.getItem('mc-brain-dump');
  if (!savedData) return false;
  
  try {
    const data = JSON.parse(savedData);
    return (data.entries || []).some(e => e.category === 'worry' && !e.processed && !e.archived);
  } catch (e) {
    return false;
  }
};
