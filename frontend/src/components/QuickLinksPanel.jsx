'use client';

import React, { useState, useEffect } from 'react';
// import './QuickLinksPanel.css';

const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Links', icon: '🔗' },
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'personal', name: 'Personal', icon: '🏠' },
  { id: 'reference', name: 'Reference', icon: '📚' },
  { id: 'tools', name: 'Tools', icon: '🛠️' },
  { id: 'media', name: 'Media', icon: '🎬' },
];

export default function QuickLinksPanel({ isOpen, onClose }) {
  const [links, setLinks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: 'work',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadLinks();
    }
  }, [isOpen]);

  const loadLinks = () => {
    const saved = localStorage.getItem('mc-quicklinks');
    if (saved) {
      setLinks(JSON.parse(saved));
    } else {
      // Set some default helpful links
      const defaults = [
        { id: '1', title: 'OpenClaw Docs', url: 'https://docs.openclaw.ai', category: 'reference', notes: 'Documentation for OpenClaw', createdAt: new Date().toISOString() },
        { id: '2', title: 'GitHub', url: 'https://github.com', category: 'tools', notes: 'Code repository', createdAt: new Date().toISOString() },
        { id: '3', title: 'Vercel Dashboard', url: 'https://vercel.com/dashboard', category: 'work', notes: 'Deployment platform', createdAt: new Date().toISOString() },
      ];
      setLinks(defaults);
      localStorage.setItem('mc-quicklinks', JSON.stringify(defaults));
    }
  };

  const saveLinks = (updatedLinks) => {
    setLinks(updatedLinks);
    localStorage.setItem('mc-quicklinks', JSON.stringify(updatedLinks));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.url.trim()) return;
    
    // Ensure URL has protocol
    let url = formData.url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    if (editingLink) {
      // Update existing
      const updated = links.map(l => 
        l.id === editingLink.id 
          ? { ...l, ...formData, url, updatedAt: new Date().toISOString() }
          : l
      );
      saveLinks(updated);
      setEditingLink(null);
    } else {
      // Create new
      const newLink = {
        id: Date.now().toString(),
        ...formData,
        url,
        createdAt: new Date().toISOString(),
        clickCount: 0
      };
      saveLinks([newLink, ...links]);
    }
    
    setFormData({ title: '', url: '', category: 'work', notes: '' });
    setShowAddForm(false);
  };

  const deleteLink = (id) => {
    if (confirm('Delete this link?')) {
      const updated = links.filter(l => l.id !== id);
      saveLinks(updated);
      if (editingLink?.id === id) {
        setEditingLink(null);
        setShowAddForm(false);
      }
    }
  };

  const editLink = (link) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      category: link.category,
      notes: link.notes || ''
    });
    setShowAddForm(true);
  };

  const copyToClipboard = async (link) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const incrementClickCount = (id) => {
    const updated = links.map(l => 
      l.id === id ? { ...l, clickCount: (l.clickCount || 0) + 1 } : l
    );
    saveLinks(updated);
  };

  const exportLinks = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      links
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quicklinks-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importLinks = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.links && Array.isArray(data.links)) {
          // Merge with existing, avoiding duplicates by URL
          const existingUrls = new Set(links.map(l => l.url));
          const newLinks = data.links.filter(l => !existingUrls.has(l.url));
          const merged = [...newLinks.map(l => ({ ...l, id: Date.now().toString() + Math.random() })), ...links];
          saveLinks(merged);
          alert(`Imported ${newLinks.length} new links`);
        }
      } catch (err) {
        alert('Failed to import: Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredLinks = links.filter(link => {
    const matchesSearch = 
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (link.notes && link.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || link.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort by click count (most used first) if no search query
  const sortedLinks = searchQuery.trim() 
    ? filteredLinks 
    : [...filteredLinks].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));

  const getCategoryIcon = (categoryId) => {
    const cat = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
    return cat?.icon || '🔗';
  };

  const getCategoryName = (categoryId) => {
    const cat = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
    return cat?.name || categoryId;
  };

  if (!isOpen) return null;

  return (
    <div className="quicklinks-panel-overlay" onClick={onClose}>
      <div className="quicklinks-panel" onClick={e => e.stopPropagation()}>
        <div className="quicklinks-header">
          <h3>🔗 Quick Links</h3>
          <div className="quicklinks-actions">
            <button 
              className="icon-btn" 
              onClick={exportLinks} 
              title="Export links"
            >
              📤
            </button>
            <label className="icon-btn" title="Import links">
              📥
              <input 
                type="file" 
                accept=".json" 
                onChange={importLinks} 
                style={{ display: 'none' }}
              />
            </label>
            <button 
              className="icon-btn add-btn" 
              onClick={() => {
                setEditingLink(null);
                setFormData({ title: '', url: '', category: 'work', notes: '' });
                setShowAddForm(true);
              }}
              title="Add new link"
            >
              +
            </button>
            <button className="icon-btn close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="quicklinks-toolbar">
          <input
            type="text"
            className="quicklinks-search"
            placeholder="Search links..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          
          <div className="category-filters">
            {DEFAULT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                {cat.id !== 'all' && (
                  <span className="count">
                    {links.filter(l => l.category === cat.id).length}
                  </span>
                )}
                {cat.id === 'all' && <span className="count">{links.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {showAddForm && (
          <div className="quicklinks-form-overlay" onClick={() => setShowAddForm(false)}>
            <form className="quicklinks-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <h4>{editingLink ? '✏️ Edit Link' : '➕ Add New Link'}</h4>
              
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., GitHub Repository"
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {DEFAULT_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes about this link..."
                  rows={2}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingLink ? 'Save Changes' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="quicklinks-list">
          {sortedLinks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🔗</span>
              <p>No links found</p>
              {searchQuery ? (
                <small>Try a different search term</small>
              ) : (
                <button onClick={() => setShowAddForm(true)}>Add your first link</button>
              )}
            </div>
          ) : (
            sortedLinks.map(link => (
              <div key={link.id} className="quicklink-card">
                <div className="quicklink-icon">
                  {getCategoryIcon(link.category)}
                </div>
                
                <div className="quicklink-content">
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="quicklink-title"
                    onClick={() => incrementClickCount(link.id)}
                  >
                    {link.title}
                  </a>
                  <div className="quicklink-url">
                    {link.url.replace(/^https?:\/\//, '').substring(0, 50)}
                    {link.url.replace(/^https?:\/\//, '').length > 50 && '...'}
                  </div>
                  {link.notes && (
                    <div className="quicklink-notes">{link.notes}</div>
                  )}
                  <div className="quicklink-meta">
                    <span className="category-badge">{getCategoryName(link.category)}</span>
                    {link.clickCount > 0 && (
                      <span className="click-count">👆 {link.clickCount} clicks</span>
                    )}
                  </div>
                </div>
                
                <div className="quicklink-actions">
                  <button
                    className="action-btn"
                    onClick={() => copyToClipboard(link)}
                    title="Copy URL"
                  >
                    {copiedId === link.id ? '✅' : '📋'}
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => editLink(link)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => deleteLink(link.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
