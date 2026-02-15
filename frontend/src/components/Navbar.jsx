import React from 'react';
import './Navbar.css';

export default function Navbar({ 
  phase,
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
  onNotesClick
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
              className="navbar-btn navbar-btn-settings"
              onClick={onSettingsClick}
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
