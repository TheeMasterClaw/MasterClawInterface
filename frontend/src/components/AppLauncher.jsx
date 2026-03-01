'use client';

import React, { useState, useEffect, useMemo } from 'react';
import './AppLauncher.css';

// App categories with their icons and descriptions
const appCategories = [
  {
    id: 'productivity',
    name: '🚀 Productivity',
    description: 'Tasks, goals, and getting things done',
    apps: [
      { id: 'tasks', name: 'Tasks', icon: '☑️', description: 'To-do lists and task management' },
      { id: 'calendar', name: 'Calendar', icon: '📅', description: 'Schedule and events' },
      { id: 'goals', name: 'Goal Planner', icon: '🎯', description: 'Track long-term goals' },
      { id: 'habits', name: 'Habit Tracker', icon: '✅', description: 'Build daily habits' },
      { id: 'routines', name: 'Routine Builder', icon: '🔄', description: 'Morning/evening routines' },
      { id: 'focus', name: 'Focus Timer', icon: '⏱️', description: 'Pomodoro timer' },
      { id: 'time', name: 'Time Tracker', icon: '⏰', description: 'Track time spent' },
      { id: 'sprint', name: 'Sprint Planner', icon: '🏃', description: 'Agile sprint planning' },
      { id: 'taskBoard', name: 'Task Board', icon: '📋', description: 'Kanban board' },
      { id: 'priority', name: 'Priority Matrix', icon: '📊', description: 'Eisenhower matrix' },
      { id: 'quickCapture', name: 'Quick Capture', icon: '⚡', description: 'Quick note taking' },
      { id: 'reminders', name: 'Reminder Manager', icon: '🔔', description: 'Smart reminders' },
    ]
  },
  {
    id: 'learning',
    name: '📚 Learning & Growth',
    description: 'Skills, knowledge, and self-improvement',
    apps: [
      { id: 'skills', name: 'Skill Tracker', icon: '🎓', description: 'Track skill development' },
      { id: 'reading', name: 'Reading List', icon: '📖', description: 'Books to read' },
      { id: 'study', name: 'Study Planner', icon: '📝', description: 'Study schedules' },
      { id: 'learningPath', name: 'Learning Path', icon: '🛤️', description: 'Curated courses' },
      { id: 'knowledge', name: 'Knowledge Garden', icon: '🌱', description: 'Personal wiki' },
      { id: 'resources', name: 'Resource Library', icon: '📚', description: 'Save useful links' },
      { id: 'snippets', name: 'Snippets', icon: '✂️', description: 'Code snippets' },
      { id: 'prompts', name: 'Prompt Library', icon: '💬', description: 'AI prompts' },
      { id: 'code', name: 'Code Playground', icon: '💻', description: 'Test code' },
      { id: 'achievements', name: 'Achievement Vault', icon: '🏆', description: 'Unlock achievements' },
      { id: 'challenges', name: 'Challenge Tracker', icon: '🔥', description: '30-day challenges' },
      { id: 'weeklyReview', name: 'Weekly Review', icon: '📈', description: 'Weekly reflection' },
    ]
  },
  {
    id: 'wellness',
    name: '🧘 Health & Wellness',
    description: 'Physical and mental wellbeing',
    apps: [
      { id: 'workout', name: 'Workout Tracker', icon: '💪', description: 'Exercise log' },
      { id: 'sleep', name: 'Sleep Tracker', icon: '😴', description: 'Sleep quality' },
      { id: 'water', name: 'Water Tracker', icon: '💧', description: 'Hydration log' },
      { id: 'meals', name: 'Meal Tracker', icon: '🍽️', description: 'Food diary' },
      { id: 'mood', name: 'Mood Tracker', icon: '😊', description: 'Daily mood' },
      { id: 'energy', name: 'Energy Tracker', icon: '⚡', description: 'Energy levels' },
      { id: 'breathing', name: 'Breathing Exercise', icon: '🫁', description: 'Guided breathing' },
      { id: 'mindful', name: 'Mindful Moments', icon: '🧘', description: 'Meditation' },
      { id: 'gratitude', name: 'Gratitude Log', icon: '🙏', description: 'Daily gratitude' },
      { id: 'lifeBalance', name: 'Life Balance', icon: '⚖️', description: 'Wheel of life' },
      { id: 'detox', name: 'Digital Detox', icon: '📵', description: 'Screen time' },
      { id: 'health', name: 'Health Monitor', icon: '❤️', description: 'Health metrics' },
    ]
  },
  {
    id: 'creative',
    name: '✨ Creativity & Ideas',
    description: 'Brainstorming, writing, and creating',
    apps: [
      { id: 'brainDump', name: 'Brain Dump', icon: '🧠', description: 'Clear your mind' },
      { id: 'journal', name: 'Journal', icon: '📔', description: 'Daily journaling' },
      { id: 'ideas', name: 'Idea Incubator', icon: '💡', description: 'Save ideas' },
      { id: 'inspiration', name: 'Inspiration Wall', icon: '✨', description: 'Mood board' },
      { id: 'whiteboard', name: 'Whiteboard', icon: '🖊️', description: 'Draw and sketch' },
      { id: 'vision', name: 'Vision Board', icon: '🌟', description: 'Visualize goals' },
      { id: 'timeCapsule', name: 'Time Capsule', icon: '⏳', description: 'Messages to future' },
      { id: 'reflection', name: 'Reflection Studio', icon: '🪞', description: 'Deep reflection' },
      { id: 'reflectionRoulette', name: 'Reflection Roulette', icon: '🎲', description: 'Random prompts' },
      { id: 'notes', name: 'Notes', icon: '🗒️', description: 'Quick notes' },
      { id: 'voiceMemos', name: 'Voice Memos', icon: '🎙️', description: 'Audio notes' },
      { id: 'dailyQuote', name: 'Daily Quote', icon: '💭', description: 'Inspiration' },
    ]
  },
  {
    id: 'life',
    name: '🌍 Life Management',
    description: 'Travel, finance, and relationships',
    apps: [
      { id: 'travel', name: 'Travel Planner', icon: '✈️', description: 'Trip planning' },
      { id: 'expenses', name: 'Expense Tracker', icon: '💰', description: 'Budget tracking' },
      { id: 'subscriptions', name: 'Subscriptions', icon: '📌', description: 'Manage subscriptions' },
      { id: 'relationships', name: 'Relationships', icon: '👥', description: 'Network map' },
      { id: 'gifts', name: 'Gift Ideas', icon: '🎁', description: 'Gift tracking' },
      { id: 'contacts', name: 'Contacts', icon: '📇', description: 'Contact manager' },
      { id: 'decisions', name: 'Decision Journal', icon: '🤔', description: 'Big decisions' },
      { id: 'meetings', name: 'Meeting Companion', icon: '🤝', description: 'Meeting notes' },
      { id: 'passwords', name: 'Password Vault', icon: '🔐', description: 'Secure passwords' },
      { id: 'content', name: 'Content Tracker', icon: '🎬', description: 'Movies/shows/books' },
      { id: 'watchlist', name: 'Watchlist', icon: '📺', description: 'What to watch' },
      { id: 'ambient', name: 'Ambient Mixer', icon: '🎵', description: 'Background sounds' },
    ]
  },
  {
    id: 'projects',
    name: '🛠️ Projects & Work',
    description: 'Professional and side projects',
    apps: [
      { id: 'projects', name: 'Project Dashboard', icon: '📁', description: 'Project overview' },
      { id: 'deepWork', name: 'Deep Work', icon: '🔮', description: 'Focus sessions' },
      { id: 'dailyWins', name: 'Daily Wins', icon: '🏅', description: 'Celebrate wins' },
      { id: 'briefing', name: 'Daily Briefing', icon: '📰', description: 'Day overview' },
      { id: 'activity', name: 'Activity Log', icon: '📊', description: 'Track activities' },
      { id: 'analytics', name: 'Analytics', icon: '📈', description: 'Productivity stats' },
      { id: 'questLog', name: 'Quest Log', icon: '🗡️', description: 'Gamified tasks' },
      { id: 'conversation', name: 'Chat History', icon: '💬', description: 'Past conversations' },
      { id: 'quickLinks', name: 'Quick Links', icon: '🔗', description: 'Bookmarked links' },
      { id: 'agentConnect', name: 'Agent Connect', icon: '🤖', description: 'Connect AI agents' },
      { id: 'weather', name: 'Weather', icon: '🌤️', description: 'Local weather' },
      { id: 'system', name: 'System Monitor', icon: '🖥️', description: 'System health' },
    ]
  },
];

export default function AppLauncher({ isOpen, onClose, onLaunchApp }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentApps, setRecentApps] = useState([]);

  // Load recent apps from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('masterclaw_recent_apps');
    if (saved) {
      try {
        setRecentApps(JSON.parse(saved).slice(0, 8));
      } catch (e) {
        console.error('Failed to load recent apps:', e);
      }
    }
  }, []);

  // Save recent app
  const saveRecentApp = (appId) => {
    const newRecent = [appId, ...recentApps.filter(id => id !== appId)].slice(0, 8);
    setRecentApps(newRecent);
    localStorage.setItem('masterclaw_recent_apps', JSON.stringify(newRecent));
  };

  // Handle app launch
  const handleLaunch = (appId) => {
    saveRecentApp(appId);
    onLaunchApp(appId);
    onClose();
  };

  // Filter apps based on search and category
  const filteredApps = useMemo(() => {
    let apps = [];
    
    if (selectedCategory === 'all') {
      apps = appCategories.flatMap(cat => cat.apps.map(app => ({ ...app, category: cat.name })));
    } else if (selectedCategory === 'recent') {
      const allApps = appCategories.flatMap(cat => cat.apps);
      apps = recentApps.map(id => allApps.find(app => app.id === id)).filter(Boolean);
    } else {
      const category = appCategories.find(cat => cat.id === selectedCategory);
      apps = category ? category.apps.map(app => ({ ...app, category: category.name })) : [];
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      apps = apps.filter(app => 
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query)
      );
    }

    return apps;
  }, [searchQuery, selectedCategory, recentApps]);

  // Get favorite apps (could be stored in user preferences)
  const favoriteApps = useMemo(() => {
    const allApps = appCategories.flatMap(cat => cat.apps);
    // Default favorites - these could be customizable
    const favIds = ['tasks', 'calendar', 'habits', 'journal', 'focus'];
    return favIds.map(id => allApps.find(app => app.id === id)).filter(Boolean);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="app-launcher-overlay" onClick={onClose}>
      <div className="app-launcher" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="launcher-header">
          <div className="launcher-title">
            <span className="launcher-icon">🐾</span>
            <h2>App Launcher</h2>
          </div>
          <button className="launcher-close" onClick={onClose}>×</button>
        </div>

        {/* Search */}
        <div className="launcher-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search apps... (Cmd+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="launcher-tabs">
          <button
            className={`tab ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            🌟 All Apps
          </button>
          <button
            className={`tab ${selectedCategory === 'recent' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('recent')}
          >
            🕐 Recent
          </button>
          {appCategories.map(cat => (
            <button
              key={cat.id}
              className={`tab ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name.split(' ')[0]} {cat.name.split(' ').slice(1).join(' ')}
            </button>
          ))}
        </div>

        {/* Favorites (only show on 'all' view without search) */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="favorites-section">
            <h3>⭐ Favorites</h3>
            <div className="apps-grid compact">
              {favoriteApps.map(app => (
                <button
                  key={app.id}
                  className="app-card favorite"
                  onClick={() => handleLaunch(app.id)}
                >
                  <span className="app-icon">{app.icon}</span>
                  <span className="app-name">{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Apps Grid */}
        <div className="launcher-content">
          {selectedCategory !== 'all' && selectedCategory !== 'recent' && !searchQuery && (
            <div className="category-header">
              <h3>{appCategories.find(c => c.id === selectedCategory)?.name}</h3>
              <p>{appCategories.find(c => c.id === selectedCategory)?.description}</p>
            </div>
          )}

          {filteredApps.length === 0 ? (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <p>No apps found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="apps-grid">
              {filteredApps.map(app => (
                <button
                  key={app.id}
                  className="app-card"
                  onClick={() => handleLaunch(app.id)}
                >
                  <span className="app-icon">{app.icon}</span>
                  <div className="app-info">
                    <span className="app-name">{app.name}</span>
                    <span className="app-description">{app.description}</span>
                    {app.category && selectedCategory === 'all' && (
                      <span className="app-category">{app.category}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="launcher-footer">
          <div className="keyboard-hints">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>Enter</kbd> Open</span>
            <span><kbd>Esc</kbd> Close</span>
            <span><kbd>Cmd+K</kbd> Launcher</span>
          </div>
          <div className="app-count">
            {appCategories.reduce((sum, cat) => sum + cat.apps.length, 0)} apps available
          </div>
        </div>
      </div>
    </div>
  );
}
