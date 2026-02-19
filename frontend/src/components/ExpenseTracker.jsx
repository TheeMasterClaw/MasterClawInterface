'use client';

import React, { useState, useEffect, useMemo } from 'react';
// import './ExpenseTracker.css';

const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: '🍔', color: '#f59e0b', budget: 500 },
  { id: 'transport', label: 'Transportation', icon: '🚗', color: '#3b82f6', budget: 300 },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#ec4899', budget: 400 },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#8b5cf6', budget: 200 },
  { id: 'utilities', label: 'Utilities', icon: '💡', color: '#f97316', budget: 250 },
  { id: 'health', label: 'Health & Fitness', icon: '💊', color: '#ef4444', budget: 150 },
  { id: 'education', label: 'Education', icon: '📚', color: '#14b8a6', budget: 200 },
  { id: 'travel', label: 'Travel', icon: '✈️', color: '#06b6d4', budget: 500 },
  { id: 'subscriptions', label: 'Subscriptions', icon: '📺', color: '#6366f1', budget: 100 },
  { id: 'other', label: 'Other', icon: '📦', color: '#6b7280', budget: 150 }
];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'credit', label: 'Credit Card', icon: '💳' },
  { id: 'debit', label: 'Debit Card', icon: '🏦' },
  { id: 'digital', label: 'Digital Wallet', icon: '📱' },
  { id: 'other', label: 'Other', icon: '📝' }
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ExpenseTracker({ isOpen, onClose }) {
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, analytics

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'food',
    paymentMethod: 'credit',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringPeriod: 'monthly',
    notes: ''
  });

  // Load expenses and budgets from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const savedExpenses = localStorage.getItem('mc-expenses');
      if (savedExpenses) {
        try {
          setExpenses(JSON.parse(savedExpenses));
        } catch (e) {
          console.error('Failed to parse expenses:', e);
        }
      }

      const savedBudgets = localStorage.getItem('mc-expense-budgets');
      if (savedBudgets) {
        try {
          setBudgets(JSON.parse(savedBudgets));
        } catch (e) {
          console.error('Failed to parse budgets:', e);
        }
      } else {
        // Initialize default budgets
        const defaultBudgets = {};
        EXPENSE_CATEGORIES.forEach(cat => {
          defaultBudgets[cat.id] = cat.budget;
        });
        setBudgets(defaultBudgets);
      }
    }
  }, [isOpen]);

  // Save expenses to localStorage
  const saveExpenses = (updatedExpenses) => {
    setExpenses(updatedExpenses);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-expenses', JSON.stringify(updatedExpenses));
    }
  };

  // Save budgets to localStorage
  const saveBudgets = (updatedBudgets) => {
    setBudgets(updatedBudgets);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-expense-budgets', JSON.stringify(updatedBudgets));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) return;

    const expenseData = {
      id: editingExpense ? editingExpense.id : Date.now().toString(),
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      paymentMethod: formData.paymentMethod,
      date: formData.date,
      isRecurring: formData.isRecurring,
      recurringPeriod: formData.recurringPeriod,
      notes: formData.notes,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingExpense) {
      saveExpenses(expenses.map(ex => ex.id === editingExpense.id ? expenseData : ex));
      setEditingExpense(null);
    } else {
      saveExpenses([...expenses, expenseData]);
    }

    resetForm();
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category: 'food',
      paymentMethod: 'credit',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringPeriod: 'monthly',
      notes: ''
    });
  };

  const deleteExpense = (id) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      saveExpenses(expenses.filter(ex => ex.id !== id));
      if (viewingExpense?.id === id) {
        setViewingExpense(null);
      }
    }
  };

  const startEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category,
      paymentMethod: expense.paymentMethod || 'credit',
      date: expense.date,
      isRecurring: expense.isRecurring || false,
      recurringPeriod: expense.recurringPeriod || 'monthly',
      notes: expense.notes || ''
    });
    setShowAddForm(true);
    setViewingExpense(null);
  };

  // Filter expenses by selected month/year
  const filteredExpenses = useMemo(() => {
    let result = expenses.filter(ex => {
      const exDate = new Date(ex.date);
      return exDate.getMonth() === selectedMonth && exDate.getFullYear() === selectedYear;
    });

    if (filterCategory !== 'all') {
      result = result.filter(ex => ex.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ex =>
        ex.description.toLowerCase().includes(query) ||
        ex.notes?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'date-desc':
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'amount-asc':
        result.sort((a, b) => a.amount - b.amount);
        break;
      case 'amount-desc':
        result.sort((a, b) => b.amount - a.amount);
        break;
      default:
        break;
    }

    return result;
  }, [expenses, selectedMonth, selectedYear, filterCategory, searchQuery, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const monthExpenses = expenses.filter(ex => {
      const exDate = new Date(ex.date);
      return exDate.getMonth() === selectedMonth && exDate.getFullYear() === selectedYear;
    });

    const totalSpent = monthExpenses.reduce((acc, ex) => acc + ex.amount, 0);
    const totalBudget = Object.values(budgets).reduce((acc, b) => acc + (b || 0), 0);

    const categorySpending = {};
    EXPENSE_CATEGORIES.forEach(cat => {
      categorySpending[cat.id] = monthExpenses
        .filter(ex => ex.category === cat.id)
        .reduce((acc, ex) => acc + ex.amount, 0);
    });

    const dailyAverage = totalSpent / 30; // Approximate

    const recurringTotal = monthExpenses
      .filter(ex => ex.isRecurring)
      .reduce((acc, ex) => acc + ex.amount, 0);

    return {
      totalSpent,
      totalBudget,
      remaining: totalBudget - totalSpent,
      categorySpending,
      dailyAverage,
      recurringTotal,
      transactionCount: monthExpenses.length
    };
  }, [expenses, budgets, selectedMonth, selectedYear]);

  // Get spending trend (compare to previous month)
  const spendingTrend = useMemo(() => {
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;

    const currentTotal = expenses
      .filter(ex => {
        const exDate = new Date(ex.date);
        return exDate.getMonth() === selectedMonth && exDate.getFullYear() === selectedYear;
      })
      .reduce((acc, ex) => acc + ex.amount, 0);

    const prevTotal = expenses
      .filter(ex => {
        const exDate = new Date(ex.date);
        return exDate.getMonth() === prevMonth && exDate.getFullYear() === prevYear;
      })
      .reduce((acc, ex) => acc + ex.amount, 0);

    if (prevTotal === 0) return 0;
    return ((currentTotal - prevTotal) / prevTotal) * 100;
  }, [expenses, selectedMonth, selectedYear]);

  const getCategoryLabel = (catId) => EXPENSE_CATEGORIES.find(c => c.id === catId)?.label || catId;
  const getCategoryIcon = (catId) => EXPENSE_CATEGORIES.find(c => c.id === catId)?.icon || '📦';
  const getCategoryColor = (catId) => EXPENSE_CATEGORIES.find(c => c.id === catId)?.color || '#6b7280';
  const getPaymentIcon = (methodId) => PAYMENT_METHODS.find(m => m.id === methodId)?.icon || '💵';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getBudgetProgress = (catId) => {
    const spent = stats.categorySpending[catId] || 0;
    const budget = budgets[catId] || 0;
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  const getBudgetStatus = (catId) => {
    const spent = stats.categorySpending[catId] || 0;
    const budget = budgets[catId] || 0;
    if (budget === 0) return 'neutral';
    const ratio = spent / budget;
    if (ratio > 1) return 'over';
    if (ratio > 0.8) return 'warning';
    return 'good';
  };

  if (!isOpen) return null;

  return (
    <div className="expense-panel-overlay" onClick={onClose}>
      <div className="expense-panel" onClick={e => e.stopPropagation()}>
        <div className="expense-panel-header">
          <h3>💰 Expense Tracker</h3>
          <div className="header-actions">
            <button 
              className="budget-btn"
              onClick={() => setShowBudgetSettings(true)}
              title="Manage Budgets"
            >
              🎯 Budgets
            </button>
            <button 
              className="add-expense-btn"
              onClick={() => {
                setEditingExpense(null);
                resetForm();
                setShowAddForm(true);
              }}
            >
              + Add Expense
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Month/Year Selector */}
        <div className="month-selector">
          <button 
            className="nav-btn"
            onClick={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
              } else {
                setSelectedMonth(selectedMonth - 1);
              }
            }}
          >
            ←
          </button>
          <span className="current-month">
            {MONTHS[selectedMonth]} {selectedYear}
          </span>
          <button 
            className="nav-btn"
            onClick={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
              } else {
                setSelectedMonth(selectedMonth + 1);
              }
            }}
          >
            →
          </button>
        </div>

        {/* Tabs */}
        <div className="expense-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={activeTab === 'transactions' ? 'active' : ''}
            onClick={() => setActiveTab('transactions')}
          >
            📝 Transactions ({filteredExpenses.length})
          </button>
          <button 
            className={activeTab === 'analytics' ? 'active' : ''}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Summary Cards */}
            <div className="expense-summary">
              <div className="summary-card total">
                <span className="summary-icon">💸</span>
                <div className="summary-info">
                  <span className="summary-value">{formatCurrency(stats.totalSpent)}</span>
                  <span className="summary-label">Total Spent</span>
                </div>
                {spendingTrend !== 0 && (
                  <span className={`trend-badge ${spendingTrend > 0 ? 'up' : 'down'}`}>
                    {spendingTrend > 0 ? '↑' : '↓'} {Math.abs(spendingTrend).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="summary-card budget">
                <span className="summary-icon">🎯</span>
                <div className="summary-info">
                  <span className="summary-value">{formatCurrency(stats.totalBudget)}</span>
                  <span className="summary-label">Budget</span>
                </div>
              </div>
              <div className={`summary-card remaining ${stats.remaining < 0 ? 'negative' : ''}`}>
                <span className="summary-icon">{stats.remaining < 0 ? '⚠️' : '💰'}</span>
                <div className="summary-info">
                  <span className="summary-value">{formatCurrency(Math.abs(stats.remaining))}</span>
                  <span className="summary-label">{stats.remaining < 0 ? 'Over Budget' : 'Remaining'}</span>
                </div>
              </div>
              <div className="summary-card daily">
                <span className="summary-icon">📅</span>
                <div className="summary-info">
                  <span className="summary-value">{formatCurrency(stats.dailyAverage)}</span>
                  <span className="summary-label">Daily Average</span>
                </div>
              </div>
            </div>

            {/* Budget Progress */}
            <div className="budget-progress-section">
              <h4>📊 Budget Overview</h4>
              <div className="budget-bars">
                {EXPENSE_CATEGORIES.map(cat => {
                  const spent = stats.categorySpending[cat.id] || 0;
                  const budget = budgets[cat.id] || 0;
                  const progress = getBudgetProgress(cat.id);
                  const status = getBudgetStatus(cat.id);

                  if (budget === 0 && spent === 0) return null;

                  return (
                    <div key={cat.id} className={`budget-bar-item ${status}`}>
                      <div className="budget-bar-header">
                        <span className="cat-info">
                          <span className="cat-icon">{cat.icon}</span>
                          <span className="cat-name">{cat.label}</span>
                        </span>
                        <span className="cat-amounts">
                          <span className="spent">{formatCurrency(spent)}</span>
                          <span className="divider">/</span>
                          <span className="budget">{formatCurrency(budget)}</span>
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: status === 'over' ? '#ef4444' : cat.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="recent-transactions">
              <h4>📝 Recent Transactions</h4>
              {filteredExpenses.slice(0, 5).length === 0 ? (
                <p className="no-data">No transactions this month</p>
              ) : (
                <div className="transaction-list">
                  {filteredExpenses.slice(0, 5).map(ex => (
                    <div 
                      key={ex.id} 
                      className="transaction-item"
                      onClick={() => setViewingExpense(ex)}
                    >
                      <span className="trans-icon">{getCategoryIcon(ex.category)}</span>
                      <div className="trans-info">
                        <span className="trans-desc">{ex.description}</span>
                        <span className="trans-date">{new Date(ex.date).toLocaleDateString()}</span>
                      </div>
                      <span className="trans-amount">{formatCurrency(ex.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <>
            {/* Filters */}
            <div className="transaction-filters">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                ))}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>

            {/* Transactions List */}
            <div className="transactions-list">
              {filteredExpenses.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📝</span>
                  <p>No transactions found</p>
                  <button onClick={() => setShowAddForm(true)}>Add Your First Expense</button>
                </div>
              ) : (
                filteredExpenses.map(ex => (
                  <div 
                    key={ex.id} 
                    className="transaction-row"
                    onClick={() => setViewingExpense(ex)}
                  >
                    <div className="trans-main">
                      <span 
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(ex.category) }}
                      >
                        {getCategoryIcon(ex.category)}
                      </span>
                      <div className="trans-details">
                        <span className="trans-desc">{ex.description}</span>
                        <span className="trans-meta">
                          {new Date(ex.date).toLocaleDateString()} • {getPaymentIcon(ex.paymentMethod)}
                          {ex.isRecurring && ' 🔄'}
                        </span>
                      </div>
                    </div>
                    <span className="trans-amount">{formatCurrency(ex.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            {/* Category Breakdown */}
            <div className="analytics-card">
              <h4>📊 Spending by Category</h4>
              <div className="category-chart">
                {EXPENSE_CATEGORIES.map(cat => {
                  const spent = stats.categorySpending[cat.id] || 0;
                  if (spent === 0) return null;
                  const percentage = stats.totalSpent > 0 ? (spent / stats.totalSpent) * 100 : 0;

                  return (
                    <div key={cat.id} className="chart-bar">
                      <div className="chart-label">
                        <span>{cat.icon} {cat.label}</span>
                        <span>{formatCurrency(spent)} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="chart-progress">
                        <div 
                          className="chart-fill"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: cat.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="analytics-card">
              <h4>💳 Payment Methods</h4>
              <div className="payment-methods">
                {PAYMENT_METHODS.map(method => {
                  const total = filteredExpenses
                    .filter(ex => ex.paymentMethod === method.id)
                    .reduce((acc, ex) => acc + ex.amount, 0);
                  if (total === 0) return null;

                  return (
                    <div key={method.id} className="payment-item">
                      <span className="payment-icon">{method.icon}</span>
                      <span className="payment-label">{method.label}</span>
                      <span className="payment-amount">{formatCurrency(total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recurring Expenses */}
            {stats.recurringTotal > 0 && (
              <div className="analytics-card">
                <h4>🔄 Recurring Expenses</h4>
                <div className="recurring-summary">
                  <span className="recurring-total">
                    {formatCurrency(stats.recurringTotal)} / month
                  </span>
                  <p>These are your fixed monthly expenses</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="expense-form-overlay" onClick={() => setShowAddForm(false)}>
            <form className="expense-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <h4>{editingExpense ? '✏️ Edit Expense' : '➕ Add New Expense'}</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full">
                  <label>Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What did you spend on?"
                    required
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method.id} value={method.id}>{method.icon} {method.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    />
                    <span>🔄 This is a recurring expense</span>
                  </label>
                </div>
              </div>

              {formData.isRecurring && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Recurring Period</label>
                    <select
                      value={formData.recurringPeriod}
                      onChange={(e) => setFormData({ ...formData, recurringPeriod: e.target.value })}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group full">
                  <label>Notes (optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional details..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="form-actions">
                {editingExpense && (
                  <button 
                    type="button" 
                    className="btn-delete"
                    onClick={() => {
                      deleteExpense(editingExpense.id);
                      setShowAddForm(false);
                    }}
                  >
                    🗑️ Delete
                  </button>
                )}
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingExpense ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Budget Settings Modal */}
        {showBudgetSettings && (
          <div className="budget-settings-overlay" onClick={() => setShowBudgetSettings(false)}>
            <div className="budget-settings" onClick={e => e.stopPropagation()}>
              <div className="budget-settings-header">
                <h4>🎯 Manage Budgets</h4>
                <button className="close-btn" onClick={() => setShowBudgetSettings(false)}>×</button>
              </div>
              <div className="budget-list">
                {EXPENSE_CATEGORIES.map(cat => (
                  <div key={cat.id} className="budget-item">
                    <span className="budget-cat-info">
                      <span className="cat-icon">{cat.icon}</span>
                      <span className="cat-label">{cat.label}</span>
                    </span>
                    <div className="budget-input-group">
                      <span className="currency">$</span>
                      <input
                        type="number"
                        min="0"
                        value={budgets[cat.id] || 0}
                        onChange={(e) => {
                          const newBudgets = { ...budgets, [cat.id]: parseFloat(e.target.value) || 0 };
                          saveBudgets(newBudgets);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="budget-total">
                <span>Total Monthly Budget:</span>
                <span className="total-amount">{formatCurrency(Object.values(budgets).reduce((a, b) => a + (b || 0), 0))}</span>
              </div>
            </div>
          </div>
        )}

        {/* View Expense Detail Modal */}
        {viewingExpense && !showAddForm && (
          <div className="expense-detail-overlay" onClick={() => setViewingExpense(null)}>
            <div className="expense-detail" onClick={e => e.stopPropagation()}>
              <div className="expense-detail-header">
                <span 
                  className="detail-category-icon"
                  style={{ backgroundColor: getCategoryColor(viewingExpense.category) }}
                >
                  {getCategoryIcon(viewingExpense.category)}
                </span>
                <div className="detail-info">
                  <h4>{viewingExpense.description}</h4>
                  <span className="detail-category">{getCategoryLabel(viewingExpense.category)}</span>
                </div>
                <span className="detail-amount">{formatCurrency(viewingExpense.amount)}</span>
              </div>

              <div className="expense-detail-content">
                <div className="detail-row">
                  <span className="detail-label">📅 Date</span>
                  <span className="detail-value">{new Date(viewingExpense.date).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">💳 Payment</span>
                  <span className="detail-value">
                    {getPaymentIcon(viewingExpense.paymentMethod)} {PAYMENT_METHODS.find(m => m.id === viewingExpense.paymentMethod)?.label || 'Credit Card'}
                  </span>
                </div>
                {viewingExpense.isRecurring && (
                  <div className="detail-row">
                    <span className="detail-label">🔄 Recurring</span>
                    <span className="detail-value">{viewingExpense.recurringPeriod || 'Monthly'}</span>
                  </div>
                )}
                {viewingExpense.notes && (
                  <div className="detail-row notes">
                    <span className="detail-label">📝 Notes</span>
                    <p className="detail-value">{viewingExpense.notes}</p>
                  </div>
                )}
              </div>

              <div className="expense-detail-actions">
                <button onClick={() => startEdit(viewingExpense)}>✏️ Edit</button>
                <button className="btn-delete" onClick={() => deleteExpense(viewingExpense.id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
