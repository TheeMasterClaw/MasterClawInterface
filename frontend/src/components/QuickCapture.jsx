import React, { useState, useEffect, useRef, useCallback } from 'react';
// import './QuickCapture.css';

const CAPTURE_TYPES = [
  { id: 'thought', label: '💭 Thought', color: '#6366f1', icon: '💭' },
  { id: 'task', label: '✅ Task', color: '#10b981', icon: '✅' },
  { id: 'idea', label: '💡 Idea', color: '#f59e0b', icon: '💡' },
  { id: 'reminder', label: '⏰ Reminder', color: '#ef4444', icon: '⏰' },
  { id: 'gratitude', label: '🙏 Gratitude', color: '#ec4899', icon: '🙏' },
  { id: 'bookmark', label: '🔖 Link', color: '#8b5cf6', icon: '🔖' }
];

const QUICK_TAGS = ['urgent', 'later', 'review', 'personal', 'work', 'creative'];

export default function QuickCapture({ isOpen, onClose }) {
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState('thought');
  const [selectedTags, setSelectedTags] = useState([]);
  const [recentCaptures, setRecentCaptures] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [url, setUrl] = useState('');
  const textareaRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent captures
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-quick-captures');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRecentCaptures(parsed.slice(0, 10));
        } catch (e) {
          console.error('Failed to parse captures:', e);
        }
      }
      // Focus input immediately
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  // Save captures
  const saveCaptures = useCallback((captures) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-quick-captures', JSON.stringify(captures.slice(0, 50)));
    }
  }, []);

  // Handle capture submission
  const handleCapture = useCallback(() => {
    if (!content.trim() && !url.trim()) return;

    const newCapture = {
      id: Date.now(),
      content: content.trim(),
      url: url.trim(),
      type: selectedType,
      tags: selectedTags,
      timestamp: new Date().toISOString(),
      processed: false
    };

    const updated = [newCapture, ...recentCaptures];
    setRecentCaptures(updated);
    saveCaptures(updated);

    // Also save to appropriate storage based on type
    saveToAppropriateStorage(newCapture);

    // Reset form
    setContent('');
    setUrl('');
    setSelectedTags([]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);

    // Keep focus for rapid entry
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [content, url, selectedType, selectedTags, recentCaptures, saveCaptures]);

  // Save to appropriate storage based on type
  const saveToAppropriateStorage = (capture) => {
    if (typeof window === 'undefined') return;

    switch (capture.type) {
      case 'task':
        const tasks = JSON.parse(localStorage.getItem('mc-tasks') || '[]');
        tasks.push({
          id: Date.now(),
          title: capture.content,
          tags: capture.tags,
          createdAt: capture.timestamp,
          completed: false
        });
        localStorage.setItem('mc-tasks', JSON.stringify(tasks));
        break;

      case 'idea':
        const ideas = JSON.parse(localStorage.getItem('mc-ideas') || '[]');
        ideas.push({
          id: Date.now(),
          content: capture.content,
          tags: capture.tags,
          createdAt: capture.timestamp,
          status: 'captured'
        });
        localStorage.setItem('mc-ideas', JSON.stringify(ideas));
        break;

      case 'gratitude':
        const gratitude = JSON.parse(localStorage.getItem('mc-gratitude') || '[]');
        gratitude.push({
          id: Date.now(),
          content: capture.content,
          timestamp: capture.timestamp,
          mood: 'grateful'
        });
        localStorage.setItem('mc-gratitude', JSON.stringify(gratitude));
        break;

      case 'bookmark':
        const bookmarks = JSON.parse(localStorage.getItem('mc-bookmarks') || '[]');
        bookmarks.push({
          id: Date.now(),
          title: capture.content || capture.url,
          url: capture.url,
          tags: capture.tags,
          createdAt: capture.timestamp
        });
        localStorage.setItem('mc-bookmarks', JSON.stringify(bookmarks));
        break;

      default:
        // Thought and reminder just stay in quick captures
        break;
    }
  };

  // Toggle tag selection
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Delete a capture
  const deleteCapture = (id) => {
    const updated = recentCaptures.filter(c => c.id !== id);
    setRecentCaptures(updated);
    saveCaptures(updated);
  };

  // Mark capture as processed
  const markProcessed = (id) => {
    const updated = recentCaptures.map(c => 
      c.id === id ? { ...c, processed: !c.processed } : c
    );
    setRecentCaptures(updated);
    saveCaptures(updated);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleCapture();
    } else if (e.key === 'Escape') {
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose();
      }
    }
  };

  // Format relative time
  const getRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Get type config
  const getTypeConfig = (typeId) => CAPTURE_TYPES.find(t => t.id === typeId) || CAPTURE_TYPES[0];

  if (!isOpen) return null;

  return (
    <div className="quick-capture-overlay" onClick={onClose}>
      <div 
        className={`quick-capture-panel ${isExpanded ? 'expanded' : ''}`} 
        onClick={e => e.stopPropagation()}
      >
        <div className="quick-capture-header">
          <h3>⚡ Quick Capture</h3>
          <div className="header-actions">
            <button 
              className="expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '⬜' : '⬛'}
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="quick-capture-content">
          {/* Type Selector */}
          <div className="capture-types">
            {CAPTURE_TYPES.map(type => (
              <button
                key={type.id}
                className={`type-btn ${selectedType === type.id ? 'active' : ''}`}
                onClick={() => setSelectedType(type.id)}
                style={{ '--type-color': type.color }}
                title={type.label}
              >
                <span className="type-icon">{type.icon}</span>
                <span className="type-label">{type.label.split(' ')[1]}</span>
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="capture-input-area">
            {selectedType === 'bookmark' ? (
              <div className="bookmark-inputs">
                <input
                  ref={inputRef}
                  type="url"
                  className="capture-input"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <input
                  type="text"
                  className="capture-input"
                  placeholder="Title (optional)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                className="capture-textarea"
                placeholder={`Capture your ${selectedType}...`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={isExpanded ? 4 : 2}
              />
            )}

            {/* Quick Tags */}
            <div className="quick-tags">
              {QUICK_TAGS.map(tag => (
                <button
                  key={tag}
                  className={`quick-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>

            {/* Capture Button */}
            <button 
              className={`capture-submit-btn ${showSuccess ? 'success' : ''}`}
              onClick={handleCapture}
              disabled={!content.trim() && !url.trim()}
            >
              {showSuccess ? '✓ Captured!' : '⚡ Capture (Ctrl+Enter)'}
            </button>
          </div>

          {/* Recent Captures */}
          {recentCaptures.length > 0 && (
            <div className="recent-captures">
              <div className="recent-header">
                <h4>Recent Captures</h4>
                <span className="capture-count">{recentCaptures.length}</span>
              </div>
              <div className="captures-list">
                {recentCaptures.map(capture => {
                  const typeConfig = getTypeConfig(capture.type);
                  return (
                    <div 
                      key={capture.id} 
                      className={`capture-item ${capture.processed ? 'processed' : ''}`}
                      style={{ '--type-color': typeConfig.color }}
                    >
                      <div className="capture-item-header">
                        <span className="capture-type-icon">{typeConfig.icon}</span>
                        <span className="capture-time">{getRelativeTime(capture.timestamp)}</span>
                        <div className="capture-actions">
                          <button 
                            className="action-btn"
                            onClick={() => markProcessed(capture.id)}
                            title={capture.processed ? 'Mark unprocessed' : 'Mark processed'}
                          >
                            {capture.processed ? '↩️' : '✓'}
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => deleteCapture(capture.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="capture-content">
                        {capture.url && (
                          <a 
                            href={capture.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="capture-link"
                          >
                            🔗 {capture.content || capture.url}
                          </a>
                        )}
                        {!capture.url && capture.content}
                      </div>
                      {capture.tags.length > 0 && (
                        <div className="capture-tags">
                          {capture.tags.map(tag => (
                            <span key={tag} className="capture-tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {recentCaptures.length === 0 && (
            <div className="captures-empty">
              <div className="empty-icon">📝</div>
              <p>No captures yet</p>
              <p className="empty-hint">Start capturing thoughts, tasks, and ideas!</p>
            </div>
          )}

          {/* Integration Info */}
          <div className="integration-info">
            <p>💡 Captures sync with:</p>
            <div className="integrations">
              <span className="integration">✅ Tasks</span>
              <span className="integration">💡 Ideas</span>
              <span className="integration">🙏 Gratitude</span>
              <span className="integration">🔖 Bookmarks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
