import React, { useState, useEffect } from 'react';
import './LearningTracker.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const LEARNING_TYPES = [
  { id: 'course', name: 'Course', icon: '🎓', color: '#667eea' },
  { id: 'book', name: 'Book', icon: '📚', color: '#f093fb' },
  { id: 'video', name: 'Video', icon: '🎬', color: '#ff6b6b' },
  { id: 'article', name: 'Article', icon: '📄', color: '#48dbfb' },
  { id: 'tutorial', name: 'Tutorial', icon: '💻', color: '#1dd1a1' },
  { id: 'podcast', name: 'Podcast', icon: '🎧', color: '#feca57' },
  { id: 'other', name: 'Other', icon: '📌', color: '#8892b0' }
];

const PRIORITIES = [
  { id: 'high', name: 'High', color: '#ff6b6b' },
  { id: 'medium', name: 'Medium', color: '#feca57' },
  { id: 'low', name: 'Low', color: '#48dbfb' }
];

const STATUS_OPTIONS = [
  { id: 'queued', name: 'Queued', icon: '📋' },
  { id: 'in-progress', name: 'In Progress', icon: '▶️' },
  { id: 'completed', name: 'Completed', icon: '✅' },
  { id: 'paused', name: 'Paused', icon: '⏸️' }
];

export default function LearningTracker({ isOpen, onClose }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'course',
    topic: '',
    provider: '',
    url: '',
    description: '',
    estimatedHours: '',
    priority: 'medium',
    deadline: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/learning`),
        fetch(`${API_URL}/learning/stats`)
      ]);
      
      setItems((await itemsRes.json()).items || []);
      setStats(await statsRes.json());
    } catch (err) {
      console.error('Failed to fetch learning data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/learning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setFormData({
          title: '',
          type: 'course',
          topic: '',
          provider: '',
          url: '',
          description: '',
          estimatedHours: '',
          priority: 'medium',
          deadline: ''
        });
        setShowForm(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to add learning item:', err);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await fetch(`${API_URL}/learning/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this learning item?')) return;
    
    try {
      await fetch(`${API_URL}/learning/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const getTypeInfo = (typeId) => LEARNING_TYPES.find(t => t.id === typeId) || LEARNING_TYPES[6];
  const getPriorityColor = (priority) => PRIORITIES.find(p => p.id === priority)?.color || '#8892b0';

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(i => i.status === filter);

  const inProgressItem = items.find(i => i.status === 'in-progress');

  if (!isOpen) return null;

  return (
    <div className="learning-tracker-overlay" onClick={onClose}>
      <div className="learning-tracker-panel" onClick={e => e.stopPropagation()}>
        <div className="learning-tracker-header">
          <div className="header-title">
            <span className="header-icon">🎓</span>
            <h2>Learning Tracker</h2>
            {stats && (
              <span className="header-stats">
                {stats.completed}/{stats.total} completed · {stats.totalHours}h learned
              </span>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary small"
              onClick={() => setShowForm(true)}
            >
              ➕ Add Item
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.inProgress}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.completionRate}%</span>
              <span className="stat-label">Completion</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.totalHours}h</span>
              <span className="stat-label">Hours</span>
            </div>
          </div>
        )}

        {/* Currently Learning */}
        {inProgressItem && (
          <div className="current-learning">
            <div className="current-header">
              <span className="current-label">🎯 Currently Learning</span>
            </div>
            <div className="current-card">
              <div className="current-info">
                <span className="current-type">{getTypeInfo(inProgressItem.type).icon} {inProgressItem.type}</span>
                <h4>{inProgressItem.title}</h4>
                {inProgressItem.provider && <span className="current-provider">{inProgressItem.provider}</span>}
              </div>              
              <div className="current-progress">
                <div className="progress-ring">
                  <svg viewBox="0 0 60 60">
                    <circle className="ring-bg" cx="30" cy="30" r="26" />
                    <circle 
                      className="ring-progress"
                      cx="30" 
                      cy="30" 
                      r="26"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 26}`,
                        strokeDashoffset: `${2 * Math.PI * 26 * (1 - inProgressItem.progress / 100)}`
                      }}
                    />
                  </svg>
                  <span className="progress-text">{inProgressItem.progress}%</span>
                </div>
                <button 
                  className="btn-update"
                  onClick={() => setEditingItem(inProgressItem)}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {[
            { id: 'all', name: 'All', icon: '📚' },
            { id: 'in-progress', name: 'In Progress', icon: '▶️' },
            { id: 'queued', name: 'Queued', icon: '📋' },
            { id: 'completed', name: 'Completed', icon: '✅' }
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
        <div className="learning-content">
          {loading ? (
            <div className="loading-state">⏳ Loading...</div>
          ) : (
            <>
              {/* Add/Edit Form */}
              {showForm && (
                <div className="learning-form">
                  <h3>{editingItem ? 'Edit Learning Item' : 'Add New Learning Item'}</h3>
                  
                  <form onSubmit={handleSubmit}>
                    <input
                      type="text"
                      placeholder="Title *"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                    
                    <div className="form-row">
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        {LEARNING_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                        ))}
                      </select>
                      
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        {PRIORITIES.map(p => (
                          <option key={p.id} value={p.id}>{p.name} Priority</option>
                        ))}
                      </select>
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Topic (e.g., JavaScript, Design, Business)"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    />
                    
                    <input
                      type="text"
                      placeholder="Provider (e.g., Coursera, Udemy, Book Author)"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    />
                    
                    <input
                      type="url"
                      placeholder="URL (optional)"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                    
                    <div className="form-row">
                      <input
                        type="number"
                        placeholder="Estimated hours"
                        value={formData.estimatedHours}
                        onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                      />
                      
                      <input
                        type="date"
                        placeholder="Deadline (optional)"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      />
                    </div>
                    
                    <textarea
                      placeholder="Description / Notes"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                    
                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => { setShowForm(false); setEditingItem(null); }}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">
                        {editingItem ? 'Update' : 'Add'} Item
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Update Progress Modal */}
              {editingItem && !showForm && (
                <UpdateProgressModal
                  item={editingItem}
                  onClose={() => setEditingItem(null)}
                  onUpdate={handleUpdate}
                />
              )}

              {/* Items List */}
              {filteredItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎓</div>
                  <h3>No learning items yet</h3>
                  <p>Start tracking your learning journey!</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    Add Your First Item
                  </button>
                </div>
              ) : (
                <div className="learning-list">
                  {filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      className={`learning-card ${item.status}`}
                      style={{ '--priority-color': getPriorityColor(item.priority) }}
                    >
                      <div className="card-priority" />
                      
                      <div className="card-content">
                        <div className="card-header">
                          <div className="card-type">
                            <span className="type-icon">{getTypeInfo(item.type).icon}</span>
                            <span className="type-name">{item.type}</span>
                          </div>
                          
                          <div className="card-actions">
                            {item.status !== 'completed' && (
                              <>
                                {item.status !== 'in-progress' && (
                                  <button 
                                    onClick={() => handleUpdate(item.id, { status: 'in-progress' })}
                                    title="Start learning"
                                  >
                                    ▶️
                                  </button>
                                )}
                                <button 
                                  onClick={() => setEditingItem(item)}
                                  title="Update progress"
                                >
                                  📝
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleDelete(item.id)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <h4 className="card-title">
                          {item.url ? (
                            <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
                          ) : item.title}
                        </h4>

                        {(item.provider || item.topic) && (
                          <div className="card-meta">
                            {item.provider && <span>🏢 {item.provider}</span>}
                            {item.topic && <span>📂 {item.topic}</span>}
                          </div>
                        )}

                        {item.description && (
                          <p className="card-description">{item.description}</p>
                        )}

                        <div className="card-stats">
                          <div className="stat">
                            <span className="stat-label">Progress</span>
                            <div className="mini-progress">
                              <div 
                                className="mini-fill"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="stat-value">{item.progress}%</span>
                          </div>
                          
                          <div className="stat">
                            <span className="stat-label">Hours</span>
                            <span className="stat-value">
                              {item.hoursSpent}/{item.estimatedHours || '?'}
                            </span>
                          </div>
                          
                          {item.deadline && (
                            <div className="stat">
                              <span className="stat-label">Deadline</span>
                              <span className={`stat-value ${new Date(item.deadline) < new Date() ? 'overdue' : ''}`}>
                                {new Date(item.deadline).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {item.status === 'completed' && item.completedAt && (
                          <div className="completion-badge">
                            ✅ Completed {new Date(item.completedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Update Progress Modal
function UpdateProgressModal({ item, onClose, onUpdate }) {
  const [progress, setProgress] = useState(item.progress);
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState(item.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const updates = { progress, notes };
    if (hours) updates.addHours = parseFloat(hours);
    if (progress === 100) updates.status = 'completed';
    
    onUpdate(item.id, updates);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Update Progress</h3>
        
        <p className="modal-item-title">{item.title}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Progress ({progress}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
            />
            <div className="progress-labels">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div className="form-group">
            <label>Add Hours Spent</label>
            <input
              type="number"
              step="0.5"
              placeholder="Hours spent this session"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you learn? Any thoughts?"
              rows={4}
            />
          </div>
          
          {progress === 100 && (
            <div className="completion-notice">
              🎉 This will mark the item as completed!
            </div>
          )}
          
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Update</button>
          </div>
        </form>
      </div>
    </div>
  );
}
