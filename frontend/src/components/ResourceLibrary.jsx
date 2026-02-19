'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import './ResourceLibrary.css';
import { getApiUrl } from '../lib/apiUrl.js';

const API_URL = getApiUrl();

const CATEGORIES = [
  { id: 'article', name: 'Article', icon: '📄' },
  { id: 'video', name: 'Video', icon: '🎬' },
  { id: 'tutorial', name: 'Tutorial', icon: '📚' },
  { id: 'documentation', name: 'Documentation', icon: '📖' },
  { id: 'podcast', name: 'Podcast', icon: '🎧' },
  { id: 'tool', name: 'Tool', icon: '🛠️' },
  { id: 'inspiration', name: 'Inspiration', icon: '✨' },
  { id: 'uncategorized', name: 'Uncategorized', icon: '📁' }
];

const PRIORITIES = [
  { id: 'high', name: 'High', color: '#ff6b6b' },
  { id: 'medium', name: 'Medium', color: '#feca57' },
  { id: 'low', name: 'Low', color: '#48dbfb' }
];

const STATUS_FILTERS = [
  { id: 'all', name: 'All', icon: '📚' },
  { id: 'unread', name: 'Unread', icon: '🔖' },
  { id: 'reading', name: 'Reading', icon: '📖' },
  { id: 'completed', name: 'Completed', icon: '✅' },
  { id: 'archived', name: 'Archived', icon: '📦' }
];

export default function ResourceLibrary({ isOpen, onClose }) {
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [selectedResources, setSelectedResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    category: 'article',
    tags: '',
    priority: 'medium',
    notes: ''
  });

  // Load resources
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sortBy', sortBy);
      
      const response = await fetch(`${API_URL}/resources?${params}`);
      const data = await response.json();
      setResources(data.resources || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery, sortBy]);

  // Load categories and tags
  const fetchMeta = useCallback(async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        fetch(`${API_URL}/resources/meta/categories`),
        fetch(`${API_URL}/resources/meta/tags`)
      ]);
      const catData = await catRes.json();
      const tagData = await tagRes.json();
      setCategories(catData);
      setTags(tagData);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchResources();
      fetchMeta();
    }
  }, [isOpen, fetchResources, fetchMeta]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) fetchResources();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, fetchResources]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    try {
      const url = editingResource 
        ? `${API_URL}/resources/${editingResource.id}`
        : `${API_URL}/resources`;
      
      const method = editingResource ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setFormData({
          url: '',
          title: '',
          description: '',
          category: 'article',
          tags: '',
          priority: 'medium',
          notes: ''
        });
        setShowAddForm(false);
        setEditingResource(null);
        fetchResources();
        fetchMeta();
      }
    } catch (err) {
      console.error('Failed to save resource:', err);
    }
  };

  const handleQuickAdd = async (url) => {
    try {
      const response = await fetch(`${API_URL}/resources/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (response.ok || response.status === 409) {
        fetchResources();
        setFormData(prev => ({ ...prev, url: '' }));
      }
    } catch (err) {
      console.error('Failed to quick add:', err);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await fetch(`${API_URL}/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchResources();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      await fetch(`${API_URL}/resources/${id}`, { method: 'DELETE' });
      fetchResources();
    } catch (err) {
      console.error('Failed to delete resource:', err);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedResources.length === 0) return;
    
    try {
      await fetch(`${API_URL}/resources/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedResources, action })
      });
      setSelectedResources([]);
      fetchResources();
    } catch (err) {
      console.error('Failed to perform bulk action:', err);
    }
  };

  const toggleSelection = (id) => {
    setSelectedResources(prev => 
      prev.includes(id) 
        ? prev.filter(rid => rid !== id)
        : [...prev, id]
    );
  };

  const startEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      url: resource.url,
      title: resource.title,
      description: resource.description || '',
      category: resource.category || 'article',
      tags: (resource.tags || []).join(', '),
      priority: resource.priority || 'medium',
      notes: resource.notes || ''
    });
    setShowAddForm(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'unread': return '🔖';
      case 'reading': return '📖';
      case 'completed': return '✅';
      case 'archived': return '📦';
      default: return '🔖';
    }
  };

  const getPriorityColor = (priority) => {
    const p = PRIORITIES.find(p => p.id === priority);
    return p?.color || '#888';
  };

  const getCategoryIcon = (category) => {
    const cat = CATEGORIES.find(c => c.id === category?.toLowerCase());
    return cat?.icon || '📁';
  };

  if (!isOpen) return null;

  return (
    <div className="resource-library-overlay" onClick={onClose}>
      <div className="resource-library-panel" onClick={e => e.stopPropagation()}>
        <div className="resource-library-header">
          <div className="header-title">
            <span className="header-icon">📚</span>
            <h2>Resource Library</h2>
            {stats && (
              <span className="header-stats">
                {stats.total} saved · {stats.byStatus?.unread || 0} unread
              </span>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="action-btn primary"
              onClick={() => {
                setEditingResource(null);
                setFormData({
                  url: '',
                  title: '',
                  description: '',
                  category: 'article',
                  tags: '',
                  priority: 'medium',
                  notes: ''
                });
                setShowAddForm(true);
              }}
            >
              ➕ Add Resource
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
              <span className="stat-value">{stats.byStatus?.unread || 0}</span>
              <span className="stat-label">Unread</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.byStatus?.reading || 0}</span>
              <span className="stat-label">Reading</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.byStatus?.completed || 0}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-item completion-rate">
              <span className="stat-value">{stats.completionRate}%</span>
              <span className="stat-label">Completion</span>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="resource-form-container">
            <form onSubmit={handleSubmit} className="resource-form">
              <h3>{editingResource ? 'Edit Resource' : 'Add New Resource'}</h3>
              
              <div className="form-row">
                <div className="form-group url-group">
                  <label>URL *</label>
                  <div className="url-input-group">
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://..."
                      required
                    />
                    {!editingResource && (
                      <button
                        type="button"
                        className="quick-add-btn"
                        onClick={() => handleQuickAdd(formData.url)}
                        disabled={!formData.url}
                      >
                        ⚡ Quick Save
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Resource title..."
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <div className="priority-selector">
                    {PRIORITIES.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={`priority-btn ${formData.priority === p.id ? 'active' : ''}`}
                        style={{ '--priority-color': p.color }}
                        onClick={() => setFormData({ ...formData, priority: p.id })}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="javascript, tutorial, ai..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the resource..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Personal notes about this resource..."
                  rows={2}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  {editingResource ? '💾 Save Changes' : '➕ Add Resource'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="toolbar">
          <div className="filter-tabs">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.id}
                className={`filter-tab ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                <span>{f.icon}</span>
                <span>{f.name}</span>
                {stats?.byStatus && f.id !== 'all' && (
                  <span className="count-badge">{stats.byStatus[f.id] || 0}</span>
                )}
              </button>
            ))}
          </div>

          <div className="toolbar-actions">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">📅 Newest First</option>
              <option value="oldest">📅 Oldest First</option>
              <option value="title">🔤 Title A-Z</option>
              <option value="priority">🔥 Priority</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedResources.length > 0 && (
          <div className="bulk-actions-bar">
            <span>{selectedResources.length} selected</span>
            <div className="bulk-buttons">
              <button onClick={() => handleBulkAction('markRead')}>✅ Mark Read</button>
              <button onClick={() => handleBulkAction('archive')}>📦 Archive</button>
              <button onClick={() => setSelectedResources([])}>Clear</button>
            </div>
          </div>
        )}

        {/* Popular Tags */}
        {tags.length > 0 && !searchQuery && (
          <div className="tags-cloud">
            <span className="tags-label">🏷️ Popular:</span>
            {tags.slice(0, 10).map(tag => (
              <button
                key={tag.name}
                className="tag-pill"
                onClick={() => setSearchQuery(tag.name)}
              >
                {tag.name} ({tag.count})
              </button>
            ))}
          </div>
        )}

        {/* Resources Grid */}
        <div className="resources-container">
          {loading ? (
            <div className="loading-state">⏳ Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No resources found</h3>
              <p>{searchQuery ? 'Try a different search term' : 'Start building your library by adding your first resource!'}</p>
              {!searchQuery && (
                <button className="btn primary" onClick={() => setShowAddForm(true)}>
                  Add Your First Resource
                </button>
              )}
            </div>
          ) : (
            <div className="resources-grid">
              {resources.map(resource => (
                <div 
                  key={resource.id} 
                  className={`resource-card ${resource.status} ${selectedResources.includes(resource.id) ? 'selected' : ''}`}
                  style={{ '--priority-color': getPriorityColor(resource.priority) }}
                >
                  <div className="card-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedResources.includes(resource.id)}
                      onChange={() => toggleSelection(resource.id)}
                    />
                  </div>
                  
                  <div className="card-priority" title={`${resource.priority} priority`} />
                  
                  <div className="card-content">
                    <div className="card-header">
                      <img 
                        src={resource.favicon} 
                        alt="" 
                        className="favicon"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <div className="card-title-row">
                        <h4 className="card-title" title={resource.title}>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            {resource.title}
                          </a>
                        </h4>
                        <span className="domain">{resource.domain}</span>
                      </div>
                    </div>

                    {resource.description && (
                      <p className="card-description">{resource.description}</p>
                    )}

                    <div className="card-meta">
                      <span className="meta-item category">
                        {getCategoryIcon(resource.category)} {resource.category}
                      </span>
                      <span className="meta-item status">
                        {getStatusIcon(resource.status)} {resource.status}
                      </span>
                      {resource.tags?.length > 0 && (
                        <div className="card-tags">
                          {resource.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                          {resource.tags.length > 3 && (
                            <span className="tag more">+{resource.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {resource.notes && (
                      <div className="card-notes">📝 {resource.notes}</div>
                    )}

                    <div className="card-actions">
                      <button 
                        className="action-btn"
                        onClick={() => handleStatusChange(resource.id, 'reading')}
                        title="Mark as reading"
                        disabled={resource.status === 'reading'}
                      >
                        📖
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => handleStatusChange(resource.id, 'completed')}
                        title="Mark as completed"
                        disabled={resource.status === 'completed'}
                      >
                        ✅
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => handleStatusChange(resource.id, 'archived')}
                        title="Archive"
                        disabled={resource.status === 'archived'}
                      >
                        📦
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => startEdit(resource)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(resource.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
