import React, { useState, useEffect, useCallback } from 'react';
import './SkillTracker.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: '#22c55e' },
  { value: 'intermediate', label: 'Intermediate', color: '#3b82f6' },
  { value: 'advanced', label: 'Advanced', color: '#8b5cf6' },
  { value: 'expert', label: 'Expert', color: '#f59e0b' }
];

const SKILL_STATUSES = [
  { value: 'active', label: 'Active', icon: '🟢' },
  { value: 'paused', label: 'Paused', icon: '⏸️' },
  { value: 'completed', label: 'Completed', icon: '✅' },
  { value: 'archived', label: 'Archived', icon: '📦' }
];

const MOODS = [
  { value: 'terrible', label: '😫', color: '#ef4444' },
  { value: 'bad', label: '😕', color: '#f97316' },
  { value: 'neutral', label: '😐', color: '#eab308' },
  { value: 'good', label: '🙂', color: '#22c55e' },
  { value: 'great', label: '🤩', color: '#10b981' }
];

const CATEGORY_COLORS = {
  'Programming': '#6366f1',
  'Languages': '#ec4899',
  'Music': '#8b5cf6',
  'Art & Design': '#f43f5e',
  'Fitness': '#22c55e',
  'Cooking': '#f97316',
  'Writing': '#3b82f6',
  'Business': '#eab308',
  'Science': '#06b6d4',
  'Other': '#6b7280'
};

export default function SkillTracker({ isOpen, onClose }) {
  const [skills, setSkills] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('skills');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form states
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  // Filter states
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch skills
      const skillsRes = await fetch(`${API_URL}/skills-tracker`);
      if (!skillsRes.ok) throw new Error('Failed to fetch skills');
      const skillsData = await skillsRes.json();
      setSkills(skillsData.skills || []);
      
      // Fetch categories
      const categoriesRes = await fetch(`${API_URL}/skills-tracker/categories`);
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }
      
      // Fetch stats
      const statsRes = await fetch(`${API_URL}/skills-tracker/stats/overview`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      // Fetch recent sessions
      const sessionsRes = await fetch(`${API_URL}/skills-tracker/sessions/list?limit=20`);
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions || []);
      }
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  // Create/Update skill
  const handleSaveSkill = async (skillData) => {
    try {
      const url = editingSkill 
        ? `${API_URL}/skills-tracker/${editingSkill.id}`
        : `${API_URL}/skills-tracker`;
      
      const method = editingSkill ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillData)
      });
      
      if (!response.ok) throw new Error('Failed to save skill');
      
      setShowSkillForm(false);
      setEditingSkill(null);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete skill
  const handleDeleteSkill = async (skillId) => {
    if (!confirm('Are you sure? This will delete the skill and all its practice sessions.')) return;
    
    try {
      const response = await fetch(`${API_URL}/skills-tracker/${skillId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete skill');
      
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Log practice session
  const handleLogSession = async (sessionData) => {
    try {
      const response = await fetch(`${API_URL}/skills-tracker/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      
      if (!response.ok) throw new Error('Failed to log session');
      
      setShowSessionForm(false);
      setSelectedSkill(null);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Delete this practice session?')) return;
    
    try {
      const response = await fetch(`${API_URL}/skills-tracker/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete session');
      
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter skills
  const filteredSkills = skills.filter(skill => {
    if (filterCategory && skill.category !== filterCategory) return false;
    if (filterStatus && skill.status !== filterStatus) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="skill-tracker-overlay" onClick={onClose}>
      <div className="skill-tracker-panel" onClick={e => e.stopPropagation()}>
        <div className="skill-tracker-header">
          <div className="skill-tracker-title">
            <span className="skill-tracker-icon">🎯</span>
            <div>
              <h2>Skill Tracker</h2>
              <p className="skill-tracker-subtitle">Track your learning journey</p>
            </div>
          </div>
          <button className="skill-tracker-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="skill-tracker-error">
            ⚠️ {error}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="skill-tracker-tabs">
          <button 
            className={activeTab === 'skills' ? 'active' : ''}
            onClick={() => setActiveTab('skills')}
          >
            📚 Skills ({skills.length})
          </button>
          <button 
            className={activeTab === 'sessions' ? 'active' : ''}
            onClick={() => setActiveTab('sessions')}
          >
            ⏱️ Sessions ({sessions.length})
          </button>
          <button 
            className={activeTab === 'stats' ? 'active' : ''}
            onClick={() => setActiveTab('stats')}
          >
            📊 Stats
          </button>
        </div>

        <div className="skill-tracker-content">
          {loading ? (
            <div className="skill-tracker-loading">Loading...</div>
          ) : (
            <>
              {activeTab === 'skills' && (
                <SkillsTab
                  skills={filteredSkills}
                  categories={categories}
                  filterCategory={filterCategory}
                  setFilterCategory={setFilterCategory}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  onAddSkill={() => { setEditingSkill(null); setShowSkillForm(true); }}
                  onEditSkill={setEditingSkill}
                  onDeleteSkill={handleDeleteSkill}
                  onLogSession={(skill) => { setSelectedSkill(skill); setShowSessionForm(true); }}
                />
              )}
              
              {activeTab === 'sessions' && (
                <SessionsTab
                  sessions={sessions}
                  skills={skills}
                  onDeleteSession={handleDeleteSession}
                  onAddSession={() => { setSelectedSkill(null); setShowSessionForm(true); }}
                />
              )}
              
              {activeTab === 'stats' && <StatsTab stats={stats} skills={skills} />}
            </>
          )}
        </div>

        {showSkillForm && (
          <SkillForm
            skill={editingSkill}
            categories={categories}
            onSave={handleSaveSkill}
            onCancel={() => { setShowSkillForm(false); setEditingSkill(null); }}
          />
        )}

        {showSessionForm && (
          <SessionForm
            skills={skills}
            selectedSkill={selectedSkill}
            onSave={handleLogSession}
            onCancel={() => { setShowSessionForm(false); setSelectedSkill(null); }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SkillsTab({ skills, categories, filterCategory, setFilterCategory, filterStatus, setFilterStatus, onAddSkill, onEditSkill, onDeleteSkill, onLogSession }) {
  return (
    <div className="skills-tab">
      <div className="skills-toolbar">
        <div className="skills-filters">
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="skill-filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="skill-filter-select"
          >
            <option value="">All Statuses</option>
            {SKILL_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
            ))}
          </select>
        </div>
        
        <button className="skill-btn skill-btn-primary" onClick={onAddSkill}>
          + Add Skill
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="skills-empty">
          <div className="skills-empty-icon">🎯</div>
          <h3>No skills yet</h3>
          <p>Start tracking your learning journey by adding your first skill.</p>
          <button className="skill-btn skill-btn-primary" onClick={onAddSkill}>
            Add Your First Skill
          </button>
        </div>
      ) : (
        <div className="skills-grid">
          {skills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onEdit={() => onEditSkill(skill)}
              onDelete={() => onDeleteSkill(skill.id)}
              onLogSession={() => onLogSession(skill)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SkillCard({ skill, onEdit, onDelete, onLogSession }) {
  const progressPercent = skill.targetHours && skill.targetHours > 0
    ? Math.min(100, Math.round((skill.totalHours / skill.targetHours) * 100))
    : 0;

  const statusConfig = SKILL_STATUSES.find(s => s.value === skill.status) || SKILL_STATUSES[0];

  return (
    <div className="skill-card" style={{ '--skill-color': skill.color || '#6366f1' }}>
      <div className="skill-card-header">
        <div className="skill-card-icon">{skill.icon || '📚'}</div>
        <div className="skill-card-meta">
          <span className="skill-card-category">{skill.category}</span>
          <span className="skill-card-status" title={statusConfig.label}>
            {statusConfig.icon}
          </span>
        </div>
      </div>

      <h3 className="skill-card-name">{skill.name}</h3>
      
      {skill.description && (
        <p className="skill-card-description">{skill.description}</p>
      )}

      <div className="skill-card-level">
        <span 
          className="skill-level-badge"
          style={{ 
            backgroundColor: PROFICIENCY_LEVELS.find(l => l.value === skill.currentLevel)?.color + '20',
            color: PROFICIENCY_LEVELS.find(l => l.value === skill.currentLevel)?.color
          }}
        >
          {PROFICIENCY_LEVELS.find(l => l.value === skill.currentLevel)?.label || 'Beginner'}
        </span>
        {skill.streak > 0 && (
          <span className="skill-streak-badge">🔥 {skill.streak} day{skill.streak !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="skill-card-stats">
        <div className="skill-stat">
          <span className="skill-stat-value">{skill.totalHours || 0}h</span>
          <span className="skill-stat-label">Total</span>
        </div>
        <div className="skill-stat">
          <span className="skill-stat-value">{skill.sessionCount || 0}</span>
          <span className="skill-stat-label">Sessions</span>
        </div>
      </div>

      {skill.targetHours && (
        <div className="skill-progress">
          <div className="skill-progress-bar">
            <div 
              className="skill-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="skill-progress-text">{progressPercent}% of {skill.targetHours}h goal</span>
        </div>
      )}

      <div className="skill-card-actions">
        <button className="skill-btn skill-btn-sm" onClick={onLogSession}>
          ⏱️ Log Session
        </button>
        <button className="skill-btn skill-btn-sm skill-btn-ghost" onClick={onEdit}>
          Edit
        </button>
        <button className="skill-btn skill-btn-sm skill-btn-danger" onClick={onDelete}>
          🗑️
        </button>
      </div>
    </div>
  );
}

function SessionsTab({ sessions, skills, onDeleteSession, onAddSession }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="sessions-tab">
      <div className="sessions-toolbar">
        <h3>Recent Practice Sessions</h3>
        <button className="skill-btn skill-btn-primary" onClick={onAddSession}>
          + Log Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="sessions-empty">
          <div className="sessions-empty-icon">⏱️</div>
          <h3>No sessions yet</h3>
          <p>Log your practice sessions to track your progress over time.</p>
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map(session => (
            <div key={session.id} className="session-item">
              <div 
                className="session-skill-indicator"
                style={{ backgroundColor: session.skillColor || '#6366f1' }}
              >
                {session.skillIcon}
              </div>
              
              <div className="session-content">
                <div className="session-header">
                  <span className="session-skill-name">{session.skillName}</span>
                  <span className="session-date">{formatDate(session.date)}</span>
                </div>
                
                <div className="session-details">
                  <span className="session-duration">⏱️ {formatDuration(session.duration)}</span>
                  {session.mood && (
                    <span className="session-mood" title={`Feeling: ${session.mood}`}>
                      {MOODS.find(m => m.value === session.mood)?.label || '😐'}
                    </span>
                  )}
                </div>
                
                {session.notes && (
                  <p className="session-notes">{session.notes}</p>
                )}
                
                {session.tags?.length > 0 && (
                  <div className="session-tags">
                    {session.tags.map((tag, i) => (
                      <span key={i} className="session-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                className="session-delete-btn"
                onClick={() => onDeleteSession(session.id)}
                title="Delete session"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsTab({ stats, skills }) {
  if (!stats) return <div className="stats-empty">No stats available</div>;

  const topSkills = [...skills]
    .sort((a, b) => (b.totalHours || 0) - (a.totalHours || 0))
    .slice(0, 5);

  return (
    <div className="stats-tab">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalSkills}</div>
          <div className="stat-label">Total Skills</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.totalHours}h</div>
          <div className="stat-label">Total Hours</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.totalSessions}</div>
          <div className="stat-label">Sessions</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.thisWeekHours}h</div>
          <div className="stat-label">This Week</div>
        </div>
      </div>

      {topSkills.length > 0 && (
        <div className="stats-section">
          <h4>🏆 Top Skills by Hours</h4>
          <div className="top-skills-list">
            {topSkills.map((skill, index) => (
              <div key={skill.id} className="top-skill-item">
                <span className="top-skill-rank">#{index + 1}</span>
                <span className="top-skill-icon">{skill.icon}</span>
                <span className="top-skill-name">{skill.name}</span>
                <span className="top-skill-hours">{skill.totalHours}h</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.byCategory && Object.keys(stats.byCategory).length > 0 && (
        <div className="stats-section">
          <h4>📊 Hours by Category</h4>
          <div className="category-breakdown">
            {Object.entries(stats.byCategory).map(([category, data]) => (
              <div key={category} className="category-item">
                <span 
                  className="category-dot"
                  style={{ backgroundColor: CATEGORY_COLORS[category] || '#6b7280' }}
                />
                <span className="category-name">{category}</span>
                <span className="category-hours">{data.hours}h</span>
                <span className="category-skills">{data.skills} skills</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.byLevel && Object.keys(stats.byLevel).length > 0 && (
        <div className="stats-section">
          <h4>📈 Skills by Level</h4>
          <div className="level-distribution">
            {Object.entries(stats.byLevel).map(([level, count]) => {
              const levelConfig = PROFICIENCY_LEVELS.find(l => l.value === level);
              return (
                <div key={level} className="level-item">
                  <span 
                    className="level-badge"
                    style={{ 
                      backgroundColor: levelConfig?.color + '20',
                      color: levelConfig?.color
                    }}
                  >
                    {levelConfig?.label || level}
                  </span>
                  <span className="level-count">{count} skill{count !== 1 ? 's' : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SkillForm({ skill, categories, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: skill?.name || '',
    description: skill?.description || '',
    category: skill?.category || 'Other',
    currentLevel: skill?.currentLevel || 'beginner',
    targetLevel: skill?.targetLevel || '',
    targetHours: skill?.targetHours || '',
    color: skill?.color || '#6366f1',
    icon: skill?.icon || '📚'
  });

  const ICONS = ['📚', '💻', '🎸', '🎨', '🏃', '🍳', '✍️', '💼', '🔬', '🧠', '🗣️', '🎹', '📷', '🎮', '🌱'];
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      targetHours: formData.targetHours ? parseFloat(formData.targetHours) : null,
      targetLevel: formData.targetLevel || null
    });
  };

  return (
    <div className="skill-form-overlay">
      <div className="skill-form-panel">
        <h3>{skill ? 'Edit Skill' : 'Add New Skill'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Skill Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., React, Spanish, Guitar"
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What do you want to learn?"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Programming">Programming</option>
                <option value="Languages">Languages</option>
                <option value="Music">Music</option>
                <option value="Art & Design">Art & Design</option>
                <option value="Fitness">Fitness</option>
                <option value="Cooking">Cooking</option>
                <option value="Writing">Writing</option>
                <option value="Business">Business</option>
                <option value="Science">Science</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Current Level</label>
              <select
                value={formData.currentLevel}
                onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
              >
                {PROFICIENCY_LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Target Level</label>
              <select
                value={formData.targetLevel}
                onChange={(e) => setFormData({ ...formData, targetLevel: e.target.value })}
              >
                <option value="">None</option>
                {PROFICIENCY_LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Target Hours (optional)</label>
              <input
                type="number"
                value={formData.targetHours}
                onChange={(e) => setFormData({ ...formData, targetHours: e.target.value })}
                placeholder="e.g., 100"
                min={1}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Icon</label>
            <div className="icon-selector">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  className={formData.icon === icon ? 'selected' : ''}
                  onClick={() => setFormData({ ...formData, icon })}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-selector">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={formData.color === color ? 'selected' : ''}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="skill-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="skill-btn skill-btn-primary">
              {skill ? 'Update Skill' : 'Add Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SessionForm({ skills, selectedSkill, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    skillId: selectedSkill?.id || (skills[0]?.id || ''),
    duration: 30,
    notes: '',
    mood: 'good',
    tags: [],
    date: new Date().toISOString().split('T')[0]
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      duration: parseInt(formData.duration, 10)
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
    <div className="skill-form-overlay">
      <div className="skill-form-panel">
        <h3>Log Practice Session</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Skill *</label>
            <select
              value={formData.skillId}
              onChange={(e) => setFormData({ ...formData, skillId: e.target.value })}
              required
            >
              {skills.map(skill => (
                <option key={skill.id} value={skill.id}>
                  {skill.icon} {skill.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                min={1}
                max={1440}
                required
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>How did it feel?</label>
            <div className="mood-selector">
              {MOODS.map(mood => (
                <button
                  key={mood.value}
                  type="button"
                  className={formData.mood === mood.value ? 'selected' : ''}
                  style={{ 
                    backgroundColor: formData.mood === mood.value ? mood.color + '30' : 'transparent',
                    borderColor: mood.color
                  }}
                  onClick={() => setFormData({ ...formData, mood: mood.value })}
                  title={mood.value}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="What did you practice? Any breakthroughs or challenges?"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tag-input-group">
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
            <button type="button" className="skill-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="skill-btn skill-btn-primary">Log Session</button>
          </div>
        </form>
      </div>
    </div>
  );
}
