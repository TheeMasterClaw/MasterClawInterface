'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import './DailyBriefing.css';
import { getApiUrl } from '../lib/apiUrl.js';

const API_URL = getApiUrl();

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function DailyBriefing({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [briefing, setBriefing] = useState({
    tasks: [],
    habits: [],
    events: [],
    stats: {
      taskCompletion: 0,
      habitCompletion: 0,
      currentStreak: 0,
      focusHours: 0
    }
  });
  const [quote, setQuote] = useState(null);
  const [expandedSection, setExpandedSection] = useState('tasks');
  const [weather, setWeather] = useState(null);

  // Generate greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('🌙 Good night');
    else if (hour < 12) setGreeting('🌅 Good morning');
    else if (hour < 17) setGreeting('☀️ Good afternoon');
    else if (hour < 21) setGreeting('🌆 Good evening');
    else setGreeting('🌙 Good night');
  }, []);

  // Fetch all briefing data
  const fetchBriefing = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      // Fetch tasks
      const tasksRes = await fetch(`${API_URL}/tasks?status=open`);
      const tasksData = tasksRes.ok ? await tasksRes.json() : { tasks: [] };
      
      // Fetch calendar events
      const eventsRes = await fetch(`${API_URL}/calendar/upcoming`);
      const eventsData = eventsRes.ok ? await eventsRes.json() : [];
      
      // Filter for today's events
      const today = new Date().toDateString();
      const todayEvents = (Array.isArray(eventsData) ? eventsData : []).filter(e => {
        const eventDate = new Date(e.startTime).toDateString();
        return eventDate === today;
      });

      // Get habits from localStorage (sync with HabitTracker)
      const savedHabits = localStorage.getItem('mc-habits');
      const habits = savedHabits ? JSON.parse(savedHabits) : [];
      const todayKey = new Date().toISOString().split('T')[0];
      const habitsWithStatus = habits.map(h => ({
        ...h,
        completed: h.completedDates?.includes(todayKey) || false
      }));

      // Get focus stats from localStorage
      const focusData = localStorage.getItem('mc-focus-sessions');
      const sessions = focusData ? JSON.parse(focusData) : [];
      const todaySessions = sessions.filter(s => {
        const sessionDate = new Date(s.timestamp).toDateString();
        return sessionDate === today;
      });
      const focusHours = Math.round(todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60 * 10) / 10;

      // Calculate completion stats
      const completedTasks = (tasksData.tasks || []).filter(t => t.status === 'done').length;
      const totalTasks = (tasksData.tasks || []).length;
      const completedHabits = habitsWithStatus.filter(h => h.completed).length;
      const totalHabits = habitsWithStatus.length;

      // Calculate streak
      const streak = parseInt(localStorage.getItem('mc-daily-streak') || '0');

      // Get daily quote
      const quotesRes = await fetch(`${API_URL}/time/quote`);
      const quoteData = quotesRes.ok ? await quotesRes.json() : null;
      
      // Get weather (if available)
      const weatherRes = await fetch(`${API_URL}/time/weather`);
      const weatherData = weatherRes.ok ? await weatherRes.json() : null;

      setBriefing({
        tasks: tasksData.tasks || [],
        habits: habitsWithStatus,
        events: todayEvents,
        stats: {
          taskCompletion: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          habitCompletion: totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0,
          currentStreak: streak,
          focusHours
        }
      });

      setQuote(quoteData);
      setWeather(weatherData);
    } catch (err) {
      console.error('Failed to fetch briefing:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  const toggleHabit = (habitId) => {
    const todayKey = new Date().toISOString().split('T')[0];
    const savedHabits = localStorage.getItem('mc-habits');
    const habits = savedHabits ? JSON.parse(savedHabits) : [];
    
    const updatedHabits = habits.map(h => {
      if (h.id === habitId) {
        const completedDates = h.completedDates || [];
        const isCompleted = completedDates.includes(todayKey);
        
        if (isCompleted) {
          return { ...h, completedDates: completedDates.filter(d => d !== todayKey) };
        } else {
          return { ...h, completedDates: [...completedDates, todayKey] };
        }
      }
      return h;
    });
    
    localStorage.setItem('mc-habits', JSON.stringify(updatedHabits));
    fetchBriefing();
  };

  const completeTask = async (taskId) => {
    try {
      await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' })
      });
      fetchBriefing();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (!isOpen) return null;

  const today = new Date();
  const dateString = `${WEEKDAYS[today.getDay()]}, ${MONTHS[today.getMonth()]} ${today.getDate()}`;

  return (
    <div className="daily-briefing-overlay" onClick={onClose}>
      <div className="daily-briefing-panel" onClick={e => e.stopPropagation()}>
        <div className="daily-briefing-header">
          <div className="daily-briefing-title">
            <span className="briefing-icon">📅</span>
            <div>
              <h2>{greeting}</h2>
              <p className="date-subtitle">{dateString}</p>
            </div>
          </div>
          <button className="daily-briefing-close" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="daily-briefing-loading">
            <div className="loading-spinner" />
            <p>Preparing your daily briefing...</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="briefing-stats">
              <div className="briefing-stat">
                <span className="stat-value">{briefing.stats.taskCompletion}%</span>
                <span className="stat-label">Tasks Done</span>
              </div>
              <div className="briefing-stat">
                <span className="stat-value">{briefing.stats.habitCompletion}%</span>
                <span className="stat-label">Habits Done</span>
              </div>
              <div className="briefing-stat">
                <span className="stat-value">{briefing.stats.focusHours}h</span>
                <span className="stat-label">Focus Time</span>
              </div>
              <div className="briefing-stat">
                <span className="stat-value">🔥 {briefing.stats.currentStreak}</span>
                <span className="stat-label">Day Streak</span>
              </div>
            </div>

            {/* Weather & Quote */}
            {(weather || quote) && (
              <div className="briefing-context">
                {weather && (
                  <div className="weather-widget">
                    <span className="weather-icon">
                      {weather.temperature > 25 ? '☀️' : weather.temperature > 15 ? '⛅' : weather.condition?.toLowerCase().includes('rain') ? '🌧️' : '☁️'}
                    </span>
                    <div className="weather-info">
                      <span className="weather-temp">{Math.round(weather.temperature)}°C</span>
                      <span className="weather-desc">{weather.condition || 'Partly Cloudy'}</span>
                    </div>
                  </div>
                )}
                {quote && (
                  <div className="daily-quote-mini">
                    <span className="quote-mark">"</span>
                    <p className="quote-text">{quote.text}</p>
                    <span className="quote-author">— {quote.author}</span>
                  </div>
                )}
              </div>
            )}

            {/* Section Tabs */}
            <div className="briefing-tabs">
              <button 
                className={expandedSection === 'tasks' ? 'active' : ''}
                onClick={() => setExpandedSection('tasks')}
              >
                📋 Tasks ({briefing.tasks.filter(t => t.status !== 'done').length})
              </button>
              <button 
                className={expandedSection === 'habits' ? 'active' : ''}
                onClick={() => setExpandedSection('habits')}
              >
                ✅ Habits ({briefing.habits.filter(h => !h.completed).length})
              </button>
              <button 
                className={expandedSection === 'events' ? 'active' : ''}
                onClick={() => setExpandedSection('events')}
              >
                📅 Events ({briefing.events.length})
              </button>
            </div>

            {/* Tasks Section */}
            {expandedSection === 'tasks' && (
              <div className="briefing-section">
                {briefing.tasks.length === 0 ? (
                  <div className="section-empty">
                    <span className="empty-icon">🎉</span>
                    <p>No tasks on your list!</p>
                    <small>Enjoy your free time or add new goals.</small>
                  </div>
                ) : (
                  <div className="tasks-list">
                    {briefing.tasks.map(task => (
                      <div key={task.id} className={`briefing-task ${task.status}`}>
                        <button 
                          className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                          onClick={() => task.status !== 'done' && completeTask(task.id)}
                        >
                          {task.status === 'done' && '✓'}
                        </button>
                        <div className="task-content">
                          <span className={`task-title ${task.status === 'done' ? 'completed' : ''}`}>
                            {task.title}
                          </span>
                          {task.priority && (
                            <span className={`task-priority ${task.priority}`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Habits Section */}
            {expandedSection === 'habits' && (
              <div className="briefing-section">
                {briefing.habits.length === 0 ? (
                  <div className="section-empty">
                    <span className="empty-icon">🌱</span>
                    <p>No habits tracked yet</p>
                    <small>Start building habits in the Habit Tracker.</small>
                  </div>
                ) : (
                  <div className="habits-list">
                    {briefing.habits.map(habit => (
                      <div key={habit.id} className={`briefing-habit ${habit.completed ? 'completed' : ''}`}>
                        <button 
                          className={`habit-checkbox ${habit.completed ? 'checked' : ''}`}
                          onClick={() => toggleHabit(habit.id)}
                        >
                          {habit.completed && '✓'}
                        </button>
                        <div className="habit-content">
                          <span className="habit-icon">{habit.icon || '📌'}</span>
                          <span className="habit-name">{habit.name}</span>
                          {habit.streak > 0 && (
                            <span className="habit-streak">🔥 {habit.streak}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Events Section */}
            {expandedSection === 'events' && (
              <div className="briefing-section">
                {briefing.events.length === 0 ? (
                  <div className="section-empty">
                    <span className="empty-icon">📭</span>
                    <p>No events scheduled today</p>
                    <small>Your calendar is clear. Time for deep work!</small>
                  </div>
                ) : (
                  <div className="events-list">
                    {briefing.events.map(event => (
                      <div key={event.id} className="briefing-event">
                        <div className="event-time-marker">
                          <span className="event-time">{formatTime(event.startTime)}</span>
                          <div className="time-line" />
                        </div>
                        <div className="event-content">
                          <span className="event-title">{event.title}</span>
                          {event.duration && (
                            <span className="event-duration">{formatDuration(event.duration)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Footer */}
            <div className="briefing-footer">
              <p className="footer-message">
                {briefing.stats.taskCompletion === 100 && briefing.stats.habitCompletion === 100 
                  ? '🎉 Amazing! All tasks and habits completed!' 
                  : briefing.stats.taskCompletion >= 50 
                  ? '💪 Keep going! You\'re making great progress.'
                  : '🚀 Start your day strong. You\'ve got this!'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
