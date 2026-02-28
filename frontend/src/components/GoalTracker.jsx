import React, { useState, useEffect } from 'react';
import './GoalTracker.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const CATEGORIES = [
  { id: 'personal', name: 'Personal', icon: '👤', color: '#3498db' },
  { id: 'career', name: 'Career', icon: '💼', color: '#9b59b6' },
  { id: 'health', name: 'Health', icon: '❤️', color: '#e74c3c' },
  { id: 'financial', name: 'Financial', icon: '💰', color: '#27ae60' },
  { id: 'learning', name: 'Learning', icon: '📚', color: '#f39c12' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#1abc9c' },
  { id: 'creative', name: 'Creative', icon: '🎨', color: '#e91e63' },
  { id: 'social', name: 'Social', icon: '👥', color: '#ff9800' }
];

const TIMEFRAMES = [
  { id: 'short', name: 'Short-term', days: 90 },
  { id: 'medium', name: 'Medium-term', days: 365 },
  { id: 'long', name: 'Long-term', days: 1825 }
];

const ICON_OPTIONS = ['🎯', '⭐', '🏆', '🚀', '💎', '🔥', '⚡', '🌟', '💪', '🎨', '📚', '✈️', '💰', '❤️', '💼', '🏃', '🌱', '🎵'];

export default function GoalTracker({ isOpen, onClose }) {
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'personal',
    timeframe: 'medium',
    targetDate: '',
    color: '#3498db',
    icon: '🎯',
    milestones: [{ name: '' }]
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [goalsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/goals`),
        fetch(`${API_URL}/goals/stats`)
      ]);
      
      setGoals((await goalsRes.json()).goals || []);
      setStats(await statsRes.json());
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validMilestones = formData.milestones.filter(m => m.name.trim());
    
    try {
      await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          milestones: validMilestones
        })
      });
      
      setFormData({
        name: '',
        description: '',
        category: 'personal',
        timeframe: 'medium',
        targetDate: '',
        color: '#3498db',
        icon: '🎯',
        milestones: [{ name: '' }]
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add goal:', err);
    }
  };

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, { name: '' }]
    });
  };

  const updateMilestone = (index, value) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index].name = value;
    setFormData({ ...formData, milestones: newMilestones });
  };

  const removeMilestone = (index) => {
    const newMilestones = formData.milestones.filter((_, i) => i !== index);
    setFormData({ ...formData, milestones: newMilestones });
  };

  const toggleMilestone = async (goalId, milestoneId) => {
    try {
      await fetch(`${API_URL}/goals/${goalId}/milestones/${milestoneId}/toggle`, {
        method: 'POST'
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle milestone:', err);
    }
  };

  const handleArchive = async (id) => {
    try {
      await fetch(`${API_URL}/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to archive:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    
    try {
      await fetch(`${API_URL}/goals/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getFilteredGoals = () => {
    if (filter === 'all') return goals;
    if (filter === 'active') return goals.filter(g => g.status === 'active');
    if (filter === 'completed') return goals.filter(g => g.status === 'completed');
    return goals.filter(g => g.category === filter);
  };

  const getCategoryInfo = (catId) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
  const getTimeframeInfo = (tfId) => TIMEFRAMES.find(t => t.id === tfId) || TIMEFRAMES[1];

  if (!isOpen) return null;

  return (
    <div className="goal-tracker-overlay" onClick={onClose}>
      <div className="goal-tracker-panel" onClick={e => e.stopPropagation()}>
        <div className="goal-tracker-header">
          <div className="header-title">
            <span className="header-icon">🏆</span>
            <h2>Goal Tracker</h2>
            {stats && (
              <span className="header-stats">
                {stats.active} active · {stats.avgProgress}% avg
              </span>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary small"
              onClick={() => setShowForm(true)}
            >
              ➕ New Goal
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="goal-stats">
            <div className="stat-card big">
              <span className="stat-label">Active Goals</span>
              <span className="stat-value">{stats.active}</span>
            </div>
            
            <div className="stat-card big">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{stats.completed}</span>
            </div>
            
            <div className="stat-card big">
              <span className="stat-label">Avg Progress</span>
              <span className="stat-value">{stats.avgProgress}%</span>
            </div>
            
            {stats.upcomingDeadlines > 0 && (
              <div className="stat-card alert">
                <span className="stat-label">Upcoming</span>
                <span className="stat-value">{stats.upcomingDeadlines} ⚠️</span>
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {[
            { id: 'active', name: 'Active', icon: '🎯' },
            { id: 'completed', name: 'Completed', icon: '✅' },
            { id: 'all', name: 'All', icon: '📋' }
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
        <div className="goal-content">
          {loading ? (
            <div className="loading-state">⏳ Loading...</div>
          ) : (
            <>
              {/* Add Form */}
              {showForm && (
                <div className="goal-form">
                  <h3>Create New Goal</h3>
                  
                  <form onSubmit={handleSubmit}>
                    <input
                      type="text"
                      placeholder="Goal name *"
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
                        value={formData.timeframe}
                        onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                      >
                        {TIMEFRAMES.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-row">
                      <select
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      >
                        {ICON_OPTIONS.map(i => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                      
                      <input
                        type="date"
                        placeholder="Target date"
                        value={formData.targetDate}
                        onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                      />
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
                    
                    <div className="milestones-section">
                      <h4>Milestones</h4>
                      {formData.milestones.map((m, idx) => (
                        <div key={idx} className="milestone-row">
                          <input
                            type="text"
                            placeholder={`Milestone ${idx + 1}`}
                            value={m.name}
                            onChange={(e) => updateMilestone(idx, e.target.value)}
                          />
                          {formData.milestones.length > 1 && (
                            <button
                              type="button"
                              className="remove-milestone"
                              onClick={() => removeMilestone(idx)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" className="add-milestone-btn" onClick={addMilestone}>
                        + Add Milestone
                      </button>
                    </div>
                    
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">Create Goal</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Goals List */}
              {getFilteredGoals().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏆</div>
                  <h3>No goals yet</h3>
                  <p>Set goals to track your progress!</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    Create First Goal
                  </button>
                </div>
              ) : (
                <div className="goals-list">
                  {getFilteredGoals().map(goal => {
                    const category = getCategoryInfo(goal.category);
                    const timeframe = getTimeframeInfo(goal.timeframe);
                    const isUrgent = goal.daysRemaining !== null && goal.daysRemaining <= 30 && goal.status === 'active';
                    
                    return (
                      <div 
                        key={goal.id}
                        className={`goal-card ${goal.status} ${isUrgent ? 'urgent' : ''}`}
                        style={{ '--goal-color': goal.color }}
                      >
                        <div className="goal-header">
                          <div className="goal-icon" style={{ background: goal.color }}>
                            {goal.icon}
                          </div>
                          
                          <div className="goal-title-section">
                            <h4>{goal.name}</h4>
                            <div className="goal-meta">
                              <span className="category-tag" style={{ color: category.color }}>
                                {category.icon} {category.name}
                              </span>
                              <span className="timeframe-tag">{timeframe.name}</span>
                              {goal.targetDate && (
                                <span className={`date-tag ${isUrgent ? 'urgent' : ''}`}>
                                  📅 {new Date(goal.targetDate).toLocaleDateString()}
                                  {goal.daysRemaining !== null && goal.daysRemaining > 0 && (
                                    <span className="days-left"> ({goal.daysRemaining}d left)</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="goal-progress-circle">
                            <svg viewBox="0 0 36 36">
                              <path
                                className="circle-bg"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="circle-progress"
                                strokeDasharray={`${goal.progress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                style={{ stroke: goal.color }}
                              />
                            </svg>
                            <span className="progress-text">{goal.progress}%</span>
                          </div>
                        </div>

                        {goal.description && (
                          <p className="goal-description">{goal.description}</p>
                        )}

                        {/* Milestones */}
                        {goal.milestones?.length > 0 && (
                          <div className="milestones-list">
                            <div className="milestones-header">
                              <span>Milestones ({goal.completedMilestones}/{goal.totalMilestones})</span>
                            </div>
                            {goal.milestones.map((milestone, idx) => (
                              <div 
                                key={milestone.id}
                                className={`milestone-item ${milestone.completed ? 'completed' : ''}`}
                                onClick={() => toggleMilestone(goal.id, milestone.id)}
                              >
                                <span className="milestone-check">{milestone.completed ? '✓' : '○'}</span>
                                <span className="milestone-name">{milestone.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="goal-footer">
                          <span className={`status-badge ${goal.status}`}>
                            {goal.status === 'active' ? '🎯 Active' : 
                             goal.status === 'completed' ? '✅ Completed' : '📦 Archived'}
                          </span>
                          
                          {goal.status !== 'archived' && (
                            <div className="goal-actions">
                              <button onClick={() => handleArchive(goal.id)} title="Archive">📦</button>
                              <button onClick={() => handleDelete(goal.id)} title="Delete">🗑️</button>
                            </div>
                          )}
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
