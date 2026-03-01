'use client';

import React, { useState, useRef, useEffect } from 'react';
import './Navbar.css';

// Define app categories with their icons
const appCategories = [
  {
    name: 'Quick Access',
    apps: [
      { id: 'quickCapture', icon: '⚡', label: 'Quick Capture' },
      { id: 'today', icon: '📅', label: 'Today View' },
      { id: 'focus', icon: '🎯', label: 'Focus Timer' },
      { id: 'habit', icon: '✅', label: 'Habit Tracker' },
    ]
  },
  {
    name: 'Productivity',
    apps: [
      { id: 'tasks', icon: '☑️', label: 'Tasks' },
      { id: 'briefing', icon: '📅', label: 'Daily Briefing' },
      { id: 'meeting', icon: '🤝', label: 'Meeting Companion' },
      { id: 'projects', icon: '📊', label: 'Project Dashboard' },
      { id: 'goals', icon: '🏆', label: 'Goal Planner' },
      { id: 'taskboard', icon: '📋', label: 'Task Board' },
      { id: 'priority', icon: '📊', label: 'Priority Matrix' },
      { id: 'time', icon: '⏱️', label: 'Time Tracker' },
    ]
  },
  {
    name: 'Knowledge',
    apps: [
      { id: 'notes', icon: '📝', label: 'Notes' },
      { id: 'journal', icon: '📔', label: 'Journal' },
      { id: 'snippets', icon: '📦', label: 'Snippets' },
      { id: 'garden', icon: '🌱', label: 'Knowledge Garden' },
      { id: 'reading', icon: '📚', label: 'Reading List' },
      { id: 'learning', icon: '🎓', label: 'Learning Path' },
      { id: 'skills', icon: '🎯', label: 'Skill Tracker' },
      { id: 'prompts', icon: '📚', label: 'Prompt Library' },
    ]
  },
  {
    name: 'Wellness',
    apps: [
      { id: 'mood', icon: '🧠', label: 'Mood Tracker' },
      { id: 'breathing', icon: '🫁', label: 'Breathing' },
      { id: 'mindful', icon: '🧘', label: 'Mindful Moments' },
      { id: 'gratitude', icon: '🙏', label: 'Gratitude Log' },
      { id: 'wins', icon: '🏆', label: 'Daily Wins' },
      { id: 'workout', icon: '💪', label: 'Workout' },
      { id: 'sleep', icon: '🌙', label: 'Sleep Tracker' },
      { id: 'meals', icon: '🍎', label: 'Meal Tracker' },
      { id: 'energy', icon: '⚡', label: 'Energy Tracker' },
      { id: 'detox', icon: '🧘', label: 'Digital Detox' },
    ]
  },
  {
    name: 'Creative',
    apps: [
      { id: 'whiteboard', icon: '🎨', label: 'Whiteboard' },
      { id: 'vision', icon: '🖼️', label: 'Vision Board' },
      { id: 'inspiration', icon: '✨', label: 'Inspiration Wall' },
      { id: 'ideas', icon: '💡', label: 'Idea Incubator' },
      { id: 'timecapsule', icon: '⏳', label: 'Time Capsule' },
      { id: 'roulette', icon: '🎲', label: 'Reflection Roulette' },
      { id: 'code', icon: '💻', label: 'Code Playground' },
      { id: 'voice', icon: '🎙️', label: 'Voice Memos' },
    ]
  },
  {
    name: 'Life',
    apps: [
      { id: 'vault', icon: '🔐', label: 'Password Vault' },
      { id: 'balance', icon: '⚖️', label: 'Life Balance' },
      { id: 'network', icon: '🌐', label: 'Relationships' },
      { id: 'deepwork', icon: '🎯', label: 'Deep Work' },
      { id: 'travel', icon: '🧳', label: 'Travel Planner' },
      { id: 'content', icon: '🎬', label: 'Content Tracker' },
      { id: 'subscriptions', icon: '💳', label: 'Subscriptions' },
      { id: 'expenses', icon: '💰', label: 'Expense Tracker' },
      { id: 'contacts', icon: '👥', label: 'Contacts' },
    ]
  },
  {
    name: 'System',
    apps: [
      { id: 'system', icon: '🖥️', label: 'System Monitor' },
      { id: 'health', icon: '🏥', label: 'Health Monitor' },
      { id: 'productivity', icon: '📈', label: 'Analytics' },
      { id: 'activity', icon: '📊', label: 'Activity Log' },
      { id: 'quest', icon: '🗡️', label: 'Quest Log' },
      { id: 'achievements', icon: '🏆', label: 'Achievements' },
      { id: 'challenges', icon: '🎯', label: 'Challenges' },
      { id: 'braindump', icon: '🧠', label: 'Brain Dump' },
      { id: 'sprint', icon: '🏃', label: 'Sprint Planner' },
      { id: 'resources', icon: '📚', label: 'Resources' },
      { id: 'weekly', icon: '🗓️', label: 'Weekly Review' },
      { id: 'settings', icon: '⚙️', label: 'Settings' },
    ]
  },
];

export default function Navbar({ 
  phase,
  connectionStatus,
  onBack,
  onSettingsClick,
  onHealthClick,
  onLinksClick,
  onActivityClick,
  onFocusClick,
  onWeatherClick,
  onHabitClick,
  onQuoteClick,
  onTimeClick,
  onMoodClick,
  onBreathingClick,
  onProductivityClick,
  onNotesClick,
  onJournalClick,
  onQuestLogClick,
  onSnippetsClick,
  onKnowledgeGardenClick,
  onGoalPlannerClick,
  onSystemMonitorClick,
  onWhiteboardClick,
  onGratitudeLogClick,
  onReadingListClick,
  onAmbientMixerClick,
  onSkillTrackerClick,
  onWeeklyReviewClick,
  onDecisionJournalClick,
  onIdeaIncubatorClick,
  onWorkoutTrackerClick,
  onSleepTrackerClick,
  onExpenseTrackerClick,
  onEnergyTrackerClick,
  onDailyBriefingClick,
  onMeetingCompanionClick,
  onProjectDashboardClick,
  onSubscriptionTrackerClick,
  onVisionBoardClick,
  onPasswordVaultClick,
  onLifeBalanceWheelClick,
  onRelationshipNetworkClick,
  onDeepWorkTrackerClick,
  onDailyWinsClick,
  onTravelPlannerClick,
  onPromptLibraryClick,
  onContentTrackerClick,
  onMealTrackerClick,
  onStudyPlannerClick,
  onVoiceMemosClick,
  onTimeCapsuleClick,
  onPriorityMatrixClick,
  onDigitalDetoxTrackerClick,
  onTaskBoardClick,
  onReflectionRouletteClick,
  onQuickCaptureClick,
  onCodePlaygroundClick,
  onInspirationWallClick,
  onLearningPathClick,
  onReminderClick,
  onConversationHistoryClick,
  onReflectionStudioClick,
  onMindfulMomentsClick,
  onAchievementVaultClick,
  onChallengeTrackerClick,
  onBrainDumpClick,
  onSprintPlannerClick,
  onResourceLibraryClick,
  onContactManagerClick,
  onTodayViewClick,
  onAppsClick
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Map app IDs to click handlers
  const clickHandlers = {
    tasks: () => {},
    quickCapture: onQuickCaptureClick,
    briefing: onDailyBriefingClick,
    meeting: onMeetingCompanionClick,
    system: onSystemMonitorClick,
    whiteboard: onWhiteboardClick,
    goals: onGoalPlannerClick,
    projects: onProjectDashboardClick,
    vision: onVisionBoardClick,
    vault: onPasswordVaultClick,
    balance: onLifeBalanceWheelClick,
    network: onRelationshipNetworkClick,
    deepwork: onDeepWorkTrackerClick,
    snippets: onSnippetsClick,
    garden: onKnowledgeGardenClick,
    quest: onQuestLogClick,
    gratitude: onGratitudeLogClick,
    wins: onDailyWinsClick,
    priority: onPriorityMatrixClick,
    taskboard: onTaskBoardClick,
    roulette: onReflectionRouletteClick,
    detox: onDigitalDetoxTrackerClick,
    travel: onTravelPlannerClick,
    prompts: onPromptLibraryClick,
    content: onContentTrackerClick,
    reading: onReadingListClick,
    journal: onJournalClick,
    timecapsule: onTimeCapsuleClick,
    notes: onNotesClick,
    productivity: onProductivityClick,
    breathing: onBreathingClick,
    mindful: onMindfulMomentsClick,
    mood: onMoodClick,
    time: onTimeClick,
    quote: onQuoteClick,
    habit: onHabitClick,
    weather: onWeatherClick,
    focus: onFocusClick,
    activity: onActivityClick,
    links: onLinksClick,
    health: onHealthClick,
    skills: onSkillTrackerClick,
    weekly: onWeeklyReviewClick,
    ideas: onIdeaIncubatorClick,
    workout: onWorkoutTrackerClick,
    meals: onMealTrackerClick,
    study: onStudyPlannerClick,
    learning: onLearningPathClick,
    voice: onVoiceMemosClick,
    sleep: onSleepTrackerClick,
    expenses: onExpenseTrackerClick,
    subscriptions: onSubscriptionTrackerClick,
    energy: onEnergyTrackerClick,
    inspiration: onInspirationWallClick,
    code: onCodePlaygroundClick,
    reminder: onReminderClick,
    conversation: onConversationHistoryClick,
    reflection: onReflectionStudioClick,
    achievements: onAchievementVaultClick,
    challenges: onChallengeTrackerClick,
    braindump: onBrainDumpClick,
    sprint: onSprintPlannerClick,
    resources: onResourceLibraryClick,
    contacts: onContactManagerClick,
    today: onTodayViewClick,
    settings: onSettingsClick,
  };

  const handleAppClick = (appId) => {
    const handler = clickHandlers[appId];
    if (handler) {
      handler();
      setDropdownOpen(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Left section - Back button and Logo */}
        <div className="navbar-left">
          {phase !== 'welcome' && (
            <button
              className="navbar-back-btn"
              onClick={onBack}
              title="Go back"
            >
              ← Back
            </button>
          )}
          <div className="navbar-logo">
            <span className="navbar-logo-text">MC</span>
            <span className="navbar-logo-subtitle">MasterClaw</span>
          </div>
        </div>

        {/* Center section - Empty */}
        <div className="navbar-center">
        </div>

        {/* Right section */}
        {phase !== 'dashboard' && (
          <div className="navbar-right" ref={dropdownRef}>
            {/* Apps Button */}
            <button
              className="navbar-btn navbar-btn-apps"
              onClick={onAppsClick}
              title="All Apps (Cmd+K)"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 'bold' }}
            >
              🐾
            </button>

            {/* Dropdown Menu Button */}
            <button
              className="navbar-btn navbar-btn-dropdown"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title="Quick Apps"
              style={{ background: 'rgba(99, 102, 241, 0.2)' }}
            >
              📱 {dropdownOpen ? '▲' : '▼'}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="navbar-dropdown">
                {appCategories.map((category) => (
                  <div key={category.name} className="dropdown-category">
                    <div className="dropdown-category-header">{category.name}</div>
                    <div className="dropdown-apps">
                      {category.apps.map((app) => (
                        <button
                          key={app.id}
                          className="dropdown-app-item"
                          onClick={() => handleAppClick(app.id)}
                          title={app.label}
                        >
                          <span className="dropdown-app-icon">{app.icon}</span>
                          <span className="dropdown-app-label">{app.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right section - Connection Status (only on dashboard) */}
        {phase === 'dashboard' && (
          <div className="navbar-right">
            <div className={`navbar-connection-status ${connectionStatus || 'connecting'}`}>
              {(connectionStatus === 'connected') && <span>🟢 Live</span>}
              {connectionStatus === 'reconnecting' && <span>🔄 Reconnecting...</span>}
              {connectionStatus === 'backend-only' && <span>🟡 API</span>}
              {connectionStatus === 'connecting' && <span>⏳ Connecting...</span>}
              {connectionStatus === 'unconfigured' && <span>⚙️ Setup</span>}
              {(connectionStatus === 'error' || connectionStatus === 'offline') && <span>🔴 Offline</span>}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
