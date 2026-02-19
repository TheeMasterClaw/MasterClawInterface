'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
// import './MeetingCompanion.css';

const MEETING_TEMPLATES = [
  {
    id: 'standup',
    name: 'Daily Standup',
    duration: 15,
    agenda: [
      { title: 'What did you do yesterday?', duration: 5 },
      { title: 'What will you do today?', duration: 5 },
      { title: 'Any blockers?', duration: 5 }
    ]
  },
  {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    duration: 60,
    agenda: [
      { title: 'Review sprint goals', duration: 10 },
      { title: 'Story estimation', duration: 30 },
      { title: 'Capacity planning', duration: 15 },
      { title: 'Commitment', duration: 5 }
    ]
  },
  {
    id: '1on1',
    name: '1-on-1 Meeting',
    duration: 30,
    agenda: [
      { title: 'Check-in', duration: 5 },
      { title: 'Updates & blockers', duration: 10 },
      { title: 'Career growth', duration: 10 },
      { title: 'Action items', duration: 5 }
    ]
  },
  {
    id: 'review',
    name: 'Review / Retro',
    duration: 45,
    agenda: [
      { title: 'What went well?', duration: 10 },
      { title: 'What could improve?', duration: 10 },
      { title: 'Action items', duration: 15 },
      { title: 'Appreciations', duration: 10 }
    ]
  },
  {
    id: 'blank',
    name: 'Blank Meeting',
    duration: 30,
    agenda: []
  }
];

const AGENDA_ICONS = ['📋', '🎯', '💡', '⚠️', '✅', '📊', '🤝', '📚', '🔧', '🎨'];

export default function MeetingCompanion({ isOpen, onClose }) {
  // View state
  const [view, setView] = useState('list'); // list, prepare, live, summary
  const [meetings, setMeetings] = useState([]);
  
  // Current meeting state
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [agendaItems, setAgendaItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [actionItems, setActionItems] = useState([]);
  
  // Live meeting state
  const [isRunning, setIsRunning] = useState(false);
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [liveNotes, setLiveNotes] = useState('');
  const intervalRef = useRef(null);

  // Load meetings from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-meetings');
      if (saved) {
        try {
          setMeetings(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse meetings:', e);
        }
      }
    }
  }, [isOpen]);

  // Save meetings
  const saveMeetings = useCallback((updated) => {
    setMeetings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-meetings', JSON.stringify(updated));
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
        setTotalTimeElapsed(prev => prev + 1);
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      // Time's up for current agenda item
      playNotificationSound();
      if (currentAgendaIndex < agendaItems.length - 1) {
        // Move to next agenda item
        const nextIndex = currentAgendaIndex + 1;
        setCurrentAgendaIndex(nextIndex);
        setTimeRemaining(agendaItems[nextIndex].duration * 60);
      } else {
        // Meeting complete
        setIsRunning(false);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, currentAgendaIndex, agendaItems]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Audio notification not available');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Create new meeting from template
  const createMeeting = (template) => {
    const newMeeting = {
      id: Date.now().toString(),
      title: template.name,
      duration: template.duration,
      agenda: template.agenda.map((item, i) => ({
        ...item,
        id: `agenda-${i}`,
        icon: AGENDA_ICONS[i % AGENDA_ICONS.length]
      })),
      createdAt: new Date().toISOString(),
      status: 'preparing'
    };
    
    setCurrentMeeting(newMeeting);
    setMeetingTitle(newMeeting.title);
    setAgendaItems(newMeeting.agenda);
    setNotes('');
    setActionItems([]);
    setView('prepare');
  };

  // Start blank meeting
  const createBlankMeeting = () => {
    createMeeting(MEETING_TEMPLATES.find(t => t.id === 'blank'));
  };

  // Add agenda item
  const addAgendaItem = () => {
    const newItem = {
      id: `agenda-${Date.now()}`,
      title: 'New Item',
      duration: 5,
      icon: AGENDA_ICONS[agendaItems.length % AGENDA_ICONS.length]
    };
    setAgendaItems([...agendaItems, newItem]);
  };

  // Update agenda item
  const updateAgendaItem = (id, field, value) => {
    setAgendaItems(items => items.map(item => 
      item.id === id ? { ...item, [field]: field === 'duration' ? parseInt(value) || 1 : value } : item
    ));
  };

  // Remove agenda item
  const removeAgendaItem = (id) => {
    setAgendaItems(items => items.filter(item => item.id !== id));
  };

  // Move agenda item
  const moveAgendaItem = (index, direction) => {
    if (direction === 'up' && index > 0) {
      const newItems = [...agendaItems];
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
      setAgendaItems(newItems);
    } else if (direction === 'down' && index < agendaItems.length - 1) {
      const newItems = [...agendaItems];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      setAgendaItems(newItems);
    }
  };

  // Start meeting
  const startMeeting = () => {
    if (agendaItems.length === 0) {
      alert('Please add at least one agenda item');
      return;
    }
    
    const updatedMeeting = {
      ...currentMeeting,
      title: meetingTitle,
      agenda: agendaItems,
      status: 'in-progress',
      startedAt: new Date().toISOString()
    };
    
    setCurrentMeeting(updatedMeeting);
    setCurrentAgendaIndex(0);
    setTimeRemaining(agendaItems[0].duration * 60);
    setTotalTimeElapsed(0);
    setLiveNotes('');
    setView('live');
  };

  // Toggle timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Skip to next agenda item
  const skipToNext = () => {
    if (currentAgendaIndex < agendaItems.length - 1) {
      const nextIndex = currentAgendaIndex + 1;
      setCurrentAgendaIndex(nextIndex);
      setTimeRemaining(agendaItems[nextIndex].duration * 60);
    }
  };

  // Go to previous agenda item
  const goToPrevious = () => {
    if (currentAgendaIndex > 0) {
      const prevIndex = currentAgendaIndex - 1;
      setCurrentAgendaIndex(prevIndex);
      setTimeRemaining(agendaItems[prevIndex].duration * 60);
    }
  };

  // Add action item during meeting
  const addActionItem = () => {
    const newAction = {
      id: Date.now().toString(),
      text: '',
      assignee: '',
      completed: false
    };
    setActionItems([...actionItems, newAction]);
  };

  // Update action item
  const updateActionItem = (id, field, value) => {
    setActionItems(items => items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Remove action item
  const removeActionItem = (id) => {
    setActionItems(items => items.filter(item => item.id !== id));
  };

  // Toggle action item completion
  const toggleActionItem = (id) => {
    setActionItems(items => items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  // End meeting
  const endMeeting = () => {
    setIsRunning(false);
    
    const completedMeeting = {
      ...currentMeeting,
      title: meetingTitle,
      agenda: agendaItems,
      notes: liveNotes,
      actionItems: actionItems,
      status: 'completed',
      endedAt: new Date().toISOString(),
      totalDuration: Math.floor(totalTimeElapsed / 60)
    };
    
    // Save to history
    const updatedMeetings = [completedMeeting, ...meetings];
    saveMeetings(updatedMeetings);
    
    setCurrentMeeting(completedMeeting);
    setView('summary');
  };

  // Delete meeting from history
  const deleteMeeting = (id, e) => {
    e.stopPropagation();
    if (confirm('Delete this meeting record?')) {
      const updated = meetings.filter(m => m.id !== id);
      saveMeetings(updated);
    }
  };

  // View meeting summary
  const viewMeetingSummary = (meeting) => {
    setCurrentMeeting(meeting);
    setMeetingTitle(meeting.title);
    setAgendaItems(meeting.agenda || []);
    setNotes(meeting.notes || '');
    setActionItems(meeting.actionItems || []);
    setView('summary');
  };

  // Get total planned duration
  const getTotalDuration = () => {
    return agendaItems.reduce((sum, item) => sum + (item.duration || 0), 0);
  };

  // Get progress percentage
  const getProgress = () => {
    if (agendaItems.length === 0) return 0;
    return ((currentAgendaIndex) / agendaItems.length) * 100;
  };

  if (!isOpen) return null;

  return (
    <div className="meeting-panel-overlay" onClick={onClose}>
      <div className="meeting-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="meeting-panel-header">
          <h3>🤝 Meeting Companion</h3>
          <div className="header-actions">
            {view === 'list' && (
              <button className="new-meeting-btn" onClick={createBlankMeeting}>
                + New Meeting
              </button>
            )}
            {view !== 'list' && (
              <button className="back-btn" onClick={() => setView('list')}>
                ← Back
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Meeting List View */}
        {view === 'list' && (
          <div className="meeting-list-view">
            {/* Templates Section */}
            <div className="templates-section">
              <h4>Quick Start Templates</h4>
              <div className="template-grid">
                {MEETING_TEMPLATES.filter(t => t.id !== 'blank').map(template => (
                  <button 
                    key={template.id} 
                    className="template-card"
                    onClick={() => createMeeting(template)}
                  >
                    <span className="template-name">{template.name}</span>
                    <span className="template-duration">{template.duration} min</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Meeting History */}
            <div className="meeting-history">
              <h4>Recent Meetings</h4>
              {meetings.length === 0 ? (
                <div className="empty-meetings">
                  <span className="empty-emoji">📅</span>
                  <p>No meetings yet</p>
                  <span>Select a template above to get started</span>
                </div>
              ) : (
                <div className="meeting-list">
                  {meetings.slice(0, 20).map(meeting => (
                    <div 
                      key={meeting.id} 
                      className="meeting-item"
                      onClick={() => viewMeetingSummary(meeting)}
                    >
                      <div className="meeting-info">
                        <span className="meeting-title">{meeting.title}</span>
                        <span className="meeting-meta">
                          {new Date(meeting.endedAt || meeting.createdAt).toLocaleDateString()} • 
                          {meeting.totalDuration || meeting.duration} min • 
                          {meeting.actionItems?.filter(a => !a.completed).length || 0} open actions
                        </span>
                      </div>
                      <div className="meeting-actions">
                        <span className={`meeting-status ${meeting.status}`}>
                          {meeting.status === 'completed' ? '✅' : '📝'}
                        </span>
                        <button 
                          className="delete-meeting-btn"
                          onClick={(e) => deleteMeeting(meeting.id, e)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prepare View */}
        {view === 'prepare' && (
          <div className="prepare-view">
            <div className="meeting-form">
              <div className="form-group">
                <label>Meeting Title</label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="Enter meeting title..."
                />
              </div>

              <div className="agenda-builder">
                <div className="agenda-header">
                  <label>Agenda</label>
                  <span className="total-duration">Total: {getTotalDuration()} min</span>
                </div>
                
                <div className="agenda-items">
                  {agendaItems.map((item, index) => (
                    <div key={item.id} className="agenda-item-row">
                      <span className="agenda-icon">{item.icon}</span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateAgendaItem(item.id, 'title', e.target.value)}
                        placeholder="Agenda item..."
                        className="agenda-title-input"
                      />
                      <input
                        type="number"
                        value={item.duration}
                        onChange={(e) => updateAgendaItem(item.id, 'duration', e.target.value)}
                        min="1"
                        max="180"
                        className="agenda-duration-input"
                      />
                      <span className="duration-label">min</span>
                      <div className="agenda-controls">
                        <button 
                          onClick={() => moveAgendaItem(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button 
                          onClick={() => moveAgendaItem(index, 'down')}
                          disabled={index === agendaItems.length - 1}
                        >
                          ↓
                        </button>
                        <button 
                          className="remove-btn"
                          onClick={() => removeAgendaItem(item.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="add-agenda-btn" onClick={addAgendaItem}>
                  + Add Agenda Item
                </button>
              </div>

              <button 
                className="start-meeting-btn"
                onClick={startMeeting}
                disabled={agendaItems.length === 0}
              >
                ▶️ Start Meeting
              </button>
            </div>
          </div>
        )}

        {/* Live Meeting View */}
        {view === 'live' && (
          <div className="live-view">
            {/* Progress Bar */}
            <div className="meeting-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
              <span className="progress-text">
                Item {currentAgendaIndex + 1} of {agendaItems.length}
              </span>
            </div>

            {/* Current Agenda Item */}
            <div className="current-agenda">
              <span className="current-icon">
                {agendaItems[currentAgendaIndex]?.icon}
              </span>
              <h4>{agendaItems[currentAgendaIndex]?.title}</h4>
            </div>

            {/* Timer Display */}
            <div className="meeting-timer">
              <div className={`timer-display ${timeRemaining < 60 ? 'warning' : ''}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="timer-controls">
                <button 
                  className={`timer-btn ${isRunning ? 'pause' : 'start'}`}
                  onClick={toggleTimer}
                >
                  {isRunning ? '⏸️ Pause' : '▶️ Resume'}
                </button>
                <button className="timer-btn" onClick={goToPrevious} disabled={currentAgendaIndex === 0}>
                  ← Prev
                </button>
                <button className="timer-btn" onClick={skipToNext} disabled={currentAgendaIndex >= agendaItems.length - 1}>
                  Next →
                </button>
              </div>
            </div>

            {/* Up Next */}
            {currentAgendaIndex < agendaItems.length - 1 && (
              <div className="up-next">
                <span>Up next: {agendaItems[currentAgendaIndex + 1].title}</span>
              </div>
            )}

            {/* Live Notes */}
            <div className="live-notes">
              <label>Meeting Notes</label>
              <textarea
                value={liveNotes}
                onChange={(e) => setLiveNotes(e.target.value)}
                placeholder="Take notes during the meeting..."
                rows={4}
              />
            </div>

            {/* Action Items */}
            <div className="live-action-items">
              <div className="action-header">
                <label>Action Items</label>
                <button className="add-action-btn" onClick={addActionItem}>
                  + Add
                </button>
              </div>
              <div className="action-list">
                {actionItems.map(item => (
                  <div key={item.id} className={`action-item ${item.completed ? 'completed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleActionItem(item.id)}
                    />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateActionItem(item.id, 'text', e.target.value)}
                      placeholder="Action item..."
                      className="action-text"
                    />
                    <input
                      type="text"
                      value={item.assignee}
                      onChange={(e) => updateActionItem(item.id, 'assignee', e.target.value)}
                      placeholder="@assignee"
                      className="action-assignee"
                    />
                    <button 
                      className="remove-action-btn"
                      onClick={() => removeActionItem(item.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* End Meeting */}
            <button className="end-meeting-btn" onClick={endMeeting}>
              🏁 End Meeting
            </button>
          </div>
        )}

        {/* Summary View */}
        {view === 'summary' && (
          <div className="summary-view">
            <div className="summary-header">
              <h4>{meetingTitle}</h4>
              <span className="summary-date">
                {currentMeeting?.endedAt 
                  ? new Date(currentMeeting.endedAt).toLocaleString()
                  : new Date().toLocaleString()
                }
              </span>
            </div>

            <div className="summary-stats">
              <div className="stat-box">
                <span className="stat-value">{agendaItems.length}</span>
                <span className="stat-label">Agenda Items</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">
                  {currentMeeting?.totalDuration || Math.floor(totalTimeElapsed / 60)}
                </span>
                <span className="stat-label">Minutes</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">
                  {actionItems.filter(a => !a.completed).length}
                </span>
                <span className="stat-label">Open Actions</span>
              </div>
            </div>

            {notes && (
              <div className="summary-section">
                <h5>📝 Notes</h5>
                <div className="summary-notes">{notes}</div>
              </div>
            )}

            {actionItems.length > 0 && (
              <div className="summary-section">
                <h5>✅ Action Items</h5>
                <div className="summary-actions">
                  {actionItems.map(item => (
                    <div key={item.id} className={`summary-action ${item.completed ? 'done' : ''}`}>
                      <span>{item.completed ? '✅' : '⬜'}</span>
                      <span className="action-text">{item.text}</span>
                      {item.assignee && <span className="action-assignee">@{item.assignee}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="summary-section">
              <h5>📋 Agenda Covered</h5>
              <div className="summary-agenda">
                {agendaItems.map((item, i) => (
                  <div key={item.id} className="summary-agenda-item">
                    <span>{item.icon}</span>
                    <span>{item.title}</span>
                    <span className="agenda-duration">{item.duration} min</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="back-to-list-btn" onClick={() => setView('list')}>
              ← Back to Meetings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
