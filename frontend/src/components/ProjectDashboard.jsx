'use client';

import React, { useState, useEffect } from 'react';
// import './ProjectDashboard.css';

const CATEGORIES = {
  work: { label: 'Work', color: '#6366f1', icon: '💼' },
  personal: { label: 'Personal', color: '#10b981', icon: '🏠' },
  learning: { label: 'Learning', color: '#f59e0b', icon: '📚' },
  health: { label: 'Health', color: '#ef4444', icon: '❤️' },
  creative: { label: 'Creative', color: '#8b5cf6', icon: '🎨' },
  other: { label: 'Other', color: '#64748b', icon: '📌' }
};

const STATUSES = {
  active: { label: 'Active', color: '#10b981' },
  paused: { label: 'Paused', color: '#f59e0b' },
  completed: { label: 'Completed', color: '#6366f1' },
  archived: { label: 'Archived', color: '#64748b' }
};

export default function ProjectDashboard({ isOpen, onClose }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [viewMode, setViewMode] = useState('grid'); // grid, list, timeline
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'work',
    status: 'active',
    deadline: '',
    targetHours: 0
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      // Load projects from localStorage
      const savedProjects = localStorage.getItem('mc-projects');
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      }

      // Load tasks to calculate project progress
      const tasksRes = await fetch('/tasks');
      const tasksData = await tasksRes.json();
      setTasks(tasksData);

      // Load time entries
      const savedTimeEntries = localStorage.getItem('mc-time-entries');
      if (savedTimeEntries) {
        setTimeEntries(JSON.parse(savedTimeEntries));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const saveProjects = (newProjects) => {
    localStorage.setItem('mc-projects', JSON.stringify(newProjects));
    setProjects(newProjects);
  };

  const handleAddProject = () => {
    if (!formData.name.trim()) return;

    const newProject = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    const updatedProjects = [...projects, newProject];
    saveProjects(updatedProjects);
    setShowAddModal(false);
    resetForm();
  };

  const handleUpdateProject = () => {
    if (!editingProject || !formData.name.trim()) return;

    const updatedProjects = projects.map(p => 
      p.id === editingProject.id 
        ? { ...p, ...formData, completedAt: formData.status === 'completed' && p.status !== 'completed' ? new Date().toISOString() : p.completedAt }
        : p
    );
    
    saveProjects(updatedProjects);
    setEditingProject(null);
    setShowAddModal(false);
    resetForm();
  };

  const handleDeleteProject = (id) => {
    if (confirm('Delete this project?')) {
      const updatedProjects = projects.filter(p => p.id !== id);
      saveProjects(updatedProjects);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'work',
      status: 'active',
      deadline: '',
      targetHours: 0
    });
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      category: project.category,
      status: project.status,
      deadline: project.deadline ? project.deadline.split('T')[0] : '',
      targetHours: project.targetHours || 0
    });
    setShowAddModal(true);
  };

  const getProjectTasks = (projectId) => {
    return tasks.filter(t => t.projectId === projectId);
  };

  const getProjectProgress = (projectId) => {
    const projectTasks = getProjectTasks(projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(t => t.status === 'done').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const getProjectTime = (projectId) => {
    return timeEntries
      .filter(e => e.projectId === projectId)
      .reduce((acc, e) => acc + (e.duration || 0), 0);
  };

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getFilteredAndSortedProjects = () => {
    let filtered = projects;
    
    if (filter !== 'all') {
      filtered = projects.filter(p => p.status === filter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        case 'progress':
          return getProjectProgress(b.id) - getProjectProgress(a.id);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
  };

  const getStats = () => {
    const active = projects.filter(p => p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const totalHours = timeEntries.reduce((acc, e) => acc + (e.duration || 0), 0) / 60;
    const avgProgress = projects.length > 0 
      ? Math.round(projects.reduce((acc, p) => acc + getProjectProgress(p.id), 0) / projects.length)
      : 0;

    return { active, completed, totalHours: Math.round(totalHours), avgProgress };
  };

  const getCategoryBreakdown = () => {
    const breakdown = {};
    projects.forEach(p => {
      breakdown[p.category] = (breakdown[p.category] || 0) + 1;
    });
    return Object.entries(breakdown).map(([cat, count]) => ({
      category: cat,
      count,
      color: CATEGORIES[cat]?.color || '#64748b'
    }));
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  if (!isOpen) return null;

  const filteredProjects = getFilteredAndSortedProjects();
  const stats = getStats();
  const categoryBreakdown = getCategoryBreakdown();

  return (
    <div className="project-dashboard-overlay" onClick={onClose}>
      <div className="project-dashboard" onClick={e => e.stopPropagation()}>
        <div className="project-dashboard-header">
          <div className="header-title">
            <h3>📊 Project Dashboard</h3>
            <span className="project-count">{projects.length} projects</span>
          </div>
          <div className="header-actions">
            <div className="view-toggle">
              <button 
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                ⊞
              </button>
              <button 
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                ☰
              </button>
            </div>
            <button className="add-project-btn" onClick={() => { setEditingProject(null); resetForm(); setShowAddModal(true); }}>
              + New Project
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <span className="stat-icon">🚀</span>
            <div className="stat-info">
              <span className="stat-value">{stats.active}</span>
              <span className="stat-label">Active</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-info">
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏱️</span>
            <div className="stat-info">
              <span className="stat-value">{stats.totalHours}h</span>
              <span className="stat-label">Total Time</span>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📈</span>
            <div className="stat-info">
              <span className="stat-value">{stats.avgProgress}%</span>
              <span className="stat-label">Avg Progress</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="category-breakdown">
            {categoryBreakdown.map(({ category, count, color }) => (
              <div key={category} className="category-pill" style={{ background: color + '20', borderColor: color }}>
                <span>{CATEGORIES[category]?.icon || '📌'}</span>
                <span>{CATEGORIES[category]?.label || category}</span>
                <span className="count">{count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filters & Sort */}
        <div className="project-filters">
          <div className="filter-group">
            <label>Filter:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="deadline">Deadline</option>
              <option value="progress">Progress</option>
              <option value="name">Name</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {/* Projects Grid/List */}
        <div className={`projects-container ${viewMode}`}>
          {filteredProjects.length === 0 ? (
            <div className="empty-projects">
              <span className="empty-icon">📁</span>
              <p>No projects yet</p>
              <button onClick={() => setShowAddModal(true)}>Create your first project</button>
            </div>
          ) : (
            filteredProjects.map(project => {
              const progress = getProjectProgress(project.id);
              const timeSpent = getProjectTime(project.id);
              const daysLeft = getDaysUntilDeadline(project.deadline);
              const projectTasks = getProjectTasks(project.id);
              const category = CATEGORIES[project.category] || CATEGORIES.other;
              const status = STATUSES[project.status] || STATUSES.active;

              return (
                <div key={project.id} className={`project-card ${project.status}`}>
                  <div className="project-card-header">
                    <div className="project-meta">
                      <span className="project-category" style={{ background: category.color + '20', color: category.color }}>
                        {category.icon} {category.label}
                      </span>
                      <span className="project-status" style={{ background: status.color + '20', color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <div className="project-actions">
                      <button onClick={() => openEditModal(project)} title="Edit">✏️</button>
                      <button onClick={() => handleDeleteProject(project.id)} title="Delete">🗑️</button>
                    </div>
                  </div>

                  <h4 className="project-name">{project.name}</h4>
                  {project.description && (
                    <p className="project-description">{project.description}</p>
                  )}

                  <div className="project-stats">
                    <div className="project-stat">
                      <span className="stat-label">Tasks</span>
                      <span className="stat-value">{projectTasks.filter(t => t.status === 'done').length}/{projectTasks.length}</span>
                    </div>
                    <div className="project-stat">
                      <span className="stat-label">Time</span>
                      <span className="stat-value">{formatDuration(timeSpent)}</span>
                    </div>
                    {daysLeft !== null && (
                      <div className={`project-stat ${daysLeft < 3 ? 'urgent' : ''}`}>
                        <span className="stat-label">Due</span>
                        <span className="stat-value">
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="project-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%`, background: category.color }}
                      />
                    </div>
                    <span className="progress-text">{progress}%</span>
                  </div>

                  {project.deadline && (
                    <div className="project-deadline">
                      📅 {new Date(project.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="project-modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="project-modal" onClick={e => e.stopPropagation()}>
              <h4>{editingProject ? 'Edit Project' : 'New Project'}</h4>
              
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter project name..."
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description..."
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
                    {Object.entries(CATEGORIES).map(([key, { label, icon }]) => (
                      <option key={key} value={key}>{icon} {label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {Object.entries(STATUSES).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Target Hours</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.targetHours}
                    onChange={(e) => setFormData({ ...formData, targetHours: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={editingProject ? handleUpdateProject : handleAddProject}
                  disabled={!formData.name.trim()}
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
