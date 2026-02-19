import React, { useState, useEffect, useCallback } from 'react';
// import './IdeaIncubator.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Idea status stages
const IDEA_STATUSES = [
  { value: 'seedling', label: 'Seedling', icon: '🌱', color: '#22c55e', description: 'Just planted, needs nurturing' },
  { value: 'germinating', label: 'Germinating', icon: '🌿', color: '#84cc16', description: 'Taking root, exploring possibilities' },
  { value: 'growing', label: 'Growing', icon: '🪴', color: '#3b82f6', description: 'Developing into something concrete' },
  { value: 'budding', label: 'Budding', icon: '🌷', color: '#a855f7', description: 'Ready to bloom, needs final touches' },
  { value: 'ready', label: 'Ready', icon: '🌻', color: '#f59e0b', description: 'Fully formed, ready to execute' },
  { value: 'implemented', label: 'Implemented', icon: '✅', color: '#10b981', description: 'Brought to life!' },
  { value: 'archived', label: 'Archived', icon: '📦', color: '#6b7280', description: 'Paused or set aside' }
];

// Idea categories
const CATEGORIES = [
  { value: 'project', label: 'Project', icon: '🚀', color: '#3b82f6' },
  { value: 'writing', label: 'Writing', icon: '✍️', color: '#ec4899' },
  { value: 'business', label: 'Business', icon: '💼', color: '#f59e0b' },
  { value: 'creative', label: 'Creative', icon: '🎨', color: '#a855f7' },
  { value: 'product', label: 'Product', icon: '📦', color: '#22c55e' },
  { value: 'feature', label: 'Feature', icon: '⚡', color: '#f97316' },
  { value: 'research', label: 'Research', icon: '🔬', color: '#06b6d4' },
  { value: 'lifestyle', label: 'Lifestyle', icon: '🌟', color: '#ef4444' },
  { value: 'other', label: 'Other', icon: '💡', color: '#6b7280' }
];

// Priority levels
const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' }
];

// Inspiration prompts
const PROMPTS = [
  "What problem frustrates you that nobody has solved?",
  "If you had unlimited resources, what would you build?",
  "What's something you wish existed?",
  "How could you combine two things you love?",
  "What would make your daily life 10x better?",
  "What's a skill you want to learn deeply?",
  "What would you create if failure wasn't possible?",
  "What trend do you see that others might be missing?",
  "How could you help 1000 people with what you know?",
  "What's the most ambitious thing you can imagine doing?"
];

export default function IdeaIncubator({ isOpen, onClose }) {
  const [ideas, setIdeas] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('ideas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form states
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [viewingIdea, setViewingIdea] = useState(null);
  
  // Filter states
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Prompt
  const [currentPrompt, setCurrentPrompt] = useState('');

  // Load data from localStorage
  const loadData = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedIdeas = localStorage.getItem('mc-ideas');
        const savedNotes = localStorage.getItem('mc-idea-notes');
        
        if (savedIdeas) {
          setIdeas(JSON.parse(savedIdeas));
        }
        if (savedNotes) {
          setNotes(JSON.parse(savedNotes));
        }
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load ideas');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setCurrentPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    }
  }, [isOpen, loadData]);

  // Save ideas to localStorage
  const saveIdeas = (newIdeas) => {
    setIdeas(newIdeas);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-ideas', JSON.stringify(newIdeas));
    }
  };

  // Save notes to localStorage
  const saveNotes = (newNotes) => {
    setNotes(newNotes);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-idea-notes', JSON.stringify(newNotes));
    }
  };

  // Create/update idea
  const handleSaveIdea = (ideaData) => {
    const now = new Date().toISOString();
    
    if (editingIdea) {
      const updated = ideas.map(i => 
        i.id === editingIdea.id 
          ? { ...i, ...ideaData, updatedAt: now }
          : i
      );
      saveIdeas(updated);
      setEditingIdea(null);
    } else {
      const newIdea = {
        id: Date.now().toString(),
        ...ideaData,
        createdAt: now,
        updatedAt: now
      };
      saveIdeas([newIdea, ...ideas]);
    }
    setShowIdeaForm(false);
  };

  // Delete idea
  const handleDeleteIdea = (id) => {
    if (confirm('Are you sure you want to delete this idea?')) {
      saveIdeas(ideas.filter(i => i.id !== id));
      // Also delete related notes
      saveNotes(notes.filter(n => n.ideaId !== id));
      if (viewingIdea?.id === id) {
        setViewingIdea(null);
      }
    }
  };

  // Add note to idea
  const handleAddNote = (noteData) => {
    const newNote = {
      id: Date.now().toString(),
      ...noteData,
      createdAt: new Date().toISOString()
    };
    saveNotes([newNote, ...notes]);
    setShowNoteForm(false);
    
    // Update idea's updatedAt
    const updated = ideas.map(i => 
      i.id === noteData.ideaId 
        ? { ...i, updatedAt: newNote.createdAt }
        : i
    );
    saveIdeas(updated);
  };

  // Delete note
  const handleDeleteNote = (noteId) => {
    saveNotes(notes.filter(n => n.id !== noteId));
  };

  // Update idea status
  const updateIdeaStatus = (id, newStatus) => {
    const updated = ideas.map(i => 
      i.id === id 
        ? { ...i, status: newStatus, updatedAt: new Date().toISOString() }
        : i
    );
    saveIdeas(updated);
  };

  // Get notes for an idea
  const getIdeaNotes = (ideaId) => {
    return notes.filter(n => n.ideaId === ideaId).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

  // Filter and sort ideas
  const filteredIdeas = ideas.filter(idea => {
    if (filterCategory && idea.category !== filterCategory) return false;
    if (filterStatus && idea.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = idea.title?.toLowerCase().includes(query);
      const matchesDescription = idea.description?.toLowerCase().includes(query);
      const matchesTags = idea.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!matchesTitle && !matchesDescription && !matchesTags) return false;
    }
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'updated':
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      default:
        return 0;
    }
  });

  // Get status distribution for stats
  const getStatusDistribution = () => {
    const distribution = {};
    IDEA_STATUSES.forEach(s => distribution[s.value] = 0);
    ideas.forEach(idea => {
      if (distribution[idea.status] !== undefined) {
        distribution[idea.status]++;
      }
    });
    return distribution;
  };

  // Get category distribution
  const getCategoryDistribution = () => {
    const distribution = {};
    CATEGORIES.forEach(c => distribution[c.value] = 0);
    ideas.forEach(idea => {
      if (distribution[idea.category] !== undefined) {
        distribution[idea.category]++;
      }
    });
    return distribution;
  };

  // Refresh prompt
  const refreshPrompt = () => {
    let newPrompt;
    do {
      newPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    } while (newPrompt === currentPrompt && PROMPTS.length > 1);
    setCurrentPrompt(newPrompt);
  };

  if (!isOpen) return null;

  const statusDistribution = getStatusDistribution();
  const categoryDistribution = getCategoryDistribution();

  return (
    <div className="idea-incubator-overlay" onClick={onClose}>
      <div className="idea-incubator-panel" onClick={e => e.stopPropagation()}>
        <div className="idea-incubator-header">
          <div className="idea-incubator-title">
            <span className="idea-incubator-icon">💡</span>
            <div>
              <h2>Idea Incubator</h2>
              <p className="idea-incubator-subtitle">Where ideas grow and thrive</p>
            </div>
          </div>
          <button className="idea-incubator-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="idea-incubator-error">
            ⚠️ {error}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="idea-incubator-tabs">
          <button 
            className={activeTab === 'ideas' ? 'active' : ''}
            onClick={() => setActiveTab('ideas')}
          >
            💡 Ideas ({ideas.length})
          </button>
          <button 
            className={activeTab === 'inspire' ? 'active' : ''}
            onClick={() => setActiveTab('inspire')}
          >
            ✨ Inspire Me
          </button>
          <button 
            className={activeTab === 'stats' ? 'active' : ''}
            onClick={() => setActiveTab('stats')}
          >
            📊 Stats
          </button>
        </div>

        <div className="idea-incubator-content">
          {loading ? (
            <div className="idea-incubator-loading">Loading ideas...</div>
          ) : (
            <>
              {activeTab === 'ideas' && (
                <IdeasTab
                  ideas={filteredIdeas}
                  filterCategory={filterCategory}
                  setFilterCategory={setFilterCategory}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  onAddIdea={() => { setEditingIdea(null); setShowIdeaForm(true); }}
                  onEditIdea={setEditingIdea}
                  onViewIdea={setViewingIdea}
                  onDeleteIdea={handleDeleteIdea}
                  onUpdateStatus={updateIdeaStatus}
                />
              )}
              
              {activeTab === 'inspire' && (
                <InspireTab
                  currentPrompt={currentPrompt}
                  onRefresh={refreshPrompt}
                  onStartIdea={(prompt) => {
                    setEditingIdea(null);
                    setShowIdeaForm(true);
                  }}
                />
              )}
              
              {activeTab === 'stats' && (
                <StatsTab
                  ideas={ideas}
                  statusDistribution={statusDistribution}
                  categoryDistribution={categoryDistribution}
                />
              )}
            </>
          )}
        </div>

        {showIdeaForm && (
          <IdeaForm
            idea={editingIdea}
            onSave={handleSaveIdea}
            onCancel={() => { setShowIdeaForm(false); setEditingIdea(null); }}
          />
        )}

        {viewingIdea && (
          <IdeaDetailView
            idea={viewingIdea}
            notes={getIdeaNotes(viewingIdea.id)}
            onClose={() => setViewingIdea(null)}
            onEdit={() => {
              setEditingIdea(viewingIdea);
              setShowIdeaForm(true);
              setViewingIdea(null);
            }}
            onDelete={() => handleDeleteIdea(viewingIdea.id)}
            onAddNote={() => setShowNoteForm(true)}
            onDeleteNote={handleDeleteNote}
            onUpdateStatus={(status) => updateIdeaStatus(viewingIdea.id, status)}
          />
        )}

        {showNoteForm && viewingIdea && (
          <NoteForm
            ideaId={viewingIdea.id}
            ideaTitle={viewingIdea.title}
            onSave={handleAddNote}
            onCancel={() => setShowNoteForm(false)}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function IdeasTab({ 
  ideas, 
  filterCategory, 
  setFilterCategory, 
  filterStatus, 
  setFilterStatus,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  onAddIdea, 
  onEditIdea, 
  onViewIdea, 
  onDeleteIdea,
  onUpdateStatus
}) {
  return (
    <div className="ideas-tab">
      <div className="ideas-toolbar">
        <div className="ideas-search">
          <input
            type="text"
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ideas-search-input"
          />
        </div>
        
        <div className="ideas-filters">
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="ideas-filter-select"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
            ))}
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="ideas-filter-select"
          >
            <option value="">All Statuses</option>
            {IDEA_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
            ))}
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="ideas-filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="updated">Recently Updated</option>
            <option value="priority">Priority</option>
          </select>
        </div>
        
        <button className="idea-btn idea-btn-primary" onClick={onAddIdea}>
          + New Idea
        </button>
      </div>

      {ideas.length === 0 ? (
        <div className="ideas-empty">
          <div className="ideas-empty-icon">💡</div>
          <h3>No ideas yet</h3>
          <p>Your idea incubator is empty. Capture your first spark of inspiration!</p>
          <button className="idea-btn idea-btn-primary" onClick={onAddIdea}>
            Plant Your First Idea
          </button>
        </div>
      ) : (
        <div className="ideas-grid">
          {ideas.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onEdit={() => onEditIdea(idea)}
              onView={() => onViewIdea(idea)}
              onDelete={() => onDeleteIdea(idea.id)}
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, onEdit, onView, onDelete, onUpdateStatus }) {
  const category = CATEGORIES.find(c => c.value === idea.category) || CATEGORIES[8];
  const status = IDEA_STATUSES.find(s => s.value === idea.status) || IDEA_STATUSES[0];
  const priority = PRIORITIES.find(p => p.value === idea.priority) || PRIORITIES[1];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get next status for quick advancement
  const getNextStatus = (currentStatus) => {
    const currentIndex = IDEA_STATUSES.findIndex(s => s.value === currentStatus);
    if (currentIndex < IDEA_STATUSES.length - 2) { // Don't auto-advance to archived
      return IDEA_STATUSES[currentIndex + 1].value;
    }
    return currentStatus;
  };

  return (
    <div 
      className={`idea-card ${idea.status === 'implemented' ? 'implemented' : ''}`}
      style={{ '--idea-color': category.color }}
      onClick={onView}
    >
      <div className="idea-card-header">
        <div className="idea-card-category">
          <span className="idea-category-icon">{category.icon}</span>
          <span className="idea-category-label">{category.label}</span>
        </div>
        <div className="idea-card-badges">
          <span 
            className="idea-priority-badge"
            style={{ backgroundColor: priority.color + '20', color: priority.color }}
          >
            {priority.label}
          </span>
        </div>
      </div>

      <h3 className="idea-title">{idea.title}</h3>
      
      {idea.description && (
        <p className="idea-description">
          {idea.description.length > 120 
            ? idea.description.substring(0, 120) + '...' 
            : idea.description}
        </p>
      )}

      <div className="idea-card-status">
        <div className="status-indicator" style={{ backgroundColor: status.color }}>
          <span className="status-icon">{status.icon}</span>
          <span className="status-label">{status.label}</span>
        </div>
        {idea.status !== 'implemented' && idea.status !== 'archived' && (
          <button 
            className="status-advance-btn"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus(idea.id, getNextStatus(idea.status));
            }}
            title="Advance to next stage"
          >
            →
          </button>
        )}
      </div>

      {idea.tags && idea.tags.length > 0 && (
        <div className="idea-tags">
          {idea.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="idea-tag">{tag}</span>
          ))}
          {idea.tags.length > 3 && (
            <span className="idea-tag-more">+{idea.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="idea-card-footer">
        <span className="idea-date">{formatDate(idea.createdAt)}</span>
        <div className="idea-actions" onClick={(e) => e.stopPropagation()}>
          <button className="idea-action-btn" onClick={onEdit} title="Edit">
            ✏️
          </button>
          <button className="idea-action-btn danger" onClick={onDelete} title="Delete">
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

function InspireTab({ currentPrompt, onRefresh, onStartIdea }) {
  const tips = [
    { icon: '📝', title: 'Capture immediately', desc: 'Ideas fade fast. Write them down the moment they strike.' },
    { icon: '🌱', title: 'Start small', desc: 'Big ideas grow from tiny seeds. Don\'t wait for perfection.' },
    { icon: '🔗', title: 'Connect ideas', desc: 'Great innovations often come from combining existing concepts.' },
    { icon: '🔄', title: 'Iterate often', desc: 'Your first idea is rarely your best. Keep refining.' },
    { icon: '💬', title: 'Talk it out', desc: 'Explaining your idea to others helps clarify your thinking.' },
    { icon: '🚫', title: 'Embrace constraints', desc: 'Limitations often spark the most creative solutions.' }
  ];

  return (
    <div className="inspire-tab">
      <div className="prompt-card">
        <div className="prompt-header">
          <span className="prompt-icon">💭</span>
          <h3>Creative Prompt</h3>
        </div>
        <p className="prompt-text">{currentPrompt}</p>
        <div className="prompt-actions">
          <button className="idea-btn" onClick={onRefresh}>
            🔄 New Prompt
          </button>
          <button className="idea-btn idea-btn-primary" onClick={onStartIdea}>
            💡 Start This Idea
          </button>
        </div>
      </div>

      <div className="creativity-tips">
        <h4>💡 Creativity Tips</h4>
        <div className="tips-grid">
          {tips.map((tip, i) => (
            <div key={i} className="tip-card">
              <span className="tip-icon">{tip.icon}</span>
              <h5>{tip.title}</h5>
              <p>{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatsTab({ ideas, statusDistribution, categoryDistribution }) {
  const totalIdeas = ideas.length;
  const implemented = ideas.filter(i => i.status === 'implemented').length;
  const inProgress = ideas.filter(i => 
    ['germinating', 'growing', 'budding'].includes(i.status)
  ).length;
  const completionRate = totalIdeas > 0 ? Math.round((implemented / totalIdeas) * 100) : 0;

  // Get top categories
  const topCategories = Object.entries(categoryDistribution)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Ideas per month
  const getIdeasPerMonth = () => {
    const months = {};
    ideas.forEach(idea => {
      const date = new Date(idea.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);
  };

  const ideasPerMonth = getIdeasPerMonth();

  return (
    <div className="stats-tab">
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-value">{totalIdeas}</div>
          <div className="stat-label">Total Ideas</div>
        </div>
        
        <div className="stat-card implemented">
          <div className="stat-value">{implemented}</div>
          <div className="stat-label">Implemented</div>
        </div>
        
        <div className="stat-card progress">
          <div className="stat-value">{inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        
        <div className="stat-card rate">
          <div className="stat-value">{completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
      </div>

      <div className="stats-sections">
        <div className="stats-section">
          <h4>📊 Ideas by Status</h4>
          <div className="status-bars">
            {IDEA_STATUSES.map(status => {
              const count = statusDistribution[status.value] || 0;
              const percent = totalIdeas > 0 ? (count / totalIdeas) * 100 : 0;
              return (
                <div key={status.value} className="status-bar-item">
                  <div className="status-bar-header">
                    <span>{status.icon} {status.label}</span>
                    <span>{count}</span>
                  </div>
                  <div className="status-bar">
                    <div 
                      className="status-bar-fill"
                      style={{ width: `${percent}%`, backgroundColor: status.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="stats-section">
          <h4>📁 Top Categories</h4>
          <div className="category-list">
            {topCategories.map(([cat, count]) => {
              const category = CATEGORIES.find(c => c.value === cat);
              return (
                <div key={cat} className="category-stat-item">
                  <span className="category-stat-icon">{category?.icon || '💡'}</span>
                  <span className="category-stat-name">{category?.label || cat}</span>
                  <span className="category-stat-count">{count}</span>
                </div>
              );
            })}
            {topCategories.length === 0 && (
              <p className="no-data">No categories yet</p>
            )}
          </div>
        </div>

        {ideasPerMonth.length > 0 && (
          <div className="stats-section full-width">
            <h4>📈 Ideas Over Time</h4>
            <div className="timeline-chart">
              {ideasPerMonth.map(([month, count]) => (
                <div key={month} className="timeline-bar-item">
                  <div 
                    className="timeline-bar"
                    style={{ 
                      height: `${Math.max(20, (count / Math.max(...ideasPerMonth.map(([, c]) => c))) * 100)}px` 
                    }}
                  >
                    <span className="timeline-bar-value">{count}</span>
                  </div>
                  <span className="timeline-bar-label">
                    {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IdeaDetailView({ idea, notes, onClose, onEdit, onDelete, onAddNote, onDeleteNote, onUpdateStatus }) {
  const category = CATEGORIES.find(c => c.value === idea.category) || CATEGORIES[8];
  const status = IDEA_STATUSES.find(s => s.value === idea.status) || IDEA_STATUSES[0];
  const priority = PRIORITIES.find(p => p.value === idea.priority) || PRIORITIES[1];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="idea-detail-overlay">
      <div className="idea-detail-panel">
        <div className="idea-detail-header">
          <div className="idea-detail-meta">
            <span 
              className="idea-detail-category"
              style={{ backgroundColor: category.color + '20', color: category.color }}
            >
              {category.icon} {category.label}
            </span>
            <span 
              className="idea-detail-priority"
              style={{ backgroundColor: priority.color + '20', color: priority.color }}
            >
              {priority.label} Priority
            </span>
          </div>
          <div className="idea-detail-actions">
            <button className="idea-btn" onClick={onEdit}>✏️ Edit</button>
            <button className="idea-btn danger" onClick={onDelete}>🗑️ Delete</button>
            <button className="idea-detail-close" onClick={onClose}>×</button>
          </div>
        </div>

        <h2 className="idea-detail-title">{idea.title}</h2>
        
        {idea.description && (
          <div className="idea-detail-description">
            <p>{idea.description}</p>
          </div>
        )}

        <div className="idea-detail-status-section">
          <label>Current Stage:</label>
          <div className="status-selector">
            {IDEA_STATUSES.map(s => (
              <button
                key={s.value}
                className={`status-option ${idea.status === s.value ? 'active' : ''}`}
                style={{ 
                  backgroundColor: idea.status === s.value ? s.color + '30' : 'transparent',
                  borderColor: s.color,
                  color: idea.status === s.value ? s.color : 'inherit'
                }}
                onClick={() => onUpdateStatus(s.value)}
                title={s.description}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {idea.tags && idea.tags.length > 0 && (
          <div className="idea-detail-tags">
            {idea.tags.map((tag, i) => (
              <span key={i} className="idea-detail-tag">#{tag}</span>
            ))}
          </div>
        )}

        <div className="idea-detail-dates">
          <span>Created: {formatDate(idea.createdAt)}</span>
          <span>Updated: {formatDate(idea.updatedAt)}</span>
        </div>

        <div className="idea-notes-section">
          <div className="notes-header">
            <h4>📝 Notes ({notes.length})</h4>
            <button className="idea-btn idea-btn-sm" onClick={onAddNote}>
              + Add Note
            </button>
          </div>
          
          {notes.length === 0 ? (
            <div className="notes-empty">
              <p>No notes yet. Add your first thought!</p>
            </div>
          ) : (
            <div className="notes-list">
              {notes.map(note => (
                <div key={note.id} className="note-item">
                  <div className="note-content">{note.content}</div>
                  <div className="note-footer">
                    <span className="note-date">{formatDate(note.createdAt)}</span>
                    <button 
                      className="note-delete-btn"
                      onClick={() => onDeleteNote(note.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IdeaForm({ idea, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: idea?.title || '',
    description: idea?.description || '',
    category: idea?.category || 'other',
    status: idea?.status || 'seedling',
    priority: idea?.priority || 'medium',
    tags: idea?.tags || []
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags.filter(t => t.trim())
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="idea-form-overlay">
      <div className="idea-form-panel">
        <h3>{idea ? 'Edit Idea' : 'New Idea'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Idea Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What's your idea?"
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your idea in detail..."
              rows={4}
            />
          </div>

          <div className="form-row three-col">
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {IDEA_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.icon} {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tag-input-row">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag and press Enter"
              />
              <button type="button" onClick={addTag}>Add</button>
            </div>
            {formData.tags.length > 0 && (
              <div className="form-tags">
                {formData.tags.map(tag => (
                  <span key={tag} className="form-tag">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="idea-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="idea-btn idea-btn-primary">
              {idea ? 'Update Idea' : 'Plant Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NoteForm({ ideaId, ideaTitle, onSave, onCancel }) {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSave({ ideaId, content: content.trim() });
    }
  };

  return (
    <div className="idea-form-overlay">
      <div className="idea-form-panel note-form">
        <h3>Add Note</h3>
        <p className="note-form-context">for &quot;{ideaTitle}&quot;</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind about this idea?"
              rows={4}
              autoFocus
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="idea-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="idea-btn idea-btn-primary">
              Add Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
