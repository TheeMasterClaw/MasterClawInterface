import React, { useState, useEffect } from 'react';
import './CalendarPanel.css';

export default function CalendarPanel({ isOpen, onClose }) {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', startTime: '', endTime: '' });

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen]);

  const loadEvents = async () => {
    try {
      const response = await fetch('/calendar/upcoming');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return;
    
    try {
      await fetch('/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });
      setShowAddModal(false);
      setNewEvent({ title: '', startTime: '', endTime: '' });
      loadEvents();
    } catch (err) {
      console.error('Failed to add event:', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const hasEventOnDay = (day) => {
    if (!day) return false;
    const dateStr = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toDateString();
    return events.some(e => new Date(e.startTime).toDateString() === dateStr);
  };

  if (!isOpen) return null;

  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="calendar-panel-overlay" onClick={onClose}>
      <div className="calendar-panel" onClick={e => e.stopPropagation()}>
        <div className="calendar-panel-header">
          <h3>📅 Calendar</h3>
          <button className="add-event-btn" onClick={() => setShowAddModal(true)}>
            + Event
          </button>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="calendar-month-nav">
          <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}>
            ←
          </button>
          <span>{monthName}</span>
          <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}>
            →
          </button>
        </div>

        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {getDaysInMonth().map((day, i) => (
            <div 
              key={i} 
              className={`calendar-day ${day ? 'has-day' : ''} ${hasEventOnDay(day) ? 'has-event' : ''}`}
            >
              {day || ''}
            </div>
          ))}
        </div>

        <div className="upcoming-events">
          <h4>Upcoming Events</h4>
          {events.length === 0 ? (
            <div className="empty-state">No upcoming events</div>
          ) : (
            events.slice(0, 5).map(event => (
              <div key={event.id} className="event-item">
                <div className="event-dot"></div>
                <div className="event-info">
                  <div className="event-title">{event.title}</div>
                  <div className="event-time">{formatDate(event.startTime)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h4>Add Event</h4>
              <input
                type="text"
                placeholder="Event title"
                value={newEvent.title}
                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
              />
              <input
                type="datetime-local"
                value={newEvent.startTime}
                onChange={e => setNewEvent({...newEvent, startTime: e.target.value})}
              />
              <input
                type="datetime-local"
                value={newEvent.endTime}
                onChange={e => setNewEvent({...newEvent, endTime: e.target.value})}
              />
              <div className="modal-actions">
                <button onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="primary" onClick={addEvent}>Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
