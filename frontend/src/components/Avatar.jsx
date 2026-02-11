import React from 'react';
import './Avatar.css';

/**
 * MC - MasterClaw
 * Abstract, geometric avatar
 * Represents intelligence + intention without anthropomorphizing
 * 
 * States:
 * - idle: Default state, gentle breathing
 * - listening: Active listening, pulsing core
 * - thinking: Processing, orbiting nodes speed up
 * - speaking: Active response, flowing connections
 */
export default function Avatar({ state = 'idle', size = 'medium' }) {
  const sizeClasses = {
    small: { width: 60, height: 60 },
    medium: { width: 200, height: 200 },
    large: { width: 300, height: 300 }
  };

  const { width, height } = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className={`avatar avatar--${state} avatar--${size}`}>
      <svg 
        viewBox="0 0 200 200" 
        className="avatar-svg"
        style={{ width, height }}
      >
        {/* Definitions for gradients and filters */}
        <defs>
          <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </radialGradient>
          <radialGradient id="coreGradientActive" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Central circle - core intelligence */}
        <circle 
          cx="100" 
          cy="100" 
          r="40" 
          className={`avatar-core avatar-core--${state}`}
          fill={state === 'listening' || state === 'speaking' ? 'url(#coreGradientActive)' : 'url(#coreGradient)'}
        />

        {/* Orbiting nodes - connected thoughts */}
        <g className={`avatar-nodes avatar-nodes--${state}`}>
          <circle cx="100" cy="50" r="12" className="avatar-node" />
          <circle cx="150" cy="100" r="12" className="avatar-node" />
          <circle cx="100" cy="150" r="12" className="avatar-node" />
          <circle cx="50" cy="100" r="12" className="avatar-node" />
          
          {/* Additional nodes for thinking state */}
          {(state === 'thinking' || state === 'speaking') && (
            <>
              <circle cx="125" cy="45" r="8" className="avatar-node avatar-node--secondary" />
              <circle cx="155" cy="125" r="8" className="avatar-node avatar-node--secondary" />
              <circle cx="75" cy="155" r="8" className="avatar-node avatar-node--secondary" />
              <circle cx="45" cy="75" r="8" className="avatar-node avatar-node--secondary" />
            </>
          )}
        </g>

        {/* Connecting lines - communication paths */}
        <g className={`avatar-connections avatar-connections--${state}`}>
          <line x1="100" y1="65" x2="100" y2="50" className="avatar-connection" />
          <line x1="128" y1="128" x2="150" y2="100" className="avatar-connection" />
          <line x1="100" y1="135" x2="100" y2="150" className="avatar-connection" />
          <line x1="72" y1="72" x2="50" y2="100" className="avatar-connection" />
          
          {/* Additional connections for thinking */}
          {(state === 'thinking' || state === 'speaking') && (
            <>
              <line x1="115" y1="85" x2="125" y2="53" className="avatar-connection avatar-connection--secondary" />
              <line x1="135" y1="115" x2="152" y2="120" className="avatar-connection avatar-connection--secondary" />
              <line x1="85" y1="135" x2="75" y2="147" className="avatar-connection avatar-connection--secondary" />
              <line x1="65" y1="85" x2="53" y2="77" className="avatar-connection avatar-connection--secondary" />
            </>
          )}
        </g>

        {/* Outer ring - boundary of awareness */}
        <circle
          cx="100"
          cy="100"
          r="80"
          className={`avatar-boundary avatar-boundary--${state}`}
          fill="none"
        />

        {/* Ripple effect for listening state */}
        {state === 'listening' && (
          <>
            <circle cx="100" cy="100" r="45" className="avatar-ripple" fill="none" />
            <circle cx="100" cy="100" r="50" className="avatar-ripple avatar-ripple--delayed" fill="none" />
          </>
        )}
      </svg>
    </div>
  );
}
