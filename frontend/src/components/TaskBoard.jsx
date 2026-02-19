import React, { useState, useEffect, useCallback } from 'react';
// import './TaskBoard.css';

const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#ef4444' },
  { id: 'inprogress', title: 'In Progress', color: '#f59e0b' },
  { id: 'done', title: 'Done', color: '#22c55e' }
];

const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#22c55e' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#ef4444' },
  { id: 'urgent', label: 'Urgent', color: '#dc2626' }
];

const TAGS = [
  { id: 'work', label: 'Work', color: '#3b82f6' },
  { id: 'personal', label: 'Personal', color: '#8b5cf6' },
  { id: 'health', label: 'Health', color: '#22c55e' },
  { id: 'learning', label: 'Learning', color: '#f59e0b' },
  { id: 'finance', label: 'Finance', color: '#10b981' },
  { id: 'creative', label: 'Creative', color: '#ec4899' }
];

export default function TaskBoard({ isOpen, onClose }) {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [tasks, setTasks] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  
  // Form states
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    columnId: 'todo',
    priority: 'medium',
    tags: [],
    dueDate: ''
  });
  const [newColumnTitle, setNewColumnTitle] = useState('');

  // Load from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-taskboard');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setTasks(data.tasks || []);
          if (data.columns) setColumns(data.columns);
        } catch (e) {
          console.error('Failed to parse taskboard data:', e);
        }
      }
    }
  }, [isOpen]);

  // Save to localStorage
  const saveData = useCallback((newTasks, newColumns) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-taskboard', JSON.stringify({
        tasks: newTasks || tasks,
        columns: newColumns || columns
      }));
    }
  }, [tasks, columns]);

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    
    const task = {
      id: Date.now().toString(),
      ...newTask,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    saveData(updatedTasks);
    setNewTask({
      title: '',
      description: '',
      columnId: 'todo',
      priority: 'medium',
      tags: [],
      dueDate: ''
    });
    setShowAddTask(false);
  };

  const handleUpdateTask = () => {
    if (!editingTask || !editingTask.title.trim()) return;
    
    const updatedTasks = tasks.map(t => 
      t.id === editingTask.id ? editingTask : t
    );
    setTasks(updatedTasks);
    saveData(updatedTasks);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    saveData(updatedTasks);
    setEditingTask(null);
  };

  const handleMoveTask = (taskId, newColumnId) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          columnId: newColumnId,
          completedAt: newColumnId === 'done' ? new Date().toISOString() : null
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    saveData(updatedTasks);
  };

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;
    
    const column = {
      id: `col-${Date.now()}`,
      title: newColumnTitle,
      color: '#6366f1'
    };
    
    const updatedColumns = [...columns, column];
    setColumns(updatedColumns);
    saveData(tasks, updatedColumns);
    setNewColumnTitle('');
    setShowAddColumn(false);
  };

  const handleUpdateColumn = () => {
    if (!editingColumn || !editingColumn.title.trim()) return;
    
    const updatedColumns = columns.map(c => 
      c.id === editingColumn.id ? editingColumn : c
    );
    setColumns(updatedColumns);
    saveData(tasks, updatedColumns);
    setEditingColumn(null);
  };

  const handleDeleteColumn = (columnId) => {
    // Move tasks to first column
    const firstColumnId = columns.find(c => c.id !== columnId)?.id || 'todo';
    const updatedTasks = tasks.map(t => 
      t.columnId === columnId ? { ...t, columnId: firstColumnId } : t
    );
    const updatedColumns = columns.filter(c => c.id !== columnId);
    setTasks(updatedTasks);
    setColumns(updatedColumns);
    saveData(updatedTasks, updatedColumns);
    setEditingColumn(null);
  };

  // Drag and drop handlers
  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (draggedTask && draggedTask.columnId !== columnId) {
      handleMoveTask(draggedTask.id, columnId);
    }
    setDraggedTask(null);
  };

  const toggleTag = (tagId, isEditing = false) => {
    if (isEditing) {
      setEditingTask(prev => ({
        ...prev,
        tags: prev.tags.includes(tagId)
          ? prev.tags.filter(t => t !== tagId)
          : [...prev.tags, tagId]
      }));
    } else {
      setNewTask(prev => ({
        ...prev,
        tags: prev.tags.includes(tagId)
          ? prev.tags.filter(t => t !== tagId)
          : [...prev.tags, tagId]
      }));
    }
  };

  const getPriorityColor = (priorityId) => {
    return PRIORITIES.find(p => p.id === priorityId)?.color || '#94a3b8';
  };

  const getTagColor = (tagId) => {
    return TAGS.find(t => t.id === tagId)?.color || '#64748b';
  };

  const getTagLabel = (tagId) => {
    return TAGS.find(t => t.id === tagId)?.label || tagId;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
  };

  const getFilteredTasks = (columnId) => {
    return tasks.filter(task => {
      if (task.columnId !== columnId) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterTag && !task.tags.includes(filterTag)) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      return true;
    });
  };

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.columnId === 'done').length;
    const inProgress = tasks.filter(t => t.columnId === 'inprogress').length;
    const overdue = tasks.filter(t => isOverdue(t.dueDate) && t.columnId !== 'done').length;
    return { total, completed, inProgress, overdue };
  };

  if (!isOpen) return null;

  const stats = getStats();

  return (
    <div className="taskboard-overlay" onClick={onClose}>
      <div className="taskboard-panel" onClick={e => e.stopPropagation()}>
        <div className="taskboard-header">
          <div className="taskboard-header-left">
            <h3>📋 Task Board</h3>
            <div className="taskboard-stats">
              <span className="stat-pill total">{stats.total} Total</span>
              <span className="stat-pill completed">{stats.completed} Done</span>
              <span className="stat-pill inprogress">{stats.inProgress} In Progress</span>
              {stats.overdue > 0 && (
                <span className="stat-pill overdue">{stats.overdue} Overdue</span>
              )}
            </div>
          </div>
          <div className="taskboard-header-right">
            <div className="taskboard-filters">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-search"
              />
              <select 
                value={filterTag} 
                onChange={(e) => setFilterTag(e.target.value)}
                className="filter-select"
              >
                <option value="">All Tags</option>
                {TAGS.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.label}</option>
                ))}
              </select>
              <select 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                className="filter-select"
              >
                <option value="">All Priorities</option>
                {PRIORITIES.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <button 
              className="add-column-btn"
              onClick={() => setShowAddColumn(true)}
              title="Add Column"
            >
              ➕ Column
            </button>
            <button 
              className="add-task-btn"
              onClick={() => setShowAddTask(true)}
            >
              ➕ New Task
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="taskboard-content">
          {columns.map(column => (
            <div 
              key={column.id}
              className="taskboard-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="column-header" style={{ borderTopColor: column.color }}>
                <div className="column-title-wrapper">
                  <span className="column-dot" style={{ background: column.color }}></span>
                  <h4>{column.title}</h4>
                  <span className="task-count">{getFilteredTasks(column.id).length}</span>
                </div>
                <button 
                  className="column-menu-btn"
                  onClick={() => setEditingColumn(column)}
                >
                  ⋮
                </button>
              </div>
              
              <div className="column-tasks">
                {getFilteredTasks(column.id).map(task => (
                  <div
                    key={task.id}
                    className={`task-card ${isOverdue(task.dueDate) && task.columnId !== 'done' ? 'overdue' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onClick={() => setEditingTask(task)}
                  >
                    <div className="task-card-header">
                      <span 
                        className="task-priority"
                        style={{ background: getPriorityColor(task.priority) }}
                        title={`Priority: ${task.priority}`}
                      />
                      {task.dueDate && (
                        <span className={`task-due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                          {isOverdue(task.dueDate) ? '⚠️ ' : '📅 '}
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                    
                    <h5 className="task-title">{task.title}</h5>
                    
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    
                    {task.tags.length > 0 && (
                      <div className="task-tags">
                        {task.tags.map(tagId => (
                          <span 
                            key={tagId}
                            className="task-tag"
                            style={{ background: `${getTagColor(tagId)}30`, color: getTagColor(tagId) }}
                          >
                            {getTagLabel(tagId)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {getFilteredTasks(column.id).length === 0 && (
                  <div className="empty-column">
                    <span>Drop tasks here</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="task-modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>
            <h4>➕ Add New Task</h4>
            
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="What needs to be done?"
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Add details..."
                rows={3}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Column</label>
                <select
                  value={newTask.columnId}
                  onChange={(e) => setNewTask({...newTask, columnId: e.target.value})}
                >
                  {columns.map(col => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                >
                  {PRIORITIES.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Tags</label>
              <div className="tag-selector">
                {TAGS.map(tag => (
                  <button
                    key={tag.id}
                    className={`tag-option ${newTask.tags.includes(tag.id) ? 'selected' : ''}`}
                    onClick={() => toggleTag(tag.id)}
                    style={{ 
                      background: newTask.tags.includes(tag.id) ? tag.color : 'transparent',
                      borderColor: tag.color,
                      color: newTask.tags.includes(tag.id) ? 'white' : tag.color
                    }}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddTask(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleAddTask}
                disabled={!newTask.title.trim()}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="task-modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>
            <h4>✏️ Edit Task</h4>
            
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Column</label>
                <select
                  value={editingTask.columnId}
                  onChange={(e) => setEditingTask({...editingTask, columnId: e.target.value})}
                >
                  {columns.map(col => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                >
                  {PRIORITIES.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={editingTask.dueDate || ''}
                onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Tags</label>
              <div className="tag-selector">
                {TAGS.map(tag => (
                  <button
                    key={tag.id}
                    className={`tag-option ${editingTask.tags?.includes(tag.id) ? 'selected' : ''}`}
                    onClick={() => toggleTag(tag.id, true)}
                    style={{ 
                      background: editingTask.tags?.includes(tag.id) ? tag.color : 'transparent',
                      borderColor: tag.color,
                      color: editingTask.tags?.includes(tag.id) ? 'white' : tag.color
                    }}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-danger"
                onClick={() => handleDeleteTask(editingTask.id)}
              >
                🗑️ Delete
              </button>
              <button className="btn-secondary" onClick={() => setEditingTask(null)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleUpdateTask}
                disabled={!editingTask.title.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Column Modal */}
      {showAddColumn && (
        <div className="task-modal-overlay" onClick={() => setShowAddColumn(false)}>
          <div className="task-modal small" onClick={e => e.stopPropagation()}>
            <h4>➕ Add Column</h4>
            
            <div className="form-group">
              <label>Column Name</label>
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="e.g., Review"
                autoFocus
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddColumn(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleAddColumn}
                disabled={!newColumnTitle.trim()}
              >
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Column Modal */}
      {editingColumn && (
        <div className="task-modal-overlay" onClick={() => setEditingColumn(null)}>
          <div className="task-modal small" onClick={e => e.stopPropagation()}>
            <h4>⚙️ Edit Column</h4>
            
            <div className="form-group">
              <label>Column Name</label>
              <input
                type="text"
                value={editingColumn.title}
                onChange={(e) => setEditingColumn({...editingColumn, title: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'].map(color => (
                  <button
                    key={color}
                    className={`color-option ${editingColumn.color === color ? 'selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setEditingColumn({...editingColumn, color})}
                  />
                ))}
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-danger"
                onClick={() => handleDeleteColumn(editingColumn.id)}
              >
                🗑️ Delete
              </button>
              <button className="btn-secondary" onClick={() => setEditingColumn(null)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleUpdateColumn}
                disabled={!editingColumn.title.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
