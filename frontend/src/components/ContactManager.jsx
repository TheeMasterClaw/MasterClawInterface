import React, { useState, useEffect, useCallback } from 'react';
// import './ContactManager.css';
import { getApiUrl } from '../lib/apiUrl.js';

const API_URL = getApiUrl();

const CATEGORIES = [
  { id: 'personal', name: 'Personal', icon: '👤' },
  { id: 'professional', name: 'Professional', icon: '💼' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'friend', name: 'Friend', icon: '🤝' },
  { id: 'networking', name: 'Networking', icon: '🌐' },
  { id: 'mentor', name: 'Mentor', icon: '🎓' },
  { id: 'client', name: 'Client', icon: '🤝' },
  { id: 'vendor', name: 'Vendor', icon: '🏢' }
];

const PRIORITIES = [
  { id: 'high', name: 'High', color: '#ff6b6b' },
  { id: 'medium', name: 'Medium', color: '#feca57' },
  { id: 'low', name: 'Low', color: '#48dbfb' }
];

const INTERACTION_TYPES = [
  { id: 'meeting', name: 'Meeting', icon: '🤝' },
  { id: 'call', name: 'Call', icon: '📞' },
  { id: 'text', name: 'Text', icon: '💬' },
  { id: 'email', name: 'Email', icon: '📧' },
  { id: 'video', name: 'Video Call', icon: '📹' },
  { id: 'social', name: 'Social', icon: '🎉' },
  { id: 'other', name: 'Other', icon: '📝' }
];

const REMINDER_FREQUENCIES = [
  { id: 'weekly', name: 'Weekly' },
  { id: 'biweekly', name: 'Bi-weekly' },
  { id: 'monthly', name: 'Monthly' },
  { id: 'quarterly', name: 'Quarterly' },
  { id: 'yearly', name: 'Yearly' }
];

export default function ContactManager({ isOpen, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('contacts'); // contacts, reminders, birthdays, stats
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // Form states
  const [showContactForm, setShowContactForm] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    category: 'personal',
    tags: '',
    notes: '',
    priority: 'medium',
    birthday: '',
    reminderFrequency: 'monthly'
  });
  
  const [interactionForm, setInteractionForm] = useState({
    type: 'meeting',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    location: '',
    duration: ''
  });

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      params.append('sortBy', sortBy);
      
      const response = await fetch(`${API_URL}/contacts?${params}`);
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, sortBy]);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, remindersRes, birthdaysRes] = await Promise.all([
        fetch(`${API_URL}/contacts/meta/stats`),
        fetch(`${API_URL}/contacts/meta/reminders`),
        fetch(`${API_URL}/contacts/meta/birthdays`)
      ]);
      
      setStats(await statsRes.json());
      const remindersData = await remindersRes.json();
      setReminders(remindersData.reminders || []);
      const birthdaysData = await birthdaysRes.json();
      setBirthdays(birthdaysData.birthdays || []);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      fetchStats();
    }
  }, [isOpen, fetchContacts, fetchStats]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...contactForm,
      tags: contactForm.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    try {
      const url = editingContact 
        ? `${API_URL}/contacts/${editingContact.id}`
        : `${API_URL}/contacts`;
      
      const method = editingContact ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setContactForm({
          name: '',
          email: '',
          phone: '',
          company: '',
          title: '',
          category: 'personal',
          tags: '',
          notes: '',
          priority: 'medium',
          birthday: '',
          reminderFrequency: 'monthly'
        });
        setShowContactForm(false);
        setEditingContact(null);
        fetchContacts();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  };

  const handleInteractionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedContact) return;
    
    try {
      const response = await fetch(`${API_URL}/contacts/${selectedContact.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...interactionForm,
          duration: parseInt(interactionForm.duration) || 0
        })
      });
      
      if (response.ok) {
        setInteractionForm({
          type: 'meeting',
          date: new Date().toISOString().split('T')[0],
          notes: '',
          location: '',
          duration: ''
        });
        setShowInteractionForm(false);
        fetchContacts();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to add interaction:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await fetch(`${API_URL}/contacts/${id}`, { method: 'DELETE' });
      fetchContacts();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  const startEdit = (contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      title: contact.title || '',
      category: contact.category || 'personal',
      tags: (contact.tags || []).join(', '),
      notes: contact.notes || '',
      priority: contact.priority || 'medium',
      birthday: contact.birthday ? contact.birthday.split('T')[0] : '',
      reminderFrequency: contact.reminderFrequency || 'monthly'
    });
    setShowContactForm(true);
  };

  const openInteractionForm = (contact) => {
    setSelectedContact(contact);
    setShowInteractionForm(true);
  };

  const getDaysSinceText = (days) => {
    if (days === null) return 'Never contacted';
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const getDaysSinceColor = (days, frequency) => {
    if (days === null) return '#ff6b6b';
    const thresholds = { weekly: 7, biweekly: 14, monthly: 30, quarterly: 90, yearly: 365 };
    const threshold = thresholds[frequency] || 30;
    
    if (days > threshold) return '#ff6b6b';
    if (days > threshold * 0.8) return '#feca57';
    return '#48dbfb';
  };

  if (!isOpen) return null;

  return (
    <div className="contact-manager-overlay" onClick={onClose}>
      <div className="contact-manager-panel" onClick={e => e.stopPropagation()}>
        <div className="contact-manager-header">
          <div className="header-title">
            <span className="header-icon">👥</span>
            <h2>Contact Manager</h2>
            {stats && (
              <span className="header-stats">
                {stats.totalContacts} contacts · {stats.totalInteractions} interactions
              </span>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="action-btn primary"
              onClick={() => {
                setEditingContact(null);
                setContactForm({
                  name: '',
                  email: '',
                  phone: '',
                  company: '',
                  title: '',
                  category: 'personal',
                  tags: '',
                  notes: '',
                  priority: 'medium',
                  birthday: '',
                  reminderFrequency: 'monthly'
                });
                setShowContactForm(true);
              }}
            >
              ➕ Add Contact
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="view-tabs">
          <button 
            className={`view-tab ${view === 'contacts' ? 'active' : ''}`}
            onClick={() => setView('contacts')}
          >
            👥 Contacts
          </button>
          <button 
            className={`view-tab ${view === 'reminders' ? 'active' : ''}`}
            onClick={() => setView('reminders')}
          >
            ⏰ Reminders
            {reminders.length > 0 && (
              <span className="tab-badge">{reminders.length}</span>
            )}
          </button>
          <button 
            className={`view-tab ${view === 'birthdays' ? 'active' : ''}`}
            onClick={() => setView('birthdays')}
          >
            🎂 Birthdays
            {birthdays.length > 0 && (
              <span className="tab-badge">{birthdays.length}</span>
            )}
          </button>
          <button 
            className={`view-tab ${view === 'stats' ? 'active' : ''}`}
            onClick={() => setView('stats')}
          >
            📊 Stats
          </button>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="modal-overlay" onClick={() => setShowContactForm(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>{editingContact ? 'Edit Contact' : 'Add New Contact'}</h3>
              <form onSubmit={handleContactSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={contactForm.category}
                      onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Company</label>
                    <input
                      type="text"
                      value={contactForm.company}
                      onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={contactForm.title}
                      onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                      placeholder="Job title"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <div className="priority-selector">
                      {PRIORITIES.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className={`priority-btn ${contactForm.priority === p.id ? 'active' : ''}`}
                          style={{ '--priority-color': p.color }}
                          onClick={() => setContactForm({ ...contactForm, priority: p.id })}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Birthday</label>
                    <input
                      type="date"
                      value={contactForm.birthday}
                      onChange={(e) => setContactForm({ ...contactForm, birthday: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Reminder Frequency</label>
                    <select
                      value={contactForm.reminderFrequency}
                      onChange={(e) => setContactForm({ ...contactForm, reminderFrequency: e.target.value })}
                    >
                      {REMINDER_FREQUENCIES.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tags (comma separated)</label>
                    <input
                      type="text"
                      value={contactForm.tags}
                      onChange={(e) => setContactForm({ ...contactForm, tags: e.target.value })}
                      placeholder="friend, colleague, mentor..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={contactForm.notes}
                    onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                    placeholder="Additional notes about this person..."
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn secondary" onClick={() => setShowContactForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn primary">
                    {editingContact ? '💾 Save Changes' : '➕ Add Contact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Interaction Form Modal */}
        {showInteractionForm && selectedContact && (
          <div className="modal-overlay" onClick={() => setShowInteractionForm(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Log Interaction with {selectedContact.name}</h3>
              <form onSubmit={handleInteractionSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={interactionForm.type}
                      onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })}
                    >
                      {INTERACTION_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={interactionForm.date}
                      onChange={(e) => setInteractionForm({ ...interactionForm, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={interactionForm.location}
                      onChange={(e) => setInteractionForm({ ...interactionForm, location: e.target.value })}
                      placeholder="Coffee shop, Zoom, etc."
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      value={interactionForm.duration}
                      onChange={(e) => setInteractionForm({ ...interactionForm, duration: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={interactionForm.notes}
                    onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}
                    placeholder="What did you discuss? Any follow-ups needed?"
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn secondary" onClick={() => setShowInteractionForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn primary">
                    📝 Log Interaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Content Views */}
        <div className="contact-manager-content">
          {/* Contacts View */}
          {view === 'contacts' && (
            <>
              <div className="contacts-toolbar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="🔍 Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                <select 
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                
                <select 
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">🔤 Name</option>
                  <option value="recent">📅 Most Recent Contact</option>
                  <option value="oldest">⏰ Least Contacted</option>
                  <option value="priority">🔥 Priority</option>
                </select>
              </div>

              {loading ? (
                <div className="loading-state">⏳ Loading contacts...</div>
              ) : contacts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h3>No contacts yet</h3>
                  <p>Start building your network by adding your first contact!</p>
                  <button className="btn primary" onClick={() => setShowContactForm(true)}>
                    Add Your First Contact
                  </button>
                </div>
              ) : (
                <div className="contacts-list">
                  {contacts.map(contact => (
                    <div 
                      key={contact.id} 
                      className="contact-card"
                      style={{ '--priority-color': PRIORITIES.find(p => p.id === contact.priority)?.color }}
                    >
                      <div className="contact-priority" />
                      
                      <div className="contact-avatar">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="contact-info">
                        <div className="contact-header">
                          <h4>{contact.name}</h4>
                          <span className="contact-category">
                            {CATEGORIES.find(c => c.id === contact.category)?.icon} {contact.category}
                          </span>
                        </div>
                        
                        {(contact.company || contact.title) && (
                          <div className="contact-profession">
                            {contact.title} {contact.company && contact.title && 'at '} {contact.company}
                          </div>
                        )}
                        
                        <div className="contact-details">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="detail-item" onClick={e => e.stopPropagation()}>
                              📧 {contact.email}
                            </a>
                          )}
                          {contact.phone && (
                            <span className="detail-item">📞 {contact.phone}</span>
                          )}
                        </div>

                        {contact.tags?.length > 0 && (
                          <div className="contact-tags">
                            {contact.tags.map(tag => (
                              <span key={tag} className="tag">{tag}</span>
                            ))}
                          </div>
                        )}

                        {contact.notes && (
                          <div className="contact-notes-preview">{contact.notes}</div>
                        )}

                        <div className="contact-last-contact"
                          style={{ color: getDaysSinceColor(contact.daysSinceContact, contact.reminderFrequency) }}
                        >
                          🕐 {getDaysSinceText(contact.daysSinceContact)}
                          {contact.interactionCount > 0 && (
                            <span> · {contact.interactionCount} interactions</span>
                          )}
                        </div>

                        {contact.interactionHistory?.length > 0 && (
                          <div className="recent-interactions">
                            <span className="interactions-label">Recent:</span>
                            {contact.interactionHistory.slice(0, 3).map(i => (
                              <span key={i.id} className="interaction-badge" title={i.notes}>
                                {INTERACTION_TYPES.find(t => t.id === i.type)?.icon}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="contact-actions">
                        <button 
                          className="action-btn small"
                          onClick={() => openInteractionForm(contact)}
                          title="Log Interaction"
                        >
                          📝
                        </button>
                        <button 
                          className="action-btn small"
                          onClick={() => startEdit(contact)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="action-btn small delete"
                          onClick={() => handleDelete(contact.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Reminders View */}
          {view === 'reminders' && (
            <div className="reminders-list">
              {reminders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <h3>All caught up!</h3>
                  <p>No contacts need attention right now.</p>
                </div>
              ) : (
                reminders.map(reminder => (
                  <div 
                    key={reminder.contactId} 
                    className={`reminder-card ${reminder.overdue ? 'overdue' : ''}`}
                  >
                    <div className="reminder-avatar">
                      {reminder.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="reminder-info">
                      <h4>{reminder.name}</h4>
                      <div className="reminder-meta">
                        <span className="days-since">
                          {reminder.daysSince === 0 ? 'Today' : `${reminder.daysSince} days since last contact`}
                        </span>
                        <span className="frequency">
                          Reminder: {REMINDER_FREQUENCIES.find(f => f.id === reminder.frequency)?.name}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      className="btn primary small"
                      onClick={() => {
                        const contact = contacts.find(c => c.id === reminder.contactId);
                        if (contact) openInteractionForm(contact);
                      }}
                    >
                      Log Interaction
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Birthdays View */}
          {view === 'birthdays' && (
            <div className="birthdays-list">
              {birthdays.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎂</div>
                  <h3>No upcoming birthdays</h3>
                  <p>Add birthdays to your contacts to see them here.</p>
                </div>
              ) : (
                birthdays.map(bday => (
                  <div 
                    key={bday.contactId} 
                    className={`birthday-card ${bday.thisMonth ? 'this-month' : ''}`}
                  >
                    <div className="birthday-avatar">🎂</div>
                    <div className="birthday-info">
                      <h4>{bday.name}</h4>
                      <div className="birthday-meta">
                        <span className="days-until">
                          {bday.daysUntil === 0 
                            ? '🎉 Today!' 
                            : bday.daysUntil === 1 
                              ? 'Tomorrow' 
                              : `In ${bday.daysUntil} days`}
                        </span>
                        {bday.age > 0 && (
                          <span className="age">Turning {bday.age}</span>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      className="btn secondary small"
                      onClick={() => {
                        const contact = contacts.find(c => c.id === bday.contactId);
                        if (contact) openInteractionForm(contact);
                      }}
                    >
                      📝 Log
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Stats View */}
          {view === 'stats' && stats && (
            <div className="stats-grid">
              <div className="stat-card large">
                <span className="stat-value">{stats.totalContacts}</span>
                <span className="stat-label">Total Contacts</span>
              </div>
              
              <div className="stat-card large">
                <span className="stat-value">{stats.totalInteractions}</span>
                <span className="stat-label">Total Interactions</span>
              </div>
              
              <div className="stat-card">
                <span className="stat-value">{stats.thisWeekInteractions}</span>
                <span className="stat-label">This Week</span>
              </div>
              
              <div className="stat-card">
                <span className="stat-value">{stats.thisMonthInteractions}</span>
                <span className="stat-label">This Month</span>
              </div>
              
              <div className="stat-card">
                <span className="stat-value">{stats.avgInteractionsPerContact}</span>
                <span className="stat-label">Avg Interactions</span>
              </div>
              
              <div className="stat-card">
                <span className="stat-value">{stats.withBirthdays}</span>
                <span className="stat-label">With Birthdays</span>
              </div>

              {stats.byCategory && Object.entries(stats.byCategory).length > 0 && (
                <div className="stat-section">
                  <h4>By Category</h4>
                  <div className="stat-bars">
                    {Object.entries(stats.byCategory).map(([cat, count]) => (
                      <div key={cat} className="stat-bar">
                        <span className="bar-label">{cat}</span>
                        <div className="bar-track">
                          <div 
                            className="bar-fill"
                            style={{ width: `${(count / stats.totalContacts) * 100}%` }}
                          />
                        </div>
                        <span className="bar-value">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.byPriority && Object.entries(stats.byPriority).length > 0 && (
                <div className="stat-section">
                  <h4>By Priority</h4>
                  <div className="priority-dots">
                    {Object.entries(stats.byPriority).map(([pri, count]) => (
                      <div key={pri} className="priority-stat">
                        <span 
                          className="dot"
                          style={{ background: PRIORITIES.find(p => p.id === pri)?.color }}
                        />
                        <span className="label">{pri}: {count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
