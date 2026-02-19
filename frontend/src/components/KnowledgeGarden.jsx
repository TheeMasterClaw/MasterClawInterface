import React, { useState, useEffect, useCallback } from 'react';
// import './KnowledgeGarden.css';

const CATEGORIES = {
  book: { label: 'Book', icon: '📚', color: '#8b5cf6' },
  article: { label: 'Article', icon: '📰', color: '#3b82f6' },
  video: { label: 'Video', icon: '🎬', color: '#ef4444' },
  course: { label: 'Course', icon: '🎓', color: '#10b981' },
  podcast: { label: 'Podcast', icon: '🎧', color: '#f59e0b' },
  paper: { label: 'Paper', icon: '📄', color: '#64748b' }
};

const STATUS_OPTIONS = [
  { value: 'want', label: 'Want to Learn', icon: '🔖' },
  { value: 'learning', label: 'In Progress', icon: '📖' },
  { value: 'completed', label: 'Completed', icon: '✅' },
  { value: 'dropped', label: 'Dropped', icon: '🚫' }
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'low', label: 'Low', color: '#22c55e' }
];

export default function KnowledgeGarden({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('library'); // library, ideas, stats
  const [items, setItems] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState({ status: 'all', category: 'all', priority: 'all' });
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'book',
    status: 'want',
    priority: 'medium',
    url: '',
    notes: '',
    progress: 0,
    rating: 0,
    tags: []
  });

  const [ideaData, setIdeaData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: []
  });

  // Load data from localStorage
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const savedItems = localStorage.getItem('mc-knowledge-items');
    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (e) {
        console.error('Failed to parse knowledge items:', e);
      }
    }

    const savedIdeas = localStorage.getItem('mc-knowledge-ideas');
    if (savedIdeas) {
      try {
        setIdeas(JSON.parse(savedIdeas));
      } catch (e) {
        console.error('Failed to parse ideas:', e);
      }
    }
  }, [isOpen]);

  // Save data to localStorage
  const saveItems = useCallback((newItems) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-knowledge-items', JSON.stringify(newItems));
    }
  }, []);

  const saveIdeas = useCallback((newIdeas) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-knowledge-ideas', JSON.stringify(newIdeas));
    }
  }, []);

  const handleAddItem = () => {
    if (!formData.title.trim()) return;

    const newItem = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: formData.status === 'completed' ? new Date().toISOString() : null
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    saveItems(updatedItems);
    resetForm();
    setShowAddForm(false);
  };

  const handleUpdateItem = () => {
    if (!editingItem || !formData.title.trim()) return;

    const updatedItems = items.map(item =>
      item.id === editingItem.id
        ? {
            ...item,
            ...formData,
            updatedAt: new Date().toISOString(),
            completedAt: formData.status === 'completed' && !item.completedAt
              ? new Date().toISOString()
              : item.completedAt
          }
        : item
    );

    setItems(updatedItems);
    saveItems(updatedItems);
    resetForm();
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleDeleteItem = (id) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveItems(updatedItems);
  };

  const handleAddIdea = () => {
    if (!ideaData.content.trim()) return;

    const newIdea = {
      id: Date.now(),
      ...ideaData,
      createdAt: new Date().toISOString()
    };

    const updatedIdeas = [newIdea, ...ideas];
    setIdeas(updatedIdeas);
    saveIdeas(updatedIdeas);
    setIdeaData({ title: '', content: '', category: 'general', tags: [] });
    setShowAddIdea(false);
  };

  const handleDeleteIdea = (id) => {
    const updatedIdeas = ideas.filter(idea => idea.id !== id);
    setIdeas(updatedIdeas);
    saveIdeas(updatedIdeas);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      category: 'book',
      status: 'want',
      priority: 'medium',
      url: '',
      notes: '',
      progress: 0,
      rating: 0,
      tags: []
    });
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      author: item.author || '',
      category: item.category,
      status: item.status,
      priority: item.priority,
      url: item.url || '',
      notes: item.notes || '',
      progress: item.progress || 0,
      rating: item.rating || 0,
      tags: item.tags || []
    });
    setShowAddForm(true);
  };

  const getFilteredItems = () => {
    return items.filter(item => {
      const matchesStatus = filter.status === 'all' || item.status === filter.status;
      const matchesCategory = filter.category === 'all' || item.category === filter.category;
      const matchesPriority = filter.priority === 'all' || item.priority === filter.priority;
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.author && item.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesStatus && matchesCategory && matchesPriority && matchesSearch;
    });
  };

  const getStats = () => {
    const stats = {
      total: items.length,
      completed: items.filter(i => i.status === 'completed').length,
      inProgress: items.filter(i => i.status === 'learning').length,
      want: items.filter(i => i.status === 'want').length,
      dropped: items.filter(i => i.status === 'dropped').length,
      byCategory: {},
      byMonth: {}
    };

    items.forEach(item => {
      // By category
      if (!stats.byCategory[item.category]) {
        stats.byCategory[item.category] = { total: 0, completed: 0 };
      }
      stats.byCategory[item.category].total++;
      if (item.status === 'completed') {
        stats.byCategory[item.category].completed++;
      }

      // By month (for completed items)
      if (item.completedAt) {
        const month = new Date(item.completedAt).toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!stats.byMonth[month]) {
          stats.byMonth[month] = 0;
        }
        stats.byMonth[month]++;
      }
    });

    return stats;
  };

  const getCategoryIcon = (category) => CATEGORIES[category]?.icon || '📄';
  const getCategoryLabel = (category) => CATEGORIES[category]?.label || category;
  const getStatusLabel = (status) => STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  const getStatusIcon = (status) => STATUS_OPTIONS.find(s => s.value === status)?.icon || '📄';

  const filteredItems = getFilteredItems();
  const stats = getStats();

  if (!isOpen) return null;

  return (
    <div className="knowledge-panel-overlay" onClick={onClose}>
      <div className="knowledge-panel" onClick={e => e.stopPropagation()}>
        <div className="knowledge-panel-header">
          <h3>🌱 Knowledge Garden</h3>
          <div className="header-actions">
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="knowledge-tabs">
          <button
            className={activeTab === 'library' ? 'active' : ''}
            onClick={() => setActiveTab('library')}
          >
            📚 Library ({items.length})
          </button>
          <button
            className={activeTab === 'ideas' ? 'active' : ''}
            onClick={() => setActiveTab('ideas')}
          >
            💡 Ideas ({ideas.length})
          </button>
          <button
            className={activeTab === 'stats' ? 'active' : ''}
            onClick={() => setActiveTab('stats')}
          >
            📊 Stats
          </button>
        </div>

        {activeTab === 'library' && (
          <div className="knowledge-content">
            <div className="knowledge-toolbar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search titles, authors, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                className="add-btn"
                onClick={() => {
                  setEditingItem(null);
                  resetForm();
                  setShowAddForm(true);
                }}
              >
                ➕ Add Item
              </button>
            </div>

            <div className="filter-bar">
              <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                ))}
              </select>
              <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
                <option value="all">All Types</option>
                {Object.entries(CATEGORIES).map(([key, config]) => (
                  <option key={key} value={key}>{config.icon} {config.label}</option>
                ))}
              </select>
              <select value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })}>
                <option value="all">All Priorities</option>
                {PRIORITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {showAddForm && (
              <div className="add-form-overlay" onClick={() => setShowAddForm(false)}>
                <div className="add-form" onClick={e => e.stopPropagation()}>
                  <h4>{editingItem ? '✏️ Edit Item' : '➕ Add to Library'}</h4>
                  <input
                    type="text"
                    placeholder="Title *"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Author / Creator"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  />
                  <div className="form-row">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {Object.entries(CATEGORIES).map(([key, config]) => (
                        <option key={key} value={key}>{config.icon} {config.label}</option>
                      ))}
                    </select>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                      ))}
                    </select>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      {PRIORITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="URL (optional)"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                  {formData.status === 'learning' && (
                    <div className="progress-input">
                      <label>Progress: {formData.progress}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                  {formData.status === 'completed' && (
                    <div className="rating-input">
                      <label>Rating:</label>
                      <div className="stars">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            className={star <= formData.rating ? 'filled' : ''}
                            onClick={() => setFormData({ ...formData, rating: star })}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <textarea
                    placeholder="Notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                  <div className="form-actions">
                    <button className="cancel-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
                    <button
                      className="save-btn"
                      onClick={editingItem ? handleUpdateItem : handleAddItem}
                      disabled={!formData.title.trim()}
                    >
                      {editingItem ? 'Update' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="items-list">
              {filteredItems.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🌱</span>
                  <p>Your knowledge garden is empty.</p>
                  <p>Start by adding a book, course, or article!</p>
                </div>
              ) : (
                filteredItems.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(item => (
                  <div key={item.id} className={`knowledge-item ${item.status} ${item.priority}`}>
                    <div className="item-header">
                      <span className="item-icon">{getCategoryIcon(item.category)}</span>
                      <div className="item-title-group">
                        <h5>{item.title}</h5>
                        {item.author && <span className="item-author">by {item.author}</span>}
                      </div>
                      <div className="item-actions">
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="link-btn">
                            🔗
                          </a>
                        )}
                        <button className="edit-btn" onClick={() => startEdit(item)}>✏️</button>
                        <button className="delete-btn" onClick={() => handleDeleteItem(item.id)}>🗑️</button>
                      </div>
                    </div>
                    <div className="item-meta">
                      <span className={`status-badge ${item.status}`}>
                        {getStatusIcon(item.status)} {getStatusLabel(item.status)}
                      </span>
                      <span className={`priority-badge ${item.priority}`}>
                        {item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢'} {item.priority}
                      </span>
                      <span className="category-badge">{getCategoryLabel(item.category)}</span>
                    </div>
                    {item.progress > 0 && item.status === 'learning' && (
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                        <span>{item.progress}%</span>
                      </div>
                    )}
                    {item.rating > 0 && (
                      <div className="item-rating">
                        {'⭐'.repeat(item.rating)}
                      </div>
                    )}
                    {item.notes && <p className="item-notes">{item.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'ideas' && (
          <div className="knowledge-content">
            <div className="knowledge-toolbar">
              <h4>💭 Capture Your Thoughts</h4>
              <button className="add-btn" onClick={() => setShowAddIdea(true)}>
                ➕ Add Idea
              </button>
            </div>

            {showAddIdea && (
              <div className="add-form-overlay" onClick={() => setShowAddIdea(false)}>
                <div className="add-form" onClick={e => e.stopPropagation()}>
                  <h4>💡 New Idea</h4>
                  <input
                    type="text"
                    placeholder="Title (optional)"
                    value={ideaData.title}
                    onChange={(e) => setIdeaData({ ...ideaData, title: e.target.value })}
                  />
                  <textarea
                    placeholder="What's on your mind?"
                    value={ideaData.content}
                    onChange={(e) => setIdeaData({ ...ideaData, content: e.target.value })}
                    rows={5}
                    autoFocus
                  />
                  <div className="form-actions">
                    <button className="cancel-btn" onClick={() => setShowAddIdea(false)}>Cancel</button>
                    <button
                      className="save-btn"
                      onClick={handleAddIdea}
                      disabled={!ideaData.content.trim()}
                    >
                      Save Idea
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="ideas-list">
              {ideas.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">💡</span>
                  <p>No ideas captured yet.</p>
                  <p>Jot down your thoughts before they fade!</p>
                </div>
              ) : (
                ideas.map(idea => (
                  <div key={idea.id} className="idea-card">
                    <div className="idea-header">
                      <span className="idea-date">
                        {new Date(idea.createdAt).toLocaleString()}
                      </span>
                      <button className="delete-btn" onClick={() => handleDeleteIdea(idea.id)}>
                        🗑️
                      </button>
                    </div>
                    {idea.title && <h5>{idea.title}</h5>}
                    <p className="idea-content">{idea.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="knowledge-content">
            <div className="stats-overview">
              <div className="stat-card">
                <span className="stat-number">{stats.total}</span>
                <span className="stat-label">Total Items</span>
              </div>
              <div className="stat-card completed">
                <span className="stat-number">{stats.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-card in-progress">
                <span className="stat-number">{stats.inProgress}</span>
                <span className="stat-label">In Progress</span>
              </div>
              <div className="stat-card want">
                <span className="stat-number">{stats.want}</span>
                <span className="stat-label">Want to Learn</span>
              </div>
            </div>

            <div className="stats-section">
              <h4>📊 By Category</h4>
              <div className="category-stats">
                {Object.entries(stats.byCategory).map(([category, data]) => (
                  <div key={category} className="category-stat-bar">
                    <div className="category-label">
                      {getCategoryIcon(category)} {getCategoryLabel(category)}
                    </div>
                    <div className="category-bar">
                      <div
                        className="category-fill"
                        style={{
                          width: `${(data.completed / data.total) * 100}%`,
                          backgroundColor: CATEGORIES[category]?.color || '#64748b'
                        }}
                      />
                    </div>
                    <div className="category-numbers">
                      {data.completed}/{data.total}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-section">
              <h4>📈 Completion History</h4>
              {Object.keys(stats.byMonth).length === 0 ? (
                <p className="no-data">No completed items yet. Keep learning!</p>
              ) : (
                <div className="monthly-stats">
                  {Object.entries(stats.byMonth)
                    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                    .map(([month, count]) => (
                      <div key={month} className="month-bar">
                        <span className="month-label">{month}</span>
                        <div className="month-fill-container">
                          <div
                            className="month-fill"
                            style={{
                              width: `${Math.min((count / 5) * 100, 100)}%`
                            }}
                          />
                        </div>
                        <span className="month-count">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="stats-section motivation">
              <p>
                🌱 <strong>"The more that you read, the more things you will know.</strong>
                <br />
                <strong>The more that you learn, the more places you'll go."</strong> — Dr. Seuss
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
