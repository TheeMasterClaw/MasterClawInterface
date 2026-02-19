'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import './RelationshipNetwork.css';

const RELATIONSHIP_TYPES = {
  family: { label: 'Family', icon: '👨‍👩‍👧‍👦', color: '#ef4444' },
  friend: { label: 'Friend', icon: '🤝', color: '#22c55e' },
  colleague: { label: 'Colleague', icon: '💼', color: '#3b82f6' },
  mentor: { label: 'Mentor', icon: '🎓', color: '#f59e0b' },
  mentee: { label: 'Mentee', icon: '🌱', color: '#8b5cf6' },
  client: { label: 'Client', icon: '🤵', color: '#14b8a6' },
  partner: { label: 'Partner', icon: '🤝', color: '#ec4899' },
  other: { label: 'Other', icon: '👤', color: '#64748b' }
};

const CONTACT_FREQUENCY = {
  daily: { days: 1, label: 'Daily' },
  weekly: { days: 7, label: 'Weekly' },
  biweekly: { days: 14, label: 'Bi-weekly' },
  monthly: { days: 30, label: 'Monthly' },
  quarterly: { days: 90, label: 'Quarterly' },
  yearly: { days: 365, label: 'Yearly' }
};

const IMPORTANCE_LEVELS = {
  critical: { label: 'Critical', color: '#ef4444', stars: '⭐⭐⭐' },
  high: { label: 'High', color: '#f59e0b', stars: '⭐⭐' },
  medium: { label: 'Medium', color: '#3b82f6', stars: '⭐' },
  low: { label: 'Low', color: '#64748b', stars: '◯' }
};

export default function RelationshipNetwork({ isOpen, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lastContact');
  const [searchQuery, setSearchQuery] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'friend',
    importance: 'medium',
    frequency: 'monthly',
    notes: '',
    contactInfo: '',
    birthday: ''
  });

  // Load contacts from localStorage
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const savedData = localStorage.getItem('mc-relationship-network');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setContacts(data.contacts || []);
        setRemindersEnabled(data.remindersEnabled !== false);
      } catch (e) {
        console.error('Failed to parse relationship data:', e);
      }
    }
  }, [isOpen]);

  // Save contacts to localStorage
  const saveData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const data = {
      contacts,
      remindersEnabled
    };
    localStorage.setItem('mc-relationship-network', JSON.stringify(data));
  }, [contacts, remindersEnabled]);

  useEffect(() => {
    saveData();
  }, [saveData]);

  // Calculate days since last contact
  const getDaysSinceContact = (contact) => {
    if (!contact.lastContact) return Infinity;
    const last = new Date(contact.lastContact);
    const now = new Date();
    return Math.floor((now - last) / (1000 * 60 * 60 * 24));
  };

  // Check if contact needs attention (overdue)
  const isOverdue = (contact) => {
    const daysSince = getDaysSinceContact(contact);
    const threshold = CONTACT_FREQUENCY[contact.frequency]?.days || 30;
    return daysSince > threshold;
  };

  // Get urgency level for sorting
  const getUrgencyScore = (contact) => {
    const daysSince = getDaysSinceContact(contact);
    const threshold = CONTACT_FREQUENCY[contact.frequency]?.days || 30;
    const overdueDays = daysSince - threshold;
    
    // Higher score = more urgent
    let score = overdueDays;
    if (contact.importance === 'critical') score *= 3;
    else if (contact.importance === 'high') score *= 2;
    else if (contact.importance === 'medium') score *= 1;
    else score *= 0.5;
    
    return score;
  };

  // Add new contact
  const handleAddContact = (e) => {
    e.preventDefault();
    
    const newContact = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
      lastContact: null,
      interactions: []
    };
    
    setContacts(prev => [...prev, newContact]);
    resetForm();
    setShowAddForm(false);
  };

  // Update contact
  const handleUpdateContact = (e) => {
    e.preventDefault();
    
    setContacts(prev => prev.map(c => 
      c.id === editingContact.id 
        ? { ...c, ...formData }
        : c
    ));
    resetForm();
    setEditingContact(null);
    setShowAddForm(false);
  };

  // Delete contact
  const handleDeleteContact = (id) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      setContacts(prev => prev.filter(c => c.id !== id));
    }
  };

  // Log interaction
  const logInteraction = (contactId, note = '') => {
    const interaction = {
      id: Date.now(),
      date: new Date().toISOString(),
      note
    };
    
    setContacts(prev => prev.map(c => {
      if (c.id === contactId) {
        return {
          ...c,
          lastContact: interaction.date,
          interactions: [interaction, ...(c.interactions || [])].slice(0, 50)
        };
      }
      return c;
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'friend',
      importance: 'medium',
      frequency: 'monthly',
      notes: '',
      contactInfo: '',
      birthday: ''
    });
  };

  // Start editing
  const startEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      type: contact.type,
      importance: contact.importance,
      frequency: contact.frequency,
      notes: contact.notes || '',
      contactInfo: contact.contactInfo || '',
      birthday: contact.birthday || ''
    });
    setShowAddForm(true);
  };

  // Filter and sort contacts
  const getFilteredContacts = () => {
    let result = [...contacts];
    
    // Apply filter
    if (filter !== 'all') {
      if (filter === 'overdue') {
        result = result.filter(isOverdue);
      } else if (filter === 'today') {
        result = result.filter(c => {
          if (!c.birthday) return false;
          const today = new Date();
          const bday = new Date(c.birthday);
          return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate();
        });
      } else {
        result = result.filter(c => c.type === filter);
      }
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) ||
        (c.notes && c.notes.toLowerCase().includes(query)) ||
        (c.contactInfo && c.contactInfo.toLowerCase().includes(query))
      );
    }
    
    // Apply sort
    result.sort((a, b) => {
      if (sortBy === 'lastContact') {
        return getUrgencyScore(b) - getUrgencyScore(a);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'importance') {
        const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      }
      return 0;
    });
    
    return result;
  };

  // Stats
  const getStats = () => {
    const total = contacts.length;
    const overdue = contacts.filter(isOverdue).length;
    const criticalOverdue = contacts.filter(c => 
      isOverdue(c) && (c.importance === 'critical' || c.importance === 'high')
    ).length;
    
    return { total, overdue, criticalOverdue };
  };

  const stats = getStats();
  const filteredContacts = getFilteredContacts();

  if (!isOpen) return null;

  return (
    <div className="relationship-panel-overlay" onClick={onClose}>
      <div className="relationship-panel" onClick={e => e.stopPropagation()}>
        <div className="relationship-panel-header">
          <h3>🌐 Relationship Network</h3>
          <div className="header-actions">
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              ⚙️
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showSettings ? (
          <div className="relationship-settings">
            <h4>Network Settings</h4>
            
            <div className="setting-group">
              <label>Reminders</label>
              <div className="toggle-option">
                <input
                  type="checkbox"
                  checked={remindersEnabled}
                  onChange={(e) => setRemindersEnabled(e.target.checked)}
                  id="reminders-toggle"
                />
                <label htmlFor="reminders-toggle">
                  Enable contact reminders
                </label>
              </div>
            </div>

            <div className="setting-group">
              <label>Network Stats</label>
              <div className="stats-grid compact">
                <div className="stat-item">
                  <span className="stat-value">{stats.total}</span>
                  <span className="stat-label">Contacts</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value" style={{ color: overdue > 0 ? '#ef4444' : '#22c55e' }}>
                    {stats.overdue}
                  </span>
                  <span className="stat-label">Overdue</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value" style={{ color: stats.criticalOverdue > 0 ? '#ef4444' : '#22c55e' }}>
                    {stats.criticalOverdue}
                  </span>
                  <span className="stat-label">Urgent</span>
                </div>
              </div>
            </div>

            <button className="back-btn" onClick={() => setShowSettings(false)}>
              ← Back to Network
            </button>
          </div>
        ) : showAddForm ? (
          <div className="relationship-form">
            <h4>{editingContact ? 'Edit Contact' : 'Add Contact'}</h4>
            
            <form onSubmit={editingContact ? handleUpdateContact : handleAddContact}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Contact name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    {Object.entries(RELATIONSHIP_TYPES).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Importance</label>
                  <select
                    value={formData.importance}
                    onChange={(e) => setFormData({...formData, importance: e.target.value})}
                  >
                    {Object.entries(IMPORTANCE_LEVELS).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.stars} {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  >
                    {Object.entries(CONTACT_FREQUENCY).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Birthday</label>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Contact Info</label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                  placeholder="Phone, email, social media..."
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Key details to remember..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowAddForm(false);
                  setEditingContact(null);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingContact ? 'Update' : 'Add'} Contact
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="relationship-stats-bar">
              <div className="stat-pill">
                <span className="stat-icon">👥</span>
                <span className="stat-count">{stats.total}</span>
                <span className="stat-label">Contacts</span>
              </div>
              {stats.criticalOverdue > 0 && (
                <div className="stat-pill urgent">
                  <span className="stat-icon">🔥</span>
                  <span className="stat-count">{stats.criticalOverdue}</span>
                  <span className="stat-label">Need Attention</span>
                </div>
              )}
              {stats.overdue > 0 && stats.criticalOverdue === 0 && (
                <div className="stat-pill warning">
                  <span className="stat-icon">⏰</span>
                  <span className="stat-count">{stats.overdue}</span>
                  <span className="stat-label">Overdue</span>
                </div>
              )}
            </div>

            {/* Search and Filter */}
            <div className="relationship-toolbar">
              <input
                type="text"
                className="search-input"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <select
                className="filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Contacts</option>
                <option value="overdue">⏰ Overdue</option>
                <option value="today">🎂 Birthday Today</option>
                <option value="family">👨‍👩‍👧‍👦 Family</option>
                <option value="friend">🤝 Friends</option>
                <option value="colleague">💼 Colleagues</option>
                <option value="mentor">🎓 Mentors</option>
                <option value="client">🤵 Clients</option>
              </select>

              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="lastContact">Sort: Urgency</option>
                <option value="name">Sort: Name</option>
                <option value="importance">Sort: Importance</option>
              </select>
            </div>

            {/* Contacts List */}
            <div className="contacts-list">
              {filteredContacts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🌐</div>
                  <p>No contacts found</p>
                  <p className="empty-subtitle">
                    {contacts.length === 0 
                      ? "Start building your relationship network!"
                      : "Try adjusting your filters."}
                  </p>
                </div>
              ) : (
                filteredContacts.map(contact => {
                  const daysSince = getDaysSinceContact(contact);
                  const typeConfig = RELATIONSHIP_TYPES[contact.type];
                  const importanceConfig = IMPORTANCE_LEVELS[contact.importance];
                  const frequencyConfig = CONTACT_FREQUENCY[contact.frequency];
                  const overdue = isOverdue(contact);
                  
                  return (
                    <div 
                      key={contact.id} 
                      className={`contact-card ${overdue ? 'overdue' : ''} ${contact.importance === 'critical' ? 'critical' : ''}`}
                    >
                      <div className="contact-header">
                        <div className="contact-identity">
                          <span 
                            className="contact-type-icon"
                            style={{ background: typeConfig.color }}
                          >
                            {typeConfig.icon}
                          </span>
                          <div className="contact-info">
                            <span className="contact-name">{contact.name}</span>
                            <div className="contact-meta">
                              <span className="contact-type">{typeConfig.label}</span>
                              <span className="importance-badge" style={{ color: importanceConfig.color }}>
                                {importanceConfig.stars}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="contact-actions">
                          <button 
                            className="action-btn"
                            onClick={() => startEdit(contact)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteContact(contact.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="contact-status">
                        <div className={`status-indicator ${overdue ? 'overdue' : 'ok'}`}>
                          {overdue ? (
                            <>
                              <span className="status-icon">⏰</span>
                              <span className="status-text">
                                {daysSince === Infinity ? 'Never contacted' : `${daysSince} days overdue`}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="status-icon">✅</span>
                              <span className="status-text">
                                {daysSince === Infinity 
                                  ? `Goal: ${frequencyConfig.label}` 
                                  : `${daysSince} days ago`}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="frequency-badge">
                          {frequencyConfig.label}
                        </div>
                      </div>

                      {contact.notes && (
                        <div className="contact-notes">
                          💭 {contact.notes}
                        </div>
                      )}

                      {contact.contactInfo && (
                        <div className="contact-details">
                          📱 {contact.contactInfo}
                        </div>
                      )}

                      <button 
                        className="log-interaction-btn"
                        onClick={() => logInteraction(contact.id)}
                      >
                        ✓ Just contacted
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Button */}
            <button 
              className="add-contact-btn"
              onClick={() => {
                setEditingContact(null);
                resetForm();
                setShowAddForm(true);
              }}
            >
              <span className="btn-icon">+</span>
              <span>Add Contact</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Utility functions for external use
export const getOverdueContacts = () => {
  if (typeof window === 'undefined') return [];
  
  const savedData = localStorage.getItem('mc-relationship-network');
  if (!savedData) return [];
  
  try {
    const data = JSON.parse(savedData);
    const contacts = data.contacts || [];
    
    return contacts.filter(contact => {
      if (!contact.lastContact) return true;
      const last = new Date(contact.lastContact);
      const now = new Date();
      const daysSince = Math.floor((now - last) / (1000 * 60 * 60 * 24));
      const threshold = CONTACT_FREQUENCY[contact.frequency]?.days || 30;
      return daysSince > threshold;
    }).sort((a, b) => {
      // Sort by importance then overdue days
      const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    });
  } catch (e) {
    return [];
  }
};

export const getTodaysBirthdays = () => {
  if (typeof window === 'undefined') return [];
  
  const savedData = localStorage.getItem('mc-relationship-network');
  if (!savedData) return [];
  
  try {
    const data = JSON.parse(savedData);
    const contacts = data.contacts || [];
    const today = new Date();
    
    return contacts.filter(contact => {
      if (!contact.birthday) return false;
      const bday = new Date(contact.birthday);
      return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate();
    });
  } catch (e) {
    return [];
  }
};
