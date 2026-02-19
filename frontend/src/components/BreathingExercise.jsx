import React, { useState, useEffect, useRef, useCallback } from 'react';
// import './BreathingExercise.css';

const TECHNIQUES = {
  box: {
    name: 'Box Breathing',
    description: 'Inhale, hold, exhale, hold — all equal counts',
    pattern: [
      { phase: 'inhale', duration: 4, label: 'Inhale' },
      { phase: 'hold', duration: 4, label: 'Hold' },
      { phase: 'exhale', duration: 4, label: 'Exhale' },
      { phase: 'hold', duration: 4, label: 'Hold' }
    ],
    color: '#6366f1'
  },
  fourSevenEight: {
    name: '4-7-8 Breathing',
    description: 'Relaxation technique for stress relief',
    pattern: [
      { phase: 'inhale', duration: 4, label: 'Inhale' },
      { phase: 'hold', duration: 7, label: 'Hold' },
      { phase: 'exhale', duration: 8, label: 'Exhale' }
    ],
    color: '#10b981'
  },
  coherent: {
    name: 'Coherent Breathing',
    description: 'Balanced 5-5 rhythm for calm focus',
    pattern: [
      { phase: 'inhale', duration: 5, label: 'Inhale' },
      { phase: 'exhale', duration: 5, label: 'Exhale' }
    ],
    color: '#f59e0b'
  },
  relax: {
    name: 'Relaxing Breath',
    description: 'Longer exhales to activate relaxation response',
    pattern: [
      { phase: 'inhale', duration: 4, label: 'Inhale' },
      { phase: 'exhale', duration: 6, label: 'Exhale' }
    ],
    color: '#ec4899'
  },
  energize: {
    name: 'Energizing Breath',
    description: 'Quick inhales to boost alertness',
    pattern: [
      { phase: 'inhale', duration: 2, label: 'Inhale' },
      { phase: 'exhale', duration: 2, label: 'Exhale' }
    ],
    color: '#ef4444'
  }
};

const SESSION_DURATIONS = [
  { label: '1 min', seconds: 60 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 }
];

export default function BreathingExercise({ isOpen, onClose }) {
  const [selectedTechnique, setSelectedTechnique] = useState('box');
  const [sessionDuration, setSessionDuration] = useState(180);
  const [isActive, setIsActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(4);
  const [totalTimeLeft, setTotalTimeLeft] = useState(180);
  const [sessionCount, setSessionCount] = useState(0);
  const [showTechniques, setShowTechniques] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [sessionHistory, setSessionHistory] = useState([]);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const technique = TECHNIQUES[selectedTechnique];
  const currentPhase = technique.pattern[currentPhaseIndex];

  // Load session history
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-breathing-sessions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSessionHistory(parsed);
          setSessionCount(parsed.length);
        } catch (e) {
          console.error('Failed to parse session history:', e);
        }
      }
    }
  }, [isOpen]);

  // Save session history
  const saveSessionHistory = useCallback((history) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-breathing-sessions', JSON.stringify(history.slice(-100)));
    }
  }, []);

  // Calculate total breaths based on session history
  useEffect(() => {
    const total = sessionHistory.reduce((acc, session) => acc + (session.breaths || 0), 0);
    setBreathCount(total);
  }, [sessionHistory]);

  // Timer logic
  useEffect(() => {
    if (isActive && totalTimeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setPhaseTimeLeft(prev => {
          if (prev <= 1) {
            // Move to next phase
            setCurrentPhaseIndex(currentIdx => {
              const nextIdx = (currentIdx + 1) % technique.pattern.length;
              const nextPhase = technique.pattern[nextIdx];
              setPhaseTimeLeft(nextPhase.duration);
              return nextIdx;
            });
            return technique.pattern[(currentPhaseIndex + 1) % technique.pattern.length].duration;
          }
          return prev - 1;
        });
        setTotalTimeLeft(prev => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, totalTimeLeft, currentPhaseIndex, technique]);

  const completeSession = () => {
    setIsActive(false);
    
    // Calculate breaths completed
    const patternDuration = technique.pattern.reduce((acc, p) => acc + p.duration, 0);
    const breathsCompleted = Math.floor(sessionDuration / patternDuration);
    
    const newSession = {
      id: Date.now(),
      technique: selectedTechnique,
      techniqueName: technique.name,
      duration: sessionDuration,
      breaths: breathsCompleted,
      completedAt: new Date().toISOString()
    };
    
    const updatedHistory = [...sessionHistory, newSession];
    setSessionHistory(updatedHistory);
    saveSessionHistory(updatedHistory);
    setSessionCount(updatedHistory.length);
    
    // Play completion sound
    playCompletionSound();
  };

  const playCompletionSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 432;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.5);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);
    } catch (e) {
      console.log('Audio not available');
    }
  };

  const startSession = () => {
    setIsActive(true);
    setTotalTimeLeft(sessionDuration);
    setCurrentPhaseIndex(0);
    setPhaseTimeLeft(technique.pattern[0].duration);
  };

  const pauseSession = () => {
    setIsActive(false);
  };

  const resetSession = () => {
    setIsActive(false);
    setTotalTimeLeft(sessionDuration);
    setCurrentPhaseIndex(0);
    setPhaseTimeLeft(technique.pattern[0].duration);
  };

  const handleTechniqueChange = (techKey) => {
    setSelectedTechnique(techKey);
    setShowTechniques(false);
    resetSession();
  };

  const handleDurationChange = (seconds) => {
    setSessionDuration(seconds);
    if (!isActive) {
      setTotalTimeLeft(seconds);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTodaySessions = () => {
    const today = new Date().toDateString();
    return sessionHistory.filter(s => new Date(s.completedAt).toDateString() === today);
  };

  const getTodayBreaths = () => {
    return getTodaySessions().reduce((acc, s) => acc + (s.breaths || 0), 0);
  };

  const getTotalMinutes = () => {
    return Math.floor(sessionHistory.reduce((acc, s) => acc + s.duration, 0) / 60);
  };

  const clearHistory = () => {
    setSessionHistory([]);
    saveSessionHistory([]);
    setSessionCount(0);
    setBreathCount(0);
  };

  const getBreathingAnimation = () => {
    const phase = currentPhase?.phase || 'inhale';
    const duration = currentPhase?.duration || 4;
    
    return {
      animation: `breathe-${phase} ${duration}s ease-in-out infinite`,
      transform: phase === 'inhale' ? 'scale(1.3)' : 
                 phase === 'hold' ? 'scale(1.3)' : 
                 'scale(1)'
    };
  };

  if (!isOpen) return null;

  const todaySessions = getTodaySessions();
  const todayBreaths = getTodayBreaths();
  const totalMinutes = getTotalMinutes();

  return (
    <div className="breathing-panel-overlay" onClick={onClose}>
      <div className="breathing-panel" onClick={e => e.stopPropagation()}>
        <div className="breathing-panel-header">
          <h3>🫁 Breathing Exercise</h3>
          <div className="header-actions">
            <button 
              className="stats-btn"
              onClick={() => setShowStats(!showStats)}
              title="Statistics"
            >
              📊
            </button>
            <button 
              className="techniques-btn"
              onClick={() => setShowTechniques(!showTechniques)}
              title="Techniques"
            >
              ⚙️
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showTechniques ? (
          <div className="techniques-panel">
            <h4>Choose a Breathing Technique</h4>
            <div className="technique-list">
              {Object.entries(TECHNIQUES).map(([key, tech]) => (
                <button
                  key={key}
                  className={`technique-card ${selectedTechnique === key ? 'active' : ''}`}
                  onClick={() => handleTechniqueChange(key)}
                  style={{ '--tech-color': tech.color }}
                >
                  <div className="technique-name">{tech.name}</div>
                  <div className="technique-pattern">
                    {tech.pattern.map((p, i) => (
                      <span key={i} className={`pattern-dot ${p.phase}`} />
                    ))}
                  </div>
                  <div className="technique-desc">{tech.description}</div>
                </button>
              ))}
            </div>
            <button className="back-btn" onClick={() => setShowTechniques(false)}>
              ← Back to Exercise
            </button>
          </div>
        ) : showStats ? (
          <div className="stats-panel">
            <h4>📊 Your Breathing Journey</h4>
            <div className="stats-grid-large">
              <div className="stat-card">
                <span className="stat-value-large">{sessionCount}</span>
                <span className="stat-label-large">Total Sessions</span>
              </div>
              <div className="stat-card">
                <span className="stat-value-large">{breathCount}</span>
                <span className="stat-label-large">Total Breaths</span>
              </div>
              <div className="stat-card">
                <span className="stat-value-large">{totalMinutes}</span>
                <span className="stat-label-large">Minutes Practiced</span>
              </div>
              <div className="stat-card today">
                <span className="stat-value-large">{todaySessions.length}</span>
                <span className="stat-label-large">Today's Sessions</span>
              </div>
              <div className="stat-card today">
                <span className="stat-value-large">{todayBreaths}</span>
                <span className="stat-label-large">Today's Breaths</span>
              </div>
            </div>
            {sessionHistory.length > 0 && (
              <button className="clear-history" onClick={clearHistory}>
                Clear History
              </button>
            )}
            <button className="back-btn" onClick={() => setShowStats(false)}>
              ← Back to Exercise
            </button>
          </div>
        ) : (
          <>
            <div className="breathing-display">
              <div 
                className={`breathing-circle ${currentPhase?.phase} ${isActive ? 'active' : ''}`}
                style={{
                  '--tech-color': technique.color,
                  '--phase-duration': `${currentPhase?.duration || 4}s`,
                  transform: getBreathingAnimation().transform
                }}
              >
                <div className="circle-inner">
                  <div className="phase-label">{currentPhase?.label}</div>
                  <div className="phase-timer">{phaseTimeLeft}</div>
                </div>
              </div>
              
              <div className="session-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${((sessionDuration - totalTimeLeft) / sessionDuration) * 100}%`,
                      background: technique.color 
                    }}
                  />
                </div>
                <div className="time-remaining">{formatTime(totalTimeLeft)} remaining</div>
              </div>
            </div>

            <div className="technique-info">
              <div className="current-technique" style={{ color: technique.color }}>
                {technique.name}
              </div>
              <div className="technique-description">{technique.description}</div>
            </div>

            <div className="duration-selector">
              <label>Session Duration:</label>
              <div className="duration-buttons">
                {SESSION_DURATIONS.map(({ label, seconds }) => (
                  <button
                    key={seconds}
                    className={sessionDuration === seconds ? 'active' : ''}
                    onClick={() => handleDurationChange(seconds)}
                    disabled={isActive}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="breathing-controls">
              {!isActive ? (
                <button 
                  className="breathing-btn start"
                  onClick={startSession}
                  style={{ background: technique.color }}
                >
                  ▶️ Start Session
                </button>
              ) : (
                <button 
                  className="breathing-btn pause"
                  onClick={pauseSession}
                >
                  ⏸️ Pause
                </button>
              )}
              <button className="breathing-btn reset" onClick={resetSession}>
                🔄 Reset
              </button>
            </div>

            <div className="daily-stats">
              <div className="daily-stat">
                <span className="daily-value">{todaySessions.length}</span>
                <span className="daily-label">sessions today</span>
              </div>
              <div className="daily-stat">
                <span className="daily-value">{todayBreaths}</span>
                <span className="daily-label">breaths today</span>
              </div>
            </div>

            <div className="breathing-tips">
              <p>💡 <strong>Tip:</strong> {isActive 
                ? 'Focus on your breath. Let thoughts pass like clouds.' 
                : 'Find a comfortable position. Close your eyes or soften your gaze.'}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
