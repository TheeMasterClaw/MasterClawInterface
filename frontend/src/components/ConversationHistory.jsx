'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getApiUrl } from '../lib/apiUrl.js';

const API_URL = getApiUrl();

const FILTERS = {
  all: 'All Messages',
  user: 'My Messages',
  mc: 'MC Responses',
  today: 'Today',
  week: 'This Week',
  month: 'This Month'
};

const EXPORT_FORMATS = {
  json: 'JSON',
  txt: 'Plain Text',
  md: 'Markdown'
};

export default function ConversationHistory({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesPerPage = 50;
  const searchInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load chat history
  const loadHistory = useCallback(async (reset = true) => {
    if (loading) return;
    setLoading(true);
    
    try {
      const currentPage = reset ? 1 : page;
      const limit = messagesPerPage * currentPage;
      
      const response = await fetch(`${API_URL}/chat/history?limit=${limit}`);
      const data = await response.json();
      
      if (data.messages) {
        setMessages(data.messages);
        setHasMore(data.count === limit);
        if (reset) {
          setPage(1);
        }
        calculateStats(data.messages);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  }, [page, loading]);

  // Calculate conversation statistics
  const calculateStats = (msgs) => {
    const userMessages = msgs.filter(m => m.role === 'user');
    const mcMessages = msgs.filter(m => m.role === 'mc' || m.role === 'assistant');
    
    const totalUserChars = userMessages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
    const totalMCChars = mcMessages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
    
    // Messages by day
    const byDay = msgs.reduce((acc, m) => {
      const day = new Date(m.createdAt).toDateString();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
    
    // Most active day
    const mostActiveDay = Object.entries(byDay)
      .sort((a, b) => b[1] - a[1])[0];
    
    setStats({
      totalMessages: msgs.length,
      userMessages: userMessages.length,
      mcMessages: mcMessages.length,
      avgUserMessageLength: userMessages.length > 0 ? Math.round(totalUserChars / userMessages.length) : 0,
      avgMCMessageLength: mcMessages.length > 0 ? Math.round(totalMCChars / mcMessages.length) : 0,
      totalUserChars,
      totalMCChars,
      uniqueDays: Object.keys(byDay).length,
      mostActiveDay: mostActiveDay ? { date: mostActiveDay[0], count: mostActiveDay[1] } : null,
      firstMessage: msgs[0]?.createdAt,
      lastMessage: msgs[msgs.length - 1]?.createdAt
    });
  };

  // Load on open
  useEffect(() => {
    if (isOpen) {
      loadHistory(true);
      // Focus search input
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, loadHistory]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...messages];
    
    // Apply role filter
    if (activeFilter === 'user') {
      filtered = filtered.filter(m => m.role === 'user');
    } else if (activeFilter === 'mc') {
      filtered = filtered.filter(m => m.role === 'mc' || m.role === 'assistant');
    } else if (activeFilter === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(m => new Date(m.createdAt).toDateString() === today);
    } else if (activeFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(m => new Date(m.createdAt) >= weekAgo);
    } else if (activeFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(m => new Date(m.createdAt) >= monthAgo);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.content?.toLowerCase().includes(query)
      );
    }
    
    setFilteredMessages(filtered);
  }, [messages, activeFilter, searchQuery]);

  // Load more messages
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadHistory(false);
    }
  };

  // Clear chat history
  const handleClearHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/chat/history`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMessages([]);
        setFilteredMessages([]);
        setConfirmClear(false);
        setStats(null);
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  // Export conversation
  const exportConversation = (format) => {
    const msgsToExport = searchQuery || activeFilter !== 'all' ? filteredMessages : messages;
    
    let content, filename, mimeType;
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'json':
        content = JSON.stringify(msgsToExport, null, 2);
        filename = `mc-conversation-${timestamp}.json`;
        mimeType = 'application/json';
        break;
      case 'txt':
        content = msgsToExport.map(m => {
          const date = new Date(m.createdAt).toLocaleString();
          const role = m.role === 'user' ? 'You' : 'MC';
          return `[${date}] ${role}:\n${m.content}\n`;
        }).join('\n---\n\n');
        filename = `mc-conversation-${timestamp}.txt`;
        mimeType = 'text/plain';
        break;
      case 'md':
        content = `# MasterClaw Conversation Export\n\n`;
        content += `**Date:** ${new Date().toLocaleString()}\n\n`;
        content += `**Messages:** ${msgsToExport.length}\n\n`;
        content += `---\n\n`;
        content += msgsToExport.map(m => {
          const date = new Date(m.createdAt).toLocaleString();
          const role = m.role === 'user' ? 'You' : 'MC';
          return `### ${role} - ${date}\n\n${m.content}\n`;
        }).join('\n---\n\n');
        filename = `mc-conversation-${timestamp}.md`;
        mimeType = 'text/markdown';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExportMenu(false);
  };

  // Copy message to clipboard
  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    // Show temporary feedback
    const btn = document.activeElement;
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = originalText, 1000);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();
    if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Highlight search matches
  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="conversation-history-overlay" onClick={onClose}>
      <div className="conversation-history-panel" onClick={e => e.stopPropagation()}>
        <div className="conversation-history-header">
          <div className="header-title">
            <h3>💬 Conversation History</h3>
            <span className="message-count">
              {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
              {(searchQuery || activeFilter !== 'all') && messages.length !== filteredMessages.length && 
                ` (of ${messages.length})`
              }
            </span>
          </div>
          <div className="header-actions">
            <button 
              className="action-btn stats-btn"
              onClick={() => setShowStats(!showStats)}
              title="View Statistics"
            >
              📊
            </button>
            <div className="export-dropdown">
              <button 
                className="action-btn export-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Export Conversation"
              >
                📥
              </button>
              {showExportMenu && (
                <div className="export-menu">
                  {Object.entries(EXPORT_FORMATS).map(([key, label]) => (
                    <button 
                      key={key} 
                      className="export-option"
                      onClick={() => exportConversation(key)}
                    >
                      Export as {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              className="action-btn clear-btn"
              onClick={() => setConfirmClear(true)}
              title="Clear History"
            >
              🗑️
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showStats && stats && (
          <div className="stats-panel">
            <h4>📈 Conversation Statistics</h4>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{stats.totalMessages}</span>
                <span className="stat-label">Total Messages</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.userMessages}</span>
                <span className="stat-label">Your Messages</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.mcMessages}</span>
                <span className="stat-label">MC Responses</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.uniqueDays}</span>
                <span className="stat-label">Active Days</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.avgUserMessageLength}</span>
                <span className="stat-label">Avg Your Length</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.avgMCMessageLength}</span>
                <span className="stat-label">Avg MC Length</span>
              </div>
            </div>
            {stats.mostActiveDay && (
              <div className="most-active-day">
                <strong>🏆 Most Active:</strong> {stats.mostActiveDay.date} ({stats.mostActiveDay.count} messages)
              </div>
            )}
          </div>
        )}

        <div className="search-filter-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          
          <div className="filter-tabs">
            {Object.entries(FILTERS).map(([key, label]) => (
              <button
                key={key}
                className={`filter-tab ${activeFilter === key ? 'active' : ''}`}
                onClick={() => setActiveFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="messages-container">
          {filteredMessages.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? (
                <>
                  <div className="empty-icon">🔍</div>
                  <p>No messages found matching "{searchQuery}"</p>
                  <button className="clear-filter-btn" onClick={() => {setSearchQuery(''); setActiveFilter('all');}}>
                    Clear Filters
                  </button>
                </>
              ) : (
                <>
                  <div className="empty-icon">💬</div>
                  <p>No conversation history yet</p>
                  <p className="empty-hint">Start chatting with MC to build your history!</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="messages-list">
                {filteredMessages.map((message, index) => {
                  const isUser = message.role === 'user';
                  const prevMessage = filteredMessages[index - 1];
                  const showDateDivider = prevMessage && 
                    new Date(prevMessage.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                  
                  return (
                    <React.Fragment key={message.id || index}>
                      {showDateDivider && (
                        <div className="date-divider">
                          <span>{new Date(message.createdAt).toLocaleDateString([], { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      )}
                      <div 
                        className={`message-item ${isUser ? 'user' : 'mc'} ${selectedMessage === message.id ? 'selected' : ''}`}
                        onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                      >
                        <div className="message-avatar">
                          {isUser ? '👤' : '🤖'}
                        </div>
                        <div className="message-content">
                          <div className="message-header">
                            <span className="message-author">{isUser ? 'You' : 'MC'}</span>
                            <span className="message-time">{formatDate(message.createdAt)}</span>
                          </div>
                          <div className="message-text">
                            {highlightText(message.content || '', searchQuery)}
                          </div>
                          {selectedMessage === message.id && (
                            <div className="message-actions">
                              <button 
                                className="msg-action-btn"
                                onClick={(e) => { e.stopPropagation(); copyMessage(message.content); }}
                              >
                                📋 Copy
                              </button>
                              {message.command && (
                                <span className="command-tag">/{message.command}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              
              {hasMore && !searchQuery && activeFilter === 'all' && (
                <div className="load-more-container">
                  <button 
                    className="load-more-btn"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {confirmClear && (
          <div className="confirm-dialog-overlay">
            <div className="confirm-dialog">
              <div className="confirm-icon">⚠️</div>
              <h4>Clear Conversation History?</h4>
              <p>This will permanently delete all {messages.length} messages. This action cannot be undone.</p>
              <div className="confirm-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-confirm"
                  onClick={handleClearHistory}
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
