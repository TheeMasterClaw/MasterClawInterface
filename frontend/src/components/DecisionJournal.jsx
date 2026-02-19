'use client';

import React, { useState, useEffect, useMemo } from 'react';
// import './DecisionJournal.css';

const DECISION_CATEGORIES = [
  { id: 'career', label: 'Career', emoji: '💼', color: '#60a5fa' },
  { id: 'finance', label: 'Finance', emoji: '💰', color: '#4ade80' },
  { id: 'health', label: 'Health', emoji: '❤️', color: '#f87171' },
  { id: 'relationships', label: 'Relationships', emoji: '👥', color: '#f472b6' },
  { id: 'learning', label: 'Learning', emoji: '📚', color: '#a78bfa' },
  { id: 'creative', label: 'Creative', emoji: '🎨', color: '#fbbf24' },
  { id: 'lifestyle', label: 'Lifestyle', emoji: '🏠', color: '#34d399' },
  { id: 'other', label: 'Other', emoji: '📌', color: '#9ca3af' }
];

const IMPORTANCE_LEVELS = [
  { id: 'low', label: 'Low', emoji: '🟢', description: 'Minor, easily reversible' },
  { id: 'medium', label: 'Medium', emoji: '🟡', description: 'Moderate impact, some effort to reverse' },
  { id: 'high', label: 'High', emoji: '🔴', description: 'Major impact, difficult to reverse' },
  { id: 'critical', label: 'Critical', emoji: '🔥', description: 'Life-changing, irreversible' }
];

const OUTCOME_RATING = [
  { id: 'pending', label: 'Pending', emoji: '⏳', color: '#9ca3af' },
  { id: 'success', label: 'Great Success', emoji: '🌟', color: '#4ade80' },
  { id: 'good', label: 'Good Outcome', emoji: '👍', color: '#60a5fa' },
  { id: 'neutral', label: 'Neutral', emoji: '😐', color: '#fbbf24' },
  { id: 'poor', label: 'Poor Outcome', emoji: '👎', color: '#fb923c' },
  { id: 'failure', label: 'Failure', emoji: '❌', color: '#f87171' }
];

const DECISION_TEMPLATES = [
  {
    name: 'Standard Decision',
    description: 'What decision are you making?',
    contextPlaceholder: 'What is the situation or context?',
    optionsPlaceholder: 'What options are you considering?',
    reasoningPlaceholder: 'Why are you choosing this option?',
    risksPlaceholder: 'What could go wrong?'
  },
  {
    name: 'Career Move',
    description: 'Job change, promotion, or career pivot',
    contextPlaceholder: 'Current role and situation...',
    optionsPlaceholder: 'Options: Stay, Leave, Negotiate, etc.',
    reasoningPlaceholder: 'Why this path aligns with your goals...',
    risksPlaceholder: 'Financial, growth, or stability risks...'
  },
  {
    name: 'Investment',
    description: 'Financial or time investment decision',
    contextPlaceholder: 'Current financial/time situation...',
    optionsPlaceholder: 'Investment options or alternatives...',
    reasoningPlaceholder: 'Expected returns and alignment with goals...',
    risksPlaceholder: 'Downside scenarios and mitigation...'
  },
  {
    name: 'Relationship',
    description: 'Important relationship decision',
    contextPlaceholder: 'Current relationship dynamics...',
    optionsPlaceholder: 'Different approaches or choices...',
    reasoningPlaceholder: 'Why this approach serves both parties...',
    risksPlaceholder: 'Potential misunderstandings or outcomes...'
  }
];

const STORAGE_KEY = 'mc-decision-journal';

export default function DecisionJournal({ isOpen, onClose }) {
  const [decisions, setDecisions] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'review', 'timeline'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterImportance, setFilterImportance] = useState('all');
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [editingDecision, setEditingDecision] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('career');
  const [importance, setImportance] = useState('medium');
  const [context, setContext] = useState('');
  const [options, setOptions] = useState('');
  const [decisionMade, setDecisionMade] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [risks, setRisks] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  // Load decisions from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setDecisions(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load decision journal:', err);
    }
  }, [isOpen]);

  // Save decisions to localStorage
  const saveDecisions = (newDecisions) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDecisions));
      setDecisions(newDecisions);
    } catch (err) {
      console.error('Failed to save decision journal:', err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('career');
    setImportance('medium');
    setContext('');
    setOptions('');
    setDecisionMade('');
    setReasoning('');
    setRisks('');
    setExpectedOutcome('');
    setReviewDate('');
    setTags([]);
    setTagInput('');
    setSelectedTemplate(0);
    setEditingDecision(null);
  };

  const handleSaveDecision = () => {
    if (!title.trim() || !decisionMade.trim()) return;

    const decisionData = {
      id: editingDecision?.id || Date.now(),
      title: title.trim(),
      category,
      importance,
      context: context.trim(),
      options: options.trim(),
      decisionMade: decisionMade.trim(),
      reasoning: reasoning.trim(),
      risks: risks.trim(),
      expectedOutcome: expectedOutcome.trim(),
      reviewDate: reviewDate || null,
      tags,
      outcome: editingDecision?.outcome || { status: 'pending', notes: '', date: null },
      createdAt: editingDecision?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let newDecisions;
    if (editingDecision) {
      newDecisions = decisions.map(d => d.id === editingDecision.id ? decisionData : d);
    } else {
      newDecisions = [decisionData, ...decisions];
    }
    
    saveDecisions(newDecisions);
    resetForm();
    setViewMode('list');
  };

  const handleDeleteDecision = (id) => {
    if (!window.confirm('Are you sure you want to delete this decision?')) return;
    const newDecisions = decisions.filter(d => d.id !== id);
    saveDecisions(newDecisions);
    if (selectedDecision?.id === id) {
      setSelectedDecision(null);
    }
  };

  const handleUpdateOutcome = (id, outcomeData) => {
    const newDecisions = decisions.map(d => 
      d.id === id ? { ...d, outcome: { ...d.outcome, ...outcomeData, date: new Date().toISOString() }, updatedAt: new Date().toISOString() } : d
    );
    saveDecisions(newDecisions);
    if (selectedDecision?.id === id) {
      setSelectedDecision({ ...selectedDecision, outcome: { ...selectedDecision.outcome, ...outcomeData, date: new Date().toISOString() } });
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleEditDecision = (decision) => {
    setEditingDecision(decision);
    setTitle(decision.title);
    setCategory(decision.category);
    setImportance(decision.importance);
    setContext(decision.context);
    setOptions(decision.options);
    setDecisionMade(decision.decisionMade);
    setReasoning(decision.reasoning);
    setRisks(decision.risks);
    setExpectedOutcome(decision.expectedOutcome);
    setReviewDate(decision.reviewDate || '');
    setTags(decision.tags || []);
    setViewMode('create');
    setSelectedDecision(null);
  };

  const filteredDecisions = useMemo(() => {
    let filtered = decisions;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(query) ||
        d.context.toLowerCase().includes(query) ||
        d.decisionMade.toLowerCase().includes(query) ||
        d.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(d => d.category === filterCategory);
    }
    
    if (filterImportance !== 'all') {
      filtered = filtered.filter(d => d.importance === filterImportance);
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [decisions, searchQuery, filterCategory, filterImportance]);

  const getStats = () => {
    const total = decisions.length;
    const pending = decisions.filter(d => d.outcome.status === 'pending').length;
    const reviewed = decisions.filter(d => d.outcome.status !== 'pending').length;
    const successful = decisions.filter(d => ['success', 'good'].includes(d.outcome.status)).length;
    const successRate = reviewed > 0 ? Math.round((successful / reviewed) * 100) : 0;
    
    const categoryCounts = {};
    decisions.forEach(d => {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    return { total, pending, reviewed, successRate, topCategory };
  };

  const getCategoryInfo = (id) => DECISION_CATEGORIES.find(c => c.id === id) || DECISION_CATEGORIES[7];
  const getImportanceInfo = (id) => IMPORTANCE_LEVELS.find(i => i.id === id) || IMPORTANCE_LEVELS[1];
  const getOutcomeInfo = (id) => OUTCOME_RATING.find(o => o.id === id) || OUTCOME_RATING[0];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const needsReview = decisions.filter(d => {
    if (d.outcome.status !== 'pending') return false;
    if (!d.reviewDate) return false;
    return new Date(d.reviewDate) <= new Date();
  });

  const stats = getStats();

  const applyTemplate = (index) => {
    setSelectedTemplate(index);
  };

  const template = DECISION_TEMPLATES[selectedTemplate];

  if (!isOpen) return null;

  return (
    <div className="decision-journal-overlay" onClick={onClose}>
      <div className="decision-journal" onClick={e => e.stopPropagation()}>
        <div className="decision-journal-header">
          <div className="decision-journal-title">
            <h3>🧭 Decision Journal</h3>
            <span className="subtitle">Track decisions & learn from outcomes</span>
          </div>
          <div className="decision-journal-actions">
            {viewMode === 'list' && (
              <button 
                className="primary-btn"
                onClick={() => { resetForm(); setViewMode('create'); }}
              >
                + New Decision
              </button>
            )}
            {viewMode !== 'list' && (
              <button 
                className="secondary-btn"
                onClick={() => { setViewMode('list'); resetForm(); }}
              >
                ← Back
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="decision-journal-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Decisions</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Awaiting Review</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.successRate}%</span>
            <span className="stat-label">Success Rate</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{getCategoryInfo(stats.topCategory).emoji}</span>
            <span className="stat-label">Top: {getCategoryInfo(stats.topCategory).label}</span>
          </div>
        </div>

        {needsReview.length > 0 && viewMode === 'list' && (
          <div className="review-alert">
            <span className="alert-icon">🔔</span>
            <span>{needsReview.length} decision{needsReview.length > 1 ? 's' : ''} need review</span>
            <button onClick={() => setFilterImportance('all')} className="alert-action">
              View All
            </button>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="decision-list-view">
            <div className="decision-filters">
              <input
                type="text"
                className="search-input"
                placeholder="Search decisions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {DECISION_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
              <select 
                value={filterImportance} 
                onChange={(e) => setFilterImportance(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Importance</option>
                {IMPORTANCE_LEVELS.map(i => (
                  <option key={i.id} value={i.id}>{i.emoji} {i.label}</option>
                ))}
              </select>
            </div>

            <div className="decisions-list">
              {filteredDecisions.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🧭</span>
                  <p>No decisions recorded yet</p>
                  <button 
                    className="primary-btn"
                    onClick={() => setViewMode('create')}
                  >
                    Record Your First Decision
                  </button>
                </div>
              ) : (
                filteredDecisions.map(decision => {
                  const categoryInfo = getCategoryInfo(decision.category);
                  const importanceInfo = getImportanceInfo(decision.importance);
                  const outcomeInfo = getOutcomeInfo(decision.outcome.status);
                  const isOverdue = decision.reviewDate && new Date(decision.reviewDate) <= new Date() && decision.outcome.status === 'pending';
                  
                  return (
                    <div 
                      key={decision.id} 
                      className={`decision-card ${isOverdue ? 'overdue' : ''}`}
                      onClick={() => setSelectedDecision(decision)}
                    >
                      <div className="decision-card-header">
                        <div className="decision-meta">
                          <span 
                            className="category-badge"
                            style={{ background: `${categoryInfo.color}20`, color: categoryInfo.color }}
                          >
                            {categoryInfo.emoji} {categoryInfo.label}
                          </span>
                          <span className="importance-badge" title={importanceInfo.description}>
                            {importanceInfo.emoji}
                          </span>
                          <span 
                            className="outcome-badge"
                            style={{ background: `${outcomeInfo.color}20`, color: outcomeInfo.color }}
                          >
                            {outcomeInfo.emoji} {outcomeInfo.label}
                          </span>
                        </div>
                        <span className="decision-date">{formatDate(decision.createdAt)}</span>
                      </div>
                      <h4 className="decision-title">{decision.title}</h4>
                      <p className="decision-preview">
                        <strong>Decision:</strong> {decision.decisionMade.substring(0, 100)}
                        {decision.decisionMade.length > 100 ? '...' : ''}
                      </p>
                      {decision.tags?.length > 0 && (
                        <div className="decision-tags">
                          {decision.tags.map(tag => (
                            <span key={tag} className="decision-tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                      {isOverdue && (
                        <div className="overdue-badge">⚠️ Review overdue</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {viewMode === 'create' && (
          <div className="decision-create-view">
            <div className="template-selector">
              <label>Template:</label>
              <div className="template-options">
                {DECISION_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    className={`template-btn ${selectedTemplate === i ? 'active' : ''}`}
                    onClick={() => applyTemplate(i)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-2">
                <label>{template.description}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Should I accept the new job offer?"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-select"
                >
                  {DECISION_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Importance</label>
                <select 
                  value={importance} 
                  onChange={(e) => setImportance(e.target.value)}
                  className="form-select"
                >
                  {IMPORTANCE_LEVELS.map(i => (
                    <option key={i.id} value={i.id}>{i.emoji} {i.label} - {i.description}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Review Date (optional)</label>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Context / Situation</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder={template.contextPlaceholder}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>Options Considered</label>
              <textarea
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder={template.optionsPlaceholder}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>Decision Made</label>
              <textarea
                value={decisionMade}
                onChange={(e) => setDecisionMade(e.target.value)}
                placeholder="What did you decide?"
                rows={2}
                className="form-textarea highlight"
              />
            </div>

            <div className="form-group">
              <label>Reasoning / Why This Choice</label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder={template.reasoningPlaceholder}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>Risks & Concerns</label>
              <textarea
                value={risks}
                onChange={(e) => setRisks(e.target.value)}
                placeholder={template.risksPlaceholder}
                rows={2}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>Expected Outcome</label>
              <textarea
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                placeholder="What do you expect to happen?"
                rows={2}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="tags-input-container">
                <div className="tags-list">
                  {tags.map(tag => (
                    <span key={tag} className="tag">
                      #{tag}
                      <button onClick={() => handleRemoveTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  className="tag-input"
                  placeholder="Add tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="secondary-btn"
                onClick={() => { setViewMode('list'); resetForm(); }}
              >
                Cancel
              </button>
              <button 
                className="primary-btn"
                onClick={handleSaveDecision}
                disabled={!title.trim() || !decisionMade.trim()}
              >
                {editingDecision ? '💾 Update Decision' : '💾 Save Decision'}
              </button>
            </div>
          </div>
        )}

        {selectedDecision && (
          <div className="decision-modal-overlay" onClick={() => setSelectedDecision(null)}>
            <div className="decision-modal" onClick={e => e.stopPropagation()}>
              <div className="decision-modal-header">
                <div className="decision-modal-meta">
                  <span 
                    className="category-badge large"
                    style={{ 
                      background: `${getCategoryInfo(selectedDecision.category).color}20`, 
                      color: getCategoryInfo(selectedDecision.category).color 
                    }}
                  >
                    {getCategoryInfo(selectedDecision.category).emoji} {getCategoryInfo(selectedDecision.category).label}
                  </span>
                  <span className="importance-badge large" title={getImportanceInfo(selectedDecision.importance).description}>
                    {getImportanceInfo(selectedDecision.importance).emoji} {getImportanceInfo(selectedDecision.importance).label}
                  </span>
                </div>
                <div className="decision-modal-actions">
                  <button onClick={() => handleEditDecision(selectedDecision)} className="icon-btn">✏️</button>
                  <button onClick={() => handleDeleteDecision(selectedDecision.id)} className="icon-btn danger">🗑️</button>
                  <button onClick={() => setSelectedDecision(null)} className="icon-btn">×</button>
                </div>
              </div>

              <h2 className="decision-modal-title">{selectedDecision.title}</h2>
              
              <div className="decision-modal-dates">
                <span>Created: {formatDate(selectedDecision.createdAt)}</span>
                {selectedDecision.reviewDate && (
                  <span>Review by: {formatDate(selectedDecision.reviewDate)}</span>
                )}
              </div>

              <div className="decision-modal-section">
                <h4>📋 Context</h4>
                <p>{selectedDecision.context || 'No context provided'}</p>
              </div>

              <div className="decision-modal-section">
                <h4>🔀 Options Considered</h4>
                <p>{selectedDecision.options || 'No options recorded'}</p>
              </div>

              <div className="decision-modal-section highlight">
                <h4>✅ Decision Made</h4>
                <p>{selectedDecision.decisionMade}</p>
              </div>

              <div className="decision-modal-section">
                <h4>🧠 Reasoning</h4>
                <p>{selectedDecision.reasoning || 'No reasoning recorded'}</p>
              </div>

              <div className="decision-modal-section">
                <h4>⚠️ Risks & Concerns</h4>
                <p>{selectedDecision.risks || 'No risks recorded'}</p>
              </div>

              <div className="decision-modal-section">
                <h4>🎯 Expected Outcome</h4>
                <p>{selectedDecision.expectedOutcome || 'No expected outcome recorded'}</p>
              </div>

              {selectedDecision.tags?.length > 0 && (
                <div className="decision-modal-tags">
                  {selectedDecision.tags.map(tag => (
                    <span key={tag} className="modal-tag">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="outcome-section">
                <h4>📊 Outcome Review</h4>
                
                {selectedDecision.outcome.status !== 'pending' && (
                  <div className="current-outcome">
                    <span 
                      className="outcome-badge large"
                      style={{ 
                        background: `${getOutcomeInfo(selectedDecision.outcome.status).color}20`, 
                        color: getOutcomeInfo(selectedDecision.outcome.status).color 
                      }}
                    >
                      {getOutcomeInfo(selectedDecision.outcome.status).emoji} {getOutcomeInfo(selectedDecision.outcome.status).label}
                    </span>
                    {selectedDecision.outcome.date && (
                      <span className="outcome-date">Reviewed: {formatDate(selectedDecision.outcome.date)}</span>
                    )}
                    {selectedDecision.outcome.notes && (
                      <p className="outcome-notes">{selectedDecision.outcome.notes}</p>
                    )}
                  </div>
                )}

                <div className="outcome-form">
                  <label>Update Outcome:</label>
                  <div className="outcome-options">
                    {OUTCOME_RATING.map(outcome => (
                      <button
                        key={outcome.id}
                        className={`outcome-option-btn ${selectedDecision.outcome.status === outcome.id ? 'active' : ''}`}
                        style={selectedDecision.outcome.status === outcome.id ? { 
                          background: `${outcome.color}20`,
                          borderColor: outcome.color,
                          color: outcome.color
                        } : {}}
                        onClick={() => handleUpdateOutcome(selectedDecision.id, { status: outcome.id })}
                      >
                        <span className="outcome-emoji">{outcome.emoji}</span>
                        <span className="outcome-label">{outcome.label}</span>
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Add notes about the actual outcome..."
                    value={selectedDecision.outcome.notes || ''}
                    onChange={(e) => handleUpdateOutcome(selectedDecision.id, { notes: e.target.value })}
                    rows={3}
                    className="outcome-notes-input"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
