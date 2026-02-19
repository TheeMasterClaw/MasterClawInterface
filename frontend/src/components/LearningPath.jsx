import React, { useState, useEffect, useMemo } from 'react';
// import './LearningPath.css';

const CATEGORY_ICONS = {
  programming: { emoji: '💻', label: 'Programming', color: '#60a5fa' },
  design: { emoji: '🎨', label: 'Design', color: '#f472b6' },
  language: { emoji: '🗣️', label: 'Language', color: '#34d399' },
  business: { emoji: '💼', label: 'Business', color: '#fbbf24' },
  science: { emoji: '🔬', label: 'Science', color: '#a78bfa' },
  art: { emoji: '🎭', label: 'Art & Creativity', color: '#fb923c' },
  music: { emoji: '🎵', label: 'Music', color: '#f87171' },
  health: { emoji: '🏥', label: 'Health & Wellness', color: '#4ade80' },
  philosophy: { emoji: '🤔', label: 'Philosophy', color: '#94a3b8' },
  math: { emoji: '🔢', label: 'Mathematics', color: '#818cf8' },
  writing: { emoji: '✍️', label: 'Writing', color: '#f472b6' },
  other: { emoji: '📚', label: 'Other', color: '#94a3b8' }
};

const DIFFICULTY_LEVELS = [
  { id: 'beginner', label: 'Beginner', color: '#4ade80', description: 'Just starting out' },
  { id: 'intermediate', label: 'Intermediate', color: '#fbbf24', description: 'Some experience' },
  { id: 'advanced', label: 'Advanced', color: '#f87171', description: 'Deep dive' },
  { id: 'expert', label: 'Expert', color: '#a78bfa', description: 'Mastery level' }
];

const STORAGE_KEY = 'mc-learning-paths';

export default function LearningPath({ isOpen, onClose }) {
  const [paths, setPaths] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'create', 'detail'
  const [selectedPath, setSelectedPath] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'progress', 'name'
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('programming');
  const [formDifficulty, setFormDifficulty] = useState('beginner');
  const [formTargetHours, setFormTargetHours] = useState(100);
  const [formMilestones, setFormMilestones] = useState([{ title: '', completed: false }]);
  const [formResources, setFormResources] = useState([{ title: '', url: '', type: 'article' }]);
  
  // Detail view state
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'milestones', 'resources', 'notes'
  const [sessionTimer, setSessionTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notes, setNotes] = useState('');

  // Load paths from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = parsed.map(p => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          lastStudied: p.lastStudied ? new Date(p.lastStudied) : null,
          milestones: p.milestones.map(m => ({
            ...m,
            completedAt: m.completedAt ? new Date(m.completedAt) : null
          })),
          sessions: p.sessions.map(s => ({
            ...s,
            date: new Date(s.date)
          }))
        }));
        setPaths(restored);
      } else {
        // Add sample path for first-time users
        const samplePath = createSamplePath();
        setPaths([samplePath]);
        savePaths([samplePath]);
      }
    } catch (err) {
      console.error('Failed to load learning paths:', err);
    }
  }, [isOpen]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const createSamplePath = () => ({
    id: 'sample-' + Date.now(),
    title: 'React Mastery',
    description: 'Master React.js from fundamentals to advanced patterns',
    category: 'programming',
    difficulty: 'intermediate',
    targetHours: 100,
    completedHours: 35,
    milestones: [
      { id: 'm1', title: 'JSX and Components', completed: true, completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { id: 'm2', title: 'Props and State', completed: true, completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
      { id: 'm3', title: 'Hooks Deep Dive', completed: true, completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { id: 'm4', title: 'Context API', completed: false, completedAt: null },
      { id: 'm5', title: 'Performance Optimization', completed: false, completedAt: null },
      { id: 'm6', title: 'Testing React Apps', completed: false, completedAt: null }
    ],
    resources: [
      { id: 'r1', title: 'React Documentation', url: 'https://react.dev', type: 'documentation' },
      { id: 'r2', title: 'Epic React Course', url: '#', type: 'course' },
      { id: 'r3', title: 'React Patterns', url: '#', type: 'article' }
    ],
    notes: 'Remember to practice with real projects!',
    sessions: [
      { id: 's1', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), duration: 90 },
      { id: 's2', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), duration: 60 },
      { id: 's3', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), duration: 120 }
    ],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    lastStudied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'active'
  });

  const savePaths = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save learning paths:', err);
    }
  };

  useEffect(() => {
    if (paths.length > 0) {
      savePaths(paths);
    }
  }, [paths]);

  const handleCreatePath = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newPath = {
      id: 'path-' + Date.now(),
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      difficulty: formDifficulty,
      targetHours: parseInt(formTargetHours) || 100,
      completedHours: 0,
      milestones: formMilestones
        .filter(m => m.title.trim())
        .map((m, i) => ({ id: 'm' + i, title: m.title.trim(), completed: false, completedAt: null })),
      resources: formResources
        .filter(r => r.title.trim())
        .map((r, i) => ({ id: 'r' + i, title: r.title.trim(), url: r.url.trim(), type: r.type })),
      notes: '',
      sessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastStudied: null,
      status: 'active'
    };

    setPaths(prev => [newPath, ...prev]);
    resetForm();
    setViewMode('grid');
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('programming');
    setFormDifficulty('beginner');
    setFormTargetHours(100);
    setFormMilestones([{ title: '', completed: false }]);
    setFormResources([{ title: '', url: '', type: 'article' }]);
  };

  const addMilestoneField = () => {
    setFormMilestones([...formMilestones, { title: '', completed: false }]);
  };

  const updateMilestoneField = (index, value) => {
    const updated = [...formMilestones];
    updated[index].title = value;
    setFormMilestones(updated);
  };

  const removeMilestoneField = (index) => {
    setFormMilestones(formMilestones.filter((_, i) => i !== index));
  };

  const addResourceField = () => {
    setFormResources([...formResources, { title: '', url: '', type: 'article' }]);
  };

  const updateResourceField = (index, field, value) => {
    const updated = [...formResources];
    updated[index][field] = value;
    setFormResources(updated);
  };

  const removeResourceField = (index) => {
    setFormResources(formResources.filter((_, i) => i !== index));
  };

  const toggleMilestone = (pathId, milestoneId) => {
    setPaths(prev => prev.map(p => {
      if (p.id !== pathId) return p;
      
      return {
        ...p,
        milestones: p.milestones.map(m => {
          if (m.id !== milestoneId) return m;
          return {
            ...m,
            completed: !m.completed,
            completedAt: !m.completed ? new Date() : null
          };
        }),
        updatedAt: new Date()
      };
    }));
  };

  const deletePath = (pathId) => {
    if (confirm('Are you sure you want to delete this learning path?')) {
      setPaths(prev => prev.filter(p => p.id !== pathId));
      if (selectedPath?.id === pathId) {
        setSelectedPath(null);
        setViewMode('grid');
      }
    }
  };

  const startStudySession = () => {
    setIsTimerRunning(true);
  };

  const pauseStudySession = () => {
    setIsTimerRunning(false);
  };

  const endStudySession = () => {
    if (sessionTimer < 60) { // Less than 1 minute
      if (!confirm('Session is very short. End anyway?')) return;
    }
    
    const durationMinutes = Math.floor(sessionTimer / 60);
    const newSession = {
      id: 's' + Date.now(),
      date: new Date(),
      duration: durationMinutes
    };

    setPaths(prev => prev.map(p => {
      if (p.id !== selectedPath.id) return p;
      return {
        ...p,
        completedHours: p.completedHours + (durationMinutes / 60),
        sessions: [...p.sessions, newSession],
        lastStudied: new Date(),
        updatedAt: new Date()
      };
    }));

    setIsTimerRunning(false);
    setSessionTimer(0);
  };

  const updateNotes = (pathId, newNotes) => {
    setNotes(newNotes);
    setPaths(prev => prev.map(p => {
      if (p.id !== pathId) return p;
      return { ...p, notes: newNotes, updatedAt: new Date() };
    }));
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPathStats = (path) => {
    const totalMilestones = path.milestones.length;
    const completedMilestones = path.milestones.filter(m => m.completed).length;
    const milestoneProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    const hoursProgress = Math.round((path.completedHours / path.targetHours) * 100);
    
    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasSession = path.sessions.some(s => {
        const sDate = new Date(s.date);
        sDate.setHours(0, 0, 0, 0);
        return sDate.getTime() === checkDate.getTime();
      });
      if (hasSession) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Sessions this week
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sessionsThisWeek = path.sessions.filter(s => new Date(s.date) >= weekAgo).length;

    return { 
      totalMilestones, 
      completedMilestones, 
      milestoneProgress, 
      hoursProgress,
      streak,
      sessionsThisWeek
    };
  };

  const filteredAndSortedPaths = useMemo(() => {
    let filtered = paths.filter(p => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterStatus === 'active') return p.status === 'active' && getPathStats(p).hoursProgress < 100;
      if (filterStatus === 'completed') return getPathStats(p).hoursProgress >= 100;
      if (filterStatus === 'not-started') return p.completedHours === 0;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      } else if (sortBy === 'progress') {
        return getPathStats(b).hoursProgress - getPathStats(a).hoursProgress;
      } else if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [paths, filterCategory, filterStatus, sortBy]);

  const globalStats = useMemo(() => {
    const totalPaths = paths.length;
    const activePaths = paths.filter(p => p.status === 'active').length;
    const totalHours = paths.reduce((sum, p) => sum + p.completedHours, 0);
    const totalMilestones = paths.reduce((sum, p) => sum + p.milestones.filter(m => m.completed).length, 0);
    return { totalPaths, activePaths, totalHours: Math.round(totalHours), totalMilestones };
  }, [paths]);

  if (!isOpen) return null;

  return (
    <div className="learning-path-overlay" onClick={onClose}>
      <div className="learning-path-panel" onClick={e => e.stopPropagation()}>
        <div className="learning-path-header">
          <h3>🎓 Learning Paths</h3>
          <div className="header-actions">
            {viewMode === 'grid' && (
              <button className="create-btn" onClick={() => setViewMode('create')}>
                + New Path
              </button>
            )}
            {viewMode !== 'grid' && (
              <button className="back-btn" onClick={() => { setViewMode('grid'); setSelectedPath(null); }}>
                ← Back
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {viewMode === 'grid' && (
          <>
            {/* Global Stats */}
            <div className="stats-dashboard">
              <div className="stat-card">
                <span className="stat-value">{globalStats.totalPaths}</span>
                <span className="stat-label">Total Paths</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{globalStats.activePaths}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{globalStats.totalHours}h</span>
                <span className="stat-label">Hours Learned</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{globalStats.totalMilestones}</span>
                <span className="stat-label">Milestones Done</span>
              </div>
            </div>

            {/* Filters */}
            <div className="filters-row">
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_ICONS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="not-started">Not Started</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="recent">Recently Updated</option>
                <option value="progress">Most Progress</option>
                <option value="name">Name</option>
              </select>
            </div>

            {/* Paths Grid */}
            <div className="paths-grid">
              {filteredAndSortedPaths.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🎓</span>
                  <p>No learning paths yet</p>
                  <button onClick={() => setViewMode('create')}>Create your first path</button>
                </div>
              ) : (
                filteredAndSortedPaths.map(path => {
                  const stats = getPathStats(path);
                  const category = CATEGORY_ICONS[path.category] || CATEGORY_ICONS.other;
                  const difficulty = DIFFICULTY_LEVELS.find(d => d.id === path.difficulty) || DIFFICULTY_LEVELS[0];
                  
                  return (
                    <div 
                      key={path.id} 
                      className="path-card"
                      style={{ '--path-color': category.color }}
                      onClick={() => { setSelectedPath(path); setNotes(path.notes || ''); setViewMode('detail'); }}
                    >
                      <div className="path-card-header">
                        <span className="path-icon">{category.emoji}</span>
                        <span className="difficulty-badge" style={{ backgroundColor: difficulty.color }}>
                          {difficulty.label}
                        </span>
                      </div>
                      <h4 className="path-title">{path.title}</h4>
                      <p className="path-description">{path.description}</p>
                      
                      <div className="path-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${stats.hoursProgress}%` }} />
                        </div>
                        <span className="progress-text">{stats.hoursProgress}% • {Math.round(path.completedHours)}h / {path.targetHours}h</span>
                      </div>
                      
                      <div className="path-stats-row">
                        <span title="Milestones">🎯 {stats.completedMilestones}/{stats.totalMilestones}</span>
                        <span title="Study streak">🔥 {stats.streak} day{stats.streak !== 1 ? 's' : ''}</span>
                        {path.lastStudied && (
                          <span title="Last studied">
                            📅 {new Date(path.lastStudied).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {viewMode === 'create' && (
          <form className="path-form" onSubmit={handleCreatePath}>
            <div className="form-section">
              <label>Path Title *</label>
              <input 
                type="text" 
                value={formTitle} 
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g., Master React.js"
                required
                autoFocus
              />
            </div>

            <div className="form-section">
              <label>Description</label>
              <textarea 
                value={formDescription} 
                onChange={e => setFormDescription(e.target.value)}
                placeholder="What do you want to achieve?"
                rows={2}
              />
            </div>

            <div className="form-row">
              <div className="form-section">
                <label>Category</label>
                <div className="category-grid">
                  {Object.entries(CATEGORY_ICONS).map(([key, { emoji, label }]) => (
                    <button
                      key={key}
                      type="button"
                      className={`category-option ${formCategory === key ? 'selected' : ''}`}
                      onClick={() => setFormCategory(key)}
                    >
                      <span className="category-emoji">{emoji}</span>
                      <span className="category-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label>Difficulty</label>
                <div className="difficulty-options">
                  {DIFFICULTY_LEVELS.map(level => (
                    <button
                      key={level.id}
                      type="button"
                      className={`difficulty-option ${formDifficulty === level.id ? 'selected' : ''}`}
                      onClick={() => setFormDifficulty(level.id)}
                      style={{ '--difficulty-color': level.color }}
                    >
                      <span className="difficulty-name">{level.label}</span>
                      <span className="difficulty-desc">{level.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-section">
              <label>Target Hours</label>
              <input 
                type="number" 
                value={formTargetHours} 
                onChange={e => setFormTargetHours(e.target.value)}
                min={1}
                max={10000}
              />
            </div>

            <div className="form-section">
              <label>Milestones</label>
              {formMilestones.map((milestone, index) => (
                <div key={index} className="milestone-input-row">
                  <input
                    type="text"
                    value={milestone.title}
                    onChange={e => updateMilestoneField(index, e.target.value)}
                    placeholder={`Milestone ${index + 1}`}
                  />
                  <button type="button" className="remove-btn" onClick={() => removeMilestoneField(index)}>×</button>
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addMilestoneField}>+ Add Milestone</button>
            </div>

            <div className="form-section">
              <label>Resources</label>
              {formResources.map((resource, index) => (
                <div key={index} className="resource-input-row">
                  <input
                    type="text"
                    value={resource.title}
                    onChange={e => updateResourceField(index, 'title', e.target.value)}
                    placeholder="Resource title"
                  />
                  <input
                    type="url"
                    value={resource.url}
                    onChange={e => updateResourceField(index, 'url', e.target.value)}
                    placeholder="URL"
                  />
                  <select 
                    value={resource.type}
                    onChange={e => updateResourceField(index, 'type', e.target.value)}
                  >
                    <option value="article">Article</option>
                    <option value="video">Video</option>
                    <option value="course">Course</option>
                    <option value="book">Book</option>
                    <option value="documentation">Docs</option>
                    <option value="other">Other</option>
                  </select>
                  <button type="button" className="remove-btn" onClick={() => removeResourceField(index)}>×</button>
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addResourceField}>+ Add Resource</button>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setViewMode('grid')}>Cancel</button>
              <button type="submit" className="btn-primary">Create Learning Path</button>
            </div>
          </form>
        )}

        {viewMode === 'detail' && selectedPath && (
          <div className="path-detail">
            <div className="detail-header" style={{ '--path-color': CATEGORY_ICONS[selectedPath.category]?.color || '#94a3b8' }}>
              <div className="detail-icon">{CATEGORY_ICONS[selectedPath.category]?.emoji || '📚'}</div>
              <div className="detail-info">
                <h2>{selectedPath.title}</h2>
                <p>{selectedPath.description}</p>
                <div className="detail-meta">
                  <span className="meta-badge" style={{ backgroundColor: DIFFICULTY_LEVELS.find(d => d.id === selectedPath.difficulty)?.color }}>
                    {DIFFICULTY_LEVELS.find(d => d.id === selectedPath.difficulty)?.label}
                  </span>
                  <span className="meta-badge">{CATEGORY_ICONS[selectedPath.category]?.label}</span>
                  <span className="meta-badge">{Math.round(selectedPath.completedHours)}h / {selectedPath.targetHours}h</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="detail-tabs">
              {['overview', 'milestones', 'resources', 'notes'].map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'overview' && (
                <div className="overview-tab">
                  {(() => {
                    const stats = getPathStats(selectedPath);
                    return (
                      <>
                        <div className="detail-stats">
                          <div className="detail-stat">
                            <span className="stat-number">{stats.hoursProgress}%</span>
                            <span className="stat-label">Complete</span>
                          </div>
                          <div className="detail-stat">
                            <span className="stat-number">{stats.completedMilestones}/{stats.totalMilestones}</span>
                            <span className="stat-label">Milestones</span>
                          </div>
                          <div className="detail-stat">
                            <span className="stat-number">{stats.streak}</span>
                            <span className="stat-label">Day Streak</span>
                          </div>
                          <div className="detail-stat">
                            <span className="stat-number">{selectedPath.sessions.length}</span>
                            <span className="stat-label">Sessions</span>
                          </div>
                        </div>

                        {/* Study Timer */}
                        <div className="study-timer-section">
                          <h4>⏱️ Study Session Timer</h4>
                          <div className="timer-display-large">
                            {formatTime(sessionTimer)}
                          </div>
                          <div className="timer-controls">
                            {!isTimerRunning ? (
                              <button className="btn-primary" onClick={startStudySession}>▶️ Start Studying</button>
                            ) : (
                              <button className="btn-secondary" onClick={pauseStudySession}>⏸️ Pause</button>
                            )}
                            <button className="btn-danger" onClick={endStudySession} disabled={sessionTimer === 0}>
                              ⏹️ End Session
                            </button>
                          </div>
                        </div>

                        {/* Recent Sessions */}
                        <div className="recent-sessions">
                          <h4>📊 Recent Sessions</h4>
                          {selectedPath.sessions.length === 0 ? (
                            <p className="no-data">No sessions yet. Start studying!</p>
                          ) : (
                            <div className="sessions-list">
                              {[...selectedPath.sessions].reverse().slice(0, 10).map(session => (
                                <div key={session.id} className="session-item">
                                  <span>{new Date(session.date).toLocaleDateString()}</span>
                                  <span>{session.duration} min</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'milestones' && (
                <div className="milestones-tab">
                  <div className="milestones-list">
                    {selectedPath.milestones.map((milestone, index) => (
                      <div 
                        key={milestone.id} 
                        className={`milestone-item ${milestone.completed ? 'completed' : ''}`}
                        onClick={() => toggleMilestone(selectedPath.id, milestone.id)}
                      >
                        <div className="milestone-checkbox">
                          {milestone.completed ? '✅' : '⭕'}
                        </div>
                        <div className="milestone-content">
                          <span className="milestone-number">Step {index + 1}</span>
                          <span className="milestone-title">{milestone.title}</span>
                          {milestone.completedAt && (
                            <span className="milestone-date">
                              Completed {new Date(milestone.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="resources-tab">
                  {selectedPath.resources.length === 0 ? (
                    <p className="no-data">No resources added yet.</p>
                  ) : (
                    <div className="resources-list">
                      {selectedPath.resources.map(resource => (
                        <a 
                          key={resource.id} 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="resource-item"
                        >
                          <span className="resource-type">{resource.type}</span>
                          <span className="resource-title">{resource.title}</span>
                          <span className="resource-link">↗️</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="notes-tab">
                  <textarea
                    value={notes}
                    onChange={e => updateNotes(selectedPath.id, e.target.value)}
                    placeholder="Write your learning notes here..."
                    rows={15}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="detail-actions">
              <button className="btn-danger" onClick={() => deletePath(selectedPath.id)}>
                🗑️ Delete Path
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
