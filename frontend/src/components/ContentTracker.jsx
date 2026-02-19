import React, { useState, useEffect, useCallback } from 'react';
// import './ContentTracker.css';

const CONTENT_TYPES = [
  { id: 'movie', label: 'Movies', icon: '🎬', color: '#ff6b6b' },
  { id: 'tv', label: 'TV Shows', icon: '📺', color: '#4ecdc4' },
  { id: 'podcast', label: 'Podcasts', icon: '🎧', color: '#95e1d3' },
  { id: 'game', label: 'Games', icon: '🎮', color: '#f38181' },
  { id: 'documentary', label: 'Documentaries', icon: '🎥', color: '#aa96da' },
];

const STATUS_OPTIONS = [
  { id: 'want', label: 'Want to Watch/Play', icon: '🔖', color: '#ffd93d' },
  { id: 'watching', label: 'Currently Watching/Playing', icon: '▶️', color: '#6bcb77' },
  { id: 'paused', label: 'On Hold', icon: '⏸️', color: '#f4a261' },
  { id: 'completed', label: 'Completed', icon: '✅', color: '#4ecdc4' },
  { id: 'dropped', label: 'Dropped', icon: '❌', color: '#e76f51' },
];

const RATING_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function ContentTracker({ isOpen, onClose }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'movie',
    status: 'want',
    rating: 0,
    notes: '',
    platform: '',
    currentEpisode: '',
    totalEpisodes: '',
  });

  // Load items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mc-content-tracker');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse content tracker data:', e);
      }
    }
  }, []);

  // Save items to localStorage
  useEffect(() => {
    localStorage.setItem('mc-content-tracker', JSON.stringify(items));
  }, [items]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingItem) {
      setItems(items.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...formData, updatedAt: new Date().toISOString() }
          : item
      ));
      setEditingItem(null);
    } else {
      const newItem = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setItems([newItem, ...items]);
    }
    
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'movie',
      status: 'want',
      rating: 0,
      notes: '',
      platform: '',
      currentEpisode: '',
      totalEpisodes: '',
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      type: item.type,
      status: item.status,
      rating: item.rating || 0,
      notes: item.notes || '',
      platform: item.platform || '',
      currentEpisode: item.currentEpisode || '',
      totalEpisodes: item.totalEpisodes || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateStatus = (id, newStatus) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, status: newStatus, updatedAt: new Date().toISOString() }
        : item
    ));
  };

  const updateRating = (id, rating) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, rating, updatedAt: new Date().toISOString() }
        : item
    ));
  };

  const getFilteredItems = () => {
    let filtered = items;

    if (filter !== 'all') {
      filtered = filtered.filter(item => item.type === filter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        (item.notes && item.notes.toLowerCase().includes(query)) ||
        (item.platform && item.platform.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'dateUpdated':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'dateAdded':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  };

  const getStats = () => {
    const stats = {
      total: items.length,
      byType: {},
      byStatus: {},
      completed: 0,
      averageRating: 0,
    };

    let totalRating = 0;
    let ratedCount = 0;

    items.forEach(item => {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
      
      if (item.status === 'completed') {
        stats.completed++;
      }
      
      if (item.rating > 0) {
        totalRating += item.rating;
        ratedCount++;
      }
    });

    stats.averageRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : 0;
    return stats;
  };

  const getTypeInfo = (typeId) => CONTENT_TYPES.find(t => t.id === typeId) || CONTENT_TYPES[0];
  const getStatusInfo = (statusId) => STATUS_OPTIONS.find(s => s.id === statusId) || STATUS_OPTIONS[0];

  const filteredItems = getFilteredItems();
  const stats = getStats();

  if (!isOpen) return null;

  return (
    <div className="content-tracker-overlay" onClick={onClose}>
      <div className="content-tracker-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="content-tracker-header">
          <div className="content-tracker-title">
            <span className="tracker-icon">🎬</span>
            <div>
              <h2>Content Tracker</h2>
              <p className="tracker-subtitle">Movies, Shows, Podcasts & Games</p>
            </div>
          </div>
          <div className="content-tracker-actions">
            <button 
              className="add-content-btn"
              onClick={() => {
                setEditingItem(null);
                resetForm();
                setShowAddModal(true);
              }}
            >
              <span>+</span> Add Content
            </button>
            <button className="content-tracker-close" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="content-stats">
          <div className="content-stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="content-stat-card">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="content-stat-card">
            <span className="stat-number">{stats.byStatus?.watching || 0}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="content-stat-card">
            <span className="stat-number">{stats.averageRating}</span>
            <span className="stat-label">Avg Rating</span>
          </div>
        </div>

        {/* Type Distribution */}
        <div className="type-distribution">
          {CONTENT_TYPES.map(type => {
            const count = stats.byType[type.id] || 0;
            if (count === 0) return null;
            return (
              <div 
                key={type.id} 
                className="type-badge"
                style={{ backgroundColor: `${type.color}20`, borderColor: type.color }}
              >
                <span>{type.icon}</span>
                <span className="type-count">{count}</span>
                <span className="type-label">{type.label}</span>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="content-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <select 
            className="filter-select"
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            {CONTENT_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status.id} value={status.id}>{status.icon} {status.label}</option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="dateAdded">Recently Added</option>
            <option value="dateUpdated">Recently Updated</option>
            <option value="title">Title (A-Z)</option>
            <option value="rating">Highest Rated</option>
            <option value="status">Status</option>
          </select>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {filteredItems.length === 0 ? (
            <div className="content-empty">
              <span className="empty-icon">🎭</span>
              <p>No content found</p>
              <small>{items.length === 0 ? 'Start tracking your entertainment journey!' : 'Try adjusting your filters.'}</small>
            </div>
          ) : (
            filteredItems.map(item => {
              const typeInfo = getTypeInfo(item.type);
              const statusInfo = getStatusInfo(item.status);
              
              return (
                <div key={item.id} className="content-card">
                  <div className="content-card-header">
                    <span 
                      className="content-type-badge"
                      style={{ backgroundColor: typeInfo.color }}
                    >
                      {typeInfo.icon}
                    </span>
                    <div className="content-actions">
                      <button 
                        className="action-btn edit"
                        onClick={() => handleEdit(item)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <h3 className="content-title">{item.title}</h3>
                  
                  {item.platform && (
                    <p className="content-platform">📺 {item.platform}</p>
                  )}

                  {(item.currentEpisode || item.totalEpisodes) && (
                    <p className="content-progress">
                      Episode {item.currentEpisode || '?'}{item.totalEpisode ? ` / ${item.totalEpisodes}` : ''}
                    </p>
                  )}

                  <div className="content-status-row">
                    <select
                      className="status-select"
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      style={{ borderColor: statusInfo.color }}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                      ))}
                    </select>
                  </div>

                  {item.rating > 0 && (
                    <div className="content-rating">
                      {'⭐'.repeat(Math.floor(item.rating / 2))}
                      <span className="rating-number">{item.rating}/10</span>
                    </div>
                  )}

                  {item.notes && (
                    <p className="content-notes">{item.notes}</p>
                  )}

                  <div className="content-card-footer">
                    <span className="content-date">
                      Added {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {!item.rating && item.status === 'completed' && (
                      <div className="quick-rating">
                        <span>Rate:</span>
                        {RATING_OPTIONS.slice(7).map(r => (
                          <button
                            key={r}
                            className="rating-star"
                            onClick={() => updateRating(item.id, r)}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="content-modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="content-modal" onClick={e => e.stopPropagation()}>
              <h3>{editingItem ? 'Edit Content' : 'Add New Content'}</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter title..."
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      {CONTENT_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status.id} value={status.id}>{status.icon} {status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Platform (Netflix, Steam, etc.)</label>
                  <input
                    type="text"
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    placeholder="Where are you watching/playing?"
                  />
                </div>

                {(formData.type === 'tv' || formData.type === 'podcast') && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Current Episode</label>
                      <input
                        type="text"
                        value={formData.currentEpisode}
                        onChange={(e) => setFormData({ ...formData, currentEpisode: e.target.value })}
                        placeholder="e.g., S01E05"
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Episodes</label>
                      <input
                        type="text"
                        value={formData.totalEpisodes}
                        onChange={(e) => setFormData({ ...formData, totalEpisodes: e.target.value })}
                        placeholder="e.g., 10"
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Rating</label>
                  <div className="rating-selector">
                    {RATING_OPTIONS.map(r => (
                      <button
                        key={r}
                        type="button"
                        className={`rating-option ${formData.rating === r ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, rating: r })}
                      >
                        {r}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`rating-option ${formData.rating === 0 ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, rating: 0 })}
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Your thoughts, review, or notes..."
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingItem ? 'Save Changes' : 'Add Content'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
