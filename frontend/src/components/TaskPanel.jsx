import React, { useState, useEffect } from 'react';
// import './TaskPanel.css';

export default function TaskPanel({ isOpen, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen]);

  const loadTasks = async () => {
    try {
      const response = await fetch('/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    
    try {
      await fetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask, priority: 'normal' })
      });
      setNewTask('');
      loadTasks();
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const completeTask = async (id) => {
    try {
      await fetch(`/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' })
      });
      loadTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`/tasks/${id}`, { method: 'DELETE' });
      loadTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'open') return t.status !== 'done';
    if (filter === 'done') return t.status === 'done';
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="task-panel-overlay" onClick={onClose}>
      <div className="task-panel" onClick={e => e.stopPropagation()}>
        <div className="task-panel-header">
          <h3>📋 Tasks</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="task-panel-filters">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'open' ? 'active' : ''} 
            onClick={() => setFilter('open')}
          >
            Open
          </button>
          <button 
            className={filter === 'done' ? 'active' : ''} 
            onClick={() => setFilter('done')}
          >
            Done
          </button>
        </div>

        <div className="task-panel-add">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <button onClick={addTask}>Add</button>
        </div>

        <div className="task-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">No tasks yet</div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className={`task-item ${task.status}`}>
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={() => completeTask(task.id)}
                />
                <span className="task-title">{task.title}</span>
                <span className={`task-priority ${task.priority}`}>
                  {task.priority}
                </span>
                <button 
                  className="delete-btn" 
                  onClick={() => deleteTask(task.id)}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
