'use client';

import React, { useState, useEffect, useMemo } from 'react';
// import './SprintPlanner.css';

const SPRINT_DURATIONS = [7, 14, 21, 28];

const RETRO_CATEGORIES = [
  { id: 'went-well', label: 'What went well? 🎉', color: '#4ade80' },
  { id: 'improve', label: 'What to improve? 🔧', color: '#fbbf24' },
  { id: 'action', label: 'Action items 🎯', color: '#60a5fa' }
];

const isBrowser = typeof window !== 'undefined';

export default function SprintPlanner({ isOpen, onClose }) {
  const [sprints, setSprints] = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [view, setView] = useState('list'); // list, create, detail, standup, retro
  const [newSprint, setNewSprint] = useState({
    name: '',
    duration: 14,
    goals: '',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [newTask, setNewTask] = useState({ title: '', estimate: 1, priority: 'medium' });
  const [standupNotes, setStandupNotes] = useState({ yesterday: '', today: '', blockers: '' });
  const [retroItems, setRetroItems] = useState({ 'went-well': [], 'improve': [], 'action': [] });
  const [newRetroItem, setNewRetroItem] = useState({ category: 'went-well', text: '' });

  // Load sprints from localStorage
  useEffect(() => {
    if (isOpen && isBrowser) {
      const saved = localStorage.getItem('mc-sprints');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSprints(parsed);
          // Find active sprint
          const active = parsed.find(s => s.status === 'active');
          if (active) setActiveSprint(active);
        } catch (e) {
          console.error('Failed to parse sprints:', e);
        }
      }
    }
  }, [isOpen]);

  // Save sprints to localStorage
  const saveSprints = (sprintData) => {
    if (isBrowser) {
      localStorage.setItem('mc-sprints', JSON.stringify(sprintData));
    }
  };

  // Calculate sprint end date
  const calculateEndDate = (startDate, duration) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + duration);
    return date.toISOString().split('T')[0];
  };

  // Calculate days remaining
  const getDaysRemaining = (sprint) => {
    const end = new Date(sprint.endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // Calculate progress
  const getProgress = (sprint) => {
    if (!sprint.tasks || sprint.tasks.length === 0) return 0;
    const completed = sprint.tasks.filter(t => t.completed).length;
    return Math.round((completed / sprint.tasks.length) * 100);
  };

  // Calculate burndown data
  const getBurndownData = (sprint) => {
    if (!sprint.tasks) return [];
    
    const totalPoints = sprint.tasks.reduce((sum, t) => sum + (t.estimate || 1), 0);
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    const data = [];
    let remaining = totalPoints;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate completed points up to this date
      const completedPoints = sprint.tasks
        .filter(t => t.completed && t.completedAt && t.completedAt <= dateStr)
        .reduce((sum, t) => sum + (t.estimate || 1), 0);
      
      remaining = totalPoints - completedPoints;
      
      data.push({
        day: i + 1,
        date: dateStr,
        remaining: Math.max(0, remaining),
        ideal: totalPoints - (totalPoints / (days - 1)) * i
      });
    }
    
    return data;
  };

  // Create new sprint
  const handleCreateSprint = () => {
    if (!newSprint.name.trim()) return;
    
    const sprint = {
      id: Date.now().toString(),
      name: newSprint.name,
      duration: newSprint.duration,
      goals: newSprint.goals,
      startDate: newSprint.startDate,
      endDate: calculateEndDate(newSprint.startDate, newSprint.duration),
      status: 'active',
      tasks: [],
      standups: [],
      retrospective: null,
      createdAt: new Date().toISOString()
    };
    
    const updated = [...sprints.filter(s => s.status !== 'active'), sprint];
    setSprints(updated);
    saveSprints(updated);
    setActiveSprint(sprint);
    setView('detail');
    setNewSprint({ name: '', duration: 14, goals: '', startDate: new Date().toISOString().split('T')[0] });
  };

  // Add task to sprint
  const handleAddTask = () => {
    if (!newTask.title.trim() || !activeSprint) return;
    
    const task = {
      id: Date.now().toString(),
      title: newTask.title,
      estimate: parseInt(newTask.estimate) || 1,
      priority: newTask.priority,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    const updated = sprints.map(s => 
      s.id === activeSprint.id 
        ? { ...s, tasks: [...s.tasks, task] }
        : s
    );
    
    setSprints(updated);
    saveSprints(updated);
    setActiveSprint({ ...activeSprint, tasks: [...activeSprint.tasks, task] });
    setNewTask({ title: '', estimate: 1, priority: 'medium' });
  };

  // Toggle task completion
  const toggleTask = (taskId) => {
    const updated = sprints.map(s => 
      s.id === activeSprint.id 
        ? {
            ...s,
            tasks: s.tasks.map(t => 
              t.id === taskId 
                ? { 
                    ...t, 
                    completed: !t.completed,
                    completedAt: !t.completed ? new Date().toISOString().split('T')[0] : null
                  }
                : t
            )
          }
        : s
    );
    
    setSprints(updated);
    saveSprints(updated);
    const updatedSprint = updated.find(s => s.id === activeSprint.id);
    setActiveSprint(updatedSprint);
  };

  // Delete task
  const deleteTask = (taskId) => {
    const updated = sprints.map(s => 
      s.id === activeSprint.id 
        ? { ...s, tasks: s.tasks.filter(t => t.id !== taskId) }
        : s
    );
    
    setSprints(updated);
    saveSprints(updated);
    const updatedSprint = updated.find(s => s.id === activeSprint.id);
    setActiveSprint(updatedSprint);
  };

  // Save standup notes
  const handleSaveStandup = () => {
    if (!activeSprint) return;
    
    const standup = {
      date: new Date().toISOString(),
      yesterday: standupNotes.yesterday,
      today: standupNotes.today,
      blockers: standupNotes.blockers
    };
    
    const updated = sprints.map(s => 
      s.id === activeSprint.id 
        ? { ...s, standups: [...(s.standups || []), standup] }
        : s
    );
    
    setSprints(updated);
    saveSprints(updated);
    setActiveSprint({ ...activeSprint, standups: [...(activeSprint.standups || []), standup] });
    setStandupNotes({ yesterday: '', today: '', blockers: '' });
    setView('detail');
  };

  // Add retrospective item
  const handleAddRetroItem = () => {
    if (!newRetroItem.text.trim()) return;
    
    const item = {
      id: Date.now().toString(),
      text: newRetroItem.text,
      category: newRetroItem.category
    };
    
    setRetroItems(prev => ({
      ...prev,
      [newRetroItem.category]: [...prev[newRetroItem.category], item]
    }));
    
    setNewRetroItem({ category: newRetroItem.category, text: '' });
  };

  // Save retrospective
  const handleSaveRetrospective = () => {
    if (!activeSprint) return;
    
    const updated = sprints.map(s => 
      s.id === activeSprint.id 
        ? { 
            ...s, 
            status: 'completed',
            retrospective: retroItems,
            completedAt: new Date().toISOString()
          }
        : s
    );
    
    setSprints(updated);
    saveSprints(updated);
    setActiveSprint(null);
    setView('list');
    setRetroItems({ 'went-well': [], 'improve': [], 'action': [] });
  };

  // Complete sprint
  const completeSprint = () => {
    if (!activeSprint) return;
    setRetroItems({ 'went-well': [], 'improve': [], 'action': [] });
    setView('retro');
  };

  // Archive old sprint and start new
  const archiveAndNew = () => {
    setActiveSprint(null);
    setView('create');
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    if (!activeSprint || !activeSprint.tasks) {
      return { total: 0, completed: 0, points: 0, completedPoints: 0 };
    }
    
    const total = activeSprint.tasks.length;
    const completed = activeSprint.tasks.filter(t => t.completed).length;
    const points = activeSprint.tasks.reduce((sum, t) => sum + (t.estimate || 1), 0);
    const completedPoints = activeSprint.tasks
      .filter(t => t.completed)
      .reduce((sum, t) => sum + (t.estimate || 1), 0);
    
    return { total, completed, points, completedPoints };
  }, [activeSprint]);

  if (!isOpen) return null;

  return (
    <div className="sprint-overlay" onClick={onClose}>
      <div className="sprint-panel" onClick={e => e.stopPropagation()}>
        <div className="sprint-header">
          <h3>🏃 Sprint Planner</h3>
          <div className="sprint-header-actions">
            {view !== 'list' && (
              <button 
                className="back-btn"
                onClick={() => setView(view === 'detail' ? 'list' : 'detail')}
              >
                ← Back
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="sprint-content">
          {/* LIST VIEW */}
          {view === 'list' && (
            <div className="sprint-list">
              <div className="sprint-list-header">
                <h4>Your Sprints</h4>
                <button className="create-sprint-btn" onClick={() => setView('create')}>
                  + New Sprint
                </button>
              </div>
              
              {sprints.length === 0 ? (
                <div className="sprint-empty">
                  <span className="empty-icon">🏃</span>
                  <p>No sprints yet</p>
                  <p className="empty-sub">Create your first sprint to start planning!</p>
                  <button className="create-sprint-btn" onClick={() => setView('create')}>
                    Create Sprint
                  </button>
                </div>
              ) : (
                <div className="sprint-grid">
                  {sprints.map(sprint => (
                    <div 
                      key={sprint.id} 
                      className={`sprint-card ${sprint.status}`}
                      onClick={() => {
                        setActiveSprint(sprint);
                        setView('detail');
                      }}
                    >
                      <div className="sprint-card-header">
                        <span className={`sprint-status ${sprint.status}`}>
                          {sprint.status === 'active' ? '● Active' : '✓ Completed'}
                        </span>
                        <span className="sprint-duration">{sprint.duration} days</span>
                      </div>
                      <h5 className="sprint-name">{sprint.name}</h5>
                      <p className="sprint-dates">
                        {sprint.startDate} → {sprint.endDate}
                      </p>
                      {sprint.status === 'active' && (
                        <div className="sprint-progress-mini">
                          <div className="progress-bar-mini">
                            <div 
                              className="progress-fill-mini"
                              style={{ width: `${getProgress(sprint)}%` }}
                            />
                          </div>
                          <span>{getProgress(sprint)}%</span>
                        </div>
                      )}
                      <div className="sprint-stats-mini">
                        <span>{sprint.tasks?.length || 0} tasks</span>
                        <span>{sprint.tasks?.filter(t => t.completed).length || 0} done</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CREATE VIEW */}
          {view === 'create' && (
            <div className="sprint-create">
              <h4>Create New Sprint</h4>
              
              <div className="form-group">
                <label>Sprint Name</label>
                <input
                  type="text"
                  placeholder='e.g., "Focus Sprint - Week 1"'
                  value={newSprint.name}
                  onChange={e => setNewSprint({ ...newSprint, name: e.target.value })}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Duration</label>
                  <select
                    value={newSprint.duration}
                    onChange={e => setNewSprint({ ...newSprint, duration: parseInt(e.target.value) })}
                  >
                    {SPRINT_DURATIONS.map(d => (
                      <option key={d} value={d}>{d} days</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={newSprint.startDate}
                    onChange={e => setNewSprint({ ...newSprint, startDate: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Sprint Goals (optional)</label>
                <textarea
                  placeholder="What do you want to achieve this sprint?"
                  value={newSprint.goals}
                  onChange={e => setNewSprint({ ...newSprint, goals: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="sprint-preview">
                <p>📅 Sprint will run from <strong>{newSprint.startDate}</strong> to <strong>{calculateEndDate(newSprint.startDate, newSprint.duration)}</strong></p>
              </div>
              
              <button 
                className="create-sprint-submit"
                onClick={handleCreateSprint}
                disabled={!newSprint.name.trim()}
              >
                🚀 Start Sprint
              </button>
            </div>
          )}

          {/* DETAIL VIEW */}
          {view === 'detail' && activeSprint && (
            <div className="sprint-detail">
              <div className="sprint-detail-header">
                <div>
                  <h4>{activeSprint.name}</h4>
                  <p className="sprint-meta">
                    {activeSprint.startDate} → {activeSprint.endDate} 
                    <span className="days-left">({getDaysRemaining(activeSprint)} days left)</span>
                  </p>
                </div>
                <div className="sprint-actions">
                  <button className="action-btn" onClick={() => setView('standup')}>
                    📋 Daily Standup
                  </button>
                  <button className="action-btn complete" onClick={completeSprint}>
                    ✓ Complete Sprint
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="sprint-stats">
                <div className="stat-card">
                  <span className="stat-value">{stats.completed}/{stats.total}</span>
                  <span className="stat-label">Tasks Done</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.completedPoints}/{stats.points}</span>
                  <span className="stat-label">Points</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{getProgress(activeSprint)}%</span>
                  <span className="stat-label">Progress</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{activeSprint.standups?.length || 0}</span>
                  <span className="stat-label">Standups</span>
                </div>
              </div>

              {/* Goals */}
              {activeSprint.goals && (
                <div className="sprint-goals">
                  <h5>🎯 Sprint Goals</h5>
                  <p>{activeSprint.goals}</p>
                </div>
              )}

              {/* Burndown Chart */}
              {activeSprint.tasks?.length > 0 && (
                <div className="burndown-chart">
                  <h5>📉 Burndown Chart</h5>
                  <div className="chart-container">
                    {getBurndownData(activeSprint).map((point, i) => (
                      <div key={i} className="chart-bar-wrapper">
                        <div className="chart-bars">
                          <div 
                            className="chart-bar ideal"
                            style={{ height: `${(point.ideal / Math.max(...getBurndownData(activeSprint).map(d => d.ideal))) * 100}%` }}
                            title={`Ideal: ${point.ideal.toFixed(1)} pts`}
                          />
                          <div 
                            className="chart-bar actual"
                            style={{ height: `${(point.remaining / Math.max(...getBurndownData(activeSprint).map(d => d.ideal))) * 100}%` }}
                            title={`Remaining: ${point.remaining} pts`}
                          />
                        </div>
                        <span className="chart-label">D{point.day}</span>
                      </div>
                    ))}
                  </div>
                  <div className="chart-legend">
                    <span><span className="legend-color ideal"></span> Ideal</span>
                    <span><span className="legend-color actual"></span> Actual</span>
                  </div>
                </div>
              )}

              {/* Add Task */}
              <div className="add-task-section">
                <h5>➕ Add Task</h5>
                <div className="add-task-form">
                  <input
                    type="text"
                    placeholder="Task title..."
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    onKeyPress={e => e.key === 'Enter' && handleAddTask()}
                  />
                  <select
                    value={newTask.estimate}
                    onChange={e => setNewTask({ ...newTask, estimate: e.target.value })}
                  >
                    {[1, 2, 3, 5, 8, 13].map(p => (
                      <option key={p} value={p}>{p} pts</option>
                    ))}
                  </select>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <button onClick={handleAddTask}>Add</button>
                </div>
              </div>

              {/* Task List */}
              <div className="task-list">
                <h5>📝 Tasks ({activeSprint.tasks?.length || 0})</h5>
                {activeSprint.tasks?.length === 0 ? (
                  <p className="empty-tasks">No tasks yet. Add some tasks to get started!</p>
                ) : (
                  <div className="tasks">
                    {activeSprint.tasks.map(task => (
                      <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                        />
                        <div className="task-content">
                          <span className="task-title">{task.title}</span>
                          <div className="task-meta">
                            <span 
                              className="task-priority"
                              style={{ background: getPriorityColor(task.priority) }}
                            >
                              {task.priority}
                            </span>
                            <span className="task-points">{task.estimate} pts</span>
                          </div>
                        </div>
                        <button 
                          className="delete-task"
                          onClick={() => deleteTask(task.id)}
                          title="Delete task"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Standup History */}
              {activeSprint.standups?.length > 0 && (
                <div className="standup-history">
                  <h5>📋 Standup History</h5>
                  <div className="standup-list">
                    {activeSprint.standups.slice(-5).reverse().map((standup, i) => (
                      <div key={i} className="standup-item">
                        <span className="standup-date">
                          {new Date(standup.date).toLocaleDateString()}
                        </span>
                        <p><strong>Today:</strong> {standup.today}</p>
                        {standup.blockers && (
                          <p className="blocker"><strong>Blockers:</strong> {standup.blockers}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STANDUP VIEW */}
          {view === 'standup' && activeSprint && (
            <div className="standup-view">
              <h4>📋 Daily Standup</h4>
              <p className="standup-subtitle">Day {activeSprint.standups?.length + 1 || 1} of {activeSprint.duration}</p>
              
              <div className="standup-form">
                <div className="form-group">
                  <label>What did you accomplish yesterday?</label>
                  <textarea
                    value={standupNotes.yesterday}
                    onChange={e => setStandupNotes({ ...standupNotes, yesterday: e.target.value })}
                    placeholder="Summarize yesterday's progress..."
                    rows={3}
                  />
                </div>
                
                <div className="form-group">
                  <label>What will you work on today?</label>
                  <textarea
                    value={standupNotes.today}
                    onChange={e => setStandupNotes({ ...standupNotes, today: e.target.value })}
                    placeholder="Your focus for today..."
                    rows={3}
                  />
                </div>
                
                <div className="form-group">
                  <label>Any blockers?</label>
                  <textarea
                    value={standupNotes.blockers}
                    onChange={e => setStandupNotes({ ...standupNotes, blockers: e.target.value })}
                    placeholder="Anything blocking your progress?"
                    rows={2}
                  />
                </div>
                
                <button 
                  className="save-standup-btn"
                  onClick={handleSaveStandup}
                  disabled={!standupNotes.today.trim()}
                >
                  💾 Save Standup
                </button>
              </div>
            </div>
          )}

          {/* RETRO VIEW */}
          {view === 'retro' && activeSprint && (
            <div className="retro-view">
              <h4>🔄 Sprint Retrospective</h4>
              <p className="retro-subtitle">Reflect on {activeSprint.name}</p>
              
              <div className="retro-stats-summary">
                <div className="retro-stat">
                  <span className="retro-stat-value">{stats.completed}/{stats.total}</span>
                  <span className="retro-stat-label">Tasks Completed</span>
                </div>
                <div className="retro-stat">
                  <span className="retro-stat-value">{getProgress(activeSprint)}%</span>
                  <span className="retro-stat-label">Completion Rate</span>
                </div>
                <div className="retro-stat">
                  <span className="retro-stat-value">{activeSprint.standups?.length || 0}</span>
                  <span className="retro-stat-label">Standups Logged</span>
                </div>
              </div>

              <div className="retro-columns">
                {RETRO_CATEGORIES.map(cat => (
                  <div key={cat.id} className="retro-column">
                    <h5 style={{ color: cat.color }}>{cat.label}</h5>
                    <div className="retro-items">
                      {retroItems[cat.id].map(item => (
                        <div key={item.id} className="retro-item">
                          {item.text}
                        </div>
                      ))}
                    </div>
                    <div className="add-retro-item">
                      <input
                        type="text"
                        placeholder="Add item..."
                        value={newRetroItem.category === cat.id ? newRetroItem.text : ''}
                        onChange={e => setNewRetroItem({ category: cat.id, text: e.target.value })}
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            setNewRetroItem({ category: cat.id, text: e.target.value });
                            handleAddRetroItem();
                          }
                        }}
                      />
                      <button onClick={() => {
                        setNewRetroItem({ category: cat.id, text: newRetroItem.category === cat.id ? newRetroItem.text : '' });
                        handleAddRetroItem();
                      }}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="complete-sprint-btn"
                onClick={handleSaveRetrospective}
              >
                ✓ Complete Sprint & Archive
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
