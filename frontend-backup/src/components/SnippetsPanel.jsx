import React, { useState, useEffect } from 'react';
import './SnippetsPanel.css';

export default function SnippetsPanel({ isOpen, onClose }) {
  const [snippets, setSnippets] = useState([]);
  const [newSnippet, setNewSnippet] = useState({ title: '', content: '', category: 'general', tags: '' });
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const categories = [
    { id: 'general', name: 'General', icon: '📝' },
    { id: 'code', name: 'Code', icon: '💻' },
    { id: 'email', name: 'Email Templates', icon: '📧' },
    { id: 'commands', name: 'Commands', icon: '⌨️' },
    { id: 'notes', name: 'Quick Notes', icon: '📌' },
    { id: 'links', name: 'URLs', icon: '🔗' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadSnippets();
    }
  }, [isOpen]);

  // Clear copied indicator after 2 seconds
  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  const loadSnippets = async () => {
    try {
      const response = await fetch('/snippets');
      const data = await response.json();
      setSnippets(data.snippets || []);
    } catch (err) {
      console.error('Failed to load snippets:', err);
      // Load from localStorage fallback
      const saved = localStorage.getItem('mc-snippets');
      if (saved) {
        setSnippets(JSON.parse(saved));
      }
    }
  };

  const saveToLocalStorage = (data) => {
    localStorage.setItem('mc-snippets', JSON.stringify(data));
  };

  const addSnippet = async () => {
    if (!newSnippet.title.trim() || !newSnippet.content.trim()) return;

    const snippetData = {
      title: newSnippet.title.trim(),
      content: newSnippet.content.trim(),
      category: newSnippet.category,
      tags: newSnippet.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      const response = await fetch('/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snippetData)
      });
      
      if (response.ok) {
        const result = await response.json();
        const updated = [result.snippet, ...snippets];
        setSnippets(updated);
        saveToLocalStorage(updated);
      }
    } catch (err) {
      console.error('Failed to add snippet:', err);
      // Fallback to localStorage
      const localSnippet = {
        id: Date.now().toString(),
        ...snippetData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [localSnippet, ...snippets];
      setSnippets(updated);
      saveToLocalStorage(updated);
    }

    setNewSnippet({ title: '', content: '', category: 'general', tags: '' });
  };

  const updateSnippet = async (id, updates) => {
    try {
      const response = await fetch(`/snippets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updated = snippets.map(s => 
          s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
        );
        setSnippets(updated);
        saveToLocalStorage(updated);
      }
    } catch (err) {
      console.error('Failed to update snippet:', err);
      const updated = snippets.map(s => 
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      );
      setSnippets(updated);
      saveToLocalStorage(updated);
    }
    setEditingId(null);
  };

  const deleteSnippet = async (id) => {
    if (!confirm('Delete this snippet?')) return;

    try {
      await fetch(`/snippets/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete snippet from server:', err);
    }

    const updated = snippets.filter(s => s.id !== id);
    setSnippets(updated);
    saveToLocalStorage(updated);
  };

  const copyToClipboard = async (content, id) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const incrementUsage = async (id) => {
    const snippet = snippets.find(s => s.id === id);
    if (!snippet) return;

    const updates = { usageCount: (snippet.usageCount || 0) + 1 };
    
    try {
      await fetch(`/snippets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      // Silent fail for usage tracking
    }

    const updated = snippets.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    setSnippets(updated);
    saveToLocalStorage(updated);
  };

  const handleCopy = (snippet) => {
    copyToClipboard(snippet.content, snippet.id);
    incrementUsage(snippet.id);
  };

  const filteredSnippets = snippets.filter(s => {
    const matchesFilter = filter === 'all' || s.category === filter;
    const matchesSearch = !searchQuery || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

  const getCategoryIcon = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.icon : '📝';
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'General';
  };

  // Get recent and most used snippets for quick access
  const recentSnippets = [...snippets]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);

  const mostUsedSnippets = [...snippets]
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
    .slice(0, 3);

  if (!isOpen) return null;

  return (
    <div className="snippets-panel-overlay" onClick={onClose}>
      <div className="snippets-panel" onClick={e => e.stopPropagation()}>
        <div className="snippets-panel-header">
          <h3>📦 Snippets Vault</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="snippets-quick-access">
          {recentSnippets.length > 0 && (
            <div className="quick-section">
              <span className="quick-label">Recent:</span>
              {recentSnippets.map(s => (
                <button 
                  key={`recent-${s.id}`}
                  className="quick-chip"
                  onClick={() => handleCopy(s)}
                  title={s.title}
                >
                  {getCategoryIcon(s.category)} {s.title.length > 20 ? s.title.slice(0, 20) + '...' : s.title}
                </button>
              ))}
            </div>
          )}
          {mostUsedSnippets.length > 0 && (
            <div className="quick-section">
              <span className="quick-label">Popular:</span>
              {mostUsedSnippets.map(s => (
                <button 
                  key={`popular-${s.id}`}
                  className="quick-chip popular"
                  onClick={() => handleCopy(s)}
                  title={`Used ${s.usageCount || 0} times`}
                >
                  ⭐ {s.title.length > 20 ? s.title.slice(0, 20) + '...' : s.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="snippets-panel-filters">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All ({snippets.length})
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              className={filter === cat.id ? 'active' : ''} 
              onClick={() => setFilter(cat.id)}
            >
              {cat.icon} {cat.name} ({snippets.filter(s => s.category === cat.id).length})
            </button>
          ))}
        </div>

        <div className="snippets-search">
          <input
            type="text"
            placeholder="🔍 Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="snippets-add">
          <input
            type="text"
            placeholder="Title..."
            value={newSnippet.title}
            onChange={(e) => setNewSnippet({...newSnippet, title: e.target.value})}
          />
          <select
            value={newSnippet.category}
            onChange={(e) => setNewSnippet({...newSnippet, category: e.target.value})}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Tags (comma separated)..."
            value={newSnippet.tags}
            onChange={(e) => setNewSnippet({...newSnippet, tags: e.target.value})}
          />
          <textarea
            placeholder="Content... (use this for code, templates, or any text you reuse often)"
            value={newSnippet.content}
            onChange={(e) => setNewSnippet({...newSnippet, content: e.target.value})}
            rows={3}
          />
          <button onClick={addSnippet} className="add-btn">➕ Add Snippet</button>
        </div>

        <div className="snippets-list">
          {filteredSnippets.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? 'No snippets match your search.' : 'No snippets yet. Add your first one above!'}
            </div>
          ) : (
            filteredSnippets.map(snippet => (
              <div key={snippet.id} className={`snippet-item ${snippet.category}`}>
                {editingId === snippet.id ? (
                  <div className="snippet-edit">
                    <input
                      type="text"
                      defaultValue={snippet.title}
                      onBlur={(e) => updateSnippet(snippet.id, { title: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          updateSnippet(snippet.id, { title: e.target.value });
                        }
                      }}
                      autoFocus
                    />
                    <textarea
                      defaultValue={snippet.content}
                      onBlur={(e) => updateSnippet(snippet.id, { content: e.target.value })}
                      rows={3}
                    />
                    <button onClick={() => setEditingId(null)}>Done</button>
                  </div>
                ) : (
                  <>
                    <div className="snippet-header">
                      <span className="snippet-icon">{getCategoryIcon(snippet.category)}</span>
                      <span className="snippet-title">{snippet.title}</span>
                      {snippet.usageCount > 0 && (
                        <span className="snippet-usage">{snippet.usageCount}×</span>
                      )}
                      <div className="snippet-actions">
                        <button 
                          onClick={() => handleCopy(snippet)}
                          className={copiedId === snippet.id ? 'copied' : ''}
                          title="Copy to clipboard"
                        >
                          {copiedId === snippet.id ? '✓ Copied!' : '📋'}
                        </button>
                        <button onClick={() => setEditingId(snippet.id)} title="Edit">✏️</button>
                        <button onClick={() => deleteSnippet(snippet.id)} title="Delete">🗑️</button>
                      </div>
                    </div>
                    <pre className="snippet-content">{snippet.content}</pre>
                    {snippet.tags && snippet.tags.length > 0 && (
                      <div className="snippet-tags">
                        {snippet.tags.map((tag, i) => (
                          <span key={i} className="snippet-tag">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="snippet-meta">
                      <span>{getCategoryName(snippet.category)}</span>
                      <span>•</span>
                      <span>{new Date(snippet.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
