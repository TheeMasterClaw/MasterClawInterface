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
  onAchievementVaultClick
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
              className="navbar-btn navbar-btn-quick-capture"
              onClick={onQuickCaptureClick}
              title="Quick Capture"
            >
              ⚡
            </button>
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
              className="navbar-btn navbar-btn-daily-wins"
              onClick={onDailyWinsClick}
              title="Daily Wins"
            >
              🏆
            </button>
            <button
              className="navbar-btn navbar-btn-priority-matrix"
              onClick={onPriorityMatrixClick}
              title="Priority Matrix"
            >
              📊
            </button>
            <button
              className="navbar-btn navbar-btn-taskboard"
              onClick={onTaskBoardClick}
              title="Task Board"
            >
              📋
            </button>
            <button
              className="navbar-btn navbar-btn-roulette"
              onClick={onReflectionRouletteClick}
              title="Reflection Roulette"
            >
              🎲
            </button>
            <button
              className="navbar-btn navbar-btn-detox"
              onClick={onDigitalDetoxTrackerClick}
              title="Digital Detox Tracker"
            >
              🧘
            </button>
            <button
              className="navbar-btn navbar-btn-travel"
              onClick={onTravelPlannerClick}
              title="Travel Planner"
            >
              🧳
            </button>
            <button
              className="navbar-btn navbar-btn-prompts"
              onClick={onPromptLibraryClick}
              title="Prompt Library"
            >
              📚
            </button>
            <button
              className="navbar-btn navbar-btn-content"
              onClick={onContentTrackerClick}
              title="Content Tracker"
            >
              🎬
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
              className="navbar-btn navbar-btn-timecapsule"
              onClick={onTimeCapsuleClick}
              title="Time Capsule"
            >
              ⏳
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
              className="navbar-btn navbar-btn-mindful"
              onClick={onMindfulMomentsClick}
              title="Mindful Moments"
            >
              🧘
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
              className="navbar-btn navbar-btn-meal"
              onClick={onMealTrackerClick}
              title="Meal Tracker"
            >
              🍎
            </button>
            <button
              className="navbar-btn navbar-btn-study"
              onClick={onStudyPlannerClick}
              title="Study Planner"
            >
              📚
            </button>
            <button
              className="navbar-btn navbar-btn-learning-path"
              onClick={onLearningPathClick}
              title="Learning Path"
            >
              🎓
            </button>
            <button
              className="navbar-btn navbar-btn-voice"
              onClick={onVoiceMemosClick}
              title="Voice Memos"
            >
              🎙️
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
              className="navbar-btn navbar-btn-inspiration"
              onClick={onInspirationWallClick}
              title="Inspiration Wall"
            >
              ✨
            </button>
            <button
              className="navbar-btn navbar-btn-code-playground"
              onClick={onCodePlaygroundClick}
              title="Code Playground"
            >
              💻
            </button>
            <button
              className="navbar-btn navbar-btn-reminder"
              onClick={onReminderClick}
              title="Smart Reminders"
            >
              ⏰
            </button>
            <button
              className="navbar-btn navbar-btn-conversation-history"
              onClick={onConversationHistoryClick}
              title="Conversation History"
            >
              💬
            </button>
            <button
              className="navbar-btn navbar-btn-reflection-studio"
              onClick={onReflectionStudioClick}
              title="Reflection Studio"
            >
              🧘
            </button>
            <button
              className="navbar-btn navbar-btn-achievement-vault"
              onClick={onAchievementVaultClick}
              title="Achievement Vault"
            >
              🏆
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
