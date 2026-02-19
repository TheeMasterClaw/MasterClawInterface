import React, { useState, useEffect, useMemo } from 'react';
import './VisionBoard.css';

const BOARD_CATEGORIES = [
  { id: 'all', label: 'All Items', emoji: '🌟' },
  { id: 'goals', label: 'Goals', emoji: '🎯' },
  { id: 'dreams', label: 'Dreams', emoji: '✨' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'career', label: 'Career', emoji: '💼' },
  { id: 'health', label: 'Health', emoji: '💪' },
  { id: 'relationships', label: 'Love', emoji: '❤️' },
  { id: 'quotes', label: 'Quotes', emoji: '💬' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
  { id: 'lifestyle', label: 'Lifestyle', emoji: '🌴' }
];

const MOOD_COLORS = [
  { id: 'ocean', label: 'Ocean', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'sunset', label: 'Sunset', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'forest', label: 'Forest', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'golden', label: 'Golden', gradient: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
  { id: 'midnight', label: 'Midnight', gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { id: 'cherry', label: 'Cherry', gradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' },
  { id: 'oceanic', label: 'Oceanic', gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { id: 'aurora', label: 'Aurora', gradient: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)' }
];

const STORAGE_KEY = 'mc-vision-board';

export default function VisionBoard({ isOpen, onClose }) {
  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'create', 'detail', 'fullscreen'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'category'

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('goals');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formMoodColor, setFormMoodColor] = useState('ocean');
  const [formTags, setFormTags] = useState('');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formIsGoal, setFormIsGoal] = useState(true);

  // Load items from localStorage
  useEffect(() => {
    if (!isOpen) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = parsed.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt),
          targetDate: item.targetDate ? new Date(item.targetDate) : null
        }));
        setItems(restored);
      } else {
        // Add sample items for first-time users
        const sampleItems = createSampleItems();
        setItems(sampleItems);
        saveItems(sampleItems);
      }
    } catch (err) {
      console.error('Failed to load vision board:', err);
    }
  }, [isOpen]);

  const createSampleItems = () => {
    const now = new Date();
    return [
      {
        id: 'sample-1',
        title: 'Visit Japan',
        description: 'Experience cherry blossoms in Kyoto and explore Tokyo\'s tech scene',
        category: 'travel',
        moodColor: 'cherry',
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400',
        tags: ['travel', 'asia', 'adventure'],
        isGoal: true,
        targetDate: new Date(now.getFullYear() + 1, 2, 15),
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'sample-2',
        title: 'Master React',
        description: 'Become proficient in React and build amazing applications',
        category: 'career',
        moodColor: 'ocean',
        imageUrl: '',
        tags: ['coding', 'learning', 'growth'],
        isGoal: true,
        targetDate: new Date(now.getFullYear(), 5, 30),
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'sample-3',
        title: '"The only way to do great work is to love what you do."',
        description: '— Steve Jobs',
        category: 'quotes',
        moodColor: 'golden',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        tags: ['inspiration', 'work', 'passion'],
        isGoal: false,
        targetDate: null,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'sample-4',
        title: 'Run a Marathon',
        description: 'Train consistently and complete a full 26.2 mile marathon',
        category: 'health',
        moodColor: 'forest',
        imageUrl: '',
        tags: ['fitness', 'running', 'endurance'],
        isGoal: true,
        targetDate: new Date(now.getFullYear() + 1, 8, 15),
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
    ];
  };

  const saveItems = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save vision board:', err);
    }
  };

  // Auto-save on changes
  useEffect(() => {
    if (items.length > 0) {
      saveItems(items);
    }
  }, [items]);

  const handleCreateItem = (e) => {
    e.preventDefault();

    if (!formTitle.trim()) return;

    const newItem = {
      id: 'vision-' + Date.now(),
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      moodColor: formMoodColor,
      imageUrl: formImageUrl.trim(),
      tags: formTags.split(',').map(t => t.trim()).filter(t => t),
      isGoal: formIsGoal,
      targetDate: formTargetDate ? new Date(formTargetDate) : null,
      createdAt: new Date()
    };

    setItems(prev => [newItem, ...prev]);
    resetForm();
    setViewMode('grid');
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('goals');
    setFormImageUrl('');
    setFormMoodColor('ocean');
    setFormTags('');
    setFormTargetDate('');
    setFormIsGoal(true);
  };

  const deleteItem = (itemId) => {
    if (confirm('Are you sure you want to remove this item from your vision board?')) {
      setItems(prev => prev.filter(item => item.id !== itemId));
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
        setViewMode('grid');
      }
    }
  };

  const toggleGoalComplete = (itemId) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, isGoal: !item.isGoal, completedAt: !item.isGoal ? new Date() : null } : item
    ));
  };

  const getMoodGradient = (moodId) => {
    return MOOD_COLORS.find(m => m.id === moodId)?.gradient || MOOD_COLORS[0].gradient;
  };

  const getCategoryLabel = (catId) => {
    return BOARD_CATEGORIES.find(c => c.id === catId)?.label || catId;
  };

  const getCategoryEmoji = (catId) => {
    return BOARD_CATEGORIES.find(c => c.id === catId)?.emoji || '🌟';
  };

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return result;
  }, [items, selectedCategory, searchQuery, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const goals = items.filter(i => i.isGoal).length;
    const completed = items.filter(i => i.completedAt).length;
    const withTargetDate = items.filter(i => i.targetDate && i.targetDate > new Date()).length;

    return { total, goals, completed, withTargetDate };
  }, [items]);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (targetDate) => {
    if (!targetDate) return null;
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isOpen) return null;

  return (
    <div className="vision-board-overlay" onClick={onClose}>
      <div className="vision-board-panel" onClick={e => e.stopPropagation()}>
        <div className="vision-board-header">
          <h3>🖼️ Vision Board</h3>
          <div className="header-actions">
            {viewMode === 'grid' && (
              <button
                className="create-btn"
                onClick={() => setViewMode('create')}
              >
                + Add Vision
              </button>
            )}
            {viewMode !== 'grid' && viewMode !== 'fullscreen' && (
              <button
                className="back-btn"
                onClick={() => {
                  setViewMode('grid');
                  setSelectedItem(null);
                }}
              >
                ← Back
              </button>
            )}
            {viewMode === 'fullscreen' && (
              <button
                className="back-btn"
                onClick={() => setViewMode('detail')}
              >
                ← Close View
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {viewMode === 'grid' && (
          <>
            {/* Stats Dashboard */}
            <div className="vision-stats">
              <div className="vision-stat-card">
                <span className="vision-stat-value">{stats.total}</span>
                <span className="vision-stat-label">Total Visions</span>
              </div>
              <div className="vision-stat-card">
                <span className="vision-stat-value">{stats.goals}</span>
                <span className="vision-stat-label">Active Goals</span>
              </div>
              <div className="vision-stat-card">
                <span className="vision-stat-value">{stats.completed}</span>
                <span className="vision-stat-label">Achieved</span>
              </div>
              <div className="vision-stat-card">
                <span className="vision-stat-value">{stats.withTargetDate}</span>
                <span className="vision-stat-label">With Deadline</span>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="vision-filters">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search your visions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="category">By Category</option>
              </select>
            </div>

            {/* Category Pills */}
            <div className="category-pills">
              {BOARD_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="pill-emoji">{cat.emoji}</span>
                  <span className="pill-label">{cat.label}</span>
                  {cat.id !== 'all' && (
                    <span className="pill-count">
                      {items.filter(i => i.category === cat.id).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Vision Grid */}
            <div className="vision-grid">
              {filteredItems.length === 0 ? (
                <div className="vision-empty">
                  <span className="empty-icon">🖼️</span>
                  <p>{searchQuery ? 'No visions match your search' : 'Your vision board is empty'}</p>
                  <button onClick={() => setViewMode('create')}>
                    Add your first vision
                  </button>
                </div>
              ) : (
                filteredItems.map(item => {
                  const daysRemaining = getDaysRemaining(item.targetDate);
                  const gradient = getMoodGradient(item.moodColor);

                  return (
                    <div
                      key={item.id}
                      className={`vision-card ${item.completedAt ? 'completed' : ''}`}
                      style={{ '--card-gradient': gradient }}
                      onClick={() => {
                        setSelectedItem(item);
                        setViewMode('detail');
                      }}
                    >
                      {item.imageUrl && (
                        <div className="vision-card-image">
                          <img src={item.imageUrl} alt={item.title} loading="lazy" />
                          <div className="image-overlay" style={{ background: gradient, opacity: 0.3 }} />
                        </div>
                      )}

                      <div className="vision-card-content" style={!item.imageUrl ? { background: gradient } : {}}>
                        <div className="vision-card-header">
                          <span className="vision-category">
                            {getCategoryEmoji(item.category)} {getCategoryLabel(item.category)}
                          </span>
                          {item.isGoal && !item.completedAt && (
                            <span className="goal-badge">🎯 Goal</span>
                          )}
                          {item.completedAt && (
                            <span className="completed-badge">✅ Done</span>
                          )}
                        </div>

                        <h4 className="vision-title">{item.title}</h4>

                        {item.description && (
                          <p className="vision-description">{item.description}</p>
                        )}

                        {item.targetDate && (
                          <div className="vision-deadline">
                            <span className="deadline-icon">📅</span>
                            <span className="deadline-text">
                              {daysRemaining !== null && daysRemaining > 0
                                ? `${daysRemaining} days left`
                                : formatDate(item.targetDate)}
                            </span>
                          </div>
                        )}

                        {item.tags.length > 0 && (
                          <div className="vision-tags">
                            {item.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="vision-tag">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {viewMode === 'create' && (
          <form className="vision-form" onSubmit={handleCreateItem}>
            <div className="form-section">
              <label>Title *</label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="What do you want to achieve or remember?"
                required
                autoFocus
              />
            </div>

            <div className="form-section">
              <label>Description</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Add details, context, or the full quote..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-section">
                <label>Category</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                >
                  {BOARD_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-section">
                <label>Type</label>
                <div className="type-toggle">
                  <button
                    type="button"
                    className={formIsGoal ? 'active' : ''}
                    onClick={() => setFormIsGoal(true)}
                  >
                    🎯 Goal
                  </button>
                  <button
                    type="button"
                    className={!formIsGoal ? 'active' : ''}
                    onClick={() => setFormIsGoal(false)}
                  >
                    💭 Inspiration
                  </button>
                </div>
              </div>
            </div>

            {formIsGoal && (
              <div className="form-section">
                <label>Target Date (optional)</label>
                <input
                  type="date"
                  value={formTargetDate}
                  onChange={e => setFormTargetDate(e.target.value)}
                />
              </div>
            )}

            <div className="form-section">
              <label>Image URL (optional)</label>
              <input
                type="url"
                value={formImageUrl}
                onChange={e => setFormImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <span className="form-hint">Leave empty for a beautiful gradient background</span>
            </div>

            <div className="form-section">
              <label>Mood Color</label>
              <div className="mood-options">
                {MOOD_COLORS.map(mood => (
                  <button
                    key={mood.id}
                    type="button"
                    className={`mood-option ${formMoodColor === mood.id ? 'selected' : ''}`}
                    style={{ background: mood.gradient }}
                    onClick={() => setFormMoodColor(mood.id)}
                    title={mood.label}
                  />
                ))}
              </div>
            </div>

            <div className="form-section">
              <label>Tags (comma separated)</label>
              <input
                type="text"
                value={formTags}
                onChange={e => setFormTags(e.target.value)}
                placeholder="dream, 2026, motivation"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setViewMode('grid')}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Add to Vision Board
              </button>
            </div>
          </form>
        )}

        {viewMode === 'detail' && selectedItem && (
          <div className="vision-detail">
            <div
              className="detail-hero"
              style={{
                background: selectedItem.imageUrl
                  ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${selectedItem.imageUrl}) center/cover`
                  : getMoodGradient(selectedItem.moodColor)
              }}
            >
              <div className="hero-content">
                <span className="detail-category">
                  {getCategoryEmoji(selectedItem.category)} {getCategoryLabel(selectedItem.category)}
                </span>
                <h2>{selectedItem.title}</h2>
                {selectedItem.description && (
                  <p className="detail-description">{selectedItem.description}</p>
                )}
              </div>
            </div>

            <div className="detail-body">
              <div className="detail-meta-grid">
                {selectedItem.isGoal && (
                  <div className="detail-meta-item">
                    <span className="meta-icon">🎯</span>
                    <div>
                      <span className="meta-label">Type</span>
                      <span className="meta-value">Goal</span>
                    </div>
                  </div>
                )}

                {selectedItem.targetDate && (
                  <div className="detail-meta-item">
                    <span className="meta-icon">📅</span>
                    <div>
                      <span className="meta-label">Target Date</span>
                      <span className="meta-value">
                        {formatDate(selectedItem.targetDate)}
                        {(() => {
                          const days = getDaysRemaining(selectedItem.targetDate);
                          if (days !== null && days > 0) {
                            return ` (${days} days left)`;
                          }
                          return '';
                        })()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="detail-meta-item">
                  <span className="meta-icon">📅</span>
                  <div>
                    <span className="meta-label">Created</span>
                    <span className="meta-value">{formatDate(selectedItem.createdAt)}</span>
                  </div>
                </div>

                <div className="detail-meta-item">
                  <span className="meta-icon">🎨</span>
                  <div>
                    <span className="meta-label">Mood</span>
                    <span className="meta-value mood-preview" style={{ background: getMoodGradient(selectedItem.moodColor) }} />
                  </div>
                </div>
              </div>

              {selectedItem.tags.length > 0 && (
                <div className="detail-tags-section">
                  <h4>Tags</h4>
                  <div className="detail-tags">
                    {selectedItem.tags.map((tag, i) => (
                      <span key={i} className="detail-tag">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-actions">
                {selectedItem.imageUrl && (
                  <button
                    className="btn-secondary"
                    onClick={() => setViewMode('fullscreen')}
                  >
                    🔍 View Full Image
                  </button>
                )}

                {selectedItem.isGoal && (
                  <button
                    className={`btn-${selectedItem.completedAt ? 'secondary' : 'primary'}`}
                    onClick={() => toggleGoalComplete(selectedItem.id)}
                  >
                    {selectedItem.completedAt ? '↩️ Mark Incomplete' : '✅ Mark Complete'}
                  </button>
                )}

                <button
                  className="btn-danger"
                  onClick={() => deleteItem(selectedItem.id)}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'fullscreen' && selectedItem?.imageUrl && (
          <div className="fullscreen-image" onClick={() => setViewMode('detail')}>
            <img src={selectedItem.imageUrl} alt={selectedItem.title} />
            <div className="fullscreen-caption">
              <h3>{selectedItem.title}</h3>
              <p>Click anywhere to close</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
