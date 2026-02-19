'use client';

import React, { useState, useEffect, useMemo } from 'react';
// import './ActivityLogPanel.css';

// Activity types with icons and colors
const ACTIVITY_TYPES = {
  message: { icon: '💬', label: 'Message', color: '#3b82f6' },
  command: { icon: '⚡', label: 'Command', color: '#f59e0b' },
  task: { icon: '✅', label: 'Task', color: '#22c55e' },
  calendar: { icon: '📅', label: 'Calendar', color: '#8b5cf6' },
  note: { icon: '📝', label: 'Note', color: '#ec4899' },
  setting: { icon: '⚙️', label: 'Setting', color: '#6b7280' },
  system: { icon: '🔔', label: 'System', color: '#14b8a6' },
  error: { icon: '❌', label: 'Error', color: '#ef4444' }
};

export default function ActivityLogPanel({ isOpen, onClose }) {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [dateRange, setDateRange] = useState('today'); // today, week, month, all

  // Load activities on mount
  useEffect(() => {
    loadActivities();
    
    // Set up listener for new activities
    const handleActivity = (e) => {
      if (e.detail) {
        addActivity(e.detail);
      }
    };
    
    window.addEventListener('mc-activity', handleActivity);
    return () => window.removeEventListener('mc-activity', handleActivity);
  }, []);

  const loadActivities = () => {
    const saved = localStorage.getItem('mc-activity-log');
    if (saved) {
      setActivities(JSON.parse(saved));
    } else {
      // Initialize with some sample data for first-time users
      const sampleActivities = generateSampleActivities();
      setActivities(sampleActivities);
      saveActivities(sampleActivities);
    }
  };

  const saveActivities = (acts) => {
    localStorage.setItem('mc-activity-log', JSON.stringify(acts));
  };

  const addActivity = (activity) => {
    const newActivity = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...activity
    };
    
    setActivities(prev => {
      const updated = [newActivity, ...prev].slice(0, 1000); // Keep last 1000
      saveActivities(updated);
      return updated;
    });
  };

  const clearActivities = () => {
    if (confirm('Are you sure you want to clear all activity history?')) {
      setActivities([]);
      localStorage.removeItem('mc-activity-log');
    }
  };

  const deleteActivity = (id) => {
    setActivities(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveActivities(updated);
      return updated;
    });
    if (selectedActivity?.id === id) {
      setSelectedActivity(null);
    }
  };

  // Export activities as JSON
  const exportActivities = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      activities: filteredActivities
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate sample activities for first-time users
  const generateSampleActivities = () => {
    const now = new Date();
    return [
      {
        id: '1',
        type: 'system',
        title: 'Welcome to MasterClaw',
        description: 'Activity tracking is now enabled. Your interactions will be logged here.',
        timestamp: new Date(now - 3600000).toISOString()
      },
      {
        id: '2',
        type: 'message',
        title: 'Chat message sent',
        description: 'User: "Hello, MasterClaw!"',
        timestamp: new Date(now - 3000000).toISOString()
      },
      {
        id: '3',
        type: 'task',
        title: 'Task created',
        description: 'Added: "Review project documentation"',
        metadata: { taskId: 'sample-1' },
        timestamp: new Date(now - 2400000).toISOString()
      },
      {
        id: '4',
        type: 'setting',
        title: 'Settings updated',
        description: 'Changed theme to dark mode',
        timestamp: new Date(now - 1800000).toISOString()
      }
    ];
  };

  // Filter activities based on selected criteria
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(a => a.type === filter);
    }

    // Apply date range filter
    const now = new Date();
    switch (dateRange) {
      case 'today':
        filtered = filtered.filter(a => {
          const date = new Date(a.timestamp);
          return date.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(a => new Date(a.timestamp) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(a => new Date(a.timestamp) >= monthAgo);
        break;
      default:
        break;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title?.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activities, filter, dateRange, searchQuery]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups = {};
    filteredActivities.forEach(activity => {
      const date = new Date(activity.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    return groups;
  }, [filteredActivities]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = activities.length;
    const byType = {};
    Object.keys(ACTIVITY_TYPES).forEach(type => {
      byType[type] = activities.filter(a => a.type === type).length;
    });
    
    const today = activities.filter(a => {
      const date = new Date(a.timestamp);
      return date.toDateString() === new Date().toDateString();
    }).length;

    return { total, byType, today };
  }, [activities]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today - 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRelativeTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(timestamp);
  };

  if (!isOpen) return null;

  return (
    <div className="activity-panel-overlay" onClick={onClose}>
      <div className="activity-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="activity-panel-header">
          <h2>📊 Activity Log</h2>
          <div className="activity-panel-actions">
            <button onClick={exportActivities} title="Export">
              📥
            </button>
            <button onClick={clearActivities} title="Clear All">
              🗑️
            </button>
            <button onClick={onClose} title="Close">
              ×
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="activity-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Activities</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.today}</div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {Object.entries(stats.byType)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
            </div>
            <div className="stat-label">Most Active</div>
          </div>
        </div>

        {/* Filters */}
        <div className="activity-filters">
          <div className="filter-row">
            <input
              type="text"
              className="activity-search"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <select 
              className="date-filter"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="type-filters">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({activities.length})
            </button>
            {Object.entries(ACTIVITY_TYPES).map(([type, config]) => (
              <button
                key={type}
                className={filter === type ? 'active' : ''}
                onClick={() => setFilter(type)}
                style={{ '--type-color': config.color }}
              >
                {config.icon} {config.label} ({stats.byType[type] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Activity List */}
        <div className="activity-list-container">
          {filteredActivities.length === 0 ? (
            <div className="activity-empty">
              <div className="empty-icon">📭</div>
              <p>No activities found</p>
              <span>Try adjusting your filters or search query</span>
            </div>
          ) : (
            Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <div key={date} className="activity-day">
                <div className="activity-day-header">
                  <span className="day-label">{formatDate(date)}</span>
                  <span className="day-count">{dayActivities.length} activities</span>
                </div>
                
                <div className="activity-timeline">
                  {dayActivities.map((activity, index) => {
                    const typeConfig = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.system;
                    const isLast = index === dayActivities.length - 1;
                    
                    return (
                      <div 
                        key={activity.id} 
                        className={`activity-item ${selectedActivity?.id === activity.id ? 'selected' : ''}`}
                        onClick={() => setSelectedActivity(activity)}
                      >
                        <div 
                          className="activity-timeline-dot"
                          style={{ background: typeConfig.color }}
                        >
                          {typeConfig.icon}
                        </div>
                        {!isLast && <div className="activity-timeline-line" />}
                        
                        <div className="activity-content">
                          <div className="activity-header">
                            <span className="activity-type-badge" style={{ color: typeConfig.color }}>
                              {typeConfig.label}
                            </span>
                            <span className="activity-time" title={new Date(activity.timestamp).toLocaleString()}>
                              {formatTime(activity.timestamp)}
                            </span>
                          </div>
                          <div className="activity-title">{activity.title}</div>
                          {activity.description && (
                            <div className="activity-description">{activity.description}</div>
                          )}
                        </div>
                        
                        <button 
                          className="activity-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteActivity(activity.id);
                          }}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Activity Detail Panel */}
        {selectedActivity && (
          <div className="activity-detail-panel">
            <div className="detail-header">
              <h4>Activity Details</h4>
              <button onClick={() => setSelectedActivity(null)}>×</button>
            </div>
            <div className="detail-content">
              <div className="detail-row">
                <span className="detail-label">Type</span>
                <span className="detail-value">
                  {ACTIVITY_TYPES[selectedActivity.type]?.icon} {ACTIVITY_TYPES[selectedActivity.type]?.label}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Time</span>
                <span className="detail-value">
                  {new Date(selectedActivity.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Title</span>
                <span className="detail-value">{selectedActivity.title}</span>
              </div>
              {selectedActivity.description && (
                <div className="detail-row">
                  <span className="detail-label">Description</span>
                  <span className="detail-value">{selectedActivity.description}</span>
                </div>
              )}
              {selectedActivity.metadata && (
                <div className="detail-row">
                  <span className="detail-label">Metadata</span>
                  <pre className="detail-metadata">
                    {JSON.stringify(selectedActivity.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Utility function to log activities from other components
export const logActivity = (activity) => {
  const event = new CustomEvent('mc-activity', { detail: activity });
  window.dispatchEvent(event);
};
