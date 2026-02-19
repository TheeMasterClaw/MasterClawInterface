import React, { useState, useEffect, useMemo } from 'react';
// import './SubscriptionTracker.css';

const BILLING_CYCLES = [
  { value: 'weekly', label: 'Weekly', multiplier: 52 },
  { value: 'monthly', label: 'Monthly', multiplier: 12 },
  { value: 'quarterly', label: 'Quarterly', multiplier: 4 },
  { value: 'yearly', label: 'Yearly', multiplier: 1 },
];

const CATEGORIES = [
  { icon: '🎬', name: 'Streaming', color: '#ef4444' },
  { icon: '🎵', name: 'Music', color: '#8b5cf6' },
  { icon: '☁️', name: 'Cloud Storage', color: '#3b82f6' },
  { icon: '📱', name: 'Mobile', color: '#22c55e' },
  { icon: '📰', name: 'News', color: '#f59e0b' },
  { icon: '💻', name: 'Software', color: '#6366f1' },
  { icon: '🏋️', name: 'Fitness', color: '#ec4899' },
  { icon: '🎮', name: 'Gaming', color: '#14b8a6' },
  { icon: '📚', name: 'Education', color: '#f97316' },
  { icon: '🛒', name: 'Shopping', color: '#06b6d4' },
  { icon: '🔒', name: 'Security', color: '#84cc16' },
  { icon: '✨', name: 'Other', color: '#94a3b8' },
];

export default function SubscriptionTracker({ isOpen, onClose }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('renewal'); // 'renewal', 'cost', 'name'
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'calendar'
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    currency: 'USD',
    billingCycle: 'monthly',
    nextRenewal: '',
    category: 'Other',
    description: '',
    autoRenew: true,
    url: '',
    cancelReminder: true,
    reminderDays: 3
  });

  // Load subscriptions from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-subscriptions');
      if (saved) {
        try {
          setSubscriptions(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse subscriptions:', e);
        }
      } else {
        // Default sample data
        const defaults = [
          {
            id: '1',
            name: 'Netflix',
            cost: 15.49,
            currency: 'USD',
            billingCycle: 'monthly',
            nextRenewal: getFutureDate(15),
            category: 'Streaming',
            description: 'Standard plan',
            autoRenew: true,
            url: 'https://netflix.com',
            cancelReminder: true,
            reminderDays: 3,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Spotify',
            cost: 10.99,
            currency: 'USD',
            billingCycle: 'monthly',
            nextRenewal: getFutureDate(7),
            category: 'Music',
            description: 'Premium individual',
            autoRenew: true,
            url: 'https://spotify.com',
            cancelReminder: true,
            reminderDays: 3,
            createdAt: new Date().toISOString()
          }
        ];
        setSubscriptions(defaults);
        localStorage.setItem('mc-subscriptions', JSON.stringify(defaults));
      }
    }
  }, [isOpen]);

  // Save subscriptions to localStorage
  const saveSubscriptions = (updated) => {
    setSubscriptions(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-subscriptions', JSON.stringify(updated));
    }
  };

  // Helper to get future date string
  function getFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  // Calculate annual cost
  const calculateAnnualCost = (sub) => {
    const cycle = BILLING_CYCLES.find(c => c.value === sub.billingCycle);
    return sub.cost * (cycle?.multiplier || 12);
  };

  // Calculate monthly cost
  const calculateMonthlyCost = (sub) => {
    const cycle = BILLING_CYCLES.find(c => c.value === sub.billingCycle);
    return (sub.cost * (cycle?.multiplier || 12)) / 12;
  };

  // Get total costs
  const totals = useMemo(() => {
    const monthly = subscriptions.reduce((acc, sub) => acc + calculateMonthlyCost(sub), 0);
    const yearly = subscriptions.reduce((acc, sub) => acc + calculateAnnualCost(sub), 0);
    return { monthly, yearly };
  }, [subscriptions]);

  // Get category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown = {};
    subscriptions.forEach(sub => {
      if (!breakdown[sub.category]) {
        breakdown[sub.category] = { count: 0, monthly: 0 };
      }
      breakdown[sub.category].count++;
      breakdown[sub.category].monthly += calculateMonthlyCost(sub);
    });
    return breakdown;
  }, [subscriptions]);

  // Get upcoming renewals (next 30 days)
  const upcomingRenewals = useMemo(() => {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    return subscriptions
      .filter(sub => {
        const renewalDate = new Date(sub.nextRenewal);
        return renewalDate >= today && renewalDate <= thirtyDaysLater;
      })
      .sort((a, b) => new Date(a.nextRenewal) - new Date(b.nextRenewal));
  }, [subscriptions]);

  // Get days until renewal
  const getDaysUntilRenewal = (renewalDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const renewal = new Date(renewalDate);
    renewal.setHours(0, 0, 0, 0);
    const diffTime = renewal - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get category icon and color
  const getCategoryInfo = (categoryName) => {
    return CATEGORIES.find(c => c.name === categoryName) || CATEGORIES[CATEGORIES.length - 1];
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.cost || !formData.nextRenewal) return;

    const parsedCost = parseFloat(formData.cost);
    if (isNaN(parsedCost) || parsedCost <= 0) return;

    if (editingSub) {
      const updated = subscriptions.map(sub =>
        sub.id === editingSub.id
          ? { 
              ...sub, 
              ...formData, 
              cost: parsedCost,
              updatedAt: new Date().toISOString() 
            }
          : sub
      );
      saveSubscriptions(updated);
      setEditingSub(null);
    } else {
      const newSub = {
        id: Date.now().toString(),
        ...formData,
        cost: parsedCost,
        createdAt: new Date().toISOString()
      };
      saveSubscriptions([...subscriptions, newSub]);
    }
    
    setFormData({
      name: '',
      cost: '',
      currency: 'USD',
      billingCycle: 'monthly',
      nextRenewal: '',
      category: 'Other',
      description: '',
      autoRenew: true,
      url: '',
      cancelReminder: true,
      reminderDays: 3
    });
    setShowAddForm(false);
  };

  // Delete subscription
  const deleteSubscription = (id) => {
    if (confirm('Delete this subscription?')) {
      const updated = subscriptions.filter(sub => sub.id !== id);
      saveSubscriptions(updated);
      if (editingSub?.id === id) {
        setEditingSub(null);
        setShowAddForm(false);
      }
    }
  };

  // Edit subscription
  const editSubscription = (sub) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      cost: sub.cost.toString(),
      currency: sub.currency || 'USD',
      billingCycle: sub.billingCycle,
      nextRenewal: sub.nextRenewal,
      category: sub.category,
      description: sub.description || '',
      autoRenew: sub.autoRenew !== false,
      url: sub.url || '',
      cancelReminder: sub.cancelReminder !== false,
      reminderDays: sub.reminderDays || 3
    });
    setShowAddForm(true);
  };

  // Mark subscription as renewed (update next renewal date)
  const markRenewed = (sub) => {
    const currentRenewal = new Date(sub.nextRenewal);
    let nextRenewal = new Date(currentRenewal);
    
    switch (sub.billingCycle) {
      case 'weekly':
        nextRenewal.setDate(currentRenewal.getDate() + 7);
        break;
      case 'monthly':
        nextRenewal.setMonth(currentRenewal.getMonth() + 1);
        break;
      case 'quarterly':
        nextRenewal.setMonth(currentRenewal.getMonth() + 3);
        break;
      case 'yearly':
        nextRenewal.setFullYear(currentRenewal.getFullYear() + 1);
        break;
    }
    
    const updated = subscriptions.map(s =>
      s.id === sub.id
        ? { ...s, nextRenewal: nextRenewal.toISOString().split('T')[0] }
        : s
    );
    saveSubscriptions(updated);
  };

  // Get filtered and sorted subscriptions
  const filteredSubscriptions = useMemo(() => {
    let filtered = filterCategory === 'all' 
      ? [...subscriptions] 
      : subscriptions.filter(sub => sub.category === filterCategory);
    
    switch (sortBy) {
      case 'renewal':
        filtered.sort((a, b) => new Date(a.nextRenewal) - new Date(b.nextRenewal));
        break;
      case 'cost':
        filtered.sort((a, b) => calculateMonthlyCost(b) - calculateMonthlyCost(a));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    return filtered;
  }, [subscriptions, filterCategory, sortBy]);

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="subscription-panel-overlay" onClick={onClose}>
      <div className="subscription-panel" onClick={e => e.stopPropagation()}>
        <div className="subscription-panel-header">
          <h3>💳 Subscription Tracker</h3>
          <div className="header-actions">
            <button 
              className="add-sub-btn"
              onClick={() => {
                setEditingSub(null);
                setFormData({
                  name: '',
                  cost: '',
                  currency: 'USD',
                  billingCycle: 'monthly',
                  nextRenewal: '',
                  category: 'Other',
                  description: '',
                  autoRenew: true,
                  url: '',
                  cancelReminder: true,
                  reminderDays: 3
                });
                setShowAddForm(true);
              }}
            >
              + Add Subscription
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="subscription-summary">
          <div className="summary-card total">
            <div className="summary-icon">💰</div>
            <div className="summary-info">
              <span className="summary-value">{formatCurrency(totals.monthly)}</span>
              <span className="summary-label">Monthly Cost</span>
            </div>
          </div>
          <div className="summary-card yearly">
            <div className="summary-icon">📅</div>
            <div className="summary-info">
              <span className="summary-value">{formatCurrency(totals.yearly)}</span>
              <span className="summary-label">Yearly Cost</span>
            </div>
          </div>
          <div className="summary-card count">
            <div className="summary-icon">📊</div>
            <div className="summary-info">
              <span className="summary-value">{subscriptions.length}</span>
              <span className="summary-label">Active Subs</span>
            </div>
          </div>
          <div className="summary-card upcoming">
            <div className="summary-icon">⏰</div>
            <div className="summary-info">
              <span className="summary-value">{upcomingRenewals.length}</span>
              <span className="summary-label">Due Soon (30d)</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <div className="category-breakdown">
            <h4>📊 By Category</h4>
            <div className="category-chips">
              {Object.entries(categoryBreakdown)
                .sort((a, b) => b[1].monthly - a[1].monthly)
                .map(([category, data]) => {
                  const catInfo = getCategoryInfo(category);
                  return (
                    <div 
                      key={category} 
                      className="category-chip"
                      style={{ backgroundColor: `${catInfo.color}20`, borderColor: `${catInfo.color}40` }}
                    >
                      <span className="chip-icon">{catInfo.icon}</span>
                      <span className="chip-name">{category}</span>
                      <span className="chip-cost">{formatCurrency(data.monthly)}/mo</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Upcoming Renewals */}
        {upcomingRenewals.length > 0 && (
          <div className="upcoming-section">
            <h4>⏰ Upcoming Renewals</h4>
            <div className="upcoming-list">
              {upcomingRenewals.slice(0, 5).map(sub => {
                const daysLeft = getDaysUntilRenewal(sub.nextRenewal);
                const catInfo = getCategoryInfo(sub.category);
                return (
                  <div 
                    key={sub.id} 
                    className={`upcoming-item ${daysLeft <= 3 ? 'urgent' : ''}`}
                  >
                    <span className="upcoming-icon" style={{ color: catInfo.color }}>
                      {catInfo.icon}
                    </span>
                    <div className="upcoming-info">
                      <span className="upcoming-name">{sub.name}</span>
                      <span className="upcoming-cost">{formatCurrency(sub.cost)}</span>
                    </div>
                    <div className="upcoming-date">
                      <span className="days-left">{daysLeft === 0 ? 'Today' : `${daysLeft}d`}</span>
                      <span className="renewal-date">{sub.nextRenewal}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters and Sort */}
        <div className="subscription-filters">
          <div className="filter-group">
            <label>Category:</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="renewal">Renewal Date</option>
              <option value="cost">Cost (High to Low)</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="subscriptions-list">
          {filteredSubscriptions.length === 0 ? (
            <div className="empty-subscriptions">
              <span className="empty-icon">💳</span>
              <p>No subscriptions found</p>
              <button onClick={() => setShowAddForm(true)}>Add your first subscription</button>
            </div>
          ) : (
            filteredSubscriptions.map(sub => {
              const catInfo = getCategoryInfo(sub.category);
              const daysLeft = getDaysUntilRenewal(sub.nextRenewal);
              const monthlyCost = calculateMonthlyCost(sub);
              
              return (
                <div key={sub.id} className="subscription-item">
                  <div 
                    className="sub-icon"
                    style={{ backgroundColor: `${catInfo.color}20`, color: catInfo.color }}
                  >
                    {catInfo.icon}
                  </div>
                  <div className="sub-info">
                    <div className="sub-header">
                      <span className="sub-name">{sub.name}</span>
                      <span className="sub-category">{sub.category}</span>
                    </div>
                    <div className="sub-details">
                      <span className="sub-cost">{formatCurrency(sub.cost)}</span>
                      <span className="sub-cycle">{sub.billingCycle}</span>
                      <span className="sub-monthly">(~{formatCurrency(monthlyCost)}/mo)</span>
                    </div>
                    <div className={`sub-renewal ${daysLeft <= 3 ? 'urgent' : daysLeft <= 7 ? 'soon' : ''}`}>
                      <span>🔄 Renews: {sub.nextRenewal}</span>
                      <span className="days-badge">{daysLeft <= 0 ? 'Today!' : `${daysLeft} days`}</span>
                    </div>
                    {sub.description && (
                      <span className="sub-description">{sub.description}</span>
                    )}
                    {sub.autoRenew === false && (
                      <span className="sub-badge manual">Manual renewal</span>
                    )}
                  </div>
                  <div className="sub-actions">
                    <button 
                      className="renew-btn"
                      onClick={() => markRenewed(sub)}
                      title="Mark as renewed"
                    >
                      ✓
                    </button>
                    <button 
                      className="edit-btn"
                      onClick={() => editSubscription(sub)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteSubscription(sub.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="sub-form-overlay" onClick={() => setShowAddForm(false)}>
            <form className="sub-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <h4>{editingSub ? '✏️ Edit Subscription' : '➕ New Subscription'}</h4>
              
              <div className="form-group">
                <label>Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Netflix, Spotify"
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cost *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.cost}
                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="9.99"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Billing Cycle *</label>
                  <select
                    value={formData.billingCycle}
                    onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}
                    required
                  >
                    {BILLING_CYCLES.map(cycle => (
                      <option key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Next Renewal *</label>
                  <input
                    type="date"
                    value={formData.nextRenewal}
                    onChange={e => setFormData({ ...formData, nextRenewal: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category</label>
                <div className="category-picker">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      className={`category-option ${formData.category === cat.name ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, category: cat.name })}
                      style={{ 
                        backgroundColor: formData.category === cat.name ? `${cat.color}30` : 'transparent',
                        borderColor: formData.category === cat.name ? cat.color : undefined
                      }}
                    >
                      <span>{cat.icon}</span>
                      <small>{cat.name}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Plan details, notes..."
                />
              </div>

              <div className="form-group">
                <label>Website URL (optional)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-checkboxes">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.autoRenew}
                    onChange={e => setFormData({ ...formData, autoRenew: e.target.checked })}
                  />
                  <span>Auto-renewal enabled</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.cancelReminder}
                    onChange={e => setFormData({ ...formData, cancelReminder: e.target.checked })}
                  />
                  <span>Remind me before renewal</span>
                </label>
              </div>

              {formData.cancelReminder && (
                <div className="form-group">
                  <label>Reminder Days Before</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.reminderDays}
                    onChange={e => setFormData({ ...formData, reminderDays: parseInt(e.target.value) || 3 })}
                  />
                </div>
              )}
              
              <div className="form-actions">
                {editingSub && (
                  <button 
                    type="button" 
                    className="btn-delete"
                    onClick={() => deleteSubscription(editingSub.id)}
                  >
                    🗑️ Delete
                  </button>
                )}
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSub ? 'Save Changes' : 'Add Subscription'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
