import React from 'react';
// import './Welcome.css';

export default function Welcome({ onContinue, avatar }) {
  // Clone avatar with large size and idle state
  const AvatarLarge = avatar ? React.cloneElement(avatar, { state: 'idle', size: 'large' }) : null;
  
  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <div className="avatar-wrapper-large">
          {AvatarLarge}
        </div>

        <h1 className="welcome-title">MasterClaw</h1>
        <p className="welcome-subtitle">YOUR AI COMMAND CENTER</p>

        <div className="welcome-message">
          <p className="welcome-greeting">Welcome, Rex.</p>
          <p className="welcome-tagline">Let's take over the world together.</p>
        </div>

        <button className="welcome-button" onClick={onContinue}>
          Enter Chat →
        </button>

        <p className="welcome-privacy">
          🔒 Privacy-first. Self-hosted. Yours alone.
        </p>
      </div>
    </div>
  );
}
