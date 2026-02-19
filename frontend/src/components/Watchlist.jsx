import React, { useState, useEffect } from 'react';
import './Watchlist.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CONTENT_TYPES = [
  { id: 'movie', name: 'Movie', icon: '🎬' },
  { id: 'tv', name: 'TV Show', icon: '📺' }
];

const STATUS_OPTIONS = [
  { id: 'to-watch', name: 'To Watch', icon: '📋', color: '#48dbfb' },
  { id: 'watching', name: 'Watching', icon: '▶️', color: '#feca57' },
  { id: 'watched', name: 'Watched', icon: '✅', color: '#1dd1a1' }
];

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
  'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 
  'Thriller', 'War', 'Western'
];

const PLATFORMS = [
  'Netflix', 'Prime Video', 'Disney+', 'Hulu', 'HBO Max', 
  'Apple TV+', 'Paramount+', 'Peacock', 'YouTube', 'Theater', 'Other'
];

export default function Watchlist({ isOpen, onClose }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'movie',
    genre: '',
    platform: '',
    notes: ''
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
        fetch(`${API_URL}/watchlist`),
        fetch(`${API_URL}/watchlist/stats`)
      ]);
      
      setItems((await itemsRes.json()).items || []);
      setStats(await statsRes.json());
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetch(`${API_URL}/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setFormData({ title: '', type: 'movie', genre: '', platform: '', notes: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await fetch(`${API_URL}/watchlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove from watchlist?')) return;
    
    try {
      await fetch(`${API_URL}/watchlist/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getFilteredItems = () => {
    if (filter === 'all') return items;
    return items.filter(i => i.status === filter);
  };

  const getTypeIcon = (type) => CONTENT_TYPES.find(t => t.id === type)?.icon || '📺';
  const getStatusInfo = (status) => STATUS_OPTIONS.find(s => s.id === status) || STATUS_OPTIONS[0];

  const renderStars = (rating) => {
    return '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0));
  };

  if (!isOpen) return null;

  return (
    <div className="watchlist-overlay" onClick={onClose}>
      <div className="watchlist-panel" onClick={e => e.stopPropagation()}>
        <div className="watchlist-header">
          <div className="header-title">
            <span className="header-icon">🍿</span>
            <h2>Watchlist</h2>
            {stats && (
              <span className="header-stats">
                {stats.watched} watched · {stats.toWatch} to watch
              </span>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary small"
              onClick={() => setShowForm(true)}
            >
              ➕ Add
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
              <span className="stat-value">{stats.toWatch}</span>
              <span className="stat-label">To Watch</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.watching}</span>
              <span className="stat-label">Watching</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.watched}</span>
              <span className="stat-label">Watched</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.avgRating}★</span>
              <span className="stat-label">Avg Rating</span>
            </div>
          </div>
        )}

        {/* Currently Watching */}
        {stats?.watching > 0 && filter === 'all' && (
          <div className="currently-watching">
            <div className="current-header">
              <span className="current-label">▶️ Currently Watching</span>
            </div>            
            <div className="current-items">
              {items.filter(i => i.status === 'watching').map(item => (
                <div key={item.id} className="current-item">
                  <span className="current-type">{getTypeIcon(item.type)}</span>
                  <span className="current-title">{item.title}</span>
                  <button 
                    className="btn-finish"
                    onClick={() => setEditingItem(item)}
                  >
                    Rate & Finish
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {[
            { id: 'all', name: 'All', icon: '📚' },
            { id: 'to-watch', name: 'To Watch', icon: '📋' },
            { id: 'watching', name: 'Watching', icon: '▶️' },
            { id: 'watched', name: 'Watched', icon: '✅' }
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
        <div className="watchlist-content">
          {loading ? (
            <div className="loading-state">⏳ Loading...</div>
          ) : (
            <>
              {/* Add Form */}
              {showForm && (
                <div className="add-form">
                  <h3>Add to Watchlist</h3>
                  
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
                        {CONTENT_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                        ))}
                      </select>
                      
                      <select
                        value={formData.genre}
                        onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      >
                        <option value="">Select genre</option>
                        {GENRES.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    
                    <select
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    >
                      <option value="">Where to watch?</option>
                      {PLATFORMS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    
                    <textarea
                      placeholder="Notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                    />
                    
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">Add</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Rating Modal */}
              {editingItem && (
                <RatingModal
                  item={editingItem}
                  onClose={() => setEditingItem(null)}
                  onRate={(rating, review) => {
                    handleUpdate(editingItem.id, { 
                      status: 'watched', 
                      rating, 
                      review 
                    });
                    setEditingItem(null);
                  }}
                />
              )}

              {/* Items List */}
              {getFilteredItems().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🍿</div>
                  <h3>Your watchlist is empty</h3>
                  <p>Start tracking what you want to watch!</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    Add First Item
                  </button>
                </div>
              ) : (
                <div className="watchlist-grid">
                  {getFilteredItems().map(item => (
                    <div 
                      key={item.id} 
                      className={`watch-card ${item.status}`}
                      style={{ '--status-color': getStatusInfo(item.status).color }}
                    >
                      <div className="card-status-bar" />
                      
                      <div className="card-header">
                        <div className="card-type">
                          <span className="type-icon">{getTypeIcon(item.type)}</span>
                          <span>{item.type}</span>
                        </div>
                        
                        <div className="card-actions">
                          {item.status !== 'watched' && (
                            <>
                              {item.status === 'to-watch' && (
                                <button 
                                  onClick={() => handleUpdate(item.id, { status: 'watching' })}
                                  title="Start watching"
                                >
                                  ▶️
                                </button>
                              )}
                              {item.status === 'watching' && (
                                <button 
                                  onClick={() => setEditingItem(item)}
                                  title="Mark as watched"
                                >
                                  ✅
                                </button>
                              )}
                            </>
                          )}
                          <button onClick={() => handleDelete(item.id)} title="Remove">🗑️</button>
                        </div>
                      </div>

                      <h4 className="card-title">{item.title}</h4>

                      <div className="card-meta">
                        {item.genre && <span className="meta-tag genre">{item.genre}</span>}
                        {item.platform && <span className="meta-tag platform">{item.platform}</span>}
                      </div>

                      {item.status === 'watched' && item.rating && (
                        <div className="card-rating">
                          <span className="stars">{renderStars(item.rating)}</span>
                        </div>
                      )}

                      {item.review && (
                        <p className="card-review">{item.review}</p>
                      )}

                      {item.notes && (
                        <p className="card-notes">📝 {item.notes}</p>
                      )}

                      <div className="card-footer">
                        <span className={`status-badge ${item.status}`}>
                          {getStatusInfo(item.status).icon} {getStatusInfo(item.status).name}
                        </span>
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

// Rating Modal Component
function RatingModal({ item, onClose, onRate }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onRate(rating, review);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Rate & Review</h3>
        
        <p className="modal-item-title">{item.title}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="rating-selector">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                ★
              </button>
            ))}
          </div>
          
          <textarea
            placeholder="Write a quick review... (optional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
          />
          
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={rating === 0}>
              Mark as Watched
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
