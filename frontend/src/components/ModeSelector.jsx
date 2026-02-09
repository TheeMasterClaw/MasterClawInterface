import React from 'react';
import './ModeSelector.css';

const modes = [
  {
    id: 'text',
    name: 'Text',
    description: 'Chat-based interaction. Type, ask, decide.',
    icon: '💬'
  },
  {
    id: 'voice',
    name: 'Voice',
    description: 'Speak naturally. Listen to responses.',
    icon: '🎤'
  },
  {
    id: 'hybrid',
    name: 'Hybrid',
    description: 'Mix of text, voice, and context awareness.',
    icon: '🔀'
  },
  {
    id: 'context',
    name: 'Context',
    description: 'I watch your calendar & tasks. Proactive alerts.',
    icon: '👁️'
  }
];

export default function ModeSelector({ onSelect, avatar }) {
  return (
    <div className="mode-selector-screen">
      <div className="mode-selector-container">
        <div className="avatar-wrapper-small">
          {avatar}
        </div>

        <h2 className="mode-title">How should we work together?</h2>
        <p className="mode-subtitle">Pick a mode. You can switch anytime.</p>

        <div className="modes-grid">
          {modes.map((mode) => (
            <button
              key={mode.id}
              className="mode-card"
              onClick={() => onSelect(mode.id)}
            >
              <div className="mode-icon">{mode.icon}</div>
              <h3 className="mode-name">{mode.name}</h3>
              <p className="mode-description">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
