'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import './InspirationWall.css';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🌟' },
  { id: 'quote', label: 'Quotes', icon: '💬' },
  { id: 'link', label: 'Links', icon: '🔗' },
  { id: 'note', label: 'Notes', icon: '📝' },
  { id: 'image', label: 'Visuals', icon: '🖼️' },
];

const MOODS = [
  { id: 'all', label: 'Any Mood', color: '#6366f1' },
  { id: 'motivated', label: 'Motivated', color: '#f59e0b' },
  { id: 'creative', label: 'Creative', color: '#ec4899' },
  { id: 'peaceful', label: 'Peaceful', color: '#10b981' },
  { id: 'focused', label: 'Focused', color: '#3b82f6' },
  { id: 'grateful', label: 'Grateful', color: '#8b5cf6' },
];

const INSPIRATION_PROMPTS = [
  "What made you smile today?",
  "Capture a moment of beauty you witnessed",
  "What's a quote that resonates with you right now?",
  "Save something that sparked your curiosity",
  "What are you proud of?",
  "A reminder for your future self...",
  "Something you don't want to forget",
  "What inspires you about this moment?",
];

export default function InspirationWall({ isOpen, onClose }) {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeMood, setActiveMood] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRandom, setShowRandom] = useState(false);
  const [randomItem, setRandomItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [formType, setFormType] = useState('quote');
  const [formContent, setFormContent] = useState('');
  const [formSource, setFormSource] = useState('');
  const [formMood, setFormMood] = useState('motivated');
  const [formTags, setFormTags] = useState('');

  // Load items from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-inspiration-items');
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse inspiration items:', e);
        }
      }
    }
  }, [isOpen]);

  // Save items to localStorage
  const saveItems = useCallback((newItems) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-inspiration-items', JSON.stringify(newItems));
    }
  }, []);

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.type === activeCategory;
    const matchesMood = activeMood === 'all' || item.mood === activeMood;
    const matchesSearch = !searchQuery || 
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.source && item.source.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesMood && matchesSearch;
  });

  // Sort by most recent
  const sortedItems = [...filteredItems].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const handleAddItem = () => {
    if (!formContent.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      type: formType,
      content: formContent.trim(),
      source: formSource.trim() || null,
      mood: formMood,
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedItems = [newItem, ...items];
    setItems(updatedItems);
    saveItems(updatedItems);
    resetForm();
    setShowAddForm(false);
  };

  const handleUpdateItem = () => {
    if (!editingItem || !formContent.trim()) return;

    const updatedItems = items.map(item => 
      item.id === editingItem.id 
        ? {
            ...item,
            type: formType,
            content: formContent.trim(),
            source: formSource.trim() || null,
            mood: formMood,
            tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
            updatedAt: new Date().toISOString(),
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
    if (!confirm('Are you sure you want to delete this inspiration?')) return;
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveItems(updatedItems);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormType(item.type);
    setFormContent(item.content);
    setFormSource(item.source || '');
    setFormMood(item.mood);
    setFormTags(item.tags?.join(', ') || '');
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormType('quote');
    setFormContent('');
    setFormSource('');
    setFormMood('motivated');
    setFormTags('');
    setEditingItem(null);
  };

  const showRandomInspiration = () => {
    if (items.length === 0) return;
    const random = items[Math.floor(Math.random() * items.length)];
    setRandomItem(random);
    setShowRandom(true);
  };

  const getRandomPrompt = () => {
    return INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
  };

  const getMoodColor = (moodId) => {
    return MOODS.find(m => m.id === moodId)?.color || '#6366f1';
  };

  const getTypeIcon = (type) => {
    return CATEGORIES.find(c => c.id === type)?.icon || '🌟';
  };

  const getStats = () => {
    const total = items.length;
    const byType = {};
    const byMood = {};
    
    items.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byMood[item.mood] = (byMood[item.mood] || 0) + 1;
    });

    return { total, byType, byMood };
  };

  const stats = getStats();

  if (!isOpen) return null;

  return (
    <div className="inspiration-overlay" onClick={onClose}>
      <div className="inspiration-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="inspiration-header">
          <div className="inspiration-title">
            <span className="title-icon">✨</span>
            <div>
              <h2>Inspiration Wall</h2>
              <p className="subtitle">Collect moments that spark joy</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="action-btn random-btn"
              onClick={showRandomInspiration}
              title="Surprise me"
              disabled={items.length === 0}
            >
              🎲 Surprise Me
            </button>
            <button 
              className="action-btn add-btn"
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
            >
              + Add Inspiration
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Filters */}
        {!showAddForm && (
          <div className="inspiration-filters">
            <div className="filter-section">
              <label>Category</label>
              <div className="filter-chips">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`filter-chip ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                    {cat.id !== 'all' && stats.byType[cat.id] > 0 && (
                      <span className="count">{stats.byType[cat.id]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <label>Mood</label>
              <div className="filter-chips mood-chips">
                {MOODS.map(mood => (
                  <button
                    key={mood.id}
                    className={`filter-chip mood-chip ${activeMood === mood.id ? 'active' : ''}`}
                    onClick={() => setActiveMood(mood.id)}
                    style={{ '--mood-color': mood.color }}
                  >
                    <span className="mood-dot" style={{ backgroundColor: mood.color }} />
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-row">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search your inspirations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="clear-search" onClick={() => setSearchQuery('')}>
                    ×
                  </button>
                )}
              </div>
              <div className="view-toggle">
                <button 
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  ⊞
                </button>
                <button 
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  ☰
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="inspiration-form">
            <h3>{editingItem ? '✏️ Edit Inspiration' : '✨ Add New Inspiration'}</h3>
            <p className="form-prompt">{getRandomPrompt()}</p>
            
            <div className="form-group">
              <label>Type</label>
              <div className="type-selector">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <button
                    key={cat.id}
                    className={`type-btn ${formType === cat.id ? 'active' : ''}`}
                    onClick={() => setFormType(cat.id)}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>
                {formType === 'quote' && 'Quote'}
                {formType === 'link' && 'URL / Link'}
                {formType === 'note' && 'Note'}
                {formType === 'image' && 'Description / Image URL'}
                <span className="required">*</span>
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={
                  formType === 'quote' ? 'Enter the inspiring quote...' :
                  formType === 'link' ? 'https://...' :
                  formType === 'note' ? 'Write your thoughts...' :
                  'Describe what you see or paste an image URL...'
                }
                rows={formType === 'note' ? 4 : 2}
              />
            </div>

            <div className="form-group">
              <label>
                {formType === 'quote' ? 'Author / Source' : 'Source (optional)'}
              </label>
              <input
                type="text"
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
                placeholder={formType === 'quote' ? 'Who said this?' : 'Where did you find this?'}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mood</label>
                <select value={formMood} onChange={(e) => setFormMood(e.target.value)}>
                  {MOODS.filter(m => m.id !== 'all').map(mood => (
                    <option key={mood.id} value={mood.id}>{mood.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="motivation, design, life"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                disabled={!formContent.trim()}
              >
                {editingItem ? '💾 Save Changes' : '✨ Add to Wall'}
              </button>
            </div>
          </div>
        )}

        {/* Content Grid */}
        {!showAddForm && (
          <div className={`inspiration-content ${viewMode}`}>
            {sortedItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <h3>Your Inspiration Wall is Empty</h3>
                <p>Start collecting moments, quotes, and ideas that inspire you.</p>
                <button 
                  className="btn-primary"
                  onClick={() => setShowAddForm(true)}
                >
                  Add Your First Inspiration
                </button>
              </div>
            ) : (
              sortedItems.map(item => (
                <div 
                  key={item.id} 
                  className={`inspiration-card type-${item.type}`}
                  style={{ '--mood-color': getMoodColor(item.mood) }}
                >
                  <div className="card-header">
                    <span className="card-type">{getTypeIcon(item.type)}</span>
                    <div className="card-actions">
                      <button 
                        className="card-action"
                        onClick={() => handleEditItem(item)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="card-action"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="card-content">
                    {item.type === 'quote' ? (
                      <blockquote>"{item.content}"</blockquote>
                    ) : item.type === 'link' ? (
                      <a 
                        href={item.content} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="card-link"
                      >
                        🔗 {item.content}
                      </a>
                    ) : (
                      <p>{item.content}</p>
                    )}
                  </div>

                  {item.source && (
                    <div className="card-source">
                      — {item.source}
                    </div>
                  )}

                  <div className="card-footer">
                    <span 
                      className="mood-badge"
                      style={{ backgroundColor: getMoodColor(item.mood) + '20', color: getMoodColor(item.mood) }}
                    >
                      {MOODS.find(m => m.id === item.mood)?.label}
                    </span>
                    {item.tags?.map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                    <span className="date">
                      {new Date(item.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Stats Footer */}
        {!showAddForm && items.length > 0 && (
          <div className="inspiration-stats">
            <span>📊 {stats.total} inspirations collected</span>
            <span>•</span>
            <span>{Object.keys(stats.byMood).length} moods captured</span>
          </div>
        )}

        {/* Random Inspiration Modal */}
        {showRandom && randomItem && (
          <div className="random-modal" onClick={() => setShowRandom(false)}>
            <div className="random-content" onClick={e => e.stopPropagation()}>
              <button className="random-close" onClick={() => setShowRandom(false)}>
                ×
              </button>
              <div className="random-label">✨ Your Daily Inspiration</div>
              <div 
                className={`random-card type-${randomItem.type}`}
                style={{ '--mood-color': getMoodColor(randomItem.mood) }}
              >
                <span className="random-type">{getTypeIcon(randomItem.type)}</span>
                
                {randomItem.type === 'quote' ? (
                  <blockquote>"{randomItem.content}"</blockquote>
                ) : randomItem.type === 'link' ? (
                  <a 
                    href={randomItem.content} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {randomItem.content}
                  </a>
                ) : (
                  <p>{randomItem.content}</p>
                )}

                {randomItem.source && (
                  <div className="random-source">— {randomItem.source}</div>
                )}

                <div 
                  className="random-mood"
                  style={{ backgroundColor: getMoodColor(randomItem.mood) }}
                >
                  {MOODS.find(m => m.id === randomItem.mood)?.label}
                </div>
              </div>
              <button 
                className="btn-primary"
                onClick={showRandomInspiration}
              >
                🎲 Show Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
