import React from 'react';
import PropTypes from 'prop-types';
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
 * - error: Error or offline state
 */
export default function Avatar({ state = 'idle', size = 'medium' }) {
  const sizeClasses = {
    small: { width: 60, height: 60 },
    medium: { width: 200, height: 200 },
    large: { width: 300, height: 300 }
  };

  const { width, height } = sizeClasses[size] || sizeClasses.medium;

  // Accessibility: Provide meaningful label for current state
  const stateLabels = {
    idle: 'MasterClaw AI Avatar - Ready',
    listening: 'MasterClaw AI Avatar - Listening',
    thinking: 'MasterClaw AI Avatar - Processing',
    speaking: 'MasterClaw AI Avatar - Speaking',
    error: 'MasterClaw AI Avatar - Error'
  };

  return (
    <div className={`avatar avatar--${state} avatar--${size}`}>
      <svg 
        viewBox="0 0 200 200" 
        className="avatar-svg"
        style={{ width, height }}
        role="img"
        aria-label={stateLabels[state] || stateLabels.idle}
      >
        {/* Definitions for gradients and filters */}
        <defs>
          <linearGradient id="avatarShell" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="45%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          <radialGradient id="avatarCoreBloom" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#ecfeff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
          </radialGradient>
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

        <circle cx="100" cy="100" r="92" className="avatar-shell" fill="none" />
        <circle cx="100" cy="100" r="64" className="avatar-shell avatar-shell--inner" fill="none" />

        <g className={`avatar-scanlines avatar-scanlines--${state}`}>
          <line x1="32" y1="85" x2="168" y2="85" className="avatar-scanline" />
          <line x1="24" y1="100" x2="176" y2="100" className="avatar-scanline" />
          <line x1="32" y1="115" x2="168" y2="115" className="avatar-scanline" />
        </g>

        <circle cx="100" cy="100" r="36" className="avatar-bloom" fill="url(#avatarCoreBloom)" />

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

        <g className={`avatar-data-ring avatar-data-ring--${state}`}>
          <path d="M100 20 A80 80 0 0 1 170 70" className="avatar-data-arc" />
          <path d="M180 100 A80 80 0 0 1 130 170" className="avatar-data-arc avatar-data-arc--delayed" />
          <path d="M100 180 A80 80 0 0 1 30 130" className="avatar-data-arc" />
          <path d="M20 100 A80 80 0 0 1 70 30" className="avatar-data-arc avatar-data-arc--delayed" />
        </g>

        {/* Ripple effect for listening state */}
        {state === 'listening' && (
          <>
            <circle cx="100" cy="100" r="45" className="avatar-ripple" fill="none" />
            <circle cx="100" cy="100" r="50" className="avatar-ripple avatar-ripple--delayed" fill="none" />
          </>
        )}

        {/* Error state indicator */}
        {state === 'error' && (
          <>
            <circle cx="100" cy="100" r="60" className="avatar-error-ring" fill="none" />
            <path d="M100 70 L100 110 M100 120 L100 130" className="avatar-error-icon" />
          </>
        )}
      </svg>
    </div>
  );
}

Avatar.propTypes = {
  state: PropTypes.oneOf(['idle', 'listening', 'thinking', 'speaking', 'error']),
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};
