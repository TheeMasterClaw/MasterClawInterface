import React, { useState, useEffect } from 'react';
import './GoalPlanner.css';

const CATEGORIES = {
  personal: { label: 'Personal', color: '#ec4899', icon: '🌟' },
  professional: { label: 'Professional', color: '#3b82f6', icon: '💼' },
  health: { label: 'Health', color: '#22c55e', icon: '💪' },
  learning: { label: 'Learning', color: '#a855f7', icon: '📚' },
  financial: { label: 'Financial', color: '#f59e0b', icon: '💰' },
  creative: { label: 'Creative', color: '#f97316', icon: '🎨' }
};

const TIMEFRAMES = {
  short: { label: 'Short-term', months: 3, description: '0-3 months' },
  medium: { label: 'Medium-term', months: 6, description: '3-6 months' },
  long: { label: 'Long-term', months: 12, description: '6-12 months' },
  epic: { label: 'Epic', months: 24, description: '1+ years' }
};

export default function GoalPlanner({ isOpen, onClose }) {
  const [goals, setGoals] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTimeframe, setFilterTimeframe] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // grid, timeline, category

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    timeframe: 'short',
    targetDate: '',
    milestones: [{ title: '', completed: false }],
    motivation: ''
  });

  // Load goals from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-goals');
      if (saved) {
        try {
          setGoals(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse goals:', e);
        }
      }
    }
  }, [isOpen]);

  // Save goals to localStorage
  const saveGoals = (newGoals) => {
    setGoals(newGoals);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-goals', JSON.stringify(newGoals));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newGoal = {
      id: editingGoal ? editingGoal.id : Date.now(),
      ...formData,
      createdAt: editingGoal ? editingGoal.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: editingGoal ? editingGoal.completed : false,
      completedAt: editingGoal ? editingGoal.completedAt : null
    };

    if (editingGoal) {
      saveGoals(goals.map(g => g.id === editingGoal.id ? newGoal : g));
      setEditingGoal(null);
    } else {
      saveGoals([...goals, newGoal]);
    }

    resetForm();
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'personal',
      timeframe: 'short',
      targetDate: '',
      milestones: [{ title: '', completed: false }],
      motivation: ''
    });
  };

  const deleteGoal = (id) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      saveGoals(goals.filter(g => g.id !== id));
    }
  };

  const toggleGoalComplete = (id) => {
    saveGoals(goals.map(g => {
      if (g.id === id) {
        return {
          ...g,
          completed: !g.completed,
          completedAt: !g.completed ? new Date().toISOString() : null
        };
      }
      return g;
    }));
  };

  const toggleMilestone = (goalId, milestoneIndex) => {
    saveGoals(goals.map(g => {
      if (g.id === goalId) {
        const newMilestones = [...g.milestones];
        newMilestones[milestoneIndex] = {
          ...newMilestones[milestoneIndex],
          completed: !newMilestones[milestoneIndex].completed
        };
        return { ...g, milestones: newMilestones };
      }
      return g;
    }));
  };

  const addMilestoneField = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, { title: '', completed: false }]
    });
  };

  const removeMilestoneField = (index) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index)
    });
  };

  const updateMilestone = (index, value) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index] = { ...newMilestones[index], title: value };
    setFormData({ ...formData, milestones: newMilestones });
  };

  const startEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      timeframe: goal.timeframe,
      targetDate: goal.targetDate || '',
      milestones: goal.milestones.length > 0 ? goal.milestones : [{ title: '', completed: false }],
      motivation: goal.motivation || ''
    });
    setShowAddForm(true);
  };

  const getProgress = (goal) => {
    if (goal.milestones.length === 0) return goal.completed ? 100 : 0;
    const completed = goal.milestones.filter(m => m.completed).length;
    return Math.round((completed / goal.milestones.length) * 100);
  };

  const getTimeRemaining = (targetDate) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const now = new Date();
    const diff = target - now;
    
    if (diff < 0) return { text: 'Overdue', urgent: true };
    
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 7) return { text: `${days}d left`, urgent: true };
    if (days < 30) return { text: `${Math.ceil(days / 7)}w left`, urgent: false };
    return { text: `${Math.ceil(days / 30)}mo left`, urgent: false };
  };

  const filteredGoals = goals.filter(g => {
    if (filterCategory !== 'all' && g.category !== filterCategory) return false;
    if (filterTimeframe !== 'all' && g.timeframe !== filterTimeframe) return false;
    return true;
  });

  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.completed).length,
    inProgress: goals.filter(g => !g.completed).length,
    byCategory: Object.keys(CATEGORIES).map(cat => ({
      category: cat,
      count: goals.filter(g => g.category === cat).length,
      completed: goals.filter(g => g.category === cat && g.completed).length
    }))
  };

  if (!isOpen) return null;

  return (
    <div className="goal-panel-overlay" onClick={onClose}>
      <div className="goal-panel" onClick={e => e.stopPropagation()}>
        <div className="goal-panel-header">
          <h3>🎯 Goal Planner</h3>
          <div className="header-actions">
            <button 
              className="add-goal-btn"
              onClick={() => {
                setEditingGoal(null);
                resetForm();
                setShowAddForm(true);
              }}
            >
              + New Goal
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showAddForm ? (
          <div className="goal-form-container">
            <h4>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h4>
            <form onSubmit={handleSubmit} className="goal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Goal Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="What do you want to achieve?"
                    required
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Timeframe</label>
                  <select
                    value={formData.timeframe}
                    onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                  >
                    {Object.entries(TIMEFRAMES).map(([key, tf]) => (
                      <option key={key} value={key}>{tf.label} ({tf.description})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Date (optional)</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your goal in detail..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Why is this important? (Motivation)</label>
                  <textarea
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    placeholder="What drives you to achieve this?"
                    rows={2}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group milestones-group">
                  <label>Milestones</label>
                  {formData.milestones.map((milestone, index) => (
                    <div key={index} className="milestone-input-row">
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, e.target.value)}
                        placeholder={`Milestone ${index + 1}`}
                      />
                      {formData.milestones.length > 1 && (
                        <button
                          type="button"
                          className="remove-milestone-btn"
                          onClick={() => removeMilestoneField(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-milestone-btn"
                    onClick={addMilestoneField}
                  >
                    + Add Milestone
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowAddForm(false);
                  setEditingGoal(null);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="goals-stats">
              <div className="stat-card">
                <span className="stat-number">{stats.total}</span>
                <span className="stat-label">Total Goals</span>
              </div>
              <div className="stat-card completed">
                <span className="stat-number">{stats.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-card progress">
                <span className="stat-number">{stats.inProgress}</span>
                <span className="stat-label">In Progress</span>
              </div>
              <div className="stat-card rate">
                <span className="stat-number">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </span>
                <span className="stat-label">Success Rate</span>
              </div>
            </div>

            {/* Filters */}
            <div className="goals-filters">
              <div className="filter-group">
                <label>Category:</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Timeframe:</label>
                <select value={filterTimeframe} onChange={(e) => setFilterTimeframe(e.target.value)}>
                  <option value="all">All Timeframes</option>
                  {Object.entries(TIMEFRAMES).map(([key, tf]) => (
                    <option key={key} value={key}>{tf.label}</option>
                  ))}
                </select>
              </div>
              <div className="view-toggle">
                <button 
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  ⊞ Grid
                </button>
                <button 
                  className={viewMode === 'category' ? 'active' : ''}
                  onClick={() => setViewMode('category')}
                >
                  ☰ Categories
                </button>
              </div>
            </div>

            {/* Goals List */}
            {filteredGoals.length === 0 ? (
              <div className="empty-goals">
                <div className="empty-icon">🎯</div>
                <h4>No goals yet</h4>
                <p>Create your first goal to start your journey to world domination!</p>
              </div>
            ) : (
              <div className={`goals-list ${viewMode}`}>
                {filteredGoals.map(goal => {
                  const progress = getProgress(goal);
                  const category = CATEGORIES[goal.category];
                  const timeRemaining = getTimeRemaining(goal.targetDate);
                  
                  return (
                    <div 
                      key={goal.id} 
                      className={`goal-card ${goal.completed ? 'completed' : ''}`}
                      style={{ '--category-color': category.color }}
                    >
                      <div className="goal-card-header">
                        <span className="goal-category-badge" style={{ background: category.color }}>
                          {category.icon} {category.label}
                        </span>
                        {timeRemaining && (
                          <span className={`goal-time-remaining ${timeRemaining.urgent ? 'urgent' : ''}`}>
                            {timeRemaining.text}
                          </span>
                        )}
                      </div>

                      <div className="goal-card-content">
                        <h4 className="goal-title">{goal.title}</h4>
                        {goal.description && (
                          <p className="goal-description">{goal.description}</p>
                        )}
                        
                        <div className="goal-progress-section">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="progress-text">{progress}%</span>
                        </div>

                        {goal.milestones.length > 0 && (
                          <div className="goal-milestones">
                            {goal.milestones.map((milestone, idx) => (
                              <label key={idx} className={`milestone-item ${milestone.completed ? 'completed' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={milestone.completed}
                                  onChange={() => toggleMilestone(goal.id, idx)}
                                />
                                <span>{milestone.title || `Milestone ${idx + 1}`}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {goal.motivation && (
                          <div className="goal-motivation">
                            <span className="motivation-icon">💪</span>
                            <span>{goal.motivation}</span>
                          </div>
                        )}
                      </div>

                      <div className="goal-card-footer">
                        <span className="goal-timeframe">{TIMEFRAMES[goal.timeframe]?.label}</span>
                        <div className="goal-actions">
                          <button
                            className={`complete-btn ${goal.completed ? 'completed' : ''}`}
                            onClick={() => toggleGoalComplete(goal.id)}
                            title={goal.completed ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            {goal.completed ? '↩️' : '✓'}
                          </button>
                          <button
                            className="edit-btn"
                            onClick={() => startEdit(goal)}
                            title="Edit goal"
                          >
                            ✏️
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => deleteGoal(goal.id)}
                            title="Delete goal"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Category Summary */}
            {goals.length > 0 && (
              <div className="category-summary">
                <h4>Progress by Category</h4>
                <div className="category-bars">
                  {stats.byCategory.map(({ category, count, completed }) => {
                    if (count === 0) return null;
                    const cat = CATEGORIES[category];
                    const pct = Math.round((completed / count) * 100);
                    return (
                      <div key={category} className="category-bar-item">
                        <div className="category-bar-header">
                          <span>{cat.icon} {cat.label}</span>
                          <span>{completed}/{count}</span>
                        </div>
                        <div className="category-bar">
                          <div 
                            className="category-bar-fill"
                            style={{ width: `${pct}%`, background: cat.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
