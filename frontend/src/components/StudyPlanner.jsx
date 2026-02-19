'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import './StudyPlanner.css';

const STUDY_CATEGORIES = [
  { id: 'programming', label: 'Programming', icon: '💻', color: '#6366f1' },
  { id: 'language', label: 'Languages', icon: '🗣️', color: '#ec4899' },
  { id: 'design', label: 'Design', icon: '🎨', color: '#f59e0b' },
  { id: 'business', label: 'Business', icon: '💼', color: '#22c55e' },
  { id: 'science', label: 'Science', icon: '🔬', color: '#06b6d4' },
  { id: 'arts', label: 'Arts', icon: '🎭', color: '#a855f7' },
  { id: 'music', label: 'Music', icon: '🎵', color: '#ef4444' },
  { id: 'other', label: 'Other', icon: '📚', color: '#64748b' }
];

const PRIORITY_LEVELS = [
  { id: 'high', label: 'High', color: '#ef4444' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'low', label: 'Low', color: '#22c55e' }
];

const DIFFICULTY_LEVELS = [
  { id: 'beginner', label: 'Beginner', color: '#22c55e' },
  { id: 'intermediate', label: 'Intermediate', color: '#f59e0b' },
  { id: 'advanced', label: 'Advanced', color: '#ef4444' },
  { id: 'expert', label: 'Expert', color: '#a855f7' }
];

export default function StudyPlanner({ isOpen, onClose }) {
  const [courses, setCourses] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [activeTab, setActiveTab] = useState('courses');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showLogSession, setShowLogSession] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    category: 'programming',
    priority: 'medium',
    difficulty: 'beginner',
    totalModules: 10,
    completedModules: 0,
    estimatedHours: 20,
    description: '',
    resources: '',
    deadline: ''
  });

  const [sessionForm, setSessionForm] = useState({
    courseId: '',
    duration: 60,
    modulesCompleted: 0,
    notes: '',
    mood: 'productive',
    date: new Date().toISOString().split('T')[0]
  });

  // Load data from localStorage
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const savedCourses = localStorage.getItem('mc-study-courses');
    const savedSessions = localStorage.getItem('mc-study-sessions');

    if (savedCourses) {
      try {
        setCourses(JSON.parse(savedCourses));
      } catch (e) {
        console.error('Failed to parse courses:', e);
      }
    }

    if (savedSessions) {
      try {
        setStudySessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error('Failed to parse sessions:', e);
      }
    }
  }, [isOpen]);

  // Save data to localStorage
  const saveData = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mc-study-courses', JSON.stringify(courses));
    localStorage.setItem('mc-study-sessions', JSON.stringify(studySessions));
  }, [courses, studySessions]);

  useEffect(() => {
    saveData();
  }, [saveData]);

  // Course management
  const addCourse = () => {
    if (!courseForm.title.trim()) return;

    const newCourse = {
      id: Date.now(),
      ...courseForm,
      createdAt: new Date().toISOString(),
      status: 'active',
      completedAt: null
    };

    setCourses(prev => [...prev, newCourse]);
    resetCourseForm();
    setShowAddCourse(false);
  };

  const updateCourse = () => {
    if (!editingCourse || !courseForm.title.trim()) return;

    setCourses(prev => prev.map(c => 
      c.id === editingCourse.id ? { ...c, ...courseForm } : c
    ));
    resetCourseForm();
    setEditingCourse(null);
    setShowAddCourse(false);
  };

  const deleteCourse = (courseId) => {
    if (confirm('Are you sure you want to delete this course?')) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setStudySessions(prev => prev.filter(s => s.courseId !== courseId));
    }
  };

  const completeCourse = (courseId) => {
    setCourses(prev => prev.map(c => 
      c.id === courseId 
        ? { ...c, status: 'completed', completedAt: new Date().toISOString() }
        : c
    ));
  };

  const archiveCourse = (courseId) => {
    setCourses(prev => prev.map(c => 
      c.id === courseId 
        ? { ...c, status: c.status === 'archived' ? 'active' : 'archived' }
        : c
    ));
  };

  const startEditingCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      category: course.category,
      priority: course.priority,
      difficulty: course.difficulty,
      totalModules: course.totalModules,
      completedModules: course.completedModules,
      estimatedHours: course.estimatedHours,
      description: course.description || '',
      resources: course.resources || '',
      deadline: course.deadline || ''
    });
    setShowAddCourse(true);
  };

  const resetCourseForm = () => {
    setCourseForm({
      title: '',
      category: 'programming',
      priority: 'medium',
      difficulty: 'beginner',
      totalModules: 10,
      completedModules: 0,
      estimatedHours: 20,
      description: '',
      resources: '',
      deadline: ''
    });
  };

  // Session management
  const logSession = () => {
    if (!sessionForm.courseId || sessionForm.duration <= 0) return;

    const newSession = {
      id: Date.now(),
      ...sessionForm,
      loggedAt: new Date().toISOString()
    };

    setStudySessions(prev => [...prev, newSession]);

    // Update course progress
    setCourses(prev => prev.map(c => {
      if (c.id === parseInt(sessionForm.courseId)) {
        const newCompleted = c.completedModules + parseInt(sessionForm.modulesCompleted || 0);
        return {
          ...c,
          completedModules: Math.min(newCompleted, c.totalModules),
          status: newCompleted >= c.totalModules ? 'completed' : c.status,
          completedAt: newCompleted >= c.totalModules ? new Date().toISOString() : c.completedAt
        };
      }
      return c;
    }));

    resetSessionForm();
    setShowLogSession(false);
  };

  const deleteSession = (sessionId) => {
    const session = studySessions.find(s => s.id === sessionId);
    if (session && confirm('Delete this study session?')) {
      // Revert course progress
      setCourses(prev => prev.map(c => {
        if (c.id === parseInt(session.courseId)) {
          return {
            ...c,
            completedModules: Math.max(0, c.completedModules - (session.modulesCompleted || 0)),
            status: c.status === 'completed' ? 'active' : c.status,
            completedAt: null
          };
        }
        return c;
      }));

      setStudySessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  const resetSessionForm = () => {
    setSessionForm({
      courseId: '',
      duration: 60,
      modulesCompleted: 0,
      notes: '',
      mood: 'productive',
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Stats and helpers
  const getCourseProgress = (course) => {
    return Math.round((course.completedModules / course.totalModules) * 100);
  };

  const getCourseSessions = (courseId) => {
    return studySessions.filter(s => s.courseId === courseId.toString());
  };

  const getTotalStudyTime = (courseId) => {
    const sessions = getCourseSessions(courseId);
    return sessions.reduce((sum, s) => sum + parseInt(s.duration || 0), 0);
  };

  const getTodayStudyTime = () => {
    const today = new Date().toDateString();
    return studySessions
      .filter(s => new Date(s.date).toDateString() === today)
      .reduce((sum, s) => sum + parseInt(s.duration || 0), 0);
  };

  const getWeekStudyTime = () => {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    return studySessions
      .filter(s => new Date(s.date) >= weekAgo)
      .reduce((sum, s) => sum + parseInt(s.duration || 0), 0);
  };

  const getTotalStudyTimeAll = () => {
    return studySessions.reduce((sum, s) => sum + parseInt(s.duration || 0), 0);
  };

  const getFilteredCourses = () => {
    return courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const getRecentSessions = () => {
    return [...studySessions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);
  };

  const getCategoryStats = () => {
    const stats = {};
    STUDY_CATEGORIES.forEach(cat => {
      stats[cat.id] = {
        ...cat,
        courses: 0,
        completedCourses: 0,
        totalTime: 0
      };
    });

    courses.forEach(c => {
      if (stats[c.category]) {
        stats[c.category].courses++;
        if (c.status === 'completed') {
          stats[c.category].completedCourses++;
        }
      }
    });

    studySessions.forEach(s => {
      const course = courses.find(c => c.id === parseInt(s.courseId));
      if (course && stats[course.category]) {
        stats[course.category].totalTime += parseInt(s.duration || 0);
      }
    });

    return Object.values(stats).filter(s => s.courses > 0);
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getMoodEmoji = (mood) => {
    const moods = {
      productive: '🚀',
      focused: '🎯',
      tired: '😴',
      frustrated: '😤',
      excited: '⚡',
      neutral: '😐'
    };
    return moods[mood] || '😐';
  };

  if (!isOpen) return null;

  const filteredCourses = getFilteredCourses();
  const categoryStats = getCategoryStats();

  return (
    <div className="study-panel-overlay" onClick={onClose}>
      <div className="study-panel" onClick={e => e.stopPropagation()}>
        <div className="study-panel-header">
          <h3>📚 Study Planner</h3>
          <div className="header-actions">
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="study-tabs">
          <button 
            className={`study-tab ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            📖 Courses
          </button>
          <button 
            className={`study-tab ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            ⏱️ Sessions
          </button>
          <button 
            className={`study-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Stats
          </button>
        </div>

        {/* Stats Overview */}
        <div className="study-stats-overview">
          <div className="stat-card">
            <span className="stat-icon">📚</span>
            <span className="stat-value">{courses.filter(c => c.status === 'active').length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <span className="stat-value">{courses.filter(c => c.status === 'completed').length}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏰</span>
            <span className="stat-value">{formatTime(getTodayStudyTime())}</span>
            <span className="stat-label">Today</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📈</span>
            <span className="stat-value">{formatTime(getWeekStudyTime())}</span>
            <span className="stat-label">This Week</span>
          </div>
        </div>

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="study-content">
            <div className="study-toolbar">
              <input
                type="text"
                className="search-input"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select 
                className="filter-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {STUDY_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <button 
                className="add-btn"
                onClick={() => {
                  setEditingCourse(null);
                  resetCourseForm();
                  setShowAddCourse(true);
                }}
              >
                + Add Course
              </button>
            </div>

            {showAddCourse && (
              <div className="course-form-overlay">
                <div className="course-form">
                  <h4>{editingCourse ? 'Edit Course' : 'Add New Course'}</h4>
                  
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                      placeholder="e.g., Advanced React Patterns"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                      >
                        {STUDY_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Priority</label>
                      <select
                        value={courseForm.priority}
                        onChange={(e) => setCourseForm({...courseForm, priority: e.target.value})}
                      >
                        {PRIORITY_LEVELS.map(p => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Difficulty</label>
                      <select
                        value={courseForm.difficulty}
                        onChange={(e) => setCourseForm({...courseForm, difficulty: e.target.value})}
                      >
                        {DIFFICULTY_LEVELS.map(d => (
                          <option key={d.id} value={d.id}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Total Modules/Lessons</label>
                      <input
                        type="number"
                        min="1"
                        value={courseForm.totalModules}
                        onChange={(e) => setCourseForm({...courseForm, totalModules: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Completed</label>
                      <input
                        type="number"
                        min="0"
                        max={courseForm.totalModules}
                        value={courseForm.completedModules}
                        onChange={(e) => setCourseForm({...courseForm, completedModules: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Est. Hours</label>
                      <input
                        type="number"
                        min="1"
                        value={courseForm.estimatedHours}
                        onChange={(e) => setCourseForm({...courseForm, estimatedHours: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Deadline (optional)</label>
                    <input
                      type="date"
                      value={courseForm.deadline}
                      onChange={(e) => setCourseForm({...courseForm, deadline: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                      placeholder="What will you learn?"
                      rows="2"
                    />
                  </div>

                  <div className="form-group">
                    <label>Resources (URLs, books, etc.)</label>
                    <textarea
                      value={courseForm.resources}
                      onChange={(e) => setCourseForm({...courseForm, resources: e.target.value})}
                      placeholder="Links to course materials..."
                      rows="2"
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      className="cancel-btn"
                      onClick={() => {
                        setShowAddCourse(false);
                        setEditingCourse(null);
                        resetCourseForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="save-btn"
                      onClick={editingCourse ? updateCourse : addCourse}
                      disabled={!courseForm.title.trim()}
                    >
                      {editingCourse ? 'Update' : 'Add'} Course
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="courses-list">
              {filteredCourses.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📚</span>
                  <p>No courses found</p>
                  <small>Add your first course to start tracking your learning journey</small>
                </div>
              ) : (
                filteredCourses.map(course => {
                  const progress = getCourseProgress(course);
                  const category = STUDY_CATEGORIES.find(c => c.id === course.category);
                  const priority = PRIORITY_LEVELS.find(p => p.id === course.priority);
                  const difficulty = DIFFICULTY_LEVELS.find(d => d.id === course.difficulty);
                  const totalTime = getTotalStudyTime(course.id);
                  const sessions = getCourseSessions(course.id);

                  return (
                    <div 
                      key={course.id} 
                      className={`course-card ${course.status} ${selectedCourse === course.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                    >
                      <div className="course-header">
                        <div className="course-icon" style={{ background: category?.color }}>
                          {category?.icon}
                        </div>
                        <div className="course-info">
                          <h4 className="course-title">{course.title}</h4>
                          <div className="course-meta">
                            <span className="meta-badge" style={{ color: priority?.color }}>
                              {priority?.label} Priority
                            </span>
                            <span className="meta-badge" style={{ color: difficulty?.color }}>
                              {difficulty?.label}
                            </span>
                            {course.deadline && (
                              <span className="meta-badge deadline">
                                📅 {formatDate(course.deadline)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="course-status">
                          {course.status === 'completed' && <span className="status-badge completed">✅</span>}
                          {course.status === 'archived' && <span className="status-badge archived">📦</span>}
                        </div>
                      </div>

                      <div className="course-progress">
                        <div className="progress-bar-bg">
                          <div 
                            className="progress-bar-fill"
                            style={{ 
                              width: `${progress}%`,
                              background: category?.color
                            }}
                          />
                        </div>
                        <div className="progress-stats">
                          <span>{progress}%</span>
                          <span>{course.completedModules}/{course.totalModules} modules</span>
                        </div>
                      </div>

                      <div className="course-stats-row">
                        <span>⏱️ {formatTime(totalTime)} studied</span>
                        <span>📝 {sessions.length} sessions</span>
                        <span>📊 {Math.round(totalTime / course.estimatedHours * 100)}% of est.</span>
                      </div>

                      {selectedCourse === course.id && (
                        <div className="course-actions">
                          <button 
                            className="action-btn log-session"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionForm({...sessionForm, courseId: course.id.toString()});
                              setShowLogSession(true);
                            }}
                          >
                            ➕ Log Session
                          </button>
                          <button 
                            className="action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingCourse(course);
                            }}
                          >
                            ✏️ Edit
                          </button>
                          {course.status !== 'completed' && (
                            <button 
                              className="action-btn complete"
                              onClick={(e) => {
                                e.stopPropagation();
                                completeCourse(course.id);
                              }}
                            >
                              ✅ Complete
                            </button>
                          )}
                          <button 
                            className="action-btn archive"
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveCourse(course.id);
                            }}
                          >
                            {course.status === 'archived' ? '📂 Unarchive' : '📦 Archive'}
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCourse(course.id);
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}

                      {course.description && selectedCourse === course.id && (
                        <div className="course-description">
                          <p>{course.description}</p>
                        </div>
                      )}

                      {course.resources && selectedCourse === course.id && (
                        <div className="course-resources">
                          <strong>Resources:</strong>
                          <p>{course.resources}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="study-content">
            <div className="study-toolbar">
              <button 
                className="add-btn"
                onClick={() => setShowLogSession(true)}
              >
                ➕ Log Study Session
              </button>
            </div>

            {showLogSession && (
              <div className="session-form-overlay">
                <div className="session-form">
                  <h4>Log Study Session</h4>
                  
                  <div className="form-group">
                    <label>Course *</label>
                    <select
                      value={sessionForm.courseId}
                      onChange={(e) => setSessionForm({...sessionForm, courseId: e.target.value})}
                    >
                      <option value="">Select a course...</option>
                      {courses.filter(c => c.status === 'active').map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={sessionForm.date}
                        onChange={(e) => setSessionForm({...sessionForm, date: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Duration (minutes) *</label>
                      <input
                        type="number"
                        min="1"
                        value={sessionForm.duration}
                        onChange={(e) => setSessionForm({...sessionForm, duration: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Modules Completed</label>
                      <input
                        type="number"
                        min="0"
                        value={sessionForm.modulesCompleted}
                        onChange={(e) => setSessionForm({...sessionForm, modulesCompleted: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Mood</label>
                    <div className="mood-selector">
                      {['productive', 'focused', 'tired', 'frustrated', 'excited', 'neutral'].map(mood => (
                        <button
                          key={mood}
                          className={`mood-btn ${sessionForm.mood === mood ? 'active' : ''}`}
                          onClick={() => setSessionForm({...sessionForm, mood})}
                        >
                          {getMoodEmoji(mood)} {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      value={sessionForm.notes}
                      onChange={(e) => setSessionForm({...sessionForm, notes: e.target.value})}
                      placeholder="What did you learn? Any insights?"
                      rows="3"
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      className="cancel-btn"
                      onClick={() => {
                        setShowLogSession(false);
                        resetSessionForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="save-btn"
                      onClick={logSession}
                      disabled={!sessionForm.courseId || sessionForm.duration <= 0}
                    >
                      Log Session
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="sessions-list">
              {getRecentSessions().length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">⏱️</span>
                  <p>No study sessions yet</p>
                  <small>Log your first session to track your learning progress</small>
                </div>
              ) : (
                getRecentSessions().map(session => {
                  const course = courses.find(c => c.id === parseInt(session.courseId));
                  return (
                    <div key={session.id} className="session-card">
                      <div className="session-header">
                        <span className="session-course">{course?.title || 'Unknown Course'}</span>
                        <span className="session-date">{formatDate(session.date)}</span>
                      </div>
                      <div className="session-details">
                        <span className="session-duration">⏱️ {formatTime(session.duration)}</span>
                        {session.modulesCompleted > 0 && (
                          <span className="session-modules">📚 +{session.modulesCompleted} modules</span>
                        )}
                        <span className="session-mood">{getMoodEmoji(session.mood)}</span>
                      </div>
                      {session.notes && (
                        <div className="session-notes">{session.notes}</div>
                      )}
                      <button 
                        className="delete-session-btn"
                        onClick={() => deleteSession(session.id)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="study-content">
            <div className="stats-grid-large">
              <div className="stat-card-large">
                <h4>📚 Total Study Time</h4>
                <span className="stat-large-value">{formatTime(getTotalStudyTimeAll())}</span>
                <span className="stat-large-label">All time</span>
              </div>
              <div className="stat-card-large">
                <h4>🎯 Completion Rate</h4>
                <span className="stat-large-value">
                  {courses.length > 0 
                    ? Math.round((courses.filter(c => c.status === 'completed').length / courses.length) * 100) 
                    : 0}%
                </span>
                <span className="stat-large-label">
                  {courses.filter(c => c.status === 'completed').length} of {courses.length} courses
                </span>
              </div>
              <div className="stat-card-large">
                <h4>📝 Total Sessions</h4>
                <span className="stat-large-value">{studySessions.length}</span>
                <span className="stat-large-label">
                  Avg {studySessions.length > 0 
                    ? Math.round(getTotalStudyTimeAll() / studySessions.length) 
                    : 0} min/session
                </span>
              </div>
            </div>

            <div className="category-stats">
              <h4>📊 Learning by Category</h4>
              {categoryStats.length === 0 ? (
                <p className="empty-text">No data yet. Start adding courses!</p>
              ) : (
                <div className="category-bars">
                  {categoryStats.map(cat => (
                    <div key={cat.id} className="category-bar-item">
                      <div className="category-bar-header">
                        <span className="category-name">{cat.icon} {cat.label}</span>
                        <span className="category-time">{formatTime(cat.totalTime)}</span>
                      </div>
                      <div className="category-bar-bg">
                        <div 
                          className="category-bar-fill"
                          style={{ 
                            width: `${Math.max((cat.totalTime / Math.max(...categoryStats.map(c => c.totalTime))) * 100, 5)}%`,
                            background: cat.color
                          }}
                        />
                      </div>
                      <div className="category-bar-meta">
                        {cat.courses} course{cat.courses !== 1 ? 's' : ''} • {cat.completedCourses} completed
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="study-insights">
              <h4>💡 Learning Insights</h4>
              <div className="insights-list">
                <div className="insight-card">
                  <span className="insight-icon">🔥</span>
                  <div className="insight-content">
                    <strong>Streak</strong>
                    <p>You've logged {getWeekStudyTime() > 0 ? 'study time this week' : 'no sessions this week'}</p>
                  </div>
                </div>
                <div className="insight-card">
                  <span className="insight-icon">📈</span>
                  <div className="insight-content">
                    <strong>Average Session</strong>
                    <p>
                      {studySessions.length > 0 
                        ? `${Math.round(getTotalStudyTimeAll() / studySessions.length)} minutes`
                        : 'No sessions yet'}
                    </p>
                  </div>
                </div>
                <div className="insight-card">
                  <span className="insight-icon">🎯</span>
                  <div className="insight-content">
                    <strong>Active Goals</strong>
                    <p>{courses.filter(c => c.status === 'active').length} courses in progress</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
