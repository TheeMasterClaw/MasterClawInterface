import React, { useState, useEffect, useMemo } from 'react';
// import './ChallengeTracker.css';

const CHALLENGE_ICONS = [
  { id: 'fitness', emoji: '💪', label: 'Fitness' },
  { id: 'meditation', emoji: '🧘', label: 'Meditation' },
  { id: 'reading', emoji: '📚', label: 'Reading' },
  { id: 'writing', emoji: '✍️', label: 'Writing' },
  { id: 'coding', emoji: '💻', label: 'Coding' },
  { id: 'art', emoji: '🎨', label: 'Art' },
  { id: 'music', emoji: '🎵', label: 'Music' },
  { id: 'language', emoji: '🗣️', label: 'Language' },
  { id: 'water', emoji: '💧', label: 'Hydration' },
  { id: 'sleep', emoji: '😴', label: 'Sleep' },
  { id: 'nosugar', emoji: '🚫🍬', label: 'No Sugar' },
  { id: 'nophone', emoji: '📵', label: 'Digital Detox' },
  { id: 'gratitude', emoji: '🙏', label: 'Gratitude' },
  { id: 'finance', emoji: '💰', label: 'Finance' },
  { id: 'social', emoji: '👥', label: 'Social' },
  { id: 'custom', emoji: '⭐', label: 'Custom' }
];

const DURATION_PRESETS = [
  { days: 7, label: '1 Week', emoji: '📅' },
  { days: 14, label: '2 Weeks', emoji: '📆' },
  { days: 21, label: '3 Weeks', emoji: '🗓️' },
  { days: 30, label: '30 Days', emoji: '🌟' },
  { days: 60, label: '60 Days', emoji: '🔥' },
  { days: 90, label: '90 Days', emoji: '💎' },
  { days: 100, label: '100 Days', emoji: '🏆' },
  { days: 365, label: '1 Year', emoji: '🎯' }
];

const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Easy', color: '#4ade80', description: 'Build momentum' },
  { id: 'medium', label: 'Medium', color: '#fbbf24', description: 'Push yourself' },
  { id: 'hard', label: 'Hard', color: '#f87171', description: 'Serious growth' },
  { id: 'extreme', label: 'Extreme', color: '#a78bfa', description: 'Transform yourself' }
];

const STORAGE_KEY = 'mc-challenge-tracker';

export default function ChallengeTracker({ isOpen, onClose }) {
  const [challenges, setChallenges] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'detail'
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'completed', 'archived'
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('custom');
  const [formDuration, setFormDuration] = useState(30);
  const [formDifficulty, setFormDifficulty] = useState('medium');
  const [formColor, setFormColor] = useState('#60a5fa');
  const [formReminders, setFormReminders] = useState(true);
  const [formReminderTime, setFormReminderTime] = useState('20:00');

  // Load challenges from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to dates
        const restored = parsed.map(c => ({
          ...c,
          startDate: c.startDate ? new Date(c.startDate) : null,
          completedDates: c.completedDates ? c.completedDates.map(d => new Date(d)) : [],
          createdAt: new Date(c.createdAt)
        }));
        setChallenges(restored);
      } else {
        // Add sample challenge for first-time users
        const sampleChallenge = createSampleChallenge();
        setChallenges([sampleChallenge]);
        saveChallenges([sampleChallenge]);
      }
    } catch (err) {
      console.error('Failed to load challenges:', err);
    }
  }, [isOpen]);

  const createSampleChallenge = () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 5); // Started 5 days ago
    
    const completedDates = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      completedDates.push(date);
    }
    
    return {
      id: 'sample-' + Date.now(),
      title: '💧 Daily Hydration',
      description: 'Drink 8 glasses of water every day',
      icon: 'water',
      duration: 30,
      difficulty: 'easy',
      color: '#60a5fa',
      startDate: startDate,
      completedDates: completedDates,
      reminders: true,
      reminderTime: '09:00',
      status: 'active',
      createdAt: new Date(),
      archived: false
    };
  };

  const saveChallenges = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save challenges:', err);
    }
  };

  // Auto-save on changes
  useEffect(() => {
    if (challenges.length > 0) {
      saveChallenges(challenges);
    }
  }, [challenges]);

  const handleCreateChallenge = (e) => {
    e.preventDefault();
    
    if (!formTitle.trim()) return;
    
    const newChallenge = {
      id: 'challenge-' + Date.now(),
      title: formTitle.trim(),
      description: formDescription.trim(),
      icon: formIcon,
      duration: parseInt(formDuration),
      difficulty: formDifficulty,
      color: formColor,
      startDate: new Date(),
      completedDates: [],
      reminders: formReminders,
      reminderTime: formReminderTime,
      status: 'active',
      createdAt: new Date(),
      archived: false
    };
    
    setChallenges(prev => [newChallenge, ...prev]);
    resetForm();
    setViewMode('list');
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormIcon('custom');
    setFormDuration(30);
    setFormDifficulty('medium');
    setFormColor('#60a5fa');
    setFormReminders(true);
    setFormReminderTime('20:00');
  };

  const toggleDay = (challengeId, date) => {
    setChallenges(prev => prev.map(c => {
      if (c.id !== challengeId) return c;
      
      const dateStr = date.toDateString();
      const isCompleted = c.completedDates.some(d => d.toDateString() === dateStr);
      
      let newCompletedDates;
      if (isCompleted) {
        newCompletedDates = c.completedDates.filter(d => d.toDateString() !== dateStr);
      } else {
        newCompletedDates = [...c.completedDates, date];
      }
      
      // Check if challenge is completed
      const isFullyCompleted = newCompletedDates.length >= c.duration;
      
      return {
        ...c,
        completedDates: newCompletedDates,
        status: isFullyCompleted ? 'completed' : 'active'
      };
    }));
  };

  const deleteChallenge = (challengeId) => {
    if (confirm('Are you sure you want to delete this challenge?')) {
      setChallenges(prev => prev.filter(c => c.id !== challengeId));
      if (selectedChallenge?.id === challengeId) {
        setSelectedChallenge(null);
        setViewMode('list');
      }
    }
  };

  const archiveChallenge = (challengeId) => {
    setChallenges(prev => prev.map(c => 
      c.id === challengeId ? { ...c, archived: true, status: 'archived' } : c
    ));
  };

  const restoreChallenge = (challengeId) => {
    setChallenges(prev => prev.map(c => 
      c.id === challengeId ? { ...c, archived: false, status: 'active' } : c
    ));
  };

  const restartChallenge = (challenge) => {
    if (confirm('Start this challenge over? Your previous progress will be saved in history.')) {
      const restartedChallenge = {
        ...challenge,
        id: 'challenge-' + Date.now(),
        startDate: new Date(),
        completedDates: [],
        status: 'active',
        archived: false
      };
      setChallenges(prev => [restartedChallenge, ...prev]);
      setSelectedChallenge(restartedChallenge);
    }
  };

  // Helper functions
  const getChallengeStats = (challenge) => {
    const completed = challenge.completedDates.length;
    const total = challenge.duration;
    const percentage = Math.round((completed / total) * 100);
    
    // Calculate streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check from today backwards
    for (let i = 0; i <= total; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const isCompleted = challenge.completedDates.some(d => {
        const dCopy = new Date(d);
        dCopy.setHours(0, 0, 0, 0);
        return dCopy.getTime() === checkDate.getTime();
      });
      
      if (isCompleted) {
        currentStreak++;
      } else if (i === 0) {
        // Today not completed, check if we had a streak yesterday
        continue;
      } else {
        break;
      }
    }
    
    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = [...challenge.completedDates].sort((a, b) => a - b);
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { completed, total, percentage, currentStreak, longestStreak };
  };

  const generateCalendarGrid = (challenge) => {
    const days = [];
    const startDate = new Date(challenge.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < challenge.duration; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const isCompleted = challenge.completedDates.some(d => 
        new Date(d).toDateString() === date.toDateString()
      );
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      
      days.push({ date, isCompleted, isToday, isPast, dayNumber: i + 1 });
    }
    
    return days;
  };

  const getDifficultyLabel = (difficultyId) => {
    return DIFFICULTY_LEVELS.find(d => d.id === difficultyId) || DIFFICULTY_LEVELS[1];
  };

  const getIconEmoji = (iconId) => {
    return CHALLENGE_ICONS.find(i => i.id === iconId)?.emoji || '⭐';
  };

  // Filtered challenges
  const filteredChallenges = useMemo(() => {
    return challenges.filter(c => {
      if (filterStatus === 'active') return !c.archived && c.status !== 'completed';
      if (filterStatus === 'completed') return c.status === 'completed' && !c.archived;
      if (filterStatus === 'archived') return c.archived;
      return true;
    });
  }, [challenges, filterStatus]);

  // Stats for dashboard
  const globalStats = useMemo(() => {
    const active = challenges.filter(c => !c.archived && c.status !== 'completed').length;
    const completed = challenges.filter(c => c.status === 'completed').length;
    const archived = challenges.filter(c => c.archived).length;
    const totalCompletedDays = challenges.reduce((sum, c) => sum + c.completedDates.length, 0);
    
    return { active, completed, archived, totalCompletedDays };
  }, [challenges]);

  if (!isOpen) return null;

  return (
    <div className="challenge-tracker-overlay" onClick={onClose}>
      <div className="challenge-tracker-panel" onClick={e => e.stopPropagation()}>
        <div className="challenge-tracker-header">
          <h3>🎯 Challenge Tracker</h3>
          <div className="header-actions">
            {viewMode === 'list' && (
              <button 
                className="create-btn"
                onClick={() => setViewMode('create')}
              >
                + New Challenge
              </button>
            )}
            {viewMode !== 'list' && (
              <button 
                className="back-btn"
                onClick={() => {
                  setViewMode('list');
                  setSelectedChallenge(null);
                }}
              >
                ← Back
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {viewMode === 'list' && (
          <>
            {/* Stats Dashboard */}
            <div className="stats-dashboard">
              <div className="stat-card">
                <span className="stat-value">{globalStats.active}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{globalStats.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{globalStats.totalCompletedDays}</span>
                <span className="stat-label">Days Logged</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{challenges.length}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
              {['all', 'active', 'completed', 'archived'].map(status => (
                <button
                  key={status}
                  className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Challenge Grid */}
            <div className="challenges-grid">
              {filteredChallenges.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🎯</span>
                  <p>No challenges yet</p>
                  <button onClick={() => setViewMode('create')}>
                    Create your first challenge
                  </button>
                </div>
              ) : (
                filteredChallenges.map(challenge => {
                  const stats = getChallengeStats(challenge);
                  const difficulty = getDifficultyLabel(challenge.difficulty);
                  
                  return (
                    <div 
                      key={challenge.id} 
                      className={`challenge-card ${challenge.status} ${challenge.archived ? 'archived' : ''}`}
                      style={{ '--challenge-color': challenge.color }}
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setViewMode('detail');
                      }}
                    >
                      <div className="challenge-card-header">
                        <span className="challenge-icon">{getIconEmoji(challenge.icon)}</span>
                        <span 
                          className="difficulty-badge"
                          style={{ backgroundColor: difficulty.color }}
                        >
                          {difficulty.label}
                        </span>
                      </div>
                      
                      <h4 className="challenge-title">{challenge.title}</h4>
                      <p className="challenge-description">{challenge.description}</p>
                      
                      <div className="challenge-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${stats.percentage}%` }}
                          />
                        </div>
                        <span className="progress-text">
                          {stats.completed}/{stats.total} days ({stats.percentage}%)
                        </span>
                      </div>
                      
                      <div className="challenge-stats-row">
                        <span className="stat-item" title="Current streak">
                          🔥 {stats.currentStreak}
                        </span>
                        <span className="stat-item" title="Best streak">
                          🏆 {stats.longestStreak}
                        </span>
                        {challenge.status === 'completed' && (
                          <span className="completed-badge">✅ Done!</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {viewMode === 'create' && (
          <form className="challenge-form" onSubmit={handleCreateChallenge}>
            <div className="form-section">
              <label>Challenge Name *</label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g., 30 Days of Meditation"
                required
                autoFocus
              />
            </div>

            <div className="form-section">
              <label>Description</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="What do you want to achieve?"
                rows={2}
              />
            </div>

            <div className="form-section">
              <label>Icon</label>
              <div className="icon-grid">
                {CHALLENGE_ICONS.map(icon => (
                  <button
                    key={icon.id}
                    type="button"
                    className={`icon-option ${formIcon === icon.id ? 'selected' : ''}`}
                    onClick={() => setFormIcon(icon.id)}
                    title={icon.label}
                  >
                    <span className="icon-emoji">{icon.emoji}</span>
                    <span className="icon-label">{icon.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label>Duration</label>
              <div className="duration-options">
                {DURATION_PRESETS.map(preset => (
                  <button
                    key={preset.days}
                    type="button"
                    className={`duration-option ${formDuration === preset.days ? 'selected' : ''}`}
                    onClick={() => setFormDuration(preset.days)}
                  >
                    <span className="duration-emoji">{preset.emoji}</span>
                    <span className="duration-label">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label>Difficulty</label>
              <div className="difficulty-options">
                {DIFFICULTY_LEVELS.map(level => (
                  <button
                    key={level.id}
                    type="button"
                    className={`difficulty-option ${formDifficulty === level.id ? 'selected' : ''}`}
                    onClick={() => setFormDifficulty(level.id)}
                    style={{ '--difficulty-color': level.color }}
                  >
                    <span className="difficulty-emoji">{level.emoji}</span>
                    <span className="difficulty-name">{level.label}</span>
                    <span className="difficulty-desc">{level.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label>Theme Color</label>
              <div className="color-options">
                {['#60a5fa', '#4ade80', '#f87171', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#fb923c'].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${formColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="form-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formReminders}
                  onChange={e => setFormReminders(e.target.checked)}
                />
                Enable daily reminders
              </label>
              {formReminders && (
                <input
                  type="time"
                  value={formReminderTime}
                  onChange={e => setFormReminderTime(e.target.value)}
                  className="time-input"
                />
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setViewMode('list')}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Challenge
              </button>
            </div>
          </form>
        )}

        {viewMode === 'detail' && selectedChallenge && (
          <div className="challenge-detail">
            <div className="detail-header" style={{ '--challenge-color': selectedChallenge.color }}>
              <div className="detail-icon">{getIconEmoji(selectedChallenge.icon)}</div>
              <div className="detail-info">
                <h2>{selectedChallenge.title}</h2>
                <p>{selectedChallenge.description}</p>
                <div className="detail-meta">
                  <span className="meta-badge" style={{ backgroundColor: getDifficultyLabel(selectedChallenge.difficulty).color }}>
                    {getDifficultyLabel(selectedChallenge.difficulty).label}
                  </span>
                  <span className="meta-badge">{selectedChallenge.duration} days</span>
                  <span className="meta-badge">
                    Started {new Date(selectedChallenge.startDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Stats */}
            {(() => {
              const stats = getChallengeStats(selectedChallenge);
              return (
                <div className="detail-stats">
                  <div className="detail-stat">
                    <span className="stat-number">{stats.percentage}%</span>
                    <span className="stat-label">Complete</span>
                  </div>
                  <div className="detail-stat">
                    <span className="stat-number">{stats.completed}</span>
                    <span className="stat-label">Days Done</span>
                  </div>
                  <div className="detail-stat">
                    <span className="stat-number">{stats.currentStreak}</span>
                    <span className="stat-label">Current Streak</span>
                  </div>
                  <div className="detail-stat">
                    <span className="stat-number">{stats.longestStreak}</span>
                    <span className="stat-label">Best Streak</span>
                  </div>
                </div>
              );
            })()}

            {/* Calendar Grid */}
            <div className="calendar-section">
              <h4>Progress Calendar</h4>
              <div className="calendar-grid">
                {generateCalendarGrid(selectedChallenge).map((day, index) => (
                  <button
                    key={index}
                    className={`calendar-day ${day.isCompleted ? 'completed' : ''} ${day.isToday ? 'today' : ''} ${day.isPast && !day.isCompleted ? 'missed' : ''}`}
                    style={{ '--challenge-color': selectedChallenge.color }}
                    onClick={() => toggleDay(selectedChallenge.id, day.date)}
                    title={`Day ${day.dayNumber}: ${day.date.toLocaleDateString()}`}
                  >
                    <span className="day-number">{day.dayNumber}</span>
                    {day.isCompleted && <span className="day-check">✓</span>}
                    {day.isToday && <span className="day-indicator">Today</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-box completed"></span>
                <span>Completed</span>
              </div>
              <div className="legend-item">
                <span className="legend-box today"></span>
                <span>Today</span>
              </div>
              <div className="legend-item">
                <span className="legend-box missed"></span>
                <span>Missed</span>
              </div>
              <div className="legend-item">
                <span className="legend-box upcoming"></span>
                <span>Upcoming</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="detail-actions">
              {!selectedChallenge.archived ? (
                <>
                  <button 
                    className="btn-secondary"
                    onClick={() => archiveChallenge(selectedChallenge.id)}
                  >
                    📦 Archive
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => deleteChallenge(selectedChallenge.id)}
                  >
                    🗑️ Delete
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="btn-secondary"
                    onClick={() => restoreChallenge(selectedChallenge.id)}
                  >
                    📤 Restore
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => restartChallenge(selectedChallenge)}
                  >
                    🔄 Start Over
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
