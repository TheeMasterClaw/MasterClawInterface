import React, { useState, useEffect, useMemo } from 'react';
import './PriorityMatrix.css';

const QUADRANTS = [
  { 
    id: 'do', 
    label: 'Do First', 
    subtitle: 'Urgent & Important',
    emoji: '🔥',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    description: 'Do these tasks immediately'
  },
  { 
    id: 'schedule', 
    label: 'Schedule', 
    subtitle: 'Not Urgent but Important',
    emoji: '📅',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    description: 'Decide when to do these'
  },
  { 
    id: 'delegate', 
    label: 'Delegate', 
    subtitle: 'Urgent but Not Important',
    emoji: '↗️',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    description: 'Delegate if possible'
  },
  { 
    id: 'eliminate', 
    label: 'Eliminate', 
    subtitle: 'Neither Urgent nor Important',
    emoji: '🗑️',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    description: 'Eliminate or minimize these'
  }
];

const SUGGESTED_TASKS = [
  { text: 'Reply to urgent email', urgency: 4, importance: 4 },
  { text: 'Exercise', urgency: 2, importance: 5 },
  { text: 'Weekly planning', urgency: 2, importance: 5 },
  { text: 'Attend unnecessary meeting', urgency: 4, importance: 1 },
  { text: 'Check social media', urgency: 2, importance: 1 },
  { text: 'Pay bills', urgency: 5, importance: 5 },
  { text: 'Learn new skill', urgency: 1, importance: 5 },
  { text: 'Handle customer complaint', urgency: 5, importance: 4 },
  { text: 'Organize desk', urgency: 2, importance: 2 },
  { text: 'Doctor appointment', urgency: 4, importance: 5 },
  { text: 'Watch trending video', urgency: 1, importance: 1 },
  { text: 'Long-term project planning', urgency: 1, importance: 5 }
];

const STORAGE_KEY = 'mc-priority-matrix';

export default function PriorityMatrix({ isOpen, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskUrgency, setNewTaskUrgency] = useState(3);
  const [newTaskImportance, setNewTaskImportance] = useState(3);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [filterQuadrant, setFilterQuadrant] = useState('all');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix', 'list', 'stats'
  const [draggedTask, setDraggedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // Load tasks from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTasks(parsed.tasks || []);
        setCompletedTasks(parsed.completedTasks || []);
      } else {
        // Add sample tasks for first-time users
        const sampleTasks = [
          { id: '1', text: 'Finish project proposal', urgency: 4, importance: 5, createdAt: Date.now() },
          { id: '2', text: 'Exercise for 30 minutes', urgency: 2, importance: 4, createdAt: Date.now() },
          { id: '3', text: 'Reply to John\'s email', urgency: 3, importance: 2, createdAt: Date.now() },
          { id: '4', text: 'Scroll social media', urgency: 1, importance: 1, createdAt: Date.now() }
        ];
        setTasks(sampleTasks);
      }
    } catch (err) {
      console.error('Failed to load priority matrix:', err);
    }
  }, [isOpen]);

  // Save to localStorage
  useEffect(() => {
    if (!isOpen) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, completedTasks }));
    } catch (err) {
      console.error('Failed to save priority matrix:', err);
    }
  }, [tasks, completedTasks, isOpen]);

  // Get quadrant for a task based on urgency and importance
  const getQuadrant = (urgency, importance) => {
    const isUrgent = urgency >= 3;
    const isImportant = importance >= 3;
    
    if (isUrgent && isImportant) return 'do';
    if (!isUrgent && isImportant) return 'schedule';
    if (isUrgent && !isImportant) return 'delegate';
    return 'eliminate';
  };

  // Get tasks for a specific quadrant
  const getTasksByQuadrant = (quadrantId) => {
    return tasks.filter(task => {
      const taskQuadrant = getQuadrant(task.urgency, task.importance);
      return taskQuadrant === quadrantId;
    });
  };

  // Add new task
  const addTask = () => {
    if (!newTaskText.trim()) return;
    
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      urgency: newTaskUrgency,
      importance: newTaskImportance,
      createdAt: Date.now()
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskText('');
    setNewTaskUrgency(3);
    setNewTaskImportance(3);
    setShowAddForm(false);
  };

  // Add quick suggested task
  const addSuggestedTask = (suggestedTask) => {
    const newTask = {
      id: Date.now().toString(),
      text: suggestedTask.text,
      urgency: suggestedTask.urgency,
      importance: suggestedTask.importance,
      createdAt: Date.now()
    };
    setTasks([...tasks, newTask]);
  };

  // Delete task
  const deleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    setCompletedTasks(completedTasks.filter(t => t.id !== taskId));
  };

  // Mark task as complete
  const completeTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCompletedTasks([...completedTasks, { ...task, completedAt: Date.now() }]);
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  // Update task position (urgency/importance)
  const updateTaskPosition = (taskId, urgency, importance) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, urgency, importance } : t
    ));
  };

  // Start editing task
  const startEditing = (task) => {
    setEditingTask(task);
    setNewTaskText(task.text);
    setNewTaskUrgency(task.urgency);
    setNewTaskImportance(task.importance);
    setShowAddForm(true);
  };

  // Save edited task
  const saveEdit = () => {
    if (!editingTask || !newTaskText.trim()) return;
    
    setTasks(tasks.map(t => 
      t.id === editingTask.id 
        ? { ...t, text: newTaskText.trim(), urgency: newTaskUrgency, importance: newTaskImportance }
        : t
    ));
    setEditingTask(null);
    setNewTaskText('');
    setNewTaskUrgency(3);
    setNewTaskImportance(3);
    setShowAddForm(false);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingTask(null);
    setNewTaskText('');
    setNewTaskUrgency(3);
    setNewTaskImportance(3);
    setShowAddForm(false);
  };

  // Clear all tasks
  const clearAllTasks = () => {
    if (window.confirm('Are you sure you want to clear all tasks?')) {
      setTasks([]);
      setCompletedTasks([]);
    }
  };

  // Handle drag start
  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop on quadrant
  const handleDrop = (e, quadrantId) => {
    e.preventDefault();
    if (!draggedTask) return;
    
    let newUrgency = draggedTask.urgency;
    let newImportance = draggedTask.importance;
    
    switch (quadrantId) {
      case 'do':
        newUrgency = Math.max(3, draggedTask.urgency);
        newImportance = Math.max(3, draggedTask.importance);
        break;
      case 'schedule':
        newUrgency = Math.min(2, draggedTask.urgency);
        newImportance = Math.max(3, draggedTask.importance);
        break;
      case 'delegate':
        newUrgency = Math.max(3, draggedTask.urgency);
        newImportance = Math.min(2, draggedTask.importance);
        break;
      case 'eliminate':
        newUrgency = Math.min(2, draggedTask.urgency);
        newImportance = Math.min(2, draggedTask.importance);
        break;
    }
    
    updateTaskPosition(draggedTask.id, newUrgency, newImportance);
    setDraggedTask(null);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const doCount = getTasksByQuadrant('do').length;
    const scheduleCount = getTasksByQuadrant('schedule').length;
    const delegateCount = getTasksByQuadrant('delegate').length;
    const eliminateCount = getTasksByQuadrant('eliminate').length;
    const completed = completedTasks.length;
    
    return { total, doCount, scheduleCount, delegateCount, eliminateCount, completed };
  }, [tasks, completedTasks]);

  if (!isOpen) return null;

  return (
    <div className="priority-matrix-overlay" onClick={onClose}>
      <div className="priority-matrix-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="priority-matrix-header">
          <div className="priority-matrix-title">
            <span className="priority-matrix-icon">📊</span>
            <div>
              <h2>Priority Matrix</h2>
              <p className="priority-matrix-subtitle">Eisenhower Matrix for task prioritization</p>
            </div>
          </div>
          <div className="priority-matrix-header-actions">
            <button 
              className={`pm-view-btn ${viewMode === 'matrix' ? 'active' : ''}`}
              onClick={() => setViewMode('matrix')}
              title="Matrix View"
            >
              ⊞
            </button>
            <button 
              className={`pm-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
            <button 
              className={`pm-view-btn ${viewMode === 'stats' ? 'active' : ''}`}
              onClick={() => setViewMode('stats')}
              title="Statistics"
            >
              📈
            </button>
            <button 
              className="pm-add-btn"
              onClick={() => setShowAddForm(true)}
              title="Add Task"
            >
              + Add Task
            </button>
            <button className="pm-close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats Bar */}
        {viewMode !== 'stats' && (
          <div className="priority-matrix-stats-bar">
            <div className="pm-stat">
              <span className="pm-stat-value">{stats.total}</span>
              <span className="pm-stat-label">Active</span>
            </div>
            <div className="pm-stat do">
              <span className="pm-stat-value">{stats.doCount}</span>
              <span className="pm-stat-label">Do First</span>
            </div>
            <div className="pm-stat schedule">
              <span className="pm-stat-value">{stats.scheduleCount}</span>
              <span className="pm-stat-label">Schedule</span>
            </div>
            <div className="pm-stat delegate">
              <span className="pm-stat-value">{stats.delegateCount}</span>
              <span className="pm-stat-label">Delegate</span>
            </div>
            <div className="pm-stat eliminate">
              <span className="pm-stat-value">{stats.eliminateCount}</span>
              <span className="pm-stat-label">Eliminate</span>
            </div>
            <div className="pm-stat completed">
              <span className="pm-stat-value">{stats.completed}</span>
              <span className="pm-stat-label">Done</span>
            </div>
          </div>
        )}

        {/* Matrix View */}
        {viewMode === 'matrix' && (
          <div className="priority-matrix-grid">
            {/* Urgency labels */}
            <div className="pm-label-column">
              <div className="pm-label urgent">
                <span>🔥</span>
                <span>Urgent</span>
              </div>
              <div className="pm-label not-urgent">
                <span>🐢</span>
                <span>Not Urgent</span>
              </div>
            </div>

            {/* Importance labels */}
            <div className="pm-label-row">
              <div className="pm-label important">
                <span>⭐</span>
                <span>Important</span>
              </div>
              <div className="pm-label not-important">
                <span>○</span>
                <span>Not Important</span>
              </div>
            </div>

            {/* Quadrants */}
            <div className="pm-quadrants">
              {QUADRANTS.map((quadrant, index) => (
                <div
                  key={quadrant.id}
                  className={`pm-quadrant ${quadrant.id}`}
                  style={{ 
                    '--quadrant-color': quadrant.color,
                    '--quadrant-bg': quadrant.bgColor 
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, quadrant.id)}
                >
                  <div className="pm-quadrant-header">
                    <span className="pm-quadrant-emoji">{quadrant.emoji}</span>
                    <div className="pm-quadrant-title-group">
                      <h3 className="pm-quadrant-title">{quadrant.label}</h3>
                      <span className="pm-quadrant-subtitle">{quadrant.subtitle}</span>
                    </div>
                    <span className="pm-quadrant-count">
                      {getTasksByQuadrant(quadrant.id).length}
                    </span>
                  </div>
                  <p className="pm-quadrant-description">{quadrant.description}</p>
                  
                  <div className="pm-task-list">
                    {getTasksByQuadrant(quadrant.id).map((task) => (
                      <div
                        key={task.id}
                        className="pm-task-card"
                        draggable
                        onDragStart={() => handleDragStart(task)}
                      >
                        <div className="pm-task-content">
                          <span className="pm-task-text">{task.text}</span>
                          <div className="pm-task-meta">
                            <span className="pm-task-score">
                              U:{task.urgency} I:{task.importance}
                            </span>
                          </div>
                        </div>
                        <div className="pm-task-actions">
                          <button 
                            className="pm-task-btn complete"
                            onClick={() => completeTask(task.id)}
                            title="Complete"
                          >
                            ✓
                          </button>
                          <button 
                            className="pm-task-btn edit"
                            onClick={() => startEditing(task)}
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button 
                            className="pm-task-btn delete"
                            onClick={() => deleteTask(task.id)}
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                    {getTasksByQuadrant(quadrant.id).length === 0 && (
                      <div className="pm-empty-state">
                        <span>Drop tasks here</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="priority-matrix-list-view">
            <div className="pm-list-filters">
              <button 
                className={filterQuadrant === 'all' ? 'active' : ''}
                onClick={() => setFilterQuadrant('all')}
              >
                All ({stats.total})
              </button>
              {QUADRANTS.map(q => (
                <button 
                  key={q.id}
                  className={filterQuadrant === q.id ? 'active' : ''}
                  onClick={() => setFilterQuadrant(q.id)}
                  style={{ '--filter-color': q.color }}
                >
                  {q.emoji} {q.label} ({getTasksByQuadrant(q.id).length})
                </button>
              ))}
            </div>
            
            <div className="pm-task-table">
              <div className="pm-task-table-header">
                <span>Task</span>
                <span>Urgency</span>
                <span>Importance</span>
                <span>Quadrant</span>
                <span>Actions</span>
              </div>
              {(filterQuadrant === 'all' ? tasks : getTasksByQuadrant(filterQuadrant))
                .sort((a, b) => (b.urgency + b.importance) - (a.urgency + a.importance))
                .map(task => {
                  const quadrant = QUADRANTS.find(q => q.id === getQuadrant(task.urgency, task.importance));
                  return (
                    <div key={task.id} className="pm-task-row">
                      <span className="pm-task-name">{task.text}</span>
                      <div className="pm-score-bar">
                        <div className="pm-score-fill" style={{ width: `${(task.urgency / 5) * 100}%`, background: '#ef4444' }}></div>
                        <span>{task.urgency}/5</span>
                      </div>
                      <div className="pm-score-bar">
                        <div className="pm-score-fill" style={{ width: `${(task.importance / 5) * 100}%`, background: '#3b82f6' }}></div>
                        <span>{task.importance}/5</span>
                      </div>
                      <span className="pm-quadrant-badge" style={{ '--badge-color': quadrant.color }}>
                        {quadrant.emoji} {quadrant.label}
                      </span>
                      <div className="pm-row-actions">
                        <button onClick={() => completeTask(task.id)} title="Complete">✓</button>
                        <button onClick={() => startEditing(task)} title="Edit">✎</button>
                        <button onClick={() => deleteTask(task.id)} title="Delete">×</button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Stats View */}
        {viewMode === 'stats' && (
          <div className="priority-matrix-stats-view">
            <div className="pm-stats-grid">
              <div className="pm-stat-card total">
                <span className="pm-stat-number">{stats.total}</span>
                <span className="pm-stat-label">Active Tasks</span>
              </div>
              <div className="pm-stat-card completed">
                <span className="pm-stat-number">{stats.completed}</span>
                <span className="pm-stat-label">Completed Today</span>
              </div>
              
              <div className="pm-distribution">
                <h3>Task Distribution</h3>
                <div className="pm-distribution-bars">
                  {QUADRANTS.map(q => {
                    const count = getTasksByQuadrant(q.id).length;
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={q.id} className="pm-dist-bar">
                        <div className="pm-dist-label">
                          <span>{q.emoji}</span>
                          <span>{q.label}</span>
                        </div>
                        <div className="pm-dist-track">
                          <div 
                            className="pm-dist-fill" 
                            style={{ width: `${percentage}%`, background: q.color }}
                          ></div>
                        </div>
                        <span className="pm-dist-value">{count} ({Math.round(percentage)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="pm-priority-tips">
                <h3>💡 Priority Tips</h3>
                <ul>
                  <li><strong>Do First:</strong> Crises, deadlines, important meetings</li>
                  <li><strong>Schedule:</strong> Planning, exercise, learning, relationships</li>
                  <li><strong>Delegate:</strong> Interruptions, some calls/emails</li>
                  <li><strong>Eliminate:</strong> Time wasters, excessive entertainment</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="priority-matrix-actions">
          <button className="pm-quick-add-toggle" onClick={() => setShowQuickAdd(!showQuickAdd)}>
            {showQuickAdd ? '▼ Hide Suggestions' : '▶ Quick Add Suggestions'}
          </button>
          <button className="pm-clear-btn" onClick={clearAllTasks}>
            Clear All
          </button>
        </div>

        {/* Quick Add Suggestions */}
        {showQuickAdd && (
          <div className="pm-quick-add-panel">
            <h4>Click to add suggested tasks:</h4>
            <div className="pm-suggestion-chips">
              {SUGGESTED_TASKS.map((task, idx) => (
                <button 
                  key={idx}
                  className="pm-suggestion-chip"
                  onClick={() => addSuggestedTask(task)}
                >
                  {task.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Task Modal */}
        {showAddForm && (
          <div className="pm-modal-overlay" onClick={cancelEdit}>
            <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
              
              <div className="pm-form-group">
                <label>Task Description</label>
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>
              
              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label>Urgency: {newTaskUrgency}/5</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newTaskUrgency}
                    onChange={(e) => setNewTaskUrgency(parseInt(e.target.value))}
                    className="pm-slider urgency"
                  />
                  <div className="pm-slider-labels">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
                
                <div className="pm-form-group">
                  <label>Importance: {newTaskImportance}/5</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newTaskImportance}
                    onChange={(e) => setNewTaskImportance(parseInt(e.target.value))}
                    className="pm-slider importance"
                  />
                  <div className="pm-slider-labels">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
              
              <div className="pm-preview">
                <span>Will be placed in: </span>
                <span 
                  className="pm-preview-quadrant"
                  style={{ 
                    color: QUADRANTS.find(q => q.id === getQuadrant(newTaskUrgency, newTaskImportance))?.color 
                  }}
                >
                  {QUADRANTS.find(q => q.id === getQuadrant(newTaskUrgency, newTaskImportance))?.emoji} {' '}
                  {QUADRANTS.find(q => q.id === getQuadrant(newTaskUrgency, newTaskImportance))?.label}
                </span>
              </div>
              
              <div className="pm-modal-actions">
                <button className="pm-btn-secondary" onClick={cancelEdit}>
                  Cancel
                </button>
                <button 
                  className="pm-btn-primary" 
                  onClick={editingTask ? saveEdit : addTask}
                  disabled={!newTaskText.trim()}
                >
                  {editingTask ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
