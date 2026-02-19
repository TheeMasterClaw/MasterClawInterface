import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../config.js';
import './TimeTracker.css';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' }
];

export default function TimeTracker({ isOpen, onClose }) {
  const [entries, setEntries] = useState([]);
  const [runningEntry, setRunningEntry] = useState(null);
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [stats, setStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [recentProjects, setRecentProjects] = useState([]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    description: '',
    project: '',
    startTime: '',
    endTime: ''
  });
  const intervalRef = useRef(null);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadRunningEntry();
      loadEntries();
      loadStats();
    }
  }, [isOpen]);

  // Update elapsed time for running entry
  useEffect(() => {
    if (runningEntry) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const start = new Date(runningEntry.startTime);
        setElapsed(Math.floor((now - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [runningEntry]);

  const loadRunningEntry = async () => {
    try {
      const response = await fetch(API.time.running);
      const data = await response.json();
      
      if (data.running) {
        setRunningEntry(data.entry);
        setDescription(data.entry.description || '');
        setProject(data.entry.project || '');
      } else {
        setRunningEntry(null);
        setDescription('');
        setProject('');
      }
    } catch (err) {
      console.error('Failed to load running entry:', err);
    }
  };

  const loadEntries = async () => {
    try {
      const response = await fetch(`${API.time.list}?limit=20`);
      const data = await response.json();
      setEntries(data.entries || []);
      
      // Extract recent projects
      const projects = [...new Set((data.entries || [])
        .map(e => e.project)
        .filter(p => p))]
        .slice(0, 5);
      setRecentProjects(projects);
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API.time.stats}?period=${selectedPeriod}`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [selectedPeriod, isOpen]);

  const startTimer = async () => {
    try {
      const response = await fetch(API.time.start, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim() || null,
          project: project.trim() || null
        })
      });
      
      const data = await response.json();
      setRunningEntry(data.entry);
      
      // Reload entries to show the stopped one
      if (data.previousEntry) {
        loadEntries();
      }
    } catch (err) {
      console.error('Failed to start timer:', err);
    }
  };

  const stopTimer = async () => {
    try {
      const response = await fetch(API.time.stop, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setRunningEntry(null);
      setElapsed(0);
      loadEntries();
      loadStats();
    } catch (err) {
      console.error('Failed to stop timer:', err);
    }
  };

  const deleteEntry = async (id) => {
    if (!confirm('Delete this time entry?')) return;
    
    try {
      await fetch(API.time.delete(id), { method: 'DELETE' });
      loadEntries();
      loadStats();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const addManualEntry = async () => {
    try {
      const response = await fetch(API.time.start, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: manualEntry.description.trim() || null,
          project: manualEntry.project.trim() || null
        })
      });
      
      const data = await response.json();
      
      // Immediately stop it with the specified times
      if (manualEntry.startTime && manualEntry.endTime) {
        await fetch(API.time.update(data.entry.id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: new Date(manualEntry.startTime).toISOString(),
            endTime: new Date(manualEntry.endTime).toISOString()
          })
        });
      }
      
      setShowManualEntry(false);
      setManualEntry({ description: '', project: '', startTime: '', endTime: '' });
      loadEntries();
      loadStats();
    } catch (err) {
      console.error('Failed to add manual entry:', err);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="time-panel-overlay" onClick={onClose}>
      <div className="time-panel" onClick={e => e.stopPropagation()}>
        <div className="time-panel-header">
          <h3>⏱️ Time Tracker</h3>
          <div className="header-actions">
            <button 
              className="settings-btn"
              onClick={() => setShowManualEntry(!showManualEntry)}
              title="Add manual entry"
            >
              ➕
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showManualEntry ? (
          <div className="manual-entry-form">
            <h4>Add Manual Entry</h4>
            <input
              type="text"
              placeholder="What did you work on?"
              value={manualEntry.description}
              onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
            />
            <input
              type="text"
              placeholder="Project (optional)"
              value={manualEntry.project}
              onChange={(e) => setManualEntry({ ...manualEntry, project: e.target.value })}
            />
            <div className="time-inputs">
              <label>
                Start:
                <input
                  type="datetime-local"
                  value={manualEntry.startTime}
                  onChange={(e) => setManualEntry({ ...manualEntry, startTime: e.target.value })}
                />
              </label>
              <label>
                End:
                <input
                  type="datetime-local"
                  value={manualEntry.endTime}
                  onChange={(e) => setManualEntry({ ...manualEntry, endTime: e.target.value })}
                />
              </label>
            </div>
            <div className="form-actions">
              <button onClick={addManualEntry} className="primary">Add Entry</button>
              <button onClick={() => setShowManualEntry(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="timer-section">
              {runningEntry ? (
                <div className="timer-running">
                  <div className="timer-display">
                    <span className="timer-time">{formatDuration(elapsed)}</span>
                    <span className="timer-status running">🔴 Recording</span>
                  </div>
                  
                  {runningEntry.description && (
                    <div className="timer-info">{runningEntry.description}</div>
                  )}
                  {runningEntry.project && (
                    <div className="timer-project">📁 {runningEntry.project}</div>
                  )}
                  
                  <button className="timer-btn stop" onClick={stopTimer}>
                    ⏹️ Stop Timer
                  </button>
                </div>
              ) : (
                <div className="timer-stopped">
                  <div className="timer-inputs">
                    <input
                      type="text"
                      placeholder="What are you working on?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && startTimer()}
                    />
                    <input
                      type="text"
                      placeholder="Project (optional)"
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      list="recent-projects"
                      onKeyPress={(e) => e.key === 'Enter' && startTimer()}
                    />
                    <datalist id="recent-projects">
                      {recentProjects.map((p, i) => (
                        <option key={i} value={p} />
                      ))}
                    </datalist>
                  </div>
                  
                  <button className="timer-btn start" onClick={startTimer}>
                    ▶️ Start Timer
                  </button>
                </div>
              )}
            </div>

            {stats && (
              <div className="stats-section">
                <div className="stats-header">
                  <h4>📊 Statistics</h4>
                  <div className="period-selector">
                    {PERIODS.map(p => (
                      <button
                        key={p.key}
                        className={selectedPeriod === p.key ? 'active' : ''}
                        onClick={() => setSelectedPeriod(p.key)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-value">{formatDuration(stats.totalDuration)}</span>
                    <span className="stat-label">Total Time</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats.entryCount}</span>
                    <span className="stat-label">Sessions</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{formatDuration(stats.averageSessionLength)}</span>
                    <span className="stat-label">Avg Session</span>
                  </div>
                </div>
                
                {Object.keys(stats.byProject).length > 0 && (
                  <div className="project-breakdown">
                    <h5>By Project</h5>
                    {Object.entries(stats.byProject)
                      .sort((a, b) => b[1] - a[1])
                      .map(([proj, duration]) => (
                        <div key={proj} className="project-stat">
                          <span className="project-name">{proj || 'Uncategorized'}</span>
                          <span className="project-time">{formatDuration(duration)}</span>
                          <div 
                            className="project-bar" 
                            style={{ 
                              width: `${(duration / stats.totalDuration) * 100}%` 
                            }} 
                          />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            <div className="entries-section">
              <h4>📝 Recent Entries</h4>
              
              {entries.length === 0 ? (
                <div className="empty-state">No time entries yet. Start tracking! 🚀</div>
              ) : (
                <div className="entries-list">
                  {entries.map(entry => (
                    <div key={entry.id} className={`entry-item ${!entry.endTime ? 'running' : ''}`}>
                      <div className="entry-main">
                        <div className="entry-info">
                          {entry.description ? (
                            <span className="entry-desc">{entry.description}</span>
                          ) : (
                            <span className="entry-desc untitled">Untitled session</span>
                          )}
                          {entry.project && (
                            <span className="entry-project">{entry.project}</span>
                          )}
                        </div>
                        <div className="entry-time">
                          <span className="entry-duration">
                            {!entry.endTime 
                              ? formatDuration(elapsed) 
                              : formatDuration(entry.duration)}
                          </span>
                          <span className="entry-period">
                            {formatDate(entry.startTime)} {formatTime(entry.startTime)}
                            {entry.endTime && ` - ${formatTime(entry.endTime)}`}
                          </span>
                        </div>
                      </div>
                      
                      {entry.endTime && (
                        <button 
                          className="entry-delete"
                          onClick={() => deleteEntry(entry.id)}
                          title="Delete entry"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
