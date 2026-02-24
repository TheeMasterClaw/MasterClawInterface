import React, { useState, useEffect } from 'react';
import './HabitTracker.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const CATEGORIES = [
  { id: 'health', name: 'Health', icon: '❤️', color: '#e74c3c' },
  { id: 'fitness', name: 'Fitness', icon: '💪', color: '#2ecc71' },
  { id: 'productivity', name: 'Productivity', icon: '⚡', color: '#f39c12' },
  { id: 'learning', name: 'Learning', icon: '📚', color: '#9b59b6' },
  { id: 'mindfulness', name: 'Mindfulness', icon: '🧘', color: '#1abc9c' },
  { id: 'social', name: 'Social', icon: '👥', color: '#3498db' },
  { id: 'finance', name: 'Finance', icon: '💰', color: '#27ae60' },
  { id: 'creative', name: 'Creative', icon: '🎨', color: '#e91e63' },
  { id: 'general', name: 'General', icon: '✓', color: '#95a5a6' }
];

const ICON_OPTIONS = ['✓', '✅', '⭐', '🔥', '💧', '🏃', '📖', '💪', '🧘', '🎵', '💊', '🥗', '😴', '💰', '🎨', '💻', '🌱', '☀️'];

export default function HabitTracker({ isOpen, onClose }) {
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    description: '',
    color: '#3498db',
    icon: '✓'
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [habitsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/habits`),
        fetch(`${API_URL}/habits/stats`)
      ]);
      
      setHabits((await habitsRes.json()).habits || []);
      setStats(await statsRes.json());
    } catch (err) {
      console.error('Failed to fetch habits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetch(`${API_URL}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setFormData({
        name: '',
        category: 'general',
        description: '',
        color: '#3498db',
        icon: '✓'
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add habit:', err);
    }
  };

  const toggleHabit = async (id, completed) => {
    try {
      await fetch(`${API_URL}/habits/${id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    }
  };

  const handleArchive = async (id, archived) => {
    try {
      await fetch(`${API_URL}/habits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to archive:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this habit?')) return;
    
    try {
      await fetch(`${API_URL}/habits/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getFilteredHabits = () => {
    if (filter === 'all') return habits;
    if (filter === 'active') return habits.filter(h => !h.archived);
    if (filter === 'archived') return habits.filter(h => h.archived);
    return habits.filter(h => h.category === filter && !h.archived);
  };

  const getCategoryInfo = (catId) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[8];

  const getWeekdayLabel = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toLocaleDateString('en-US', { weekday: 'narrow' });
  };

  if (!isOpen) return null;

  return (
    <div className="habit-tracker-overlay" onClick={onClose}>
      <div className="habit-tracker-panel" onClick={e => e.stopPropagation()}>
        <div className="habit-tracker-header">
          <div className="header-title">
            <span className="header-icon">🔥</span>
            <h2>Habit Tracker</h2>
            {stats && (
              <span className="header-stats">
                {stats.todayRate}% today · {stats.bestStreak}🔥 best
              </span>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary small"
              onClick={() => setShowForm(true)}
            >
              ➕ Add Habit
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="habit-stats">
            <div className="stat-card completion">
              <span className="stat-label">Today's Progress</span>
              <div className="stat-value-row">
                <span className="stat-value">{stats.todayCompleted}/{stats.active}</span>
                <span className="stat-percent">{stats.todayRate}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${stats.todayRate}%` }}
                />
              </div>
            </div>
            
            <div className="stat-card total">
              <span className="stat-label">Total Completions</span>
              <span className="stat-value">{stats.totalCompletions.toLocaleString()}</span>
            </div>
            
            <div className="stat-card streak">
              <span className="stat-label">Best Streak</span>
              <span className="stat-value">{stats.bestStreak} 🔥</span>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {[
            { id: 'active', name: 'Active', icon: '✓' },
            { id: 'all', name: 'All', icon: '📋' },
            { id: 'archived', name: 'Archived', icon: '📦' }
          ].map(f => (
            <button
              key={f.id}
              className={`filter-tab ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.icon} {f.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="habit-content">
          {loading ? (
            <div className="loading-state">⏳ Loading...</div>
          ) : (
            <>
              {/* Add Form */}
              {showForm && (
                <div className="habit-form">
                  <h3>Add New Habit</h3>
                  
                  <form onSubmit={handleSubmit}>
                    <input
                      type="text"
                      placeholder="Habit name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    
                    <div className="form-row">
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          const cat = getCategoryInfo(e.target.value);
                          setFormData({ 
                            ...formData, 
                            category: e.target.value,
                            color: cat.color
                          });
                        }}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                      
                      <select
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      >
                        {ICON_OPTIONS.map(i => (
                          <option key={i} value={i}>{i} {i}</option>
                        ))}
                      </select>
                    </div>
                    
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      title="Choose color"
                    />
                    
                    <textarea
                      placeholder="Description (optional)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                    
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">Create Habit</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Habits List */}
              {getFilteredHabits().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔥</div>
                  <h3>No habits yet</h3>
                  <p>Build better habits, one day at a time!</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    Create First Habit
                  </button>
                </div>
              ) : (
                <div className="habits-list">
                  {getFilteredHabits().map(habit => {
                    const category = getCategoryInfo(habit.category);
                    
                    return (
                      <div 
                        key={habit.id} 
                        className={`habit-card ${habit.completedToday ? 'completed' : ''} ${habit.archived ? 'archived' : ''}`}
                        style={{ '--habit-color': habit.color }}
                      >
                        <div className="habit-left">
                          <button
                            className={`check-btn ${habit.completedToday ? 'checked' : ''}`}
                            onClick={() => toggleHabit(habit.id, habit.completedToday)}
                            disabled={habit.archived}
                          >
                            {habit.completedToday ? '✓' : habit.icon}
                          </button>
                          
                          <div className="habit-info">
                            <h4>{habit.name}</h4>
                            <div className="habit-meta">
                              <span className="category-tag" style={{ color: category.color }}>
                                {category.icon} {category.name}
                              </span>
                              {habit.streak > 0 && (
                                <span className="streak-tag">
                                  🔥 {habit.streak} day{habit.streak !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {habit.description && (
                              <p className="habit-desc">{habit.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="habit-right">
                          {/* 7-day heatmap */}
                          <div className="heatmap">
                            {habit.last7Days.map((day, idx) => (
                              <div
                                key={idx}
                                className={`heatmap-day ${day.completed ? 'completed' : ''}`}
                                title={`${day.date}: ${day.completed ? 'Done' : 'Not done'}`}
                              >
                                <span className="day-label">{getWeekdayLabel(6 - idx)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="habit-actions">
                            {!habit.archived ? (
                              <button 
                                onClick={() => handleArchive(habit.id, true)}
                                title="Archive"
                              >
                                📦
                              </button>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleArchive(habit.id, false)}
                                  title="Restore"
                                >
                                  ↩️
                                </button>
                                <button onClick={() => handleDelete(habit.id)} title="Delete">🗑️</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
