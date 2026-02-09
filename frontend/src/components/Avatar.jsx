import React from 'react';
import './Avatar.css';

/**
 * MC - MasterClaw
 * Abstract, geometric avatar
 * Represents intelligence + intention without anthropomorphizing
 */
export default function Avatar() {
  return (
    <div className="avatar">
      <svg viewBox="0 0 200 200" className="avatar-svg">
        {/* Central circle - core intelligence */}
        <circle cx="100" cy="100" r="40" className="avatar-core" />

        {/* Orbiting nodes - connected thoughts */}
        <circle cx="100" cy="50" r="12" className="avatar-node" />
        <circle cx="150" cy="100" r="12" className="avatar-node" />
        <circle cx="100" cy="150" r="12" className="avatar-node" />
        <circle cx="50" cy="100" r="12" className="avatar-node" />

        {/* Connecting lines - communication paths */}
        <line
          x1="100"
          y1="65"
          x2="100"
          y2="50"
          className="avatar-connection"
        />
        <line
          x1="128"
          y1="128"
          x2="150"
          y2="100"
          className="avatar-connection"
        />
        <line
          x1="100"
          y1="135"
          x2="100"
          y2="150"
          className="avatar-connection"
        />
        <line
          x1="72"
          y1="72"
          x2="50"
          y2="100"
          className="avatar-connection"
        />

        {/* Outer ring - boundary of awareness */}
        <circle
          cx="100"
          cy="100"
          r="80"
          className="avatar-boundary"
          fill="none"
        />
      </svg>
    </div>
  );
}
