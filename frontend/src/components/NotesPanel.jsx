'use client';

import React, { useState, useEffect, useMemo } from 'react';
// import './NotesPanel.css';

const NOTE_COLORS = [
  { id: 'default', bg: '#1e293b', border: '#334155' },
  { id: 'blue', bg: '#1e3a5f', border: '#3b82f6' },
  { id: 'green', bg: '#14532d', border: '#22c55e' },
  { id: 'yellow', bg: '#713f12', border: '#eab308' },
  { id: 'red', bg: '#7f1d1d', border: '#ef4444' },
  { id: 'purple', bg: '#581c87', border: '#a855f7' },
  { id: 'pink', bg: '#831843', border: '#ec4899' },
];

const MAX_CHARS = 2000;

export default function NotesPanel({ isOpen, onClose }) {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'updated'

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [],
    color: 'default',
    isPinned: false,
  });
  const [tagInput, setTagInput] = useState('');

  // Load notes from localStorage
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('mc-notes');
      if (saved) {
        try {
          setNotes(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse notes:', e);
        }
      }
    }
  }, [isOpen]);

  // Save notes to localStorage
  const saveNotes = (updatedNotes) => {
    setNotes(updatedNotes);
    localStorage.setItem('mc-notes', JSON.stringify(updatedNotes));
  };

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    notes.forEach(note => note.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [notes]);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      const matchesSearch = 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = !selectedTag || note.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });

    // Sort: pinned first, then by sort preference
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'updated':
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  }, [notes, searchQuery, selectedTag, sortBy]);

  // Get pinned notes count
  const pinnedCount = notes.filter(n => n.isPinned).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() && !formData.content.trim()) return;

    const now = new Date().toISOString();
    
    if (editingNote) {
      // Update existing
      const updated = notes.map(n => 
        n.id === editingNote.id 
          ? { ...n, ...formData, updatedAt: now }
          : n
      );
      saveNotes(updated);
      setEditingNote(null);
    } else {
      // Create new
      const newNote = {
        id: Date.now().toString(),
        ...formData,
        createdAt: now,
        updatedAt: now,
      };
      saveNotes([newNote, ...notes]);
    }
    
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      tags: [],
      color: 'default',
      isPinned: false,
    });
    setTagInput('');
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      color: note.color || 'default',
      isPinned: note.isPinned || false,
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this note?')) {
      const updated = notes.filter(n => n.id !== id);
      saveNotes(updated);
      if (editingNote?.id === id) {
        setEditingNote(null);
        setShowForm(false);
        resetForm();
      }
    }
  };

  const togglePin = (id) => {
    const updated = notes.map(n => 
      n.id === id ? { ...n, isPinned: !n.isPinned } : n
    );
    saveNotes(updated);
  };

  const duplicateNote = (note) => {
    const newNote = {
      ...note,
      id: Date.now().toString(),
      title: `${note.title} (Copy)`,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveNotes([newNote, ...notes]);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tagToRemove),
    });
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      removeTag(formData.tags[formData.tags.length - 1]);
    }
  };

  const exportNotes = () => {
    const markdown = notes.map(note => {
      const date = new Date(note.createdAt).toLocaleDateString();
      const tags = note.tags?.length ? `\n\n**Tags:** ${note.tags.map(t => `#${t}`).join(' ')}` : '';
      return `## ${note.title}\n\n*Created: ${date}*${tags}\n\n${note.content}\n\n---\n`;
    }).join('\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getColorStyle = (colorId) => {
    const color = NOTE_COLORS.find(c => c.id === colorId) || NOTE_COLORS[0];
    return {
      background: color.bg,
      borderColor: color.border,
    };
  };

  if (!isOpen) return null;

  return (
    <div className="notes-panel-overlay" onClick={onClose}>
      <div className="notes-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="notes-panel-header">
          <div className="notes-title-section">
            <h3>📝 Notes</h3>
            <span className="notes-count">{notes.length} notes</span>
          </div>
          <div className="notes-header-actions">
            <button 
              className="icon-btn" 
              onClick={exportNotes}
              title="Export as Markdown"
            >
              📤
            </button>
            <button 
              className={`icon-btn view-toggle ${viewMode}`}
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              title={viewMode === 'grid' ? 'List view' : 'Grid view'}
            >
              {viewMode === 'grid' ? '☰' : '⊞'}
            </button>
            <button 
              className="icon-btn add-btn" 
              onClick={() => {
                setEditingNote(null);
                resetForm();
                setShowForm(true);
              }}
              title="New note"
            >
              +
            </button>
            <button className="icon-btn close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="notes-toolbar">
          <div className="notes-search-wrapper">
            <input
              type="text"
              className="notes-search"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="clear-search"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>
          
          <select 
            className="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="updated">Last updated</option>
          </select>
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="notes-tag-filters">
            <button
              className={`tag-pill ${!selectedTag ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag-pill ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="notes-form-overlay" onClick={() => setShowForm(false)}>
            <form 
              className="notes-form" 
              onClick={e => e.stopPropagation()} 
              onSubmit={handleSubmit}
              style={getColorStyle(formData.color)}
            >
              <div className="notes-form-header">
                <h4>{editingNote ? '✏️ Edit Note' : '📝 New Note'}</h4>
                <button
                  type="button"
                  className={`pin-btn ${formData.isPinned ? 'pinned' : ''}`}
                  onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
                  title={formData.isPinned ? 'Unpin' : 'Pin'}
                >
                  {formData.isPinned ? '📌' : '📍'}
                </button>
              </div>
              
              <div className="form-group">
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Note title..."
                  className="title-input"
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <textarea
                  value={formData.content}
                  onChange={e => {
                    if (e.target.value.length <= MAX_CHARS) {
                      setFormData({ ...formData, content: e.target.value });
                    }
                  }}
                  placeholder="Write your note here..."
                  rows={8}
                  className="content-textarea"
                />
                <div className={`char-count ${formData.content.length >= MAX_CHARS * 0.9 ? 'warning' : ''}`}>
                  {formData.content.length}/{MAX_CHARS}
                </div>
              </div>

              {/* Tags input */}
              <div className="form-group">
                <div className="tags-input-wrapper">
                  {formData.tags.map(tag => (
                    <span key={tag} className="tag-chip">
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={addTag}
                    placeholder={formData.tags.length === 0 ? "Add tags..." : ""}
                    className="tag-input"
                  />
                </div>
              </div>

              {/* Color picker */}
              <div className="form-group color-picker">
                <label>Color:</label>
                <div className="color-options">
                  {NOTE_COLORS.map(color => (
                    <button
                      key={color.id}
                      type="button"
                      className={`color-option ${formData.color === color.id ? 'selected' : ''}`}
                      style={{ background: color.border }}
                      onClick={() => setFormData({ ...formData, color: color.id })}
                      title={color.id}
                    />
                  ))}
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={!formData.title.trim() && !formData.content.trim()}
                >
                  {editingNote ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes Grid/List */}
        <div className={`notes-container ${viewMode}`}>
          {filteredNotes.length === 0 ? (
            <div className="notes-empty-state">
              <span className="empty-icon">📝</span>
              <p>{searchQuery || selectedTag ? 'No notes found' : 'No notes yet'}</p>
              <small>
                {searchQuery || selectedTag 
                  ? 'Try different search terms' 
                  : 'Click + to create your first note'}
              </small>
            </div>
          ) : (
            <>
              {/* Pinned section */}
              {pinnedCount > 0 && !searchQuery && !selectedTag && (
                <div className="notes-section">
                  <h5 className="section-label">📌 Pinned</h5>
                  <div className={`notes-${viewMode}`}>
                    {filteredNotes
                      .filter(n => n.isPinned)
                      .map(note => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          viewMode={viewMode}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onTogglePin={togglePin}
                          onDuplicate={duplicateNote}
                          formatDate={formatDate}
                          getWordCount={getWordCount}
                          getColorStyle={getColorStyle}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Other notes */}
              <div className={`notes-${viewMode}`}>
                {filteredNotes
                  .filter(n => !n.isPinned || searchQuery || selectedTag)
                  .map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      viewMode={viewMode}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onTogglePin={togglePin}
                      onDuplicate={duplicateNote}
                      formatDate={formatDate}
                      getWordCount={getWordCount}
                      getColorStyle={getColorStyle}
                    />
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Note Card Component
function NoteCard({ 
  note, 
  viewMode, 
  onEdit, 
  onDelete, 
  onTogglePin, 
  onDuplicate,
  formatDate, 
  getWordCount,
  getColorStyle 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const style = getColorStyle(note.color);

  return (
    <div 
      className={`note-card ${viewMode} ${note.isPinned ? 'pinned' : ''}`}
      style={style}
      onClick={() => onEdit(note)}
    >
      {note.isPinned && <div className="pin-indicator">📌</div>}
      
      <div className="note-header">
        <h4 className="note-title">{note.title || 'Untitled'}</h4>
        <div className="note-menu-wrapper">
          <button 
            className="menu-btn"
            onClick={e => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            ⋮
          </button>
          {showMenu && (
            <div className="note-menu">
              <button onClick={e => { e.stopPropagation(); onTogglePin(note.id); setShowMenu(false); }}>
                {note.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button onClick={e => { e.stopPropagation(); onDuplicate(note); setShowMenu(false); }}>
                Duplicate
              </button>
              <button onClick={e => { e.stopPropagation(); onEdit(note); setShowMenu(false); }}>
                Edit
              </button>
              <button className="delete" onClick={e => { e.stopPropagation(); onDelete(note.id); setShowMenu(false); }}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="note-content-preview">
        {note.content.substring(0, 150)}
        {note.content.length > 150 && '...'}
      </div>

      {note.tags?.length > 0 && (
        <div className="note-tags">
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="note-tag">#{tag}</span>
          ))}
          {note.tags.length > 3 && (
            <span className="note-tag more">+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="note-footer">
        <span className="note-date">{formatDate(note.updatedAt || note.createdAt)}</span>
        <span className="note-stats">
          {getWordCount(note.content)} words
        </span>
      </div>
    </div>
  );
}
