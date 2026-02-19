import React, { useState, useEffect } from 'react';
import './SubscriptionManager.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CATEGORIES = [
  { id: 'streaming', name: 'Streaming', icon: '🎬', color: '#e74c3c' },
  { id: 'music', name: 'Music', icon: '🎵', color: '#9b59b6' },
  { id: 'software', name: 'Software', icon: '💻', color: '#3498db' },
  { id: 'gaming', name: 'Gaming', icon: '🎮', color: '#2ecc71' },
  { id: 'news', name: 'News', icon: '📰', color: '#f39c12' },
  { id: 'fitness', name: 'Fitness', icon: '💪', color: '#1abc9c' },
  { id: 'cloud', name: 'Cloud Storage', icon: '☁️', color: '#34495e' },
  { id: 'other', name: 'Other', icon: '📌', color: '#95a5a6' }
];

const BILLING_CYCLES = [
  { id: 'monthly', name: 'Monthly', multiplier: 1 },
  { id: 'quarterly', name: 'Quarterly', multiplier: 3 },
  { id: 'yearly', name: 'Yearly', multiplier: 12 }
];

const STATUS_OPTIONS = [
  { id: 'active', name: 'Active', color: '#1dd1a1' },
  { id: 'paused', name: 'Paused', color: '#feca57' },
  { id: 'cancelled', name: 'Cancelled', color: '#ff6b6b' }
];

export default function SubscriptionManager({ isOpen, onClose }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'streaming',
    cost: '',
    billingCycle: 'monthly',
    renewalDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/subscriptions`),
        fetch(`${API_URL}/subscriptions/stats`)
      ]);
      
      setSubscriptions((await subsRes.json()).subscriptions || []);
      setStats(await statsRes.json());
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetch(`${API_URL}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setFormData({
        name: '',
        category: 'streaming',
        cost: '',
        billingCycle: 'monthly',
        renewalDate: new Date().toISOString().split('T')[0],
        description: ''
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add subscription:', err);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await fetch(`${API_URL}/subscriptions/${id}`, {
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
    if (!confirm('Delete this subscription?')) return;
    
    try {
      await fetch(`${API_URL}/subscriptions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getFilteredSubs = () => {
    if (filter === 'all') return subscriptions;
    return subscriptions.filter(s => s.status === filter);
  };

  const getCategoryInfo = (catId) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[7];
  const getBillingInfo = (cycleId) => BILLING_CYCLES.find(b => b.id === cycleId) || BILLING_CYCLES[0];

  const getDaysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="subscription-manager-overlay" onClick={onClose}>
      <div className="subscription-manager-panel" onClick={e => e.stopPropagation()}>
        <div className="subscription-manager-header">
          <div className="header-title">
            <span className="header-icon">💳</span>
            <h2>Subscriptions</h2>
            {stats && (
              <span className="header-stats">
                {stats.active} active · {formatCurrency(stats.monthlyCost)}/mo
              </span>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary small"
              onClick={() => setShowForm(true)}
            >
              ➕ Add
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Cost Summary */}
        {stats && (
          <div className="cost-summary">
            <div className="cost-card monthly">
              <span className="cost-label">Monthly</span>
              <span className="cost-value">{formatCurrency(stats.monthlyCost)}</span>
            </div>
            
            <div className="cost-card yearly">
              <span className="cost-label">Yearly</span>
              <span className="cost-value">{formatCurrency(stats.yearlyCost)}</span>
            </div>
            
            {stats.upcomingRenewals > 0 && (
              <div className="renewal-alert">
                ⚠️ {stats.upcomingRenewals} renewal{stats.upcomingRenewals !== 1 ? 's' : ''} this week
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {[
            { id: 'active', name: 'Active', icon: '✅' },
            { id: 'paused', name: 'Paused', icon: '⏸️' },
            { id: 'cancelled', name: 'Cancelled', icon: '❌' },
            { id: 'all', name: 'All', icon: '📋' }
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
        <div className="subscription-content">
          {loading ? (
            <div className="loading-state">⏳ Loading...</div>
          ) : (
            <>
              {/* Add Form */}
              {showForm && (
                <div className="sub-form">
                  <h3>Add Subscription</h3>
                  
                  <form onSubmit={handleSubmit}>
                    <input
                      type="text"
                      placeholder="Service name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    
                    <div className="form-row">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                      
                      <select
                        value={formData.billingCycle}
                        onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                      >
                        {BILLING_CYCLES.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-row">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Cost ($) *"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        required
                      />
                      
                      <input
                        type="date"
                        placeholder="Renewal date"
                        value={formData.renewalDate}
                        onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                      />
                    </div>
                    
                    <textarea
                      placeholder="Description (optional)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                    
                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">Add Subscription</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Subscriptions List */}
              {getFilteredSubs().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💳</div>
                  <h3>No subscriptions</h3>
                  <p>Track your recurring expenses!</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    Add First Subscription
                  </button>
                </div>
              ) : (
                <div className="subscriptions-list">
                  {getFilteredSubs().map(sub => {
                    const category = getCategoryInfo(sub.category);
                    const daysUntil = getDaysUntil(sub.renewalDate);
                    const isUpcoming = daysUntil >= 0 && daysUntil <= 7;
                    
                    return (
                      <div 
                        key={sub.id} 
                        className={`subscription-card ${sub.status} ${isUpcoming ? 'upcoming' : ''}`}
                      >
                        <div 
                          className="category-icon"
                          style={{ background: category.color }}
                        >
                          {category.icon}
                        </div>
                        
                        <div className="sub-info">
                          <h4>{sub.name}</h4>
                          
                          <div className="sub-meta">
                            <span className="category-tag">{category.name}</span>
                            <span className="billing-tag">
                              {formatCurrency(sub.cost)}/{sub.billingCycle}
                            </span>
                          </div>
                          
                          {sub.description && (
                            <p className="sub-description">{sub.description}</p>
                          )}
                          
                          <div className={`renewal-date ${isUpcoming ? 'soon' : ''}`}>
                            🗓️ Renews {daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}
                            <span className="date">({new Date(sub.renewalDate).toLocaleDateString()})</span>
                          </div>
                        </div>
                        
                        <div className="sub-actions">
                          {sub.status === 'active' && (
                            <>
                              <button 
                                onClick={() => handleUpdate(sub.id, { status: 'paused' })}
                                title="Pause"
                              >
                                ⏸️
                              </button>
                              <button 
                                onClick={() => handleUpdate(sub.id, { status: 'cancelled' })}
                                title="Cancel"
                              >
                                ❌
                              </button>
                            </>
                          )}
                          
                          {sub.status === 'paused' && (
                            <button 
                              onClick={() => handleUpdate(sub.id, { status: 'active' })}
                              title="Resume"
                            >
                              ▶️
                            </button>
                          )}
                          
                          <button onClick={() => handleDelete(sub.id)} title="Delete">🗑️</button>
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
