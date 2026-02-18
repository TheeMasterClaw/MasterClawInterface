import React from 'react';
import './Navbar.css';

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
  onDeepWorkTrackerClick
}) {
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

        {/* Right section - Tool buttons */}
        {phase !== 'dashboard' && (
          <div className="navbar-right">
            <button
              className="navbar-btn navbar-btn-briefing"
              onClick={onDailyBriefingClick}
              title="Daily Briefing"
            >
              📅
            </button>
            <button
              className="navbar-btn navbar-btn-meeting"
              onClick={onMeetingCompanionClick}
              title="Meeting Companion"
            >
              🤝
            </button>
            <button
              className="navbar-btn navbar-btn-system"
              onClick={onSystemMonitorClick}
              title="System Monitor"
            >
              🖥️
            </button>
            <button
              className="navbar-btn navbar-btn-whiteboard"
              onClick={onWhiteboardClick}
              title="Whiteboard"
            >
              🎨
            </button>
            <button
              className="navbar-btn navbar-btn-goals"
              onClick={onGoalPlannerClick}
              title="Goal Planner"
            >
              🏆
            </button>
            <button
              className="navbar-btn navbar-btn-projects"
              onClick={onProjectDashboardClick}
              title="Project Dashboard"
            >
              📊
            </button>
            <button
              className="navbar-btn navbar-btn-vision"
              onClick={onVisionBoardClick}
              title="Vision Board"
            >
              🖼️
            </button>
            <button
              className="navbar-btn navbar-btn-vault"
              onClick={onPasswordVaultClick}
              title="Password Vault"
            >
              🔐
            </button>
            <button
              className="navbar-btn navbar-btn-balance"
              onClick={onLifeBalanceWheelClick}
              title="Life Balance Wheel"
            >
              ⚖️
            </button>
            <button
              className="navbar-btn navbar-btn-network"
              onClick={onRelationshipNetworkClick}
              title="Relationship Network"
            >
              🌐
            </button>
            <button
              className="navbar-btn navbar-btn-deepwork"
              onClick={onDeepWorkTrackerClick}
              title="Deep Work Tracker"
            >
              🎯
            </button>
            <button
              className="navbar-btn navbar-btn-snippets"
              onClick={onSnippetsClick}
              title="Snippets Vault"
            >
              📦
            </button>
            <button
              className="navbar-btn navbar-btn-garden"
              onClick={onKnowledgeGardenClick}
              title="Knowledge Garden"
            >
              🌱
            </button>
            <button
              className="navbar-btn navbar-btn-quest"
              onClick={onQuestLogClick}
              title="Quest Log"
            >
              🗡️
            </button>
            <button
              className="navbar-btn navbar-btn-gratitude"
              onClick={onGratitudeLogClick}
              title="Gratitude Log"
            >
              🙏
            </button>
            <button
              className="navbar-btn navbar-btn-reading"
              onClick={onReadingListClick}
              title="Reading List"
            >
              📚
            </button>
            <button
              className="navbar-btn navbar-btn-journal"
              onClick={onJournalClick}
              title="Journal"
            >
              📔
            </button>
            <button
              className="navbar-btn navbar-btn-notes"
              onClick={onNotesClick}
              title="Notes"
            >
              📝
            </button>
            <button
              className="navbar-btn navbar-btn-productivity"
              onClick={onProductivityClick}
              title="Productivity Analytics"
            >
              📈
            </button>
            <button
              className="navbar-btn navbar-btn-breathing"
              onClick={onBreathingClick}
              title="Breathing Exercise"
            >
              🫁
            </button>
            <button
              className="navbar-btn navbar-btn-mood"
              onClick={onMoodClick}
              title="Mood Tracker"
            >
              🧠
            </button>
            <button
              className="navbar-btn navbar-btn-time"
              onClick={onTimeClick}
              title="Time Tracker"
            >
              ⏱️
            </button>
            <button
              className="navbar-btn navbar-btn-quote"
              onClick={onQuoteClick}
              title="Daily Quote"
            >
              💬
            </button>
            <button
              className="navbar-btn navbar-btn-habit"
              onClick={onHabitClick}
              title="Habit Tracker"
            >
              ✅
            </button>
            <button
              className="navbar-btn navbar-btn-weather"
              onClick={onWeatherClick}
              title="Weather"
            >
              🌤️
            </button>
            <button
              className="navbar-btn navbar-btn-focus"
              onClick={onFocusClick}
              title="Focus Timer"
            >
              🎯
            </button>
            <button
              className="navbar-btn navbar-btn-activity"
              onClick={onActivityClick}
              title="Activity Log"
            >
              📊
            </button>
            <button
              className="navbar-btn navbar-btn-links"
              onClick={onLinksClick}
              title="Quick Links"
            >
              🔗
            </button>
            <button
              className="navbar-btn navbar-btn-health"
              onClick={onHealthClick}
              title="Health Monitor"
            >
              🏥
            </button>
            <button
              className="navbar-btn navbar-btn-ambient"
              onClick={onAmbientMixerClick}
              title="Ambient Sound Mixer"
            >
              🎧
            </button>
            <button
              className="navbar-btn navbar-btn-skills"
              onClick={onSkillTrackerClick}
              title="Skill Tracker"
            >
              🎯
            </button>
            <button
              className="navbar-btn navbar-btn-weekly-review"
              onClick={onWeeklyReviewClick}
              title="Weekly Review"
            >
              🗓️
            </button>
            <button
              className="navbar-btn navbar-btn-idea-incubator"
              onClick={onIdeaIncubatorClick}
              title="Idea Incubator"
            >
              💡
            </button>
            <button
              className="navbar-btn navbar-btn-workout"
              onClick={onWorkoutTrackerClick}
              title="Workout Tracker"
            >
              💪
            </button>
            <button
              className="navbar-btn navbar-btn-sleep"
              onClick={onSleepTrackerClick}
              title="Sleep Tracker"
            >
              🌙
            </button>
            <button
              className="navbar-btn navbar-btn-expense"
              onClick={onExpenseTrackerClick}
              title="Expense Tracker"
            >
              💰
            </button>
            <button
              className="navbar-btn navbar-btn-subscription"
              onClick={onSubscriptionTrackerClick}
              title="Subscription Tracker"
            >
              💳
            </button>
            <button
              className="navbar-btn navbar-btn-energy"
              onClick={onEnergyTrackerClick}
              title="Energy Tracker"
            >
              ⚡
            </button>
            <button
              className="navbar-btn navbar-btn-settings"
              onClick={onSettingsClick}
              title="Settings"
            >
              ⚙️
            </button>
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
