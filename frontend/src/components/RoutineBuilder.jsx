import React, { useState, useEffect } from 'react';
import './RoutineBuilder.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ROUTINE_TYPES = [
  { id: 'morning', name: 'Morning', icon: '🌅', color: '#f39c12' },
  { id: 'evening', name: 'Evening', icon: '🌙', color: '#9b59b6' },
  { id: 'workout', name: 'Workout', icon: '💪', color: '#e74c3c' },
  { id: 'work', name: 'Work', icon: '💼', color: '#3498db' },
  { id: 'selfcare', name: 'Self Care', icon: '🧘', color: '#1abc9c' },
  { id: 'custom', name: 'Custom', icon: '⚙️', color: '#95a5a6' }
];

const ICON_OPTIONS = ['🌅', '🌙', '💪', '💼', '🧘', '☀️', '🌊', '🔥', '⭐', '💎', '🎯', '🚀', '🎵', '📚', '✨', '🌱', '☕', '🧹'];

export default function RoutineBuilder({ isOpen, onClose }) {
  const [routines, setRoutines] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'morning',
    description: '',
    color: '#f39c12',
    icon: '🌅',
    steps: [{ name: '', duration: 5 }]
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [routinesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/routines`),
        fetch(`${API_URL}/routines/stats`)
      ]);
      
      setRoutines((await routinesRes.json()).routines || []);
      setStats(await statsRes.json());
    } catch (err) {
      console.error('Failed to fetch routines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validSteps = formData.steps.filter(s => s.name.trim());
    if (validSteps.length === 0) {
      alert('Add at least one step');
      return;
    }
    
    try {
      await fetch(`${API_URL}/routines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          steps: validSteps
        })
      });
      
      setFormData({
        name: '',
        type: 'morning',
        description: '',
        color: '#f39c12',
        icon: '🌅',
        steps: [{ name: '', duration: 5 }]
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add routine:', err);
    }
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { name: '', duration: 5 }]
    });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index][field] = field === 'duration' ? parseInt(value) || 0 : value;
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const toggleRoutineComplete = async (routine) => {
    try {
      await fetch(`${API_URL}/routines/${routine.id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: !routine.completedToday,
          progress: routine.completedToday ? 0 : 100
        })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle routine:', err);
    }
  };

  const handleArchive = async (id, archived) => {
    try {
      await fetch(`${API_URL}/routines/${id}`, {
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
    if (!confirm('Delete this routine?')) return;
    
    try {
      await fetch(`${API_URL}/routines/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getFilteredRoutines = () => {
    if (filter === 'all') return routines.filter(r => !r.archived);
    if (filter === 'archived') return routines.filter(r => r.archived);
    return routines.filter(r => r.type === filter && !r.archived);
  };

  const getTypeInfo = (typeId) => ROUTINE_TYPES.find(t => t.id === typeId) || ROUTINE_TYPES[5];

  const getTotalDuration = (steps) => steps.reduce((sum, s) => sum + (s.duration || 0), 0);

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  if (!isOpen) return null;

  return (
    <div className="routine-builder-overlay" onClick={onClose}>
      <div className="routine-builder-panel" onClick={e => e.stopPropagation()}>
        <div className="routine-builder-header">
          <div className="header-title">
            <span className="header-icon">⏰</span>
            <h2>Routine Builder</h2>
            {stats && (
              <span className="header-stats">
                {stats.todayRate}% today · {stats.active} routines
              </span>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary small"
              onClick={() => setShowForm(true)}
            >
              ➕ New Routine
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="routine-stats">
            <div className="stat-card today">
              <span className="stat-label">Today's Progress</span>
              <div className="stat-value-row">
                <span className="stat-value">{stats.todayCompleted}/{stats.active}</span>
                <span className="stat-percent">{stats.todayRate}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${stats.todayRate}%` }} />
              </div>
            </div>
            
            <div className="stat-card best">
              <span className="stat-label">Best Streak</span>
              <span className="stat-value">{stats.bestStreak} 🔥</span>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            📋 All
          </button>
          {ROUTINE_TYPES.slice(0, 5).map(t => (
            <button
              key={t.id}
              className={`filter-tab ${filter === t.id ? 'active' : ''}`}
              onClick={() => setFilter(t.id)}
            >
              {t.icon} {t.name}
            </button>
          ))}
          <button
            className={`filter-tab ${filter === 'archived' ? 'active' : ''}`}
            onClick={() => setFilter('archived')}
          >
            📦 Archived
          </button>
        </div>

        {/* Content */}
        <div className="routine-content">
          {loading ? (
            <div className="loading-state">⏳ Loading...</div>
          ) : (
            <>
              {/* Add Form */}
              {showForm && (
                <div className="routine-form">
                  <h3>Create New Routine</h3>
                  
                  <form onSubmit={handleSubmit}>
                    <input
                      type="text"
                      placeholder="Routine name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    
                    <div className="form-row">
                      <select
                        value={formData.type}
                        onChange={(e) => {
                          const type = getTypeInfo(e.target.value);
                          setFormData({ 
                            ...formData, 
                            type: e.target.value,
                            color: type.color,
                            icon: type.icon
                          });
                        }}
                      >
                        {ROUTINE_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                        ))}
                      </select>
                      
                      <select
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      >
                        {ICON_OPTIONS.map(i => (
                          <option key={i} value={i}>{i} Icon</option>
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
                    
                    <div className="steps-section">
                      <h4>Steps</h4>
                      {formData.steps.map((step, idx) => (
                        <div key={idx} className="step-row">
                          <input
                            type="text"
                            placeholder={`Step ${idx + 1}`}
                            value={step.name}
                            onChange={(e) => updateStep(idx, 'name', e.target.value)}
                            required
                          />
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={step.duration}
                            onChange={(e) => updateStep(idx, 'duration', e.target.value)}
                            title="Minutes"
                          />
                          <span className="step-min">m</span>
                          
                          {formData.steps.length > 1 && (
                            <button
                              type="button"
                              className="remove-step"
                              onClick={() => removeStep(idx)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <button type="button" className="add-step-btn" onClick={addStep}>
                        + Add Step
                      </button>
                    </div>
                    
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        Create Routine ({formatDuration(getTotalDuration(formData.steps))})
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Routines List */}
              {getFilteredRoutines().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⏰</div>
                  <h3>No routines yet</h3>
                  <p>Create routines to structure your day!</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    Create First Routine
                  </button>
                </div>
              ) : (
                <div className="routines-list">
                  {getFilteredRoutines().map(routine => {
                    const type = getTypeInfo(routine.type);
                    const totalMins = getTotalDuration(routine.steps);
                    
                    return (
                      <div 
                        key={routine.id}
                        className={`routine-card ${routine.completedToday ? 'completed' : ''}`}
                        style={{ '--routine-color': routine.color }}
                      >
                        <div className="routine-main">
                          <button
                            className={`complete-btn ${routine.completedToday ? 'checked' : ''}`}
                            onClick={() => toggleRoutineComplete(routine)}
                          >
                            {routine.completedToday ? '✓' : routine.icon}
                          </button>
                          
                          <div className="routine-info">
                            <div className="routine-header-row">
                              <h4>{routine.name}</h4>
                              <span className="duration-badge">
                                ⏱️ {formatDuration(totalMins)}
                              </span>
                            </div>
                            
                            <div className="routine-meta">
                              <span className="type-tag" style={{ color: type.color }}>
                                {type.icon} {type.name}
                              </span>
                              
                              {routine.streak > 0 && (
                                <span className="streak-badge">
                                  🔥 {routine.streak} day streak
                                </span>
                              )}
                              
                              <span className="weekly-rate">
                                📊 {routine.weeklyRate}% this week
                              </span>
                            </div>
                            
                            {routine.description && (
                              <p className="routine-desc">{routine.description}</p>
                            )}
                            
                            {/* Steps preview */}
                            <div className="steps-preview">
                              {routine.steps.map((step, idx) => (
                                <span key={step.id} className="step-tag">
                                  {idx + 1}. {step.name} ({step.duration}m)
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="routine-actions">
                          <button onClick={() => handleArchive(routine.id, true)} title="Archive">
                            📦
                          </button>
                          <button onClick={() => handleDelete(routine.id)} title="Delete">🗑️</button>
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
