import React, { useState, useEffect } from 'react';
import './GiftIdeas.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const OCCASIONS = [
  'Birthday', 'Christmas', 'Anniversary', 'Wedding', 'Graduation',
  'Housewarming', 'Baby Shower', 'Valentine\'s Day', 'Mother\'s Day',
  'Father\'s Day', 'Thank You', 'Just Because', 'Other'
];

const STATUS_OPTIONS = [
  { id: 'planned', name: 'Planned', icon: '💡', color: '#feca57' },
  { id: 'purchased', name: 'Purchased', icon: '🛍️', color: '#48dbfb' },
  { id: 'given', name: 'Given', icon: '🎁', color: '#1dd1a1' }
];

export default function GiftIdeas({ isOpen, onClose }) {
  const [gifts, setGifts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    recipient: '',
    occasion: 'Birthday',
    price: '',
    url: '',
    notes: '',
    date: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [giftsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/gifts`),
        fetch(`${API_URL}/gifts/stats`)
      ]);
      
      setGifts((await giftsRes.json()).gifts || []);
      setStats(await statsRes.json());
    } catch (err) {
      console.error('Failed to fetch gift data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetch(`${API_URL}/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setFormData({
        name: '',
        recipient: '',
        occasion: 'Birthday',
        price: '',
        url: '',
        notes: '',
        date: ''
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add gift:', err);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await fetch(`${API_URL}/gifts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this gift idea?')) return;
    
    try {
      await fetch(`${API_URL}/gifts/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getFilteredGifts = () => {
    if (filter === 'all') return gifts;
    return gifts.filter(g => g.status === filter);
  };

  const getStatusInfo = (statusId) => STATUS_OPTIONS.find(s => s.id === statusId) || STATUS_OPTIONS[0];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (!isOpen) return null;

  return (
    <div className="gift-ideas-overlay" onClick={onClose}>
      <div className="gift-ideas-panel" onClick={e => e.stopPropagation()}>
        <div className="gift-ideas-header">
          <div className="header-title">
            <span className="header-icon">🎁</span>
            <h2>Gift Ideas</h2>
            {stats && (
              <span className="header-stats">
                {stats.planned} planned · {stats.recipientCount} people
              </span>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary small"
              onClick={() => setShowForm(true)}
            >
              ➕ Add Idea
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="gift-stats">
            <div className="stat-card budget">
              <span className="stat-label">Total Budget</span>
              <span className="stat-value">{formatCurrency(stats.totalBudget)}</span>
            </div>
            
            <div className="stat-card spent">
              <span className="stat-label">Spent</span>
              <span className="stat-value">{formatCurrency(stats.spent)}</span>
            </div>
            
            <div className="stat-card remaining">
              <span className="stat-label">Remaining</span>
              <span className="stat-value">{formatCurrency(stats.remaining)}</span>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {[
            { id: 'all', name: 'All', icon: '📚' },
            { id: 'planned', name: 'Planned', icon: '💡' },
            { id: 'purchased', name: 'Purchased', icon: '🛍️' },
            { id: 'given', name: 'Given', icon: '🎁' }
          ].map(f => (
            <button
              key={f.id}
              className={`filter-tab ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.icon} {f.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="gift-content">
          {loading ? (
            <div className="loading-state">⏳ Loading...</div>
          ) : (
            <>
              {/* Add Form */}
              {showForm && (
                <div className="gift-form">
                  <h3>Add Gift Idea</h3>
                  
                  <form onSubmit={handleSubmit}>
                    <input
                      type="text"
                      placeholder="Gift name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    
                    <div className="form-row">
                      <input
                        type="text"
                        placeholder="For who? *"
                        value={formData.recipient}
                        onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                        required
                      />
                      
                      <select
                        value={formData.occasion}
                        onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                      >
                        {OCCASIONS.map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-row">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                      
                      <input
                        type="date"
                        placeholder="Occasion date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    
                    <input
                      type="url"
                      placeholder="Link to buy (optional)"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                    
                    <textarea
                      placeholder="Notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                    />
                    
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">Add Gift</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Gifts List */}
              {getFilteredGifts().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎁</div>
                  <h3>No gift ideas yet</h3>
                  <p>Start planning your gifts!</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    Add First Idea
                  </button>
                </div>
              ) : (
                <div className="gifts-list">
                  {getFilteredGifts().map(gift => {
                    const status = getStatusInfo(gift.status);
                    const daysUntil = getDaysUntil(gift.date);
                    const isUpcoming = daysUntil !== null && daysUntil >= 0 && daysUntil <= 14;
                    
                    return (
                      <div 
                        key={gift.id} 
                        className={`gift-card ${gift.status} ${isUpcoming ? 'upcoming' : ''}`}
                        style={{ '--status-color': status.color }}
                      >
                        <div className="card-status-bar" />
                        
                        <div className="card-content">
                          <div className="card-header">
                            <div className="card-recipient">
                              <span className="recipient-icon">👤</span>
                              <span>{gift.recipient}</span>
                            </div>
                            
                            <div className="card-actions">
                              {gift.status === 'planned' && (
                                <button 
                                  onClick={() => handleUpdate(gift.id, { status: 'purchased' })}
                                  title="Mark purchased"
                                >
                                  🛍️
                                </button>
                              )}
                              
                              {gift.status === 'purchased' && (
                                <button 
                                  onClick={() => handleUpdate(gift.id, { status: 'given' })}
                                  title="Mark given"
                                >
                                  🎁
                                </button>
                              )}
                              
                              <button onClick={() => handleDelete(gift.id)} title="Delete">🗑️</button>
                            </div>
                          </div>

                          <h4 className="gift-name">
                            {gift.url ? (
                              <a href={gift.url} target="_blank" rel="noopener noreferrer">{gift.name}</a>
                            ) : gift.name}
                          </h4>

                          <div className="gift-meta">
                            <span className="occasion-tag">{gift.occasion}</span>
                            {gift.price > 0 && (
                              <span className="price-tag">{formatCurrency(gift.price)}</span>
                            )}
                          </div>

                          {gift.date && (
                            <div className={`gift-date ${isUpcoming ? 'soon' : ''}`}>
                              📅 {new Date(gift.date).toLocaleDateString()}
                              {daysUntil !== null && daysUntil >= 0 && (
                                <span className="days-until">
                                  ({daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`})
                                </span>
                              )}
                            </div>
                          )}

                          {gift.notes && (
                            <p className="gift-notes">{gift.notes}</p>
                          )}

                          <div className="card-footer">
                            <span className={`status-badge ${gift.status}`}>
                              {status.icon} {status.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
