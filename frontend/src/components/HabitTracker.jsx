'use client';

import React, { useState, useEffect, useMemo } from 'react';
// import './HabitTracker.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRESET_HABITS = [
  { icon: '💧', name: 'Drink 8 glasses of water', color: '#3b82f6' },
  { icon: '🏃', name: 'Exercise 30 minutes', color: '#ef4444' },
  { icon: '📖', name: 'Read for 20 minutes', color: '#8b5cf6' },
  { icon: '🧘', name: 'Meditate', color: '#10b981' },
  { icon: '💊', name: 'Take vitamins', color: '#f59e0b' },
  { icon: '🌱', name: 'Eat healthy', color: '#22c55e' },
  { icon: '✍️', name: 'Journal', color: '#ec4899' },
  { icon: '😴', name: 'Sleep 8 hours', color: '#6366f1' },
];

export default function HabitTracker({ isOpen, onClose }) {
  const [habits, setHabits] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    icon: '⭐',
    color: '#6366f1',
    targetPerDay: 1,
    unit: 'times'
  });

  // Load habits from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-habits');
      if (saved) {
        try {
          setHabits(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse habits:', e);
        }
      } else {
        // Set default habits
        const defaults = [
          {
            id: '1',
            name: 'Drink water',
            icon: '💧',
            color: '#3b82f6',
            targetPerDay: 8,
            unit: 'glasses',
            createdAt: new Date().toISOString(),
            completions: {}
          },
          {
            id: '2',
            name: 'Exercise',
            icon: '🏃',
            color: '#ef4444',
            targetPerDay: 1,
            unit: 'session',
            createdAt: new Date().toISOString(),
            completions: {}
          }
        ];
        setHabits(defaults);
        localStorage.setItem('mc-habits', JSON.stringify(defaults));
      }
    }
  }, [isOpen]);

  // Save habits to localStorage
  const saveHabits = (updatedHabits) => {
    setHabits(updatedHabits);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-habits', JSON.stringify(updatedHabits));
    }
  };

  // Get date key for storage
  const getDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Toggle habit completion for a date
  const toggleHabit = (habitId, date = new Date()) => {
    const dateKey = getDateKey(date);
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      
      const completions = { ...h.completions };
      const currentCount = completions[dateKey] || 0;
      
      // Cycle through: 0 -> 1 -> ... -> target -> 0
      const newCount = currentCount >= h.targetPerDay ? 0 : currentCount + 1;
      
      if (newCount === 0) {
        delete completions[dateKey];
      } else {
        completions[dateKey] = newCount;
      }
      
      return { ...h, completions };
    });
    
    saveHabits(updated);
  };

  // Set specific count for a habit
  const setHabitCount = (habitId, date, count) => {
    const dateKey = getDateKey(date);
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      
      const completions = { ...h.completions };
      if (count <= 0) {
        delete completions[dateKey];
      } else {
        completions[dateKey] = count;
      }
      
      return { ...h, completions };
    });
    
    saveHabits(updated);
  };

  // Add new habit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    if (editingHabit) {
      const updated = habits.map(h =>
        h.id === editingHabit.id
          ? { ...h, ...formData, updatedAt: new Date().toISOString() }
          : h
      );
      saveHabits(updated);
      setEditingHabit(null);
    } else {
      const newHabit = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        completions: {}
      };
      saveHabits([...habits, newHabit]);
    }
    
    setFormData({ name: '', icon: '⭐', color: '#6366f1', targetPerDay: 1, unit: 'times' });
    setShowAddForm(false);
  };

  // Delete habit
  const deleteHabit = (id) => {
    if (confirm('Delete this habit? All history will be lost.')) {
      const updated = habits.filter(h => h.id !== id);
      saveHabits(updated);
      if (editingHabit?.id === id) {
        setEditingHabit(null);
        setShowAddForm(false);
      }
    }
  };

  // Edit habit
  const editHabit = (habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      targetPerDay: habit.targetPerDay || 1,
      unit: habit.unit || 'times'
    });
    setShowAddForm(true);
  };

  // Calculate streak for a habit
  const calculateStreak = (habit) => {
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);
    
    // Check backwards from today
    while (true) {
      const dateKey = getDateKey(checkDate);
      const count = habit.completions[dateKey] || 0;
      
      if (count >= habit.targetPerDay) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (getDateKey(checkDate) === getDateKey(today)) {
        // Today doesn't count against streak if not done yet
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Calculate completion rate for last 7 days
  const getWeeklyProgress = (habit) => {
    const today = new Date();
    let completed = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = getDateKey(date);
      const count = habit.completions[dateKey] || 0;
      if (count >= habit.targetPerDay) completed++;
    }
    
    return completed;
  };

  // Get week days for display
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Get days for month view
  const getMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Check if date is today
  const isToday = (date) => {
    return getDateKey(date) === getDateKey(new Date());
  };

  // Get completion status for a habit on a date
  const getCompletionStatus = (habit, date) => {
    const dateKey = getDateKey(date);
    const count = habit.completions[dateKey] || 0;
    if (count === 0) return 'none';
    if (count >= habit.targetPerDay) return 'complete';
    return 'partial';
  };

  // Get total completions today
  const getTodayTotal = () => {
    const today = getDateKey(new Date());
    return habits.reduce((acc, h) => acc + (h.completions[today] || 0), 0);
  };

  // Get completion percentage for today
  const getTodayProgress = () => {
    if (habits.length === 0) return 0;
    const totalTarget = habits.reduce((acc, h) => acc + h.targetPerDay, 0);
    const totalCompleted = getTodayTotal();
    return Math.min(100, Math.round((totalCompleted / totalTarget) * 100));
  };

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();
  const todayProgress = getTodayProgress();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  if (!isOpen) return null;

  return (
    <div className="habit-panel-overlay" onClick={onClose}>
      <div className="habit-panel" onClick={e => e.stopPropagation()}>
        <div className="habit-panel-header">
          <h3>🎯 Habit Tracker</h3>
          <div className="header-actions">
            <button 
              className="add-habit-btn"
              onClick={() => {
                setEditingHabit(null);
                setFormData({ name: '', icon: '⭐', color: '#6366f1', targetPerDay: 1, unit: 'times' });
                setShowAddForm(true);
              }}
            >
              + Add Habit
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="today-progress-section">
          <div className="progress-header">
            <span className="progress-title">Today's Progress</span>
            <span className="progress-percent">{todayProgress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${todayProgress}%` }}
            />
          </div>
          <div className="progress-stats">
            <span>{getTodayTotal()} completed</span>
            <span>{habits.reduce((acc, h) => acc + h.targetPerDay, 0)} target</span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="view-toggle">
          <button 
            className={viewMode === 'week' ? 'active' : ''}
            onClick={() => setViewMode('week')}
          >
            Week View
          </button>
          <button 
            className={viewMode === 'month' ? 'active' : ''}
            onClick={() => setViewMode('month')}
          >
            Month View
          </button>
        </div>

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="week-view">
            <div className="week-header">
              {weekDays.map((date, i) => (
                <div 
                  key={i} 
                  className={`week-day-header ${isToday(date) ? 'today' : ''}`}
                >
                  <span className="day-name">{WEEKDAYS[i]}</span>
                  <span className="day-number">{date.getDate()}</span>
                </div>
              ))}
            </div>
            
            <div className="habits-list">
              {habits.length === 0 ? (
                <div className="empty-habits">
                  <span className="empty-icon">🎯</span>
                  <p>No habits yet</p>
                  <button onClick={() => setShowAddForm(true)}>Create your first habit</button>
                </div>
              ) : (
                habits.map(habit => {
                  const streak = calculateStreak(habit);
                  const weeklyCompleted = getWeeklyProgress(habit);
                  
                  return (
                    <div key={habit.id} className="habit-row">
                      <div className="habit-info">
                        <span 
                          className="habit-icon"
                          style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                        >
                          {habit.icon}
                        </span>
                        <div className="habit-details">
                          <span className="habit-name">{habit.name}</span>
                          <div className="habit-meta">
                            <span className="streak">🔥 {streak} day streak</span>
                            <span className="weekly">{weeklyCompleted}/7 this week</span>
                          </div>
                        </div>
                        <button 
                          className="edit-habit-btn"
                          onClick={() => editHabit(habit)}
                        >
                          ✏️
                        </button>
                      </div>
                      
                      <div className="habit-week-checks">
                        {weekDays.map((date, i) => {
                          const status = getCompletionStatus(habit, date);
                          const count = habit.completions[getDateKey(date)] || 0;
                          
                          return (
                            <button
                              key={i}
                              className={`day-check ${status} ${isToday(date) ? 'today' : ''}`}
                              onClick={() => toggleHabit(habit.id, date)}
                              title={`${count}/${habit.targetPerDay} ${habit.unit}`}
                            >
                              {status === 'complete' && '✓'}
                              {status === 'partial' && count}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Month View */}
        {viewMode === 'month' && (
          <div className="month-view">
            <div className="month-nav">
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
            
            <div className="month-grid">
              {WEEKDAYS.map(day => (
                <div key={day} className="month-day-label">{day}</div>
              ))}
              {monthDays.map((date, i) => (
                <div 
                  key={i} 
                  className={`month-day ${!date ? 'empty' : ''} ${date && isToday(date) ? 'today' : ''}`}
                >
                  {date && (
                    <>
                      <span className="day-number">{date.getDate()}</span>
                      <div className="day-habits">
                        {habits.map(habit => {
                          const status = getCompletionStatus(habit, date);
                          if (status === 'none') return null;
                          return (
                            <span 
                              key={habit.id}
                              className={`day-habit-dot ${status}`}
                              style={{ backgroundColor: habit.color }}
                              title={`${habit.name}: ${habit.completions[getDateKey(date)]}/${habit.targetPerDay}`}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            <div className="month-legend">
              {habits.map(habit => (
                <div key={habit.id} className="legend-item">
                  <span 
                    className="legend-dot"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className="legend-name">{habit.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="habit-form-overlay" onClick={() => setShowAddForm(false)}>
            <form className="habit-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <h4>{editingHabit ? '✏️ Edit Habit' : '➕ New Habit'}</h4>
              
              <div className="form-group">
                <label>Habit Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Drink water"
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Icon</label>
                  <div className="icon-picker">
                    {PRESET_HABITS.map(preset => (
                      <button
                        key={preset.icon}
                        type="button"
                        className={`icon-option ${formData.icon === preset.icon ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, icon: preset.icon, color: preset.color })}
                        style={{ 
                          backgroundColor: formData.icon === preset.icon ? `${preset.color}30` : 'transparent',
                          borderColor: formData.icon === preset.icon ? preset.color : undefined
                        }}
                      >
                        {preset.icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Color</label>
                  <div className="color-picker">
                    {['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'].map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option ${formData.color === color ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, color })}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Target per Day</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.targetPerDay}
                    onChange={e => setFormData({ ...formData, targetPerDay: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="times, glasses, minutes..."
                  />
                </div>
              </div>
              
              <div className="form-actions">
                {editingHabit && (
                  <button 
                    type="button" 
                    className="btn-delete"
                    onClick={() => deleteHabit(editingHabit.id)}
                  >
                    🗑️ Delete
                  </button>
                )}
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingHabit ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
