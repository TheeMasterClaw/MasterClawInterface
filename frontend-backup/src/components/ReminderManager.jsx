import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ReminderManager.css';

const CATEGORIES = [
  { id: 'general', label: 'General', icon: '📌', color: '#6366f1' },
  { id: 'work', label: 'Work', icon: '💼', color: '#3b82f6' },
  { id: 'personal', label: 'Personal', icon: '🏠', color: '#10b981' },
  { id: 'health', label: 'Health', icon: '❤️', color: '#ef4444' },
  { id: 'learning', label: 'Learning', icon: '📚', color: '#f59e0b' },
  { id: 'meeting', label: 'Meeting', icon: '🤝', color: '#8b5cf6' },
  { id: 'bill', label: 'Bill Payment', icon: '💳', color: '#ec4899' },
  { id: 'birthday', label: 'Birthday', icon: '🎂', color: '#f97316' }
];

const RECURRING_OPTIONS = [
  { id: 'none', label: 'One-time' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' }
];

const STORAGE_KEY = 'mc-reminders';
const NOTIFICATION_SETTINGS_KEY = 'mc-reminder-notifications';

export default function ReminderManager({ isOpen, onClose }) {
  const [reminders, setReminders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationPermission, setNotificationPermission] = useState('default');
  const audioRef = useRef(null);
  const checkIntervalRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    datetime: '',
    category: 'general',
    recurring: 'none',
    priority: 'normal',
    snoozeMinutes: 5
  });

  // Load reminders on mount
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Convert date strings back to date objects for comparison
          setReminders(parsed.map(r => ({
            ...r,
            createdAt: r.createdAt || new Date().toISOString()
          })));
        } catch (e) {
          console.error('Failed to parse reminders:', e);
        }
      }

      // Check notification permission
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    }
  }, [isOpen]);

  // Save reminders whenever they change
  const saveReminders = useCallback((newReminders) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newReminders));
    }
  }, []);

  useEffect(() => {
    saveReminders(reminders);
  }, [reminders, saveReminders]);

  // Check for due reminders
  useEffect(() => {
    if (!isOpen) return;

    const checkDueReminders = () => {
      const now = new Date();
      const dueReminders = reminders.filter(r => {
        if (r.completed) return false;
        const reminderTime = new Date(r.datetime);
        return reminderTime <= now && !r.notified;
      });

      dueReminders.forEach(reminder => {
        triggerNotification(reminder);
        // Mark as notified so we don't notify again
        setReminders(prev => prev.map(r => 
          r.id === reminder.id ? { ...r, notified: true } : r
        ));
      });
    };

    checkDueReminders();
    checkIntervalRef.current = setInterval(checkDueReminders, 30000); // Check every 30 seconds

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isOpen, reminders]);

  const triggerNotification = (reminder) => {
    // Play sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (e) {
      console.log('Audio notification not available');
    }

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Reminder: ' + reminder.title, {
        body: reminder.description || 'Your reminder is due now!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: reminder.id,
        requireInteraction: true,
        actions: [
          { action: 'complete', title: '✓ Complete' },
          { action: 'snooze', title: '💤 Snooze 5m' }
        ]
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      datetime: '',
      category: 'general',
      recurring: 'none',
      priority: 'normal',
      snoozeMinutes: 5
    });
    setEditingReminder(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.datetime) return;

    const newReminder = {
      id: editingReminder ? editingReminder.id : Date.now().toString(),
      ...formData,
      createdAt: editingReminder ? editingReminder.createdAt : new Date().toISOString(),
      completed: false,
      notified: false,
      snoozeUntil: null
    };

    if (editingReminder) {
      setReminders(prev => prev.map(r => r.id === editingReminder.id ? newReminder : r));
    } else {
      setReminders(prev => [...prev, newReminder]);
    }

    resetForm();
    setShowAddForm(false);
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      datetime: reminder.datetime,
      category: reminder.category,
      recurring: reminder.recurring || 'none',
      priority: reminder.priority || 'normal',
      snoozeMinutes: reminder.snoozeMinutes || 5
    });
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      setReminders(prev => prev.filter(r => r.id !== id));
    }
  };

  const toggleComplete = (id) => {
    setReminders(prev => prev.map(r => {
      if (r.id !== id) return r;
      
      const newCompleted = !r.completed;
      
      // If completing a recurring reminder, schedule the next one
      if (newCompleted && r.recurring && r.recurring !== 'none') {
        scheduleNextRecurring(r);
      }
      
      return { ...r, completed: newCompleted };
    }));
  };

  const scheduleNextRecurring = (reminder) => {
    const currentDate = new Date(reminder.datetime);
    let nextDate = new Date(currentDate);

    switch (reminder.recurring) {
      case 'daily':
        nextDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekdays':
        do {
          nextDate.setDate(nextDate.getDate() + 1);
        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
        break;
      case 'weekends':
        do {
          nextDate.setDate(nextDate.getDate() + 1);
        } while (nextDate.getDay() !== 0 && nextDate.getDay() !== 6);
        break;
      case 'weekly':
        nextDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        return;
    }

    const nextReminder = {
      ...reminder,
      id: Date.now().toString(),
      datetime: nextDate.toISOString().slice(0, 16),
      completed: false,
      notified: false,
      createdAt: new Date().toISOString()
    };

    setReminders(prev => [...prev, nextReminder]);
  };

  const handleSnooze = (id, minutes) => {
    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);
    
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, snoozeUntil: snoozeUntil.toISOString(), notified: false } : r
    ));
  };

  const getFilteredReminders = () => {
    let filtered = reminders;

    // Apply category filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'completed') {
        filtered = filtered.filter(r => r.completed);
      } else if (activeFilter === 'upcoming') {
        filtered = filtered.filter(r => !r.completed && new Date(r.datetime) > new Date());
      } else if (activeFilter === 'overdue') {
        filtered = filtered.filter(r => !r.completed && new Date(r.datetime) < new Date());
      } else {
        filtered = filtered.filter(r => r.category === activeFilter);
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
      );
    }

    // Sort by datetime (soonest first), then by completed status
    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.datetime) - new Date(b.datetime);
    });
  };

  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.setDate(now.getDate() + 1)).toDateString() === date.toDateString();
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;
    
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTimeUntil = (datetime) => {
    const now = new Date();
    const reminderTime = new Date(datetime);
    const diffMs = reminderTime - now;
    
    if (diffMs < 0) return 'Overdue';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    if (diffMins > 0) return `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    return 'Due now';
  };

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'low': return 'priority-low';
      default: return 'priority-normal';
    }
  };

  const clearCompleted = () => {
    if (confirm('Are you sure you want to clear all completed reminders?')) {
      setReminders(prev => prev.filter(r => !r.completed));
    }
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to delete ALL reminders? This cannot be undone.')) {
      setReminders([]);
    }
  };

  const getStats = () => {
    const now = new Date();
    return {
      total: reminders.length,
      completed: reminders.filter(r => r.completed).length,
      upcoming: reminders.filter(r => !r.completed && new Date(r.datetime) > now).length,
      overdue: reminders.filter(r => !r.completed && new Date(r.datetime) <= now).length
    };
  };

  if (!isOpen) return null;

  const filteredReminders = getFilteredReminders();
  const stats = getStats();

  return (
    <div className="reminder-overlay" onClick={onClose}>
      <div className="reminder-panel" onClick={e => e.stopPropagation()}>
        <div className="reminder-header">
          <div className="reminder-title">
            <span className="reminder-icon">⏰</span>
            <h3>Smart Reminder Manager</h3>
          </div>
          <div className="reminder-header-actions">
            {notificationPermission !== 'granted' && (
              <button 
                className="notification-btn"
                onClick={requestNotificationPermission}
                title="Enable notifications"
              >
                🔔 Enable Notifications
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="reminder-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card">
            <span className="stat-number upcoming">{stats.upcoming}</span>
            <span className="stat-label">Upcoming</span>
          </div>
          <div className="stat-card">
            <span className="stat-number overdue">{stats.overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
          <div className="stat-card">
            <span className="stat-number completed">{stats.completed}</span>
            <span className="stat-label">Done</span>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="reminder-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className="add-reminder-btn"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
          >
            ➕ New Reminder
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={activeFilter === 'all' ? 'active' : ''}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button 
            className={activeFilter === 'upcoming' ? 'active' : ''}
            onClick={() => setActiveFilter('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={activeFilter === 'overdue' ? 'active' : ''}
            onClick={() => setActiveFilter('overdue')}
          >
            Overdue
          </button>
          <button 
            className={activeFilter === 'completed' ? 'active' : ''}
            onClick={() => setActiveFilter('completed')}
          >
            Completed
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat.id}
              className={activeFilter === cat.id ? 'active' : ''}
              onClick={() => setActiveFilter(cat.id)}
              style={{ '--category-color': cat.color }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="reminder-form-overlay">
            <form className="reminder-form" onSubmit={handleSubmit}>
              <h4>{editingReminder ? '✏️ Edit Reminder' : '➕ New Reminder'}</h4>
              
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="What do you need to remember?"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Add more details..."
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.datetime}
                    onChange={(e) => handleInputChange('datetime', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Recurring</label>
                  <select
                    value={formData.recurring}
                    onChange={(e) => handleInputChange('recurring', e.target.value)}
                  >
                    {RECURRING_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="normal">🟡 Normal</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Default Snooze (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={formData.snoozeMinutes}
                  onChange={(e) => handleInputChange('snoozeMinutes', parseInt(e.target.value) || 5)}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reminders List */}
        <div className="reminders-list">
          {filteredReminders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⏰</div>
              <p>No reminders found</p>
              {searchQuery && <p className="empty-hint">Try adjusting your search or filters</p>}
              {!searchQuery && activeFilter === 'all' && (
                <button className="empty-cta" onClick={() => setShowAddForm(true)}>
                  Create your first reminder
                </button>
              )}
            </div>
          ) : (
            <>
              {filteredReminders.map(reminder => {
                const category = getCategoryInfo(reminder.category);
                const isOverdue = !reminder.completed && new Date(reminder.datetime) < new Date();
                
                return (
                  <div 
                    key={reminder.id} 
                    className={`reminder-item ${reminder.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${getPriorityClass(reminder.priority)}`}
                    style={{ '--category-color': category.color }}
                  >
                    <button 
                      className="complete-checkbox"
                      onClick={() => toggleComplete(reminder.id)}
                      title={reminder.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {reminder.completed ? '✓' : '○'}
                    </button>
                    
                    <div className="reminder-content">
                      <div className="reminder-main">
                        <span className="category-badge" title={category.label}>
                          {category.icon}
                        </span>
                        <span className="reminder-title-text">{reminder.title}</span>
                        {reminder.recurring !== 'none' && (
                          <span className="recurring-badge" title={`Repeats ${reminder.recurring}`}>
                            🔄
                          </span>
                        )}
                        <span className={`priority-indicator priority-${reminder.priority}`} title={`${reminder.priority} priority`}>
                        </span>
                      </div>
                      
                      {reminder.description && (
                        <p className="reminder-description">{reminder.description}</p>
                      )}
                      
                      <div className="reminder-meta">
                        <span className={`datetime ${isOverdue ? 'overdue-text' : ''}`}>
                          {isOverdue ? '⚠️ ' : '📅 '}
                          {formatDateTime(reminder.datetime)}
                          {!reminder.completed && (
                            <span className="time-until"> ({getTimeUntil(reminder.datetime)})</span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="reminder-actions">
                      {!reminder.completed && (
                        <div className="snooze-menu">
                          <button className="action-btn snooze-btn" title="Snooze">
                            💤
                          </button>
                          <div className="snooze-options">
                            <button onClick={() => handleSnooze(reminder.id, 5)}>5 min</button>
                            <button onClick={() => handleSnooze(reminder.id, 15)}>15 min</button>
                            <button onClick={() => handleSnooze(reminder.id, 30)}>30 min</button>
                            <button onClick={() => handleSnooze(reminder.id, 60)}>1 hour</button>
                            <button onClick={() => handleSnooze(reminder.id, 1440)}>1 day</button>
                          </div>
                        </div>
                      )}
                      <button 
                        className="action-btn edit-btn" 
                        onClick={() => handleEdit(reminder)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => handleDelete(reminder.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Bulk Actions */}
        {reminders.length > 0 && (
          <div className="bulk-actions">
            <button className="bulk-btn" onClick={clearCompleted}>
              🧹 Clear Completed
            </button>
            <button className="bulk-btn danger" onClick={clearAll}>
              🗑️ Clear All
            </button>
          </div>
        )}

        {/* Quick Add Presets */}
        <div className="quick-presets">
          <span className="presets-label">Quick add:</span>
          <button 
            className="preset-chip"
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(9, 0, 0, 0);
              setFormData({
                ...formData,
                title: 'Check emails',
                datetime: tomorrow.toISOString().slice(0, 16),
                category: 'work'
              });
              setShowAddForm(true);
            }}
          >
            📧 Check emails tomorrow
          </button>
          <button 
            className="preset-chip"
            onClick={() => {
              const in30Min = new Date();
              in30Min.setMinutes(in30Min.getMinutes() + 30);
              setFormData({
                ...formData,
                title: 'Take a break',
                datetime: in30Min.toISOString().slice(0, 16),
                category: 'health'
              });
              setShowAddForm(true);
            }}
          >
            ☕ Break in 30 min
          </button>
          <button 
            className="preset-chip"
            onClick={() => {
              const nextWeek = new Date();
              nextWeek.setDate(nextWeek.getDate() + 7);
              setFormData({
                ...formData,
                title: 'Weekly review',
                datetime: nextWeek.toISOString().slice(0, 16),
                category: 'work',
                recurring: 'weekly'
              });
              setShowAddForm(true);
            }}
          >
            📊 Weekly review
          </button>
        </div>
      </div>
    </div>
  );
}
