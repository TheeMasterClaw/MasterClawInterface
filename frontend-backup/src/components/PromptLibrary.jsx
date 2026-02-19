import React, { useState, useEffect, useMemo } from 'react';
import './PromptLibrary.css';

const PRESET_PROMPTS = [
  {
    id: 'preset-1',
    title: 'Explain like I\'m 5',
    prompt: 'Explain the following concept in simple terms that a 5-year-old would understand:',
    category: 'learning',
    tags: ['explanation', 'simple', 'education'],
    icon: '🧒'
  },
  {
    id: 'preset-2',
    title: 'Code Review',
    prompt: 'Please review the following code for potential bugs, performance issues, and best practices. Provide specific suggestions for improvement:',
    category: 'coding',
    tags: ['code', 'review', 'development'],
    icon: '💻'
  },
  {
    id: 'preset-3',
    title: 'Summarize Text',
    prompt: 'Provide a concise summary of the following text, highlighting the key points and main takeaways:',
    category: 'productivity',
    tags: ['summary', 'reading', 'efficiency'],
    icon: '📝'
  },
  {
    id: 'preset-4',
    title: 'Brainstorm Ideas',
    prompt: 'Help me brainstorm creative ideas for the following topic. Generate at least 10 diverse suggestions:',
    category: 'creativity',
    tags: ['ideas', 'brainstorm', 'creative'],
    icon: '💡'
  },
  {
    id: 'preset-5',
    title: 'Draft Email',
    prompt: 'Draft a professional email with the following details. Keep it concise and clear:',
    category: 'communication',
    tags: ['email', 'writing', 'professional'],
    icon: '📧'
  },
  {
    id: 'preset-6',
    title: 'Debug Helper',
    prompt: 'I\'m experiencing the following issue. Help me debug it step by step, asking clarifying questions if needed:',
    category: 'coding',
    tags: ['debug', 'troubleshoot', 'problem-solving'],
    icon: '🐛'
  },
  {
    id: 'preset-7',
    title: 'Weekly Review',
    prompt: 'Help me conduct a weekly review. I\'ll share what I accomplished, what I struggled with, and my goals for next week. Provide insights and suggestions:',
    category: 'productivity',
    tags: ['review', 'planning', 'reflection'],
    icon: '📅'
  },
  {
    id: 'preset-8',
    title: 'Learn a Concept',
    prompt: 'Teach me about the following topic. Break it down into key concepts, provide examples, and suggest resources for further learning:',
    category: 'learning',
    tags: ['education', 'study', 'knowledge'],
    icon: '📚'
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All Prompts', icon: '📂' },
  { id: 'coding', name: 'Coding', icon: '💻' },
  { id: 'productivity', name: 'Productivity', icon: '⚡' },
  { id: 'learning', name: 'Learning', icon: '📚' },
  { id: 'creativity', name: 'Creativity', icon: '🎨' },
  { id: 'communication', name: 'Communication', icon: '💬' },
  { id: 'custom', name: 'My Prompts', icon: '⭐' }
];

export default function PromptLibrary({ isOpen, onClose, onUsePrompt }) {
  const [prompts, setPrompts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'alphabetical', 'mostUsed'
  const [expandedPrompt, setExpandedPrompt] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    category: 'custom',
    tags: '',
    icon: '⭐'
  });

  // Icon options
  const ICON_OPTIONS = ['⭐', '💻', '📝', '💡', '📧', '🐛', '📅', '📚', '🎨', '💬', '⚡', '🎯', '🔍', '✅', '❓', '💭', '🚀', '📊', '🔧', '💪'];

  // Load prompts from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-prompts');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Merge with presets, avoiding duplicates
          const presetIds = new Set(PRESET_PROMPTS.map(p => p.id));
          const userPrompts = parsed.filter(p => !presetIds.has(p.id));
          setPrompts([...PRESET_PROMPTS, ...userPrompts]);
        } catch (e) {
          console.error('Failed to parse prompts:', e);
          setPrompts(PRESET_PROMPTS);
        }
      } else {
        setPrompts(PRESET_PROMPTS);
      }
    }
  }, [isOpen]);

  // Save prompts to localStorage
  const savePrompts = (updatedPrompts) => {
    // Only save user prompts (not presets)
    const userPrompts = updatedPrompts.filter(p => !p.id.startsWith('preset-'));
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-prompts', JSON.stringify(userPrompts));
    }
    setPrompts(updatedPrompts);
  };

  // Filter and sort prompts
  const filteredPrompts = useMemo(() => {
    let result = [...prompts];

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'custom') {
        result = result.filter(p => !p.id.startsWith('preset-'));
      } else {
        result = result.filter(p => p.category === selectedCategory);
      }
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.prompt.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'mostUsed':
          return (b.useCount || 0) - (a.useCount || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [prompts, selectedCategory, searchQuery, sortBy]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: prompts.length };
    CATEGORIES.forEach(cat => {
      if (cat.id !== 'all') {
        if (cat.id === 'custom') {
          counts[cat.id] = prompts.filter(p => !p.id.startsWith('preset-')).length;
        } else {
          counts[cat.id] = prompts.filter(p => p.category === cat.id).length;
        }
      }
    });
    return counts;
  }, [prompts]);

  // Add or update prompt
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.prompt.trim()) return;

    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

    if (editingPrompt) {
      const updated = prompts.map(p =>
        p.id === editingPrompt.id
          ? {
              ...p,
              title: formData.title,
              prompt: formData.prompt,
              category: formData.category,
              tags: tagsArray,
              icon: formData.icon,
              updatedAt: Date.now()
            }
          : p
      );
      savePrompts(updated);
      setEditingPrompt(null);
    } else {
      const newPrompt = {
        id: `user-${Date.now()}`,
        title: formData.title,
        prompt: formData.prompt,
        category: formData.category,
        tags: tagsArray,
        icon: formData.icon,
        createdAt: Date.now(),
        useCount: 0
      };
      savePrompts([...prompts, newPrompt]);
    }

    setFormData({ title: '', prompt: '', category: 'custom', tags: '', icon: '⭐' });
    setShowAddForm(false);
  };

  // Delete prompt
  const deletePrompt = (id) => {
    if (id.startsWith('preset-')) {
      alert('Preset prompts cannot be deleted.');
      return;
    }
    if (confirm('Delete this prompt?')) {
      const updated = prompts.filter(p => p.id !== id);
      savePrompts(updated);
      if (editingPrompt?.id === id) {
        setEditingPrompt(null);
        setShowAddForm(false);
      }
    }
  };

  // Edit prompt
  const editPrompt = (prompt) => {
    if (prompt.id.startsWith('preset-')) {
      // Clone preset as new custom prompt
      setFormData({
        title: prompt.title + ' (Copy)',
        prompt: prompt.prompt,
        category: prompt.category,
        tags: prompt.tags?.join(', ') || '',
        icon: prompt.icon || '⭐'
      });
    } else {
      setEditingPrompt(prompt);
      setFormData({
        title: prompt.title,
        prompt: prompt.prompt,
        category: prompt.category,
        tags: prompt.tags?.join(', ') || '',
        icon: prompt.icon || '⭐'
      });
    }
    setShowAddForm(true);
  };

  // Use prompt
  const usePrompt = (prompt) => {
    // Increment use count
    const updated = prompts.map(p =>
      p.id === prompt.id ? { ...p, useCount: (p.useCount || 0) + 1 } : p
    );
    savePrompts(updated);

    // Send to parent
    if (onUsePrompt) {
      onUsePrompt(prompt.prompt);
    }

    // Close panel
    onClose();
  };

  // Copy prompt to clipboard
  const copyPrompt = async (prompt, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get favorite prompts
  const getFavorites = () => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('mc-prompt-favorites');
    return saved ? JSON.parse(saved) : [];
  };

  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setFavorites(getFavorites());
    }
  }, [isOpen]);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    const current = getFavorites();
    let updated;
    if (current.includes(id)) {
      updated = current.filter(fav => fav !== id);
    } else {
      updated = [...current, id];
    }
    localStorage.setItem('mc-prompt-favorites', JSON.stringify(updated));
    setFavorites(updated);
  };

  const isFavorite = (id) => favorites.includes(id);

  // Export prompts
  const exportPrompts = () => {
    const userPrompts = prompts.filter(p => !p.id.startsWith('preset-'));
    const dataStr = JSON.stringify(userPrompts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mc-prompts-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import prompts
  const importPrompts = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          const validPrompts = imported.filter(p =>
            p.title && p.prompt && typeof p.title === 'string' && typeof p.prompt === 'string'
          );
          const withIds = validPrompts.map(p => ({
            ...p,
            id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now()
          }));
          const merged = [...prompts, ...withIds];
          savePrompts(merged);
          alert(`Imported ${withIds.length} prompts successfully!`);
        }
      } catch (err) {
        alert('Failed to import prompts. Make sure the file is valid JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  if (!isOpen) return null;

  return (
    <div className="prompt-panel-overlay" onClick={onClose}>
      <div className="prompt-panel" onClick={e => e.stopPropagation()}>
        <div className="prompt-panel-header">
          <h3>📚 Prompt Library</h3>
          <div className="header-actions">
            <button 
              className="view-toggle-btn"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            >
              {viewMode === 'grid' ? '☰' : '⊞'}
            </button>
            <button 
              className="add-prompt-btn"
              onClick={() => {
                setEditingPrompt(null);
                setFormData({ title: '', prompt: '', category: 'custom', tags: '', icon: '⭐' });
                setShowAddForm(true);
              }}
            >
              + New Prompt
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="prompt-panel-body">
          {/* Sidebar */}
          <div className="prompt-sidebar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  ×
                </button>
              )}
            </div>

            <div className="category-list">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`category-item ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-name">{cat.name}</span>
                  <span className="category-count">{categoryCounts[cat.id] || 0}</span>
                </button>
              ))}
            </div>

            <div className="import-export">
              <button className="export-btn" onClick={exportPrompts}>
                📤 Export
              </button>
              <label className="import-btn">
                📥 Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importPrompts}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Main Content */}
          <div className="prompt-content">
            <div className="prompt-toolbar">
              <div className="results-info">
                {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''}
              </div>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="alphabetical">A-Z</option>
                <option value="mostUsed">Most used</option>
              </select>
            </div>

            {filteredPrompts.length === 0 ? (
              <div className="empty-prompts">
                <span className="empty-icon">📚</span>
                <p>No prompts found</p>
                {searchQuery ? (
                  <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                    Clear filters
                  </button>
                ) : (
                  <button onClick={() => setShowAddForm(true)}>Create your first prompt</button>
                )}
              </div>
            ) : (
              <div className={`prompts-${viewMode}`}>
                {filteredPrompts.map(prompt => (
                  <div
                    key={prompt.id}
                    className={`prompt-card ${expandedPrompt === prompt.id ? 'expanded' : ''}`}
                    onClick={() => setExpandedPrompt(expandedPrompt === prompt.id ? null : prompt.id)}
                  >
                    <div className="prompt-card-header">
                      <span className="prompt-icon">{prompt.icon || '⭐'}</span>
                      <span className="prompt-title">{prompt.title}</span>
                      {prompt.useCount > 0 && (
                        <span className="use-count" title={`Used ${prompt.useCount} time${prompt.useCount !== 1 ? 's' : ''}`}>
                          🔥 {prompt.useCount}
                        </span>
                      )}
                      <button
                        className={`favorite-btn ${isFavorite(prompt.id) ? 'active' : ''}`}
                        onClick={(e) => toggleFavorite(prompt.id, e)}
                        title={isFavorite(prompt.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {isFavorite(prompt.id) ? '★' : '☆'}
                      </button>
                    </div>

                    <div className="prompt-preview">
                      {prompt.prompt.length > 120 && expandedPrompt !== prompt.id
                        ? prompt.prompt.substring(0, 120) + '...'
                        : prompt.prompt}
                    </div>

                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="prompt-tags">
                        {prompt.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="tag">#{tag}</span>
                        ))}
                        {prompt.tags.length > 3 && (
                          <span className="tag more">+{prompt.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="prompt-actions">
                      <button
                        className="action-btn use"
                        onClick={(e) => {
                          e.stopPropagation();
                          usePrompt(prompt);
                        }}
                        title="Use this prompt"
                      >
                        ▶ Use
                      </button>
                      <button
                        className="action-btn copy"
                        onClick={(e) => copyPrompt(prompt, e)}
                        title="Copy to clipboard"
                      >
                        {copiedId === prompt.id ? '✓ Copied!' : '📋 Copy'}
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          editPrompt(prompt);
                        }}
                        title={prompt.id.startsWith('preset-') ? 'Duplicate prompt' : 'Edit prompt'}
                      >
                        {prompt.id.startsWith('preset-') ? '📋 Duplicate' : '✏️ Edit'}
                      </button>
                      {!prompt.id.startsWith('preset-') && (
                        <button
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePrompt(prompt.id);
                          }}
                          title="Delete prompt"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="prompt-form-overlay" onClick={() => setShowAddForm(false)}>
            <form className="prompt-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <h4>{editingPrompt ? '✏️ Edit Prompt' : '➕ New Prompt'}</h4>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Code Review"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Prompt *</label>
                <textarea
                  value={formData.prompt}
                  onChange={e => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="Enter your prompt template..."
                  required
                  rows={5}
                />
                <span className="form-hint">Tip: End with a colon if you expect to add more context when using.</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'custom').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Icon</label>
                  <div className="icon-picker">
                    {ICON_OPTIONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                        onClick={() => setFormData({ ...formData, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., coding, review, helpful"
                />
              </div>

              <div className="form-actions">
                {editingPrompt && !editingPrompt.id.startsWith('preset-') && (
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => deletePrompt(editingPrompt.id)}
                  >
                    🗑️ Delete
                  </button>
                )}
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingPrompt ? 'Save Changes' : 'Create Prompt'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
