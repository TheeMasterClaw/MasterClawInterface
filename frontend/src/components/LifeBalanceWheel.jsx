import React, { useState, useEffect, useCallback } from 'react';
// import './LifeBalanceWheel.css';

const LIFE_AREAS = [
  { id: 'career', name: 'Career', icon: '💼', color: '#6366f1', description: 'Work, professional growth, purpose' },
  { id: 'finance', name: 'Finance', icon: '💰', color: '#22c55e', description: 'Money management, savings, security' },
  { id: 'health', name: 'Health', icon: '❤️', color: '#ef4444', description: 'Physical fitness, nutrition, sleep' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦', color: '#f97316', description: 'Relationships, home life, support' },
  { id: 'friends', name: 'Friends', icon: '🤝', color: '#14b8a6', description: 'Social connections, community' },
  { id: 'romance', name: 'Romance', icon: '💕', color: '#ec4899', description: 'Love life, intimacy, partnership' },
  { id: 'growth', name: 'Growth', icon: '🌱', color: '#8b5cf6', description: 'Learning, self-improvement, skills' },
  { id: 'fun', name: 'Fun', icon: '🎉', color: '#f59e0b', description: 'Recreation, hobbies, joy' }
];

const getRatingLabel = (rating) => {
  if (rating <= 2) return { label: 'Needs Attention', emoji: '🔴', color: '#ef4444' };
  if (rating <= 4) return { label: 'Could Improve', emoji: '🟡', color: '#f59e0b' };
  if (rating <= 6) return { label: 'Doing Okay', emoji: '🟢', color: '#22c55e' };
  if (rating <= 8) return { label: 'Pretty Good', emoji: '⭐', color: '#3b82f6' };
  return { label: 'Thriving', emoji: '✨', color: '#8b5cf6' };
};

export default function LifeBalanceWheel({ isOpen, onClose }) {
  const [ratings, setRatings] = useState({});
  const [selectedArea, setSelectedArea] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [reflection, setReflection] = useState('');

  // Load saved data
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-life-balance');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setRatings(data.ratings || {});
          setHistory(data.history || []);
          setReflection(data.reflection || '');
        } catch (e) {
          console.error('Failed to parse life balance data:', e);
        }
      }
    }
  }, [isOpen]);

  // Save data
  const saveData = useCallback((newData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-life-balance', JSON.stringify(newData));
    }
  }, []);

  const handleRatingChange = (areaId, value) => {
    const newRatings = { ...ratings, [areaId]: parseInt(value) };
    setRatings(newRatings);
    saveData({ ratings: newRatings, history, reflection });
  };

  const saveSnapshot = () => {
    const snapshot = {
      id: Date.now(),
      date: new Date().toISOString(),
      ratings: { ...ratings }
    };
    const newHistory = [...history, snapshot].slice(-12); // Keep last 12 snapshots
    setHistory(newHistory);
    saveData({ ratings, history: newHistory, reflection });
  };

  const clearData = () => {
    if (typeof window !== 'undefined' && window.confirm('Clear all life balance data? This cannot be undone.')) {
      setRatings({});
      setHistory([]);
      setReflection('');
      localStorage.removeItem('mc-life-balance');
    }
  };

  const calculateAverage = () => {
    const values = Object.values(ratings);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const getAreaRating = (areaId) => ratings[areaId] || 5;

  // Generate SVG polygon points for the wheel
  const generateWheelPoints = () => {
    const centerX = 150;
    const centerY = 150;
    const maxRadius = 120;
    const angleStep = (2 * Math.PI) / LIFE_AREAS.length;

    return LIFE_AREAS.map((area, index) => {
      const rating = getAreaRating(area.id);
      const radius = (rating / 10) * maxRadius;
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  // Generate points for background grid
  const generateGridPoints = (level) => {
    const centerX = 150;
    const centerY = 150;
    const radius = (level / 10) * 120;
    const angleStep = (2 * Math.PI) / LIFE_AREAS.length;

    return LIFE_AREAS.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const getWeakestAreas = () => {
    return LIFE_AREAS
      .map(area => ({ ...area, rating: getAreaRating(area.id) }))
      .sort((a, b) => a.rating - b.rating)
      .slice(0, 3);
  };

  const getStrongestAreas = () => {
    return LIFE_AREAS
      .map(area => ({ ...area, rating: getAreaRating(area.id) }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  };

  if (!isOpen) return null;

  const average = calculateAverage();
  const overallStatus = getRatingLabel(average);
  const weakestAreas = getWeakestAreas();
  const strongestAreas = getStrongestAreas();
  const hasData = Object.keys(ratings).length > 0;

  return (
    <div className="life-balance-overlay" onClick={onClose}>
      <div className="life-balance-panel" onClick={e => e.stopPropagation()}>
        <div className="life-balance-header">
          <h3>⚖️ Life Balance Wheel</h3>
          <div className="header-actions">
            <button 
              className="history-btn"
              onClick={() => setShowHistory(!showHistory)}
              title="View History"
            >
              📊
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showHistory ? (
          <div className="life-balance-history">
            <h4>📈 Progress History</h4>
            {history.length === 0 ? (
              <p className="no-history">No snapshots yet. Save your first assessment!</p>
            ) : (
              <div className="history-list">
                {history.map((snapshot) => {
                  const avg = Object.values(snapshot.ratings).reduce((a, b) => a + b, 0) / 
                    Object.values(snapshot.ratings).length || 0;
                  return (
                    <div key={snapshot.id} className="history-item">
                      <div className="history-date">
                        {new Date(snapshot.date).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="history-avg">
                        Avg: <strong>{avg.toFixed(1)}</strong>/10
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="back-btn" onClick={() => setShowHistory(false)}>
              ← Back to Wheel
            </button>
          </div>
        ) : (
          <div className="life-balance-content">
            {/* Wheel Visualization */}
            <div className="wheel-section">
              <div className="wheel-container">
                <svg viewBox="0 0 300 300" className="balance-wheel">
                  {/* Background circles */}
                  {[2, 4, 6, 8, 10].map(level => (
                    <polygon
                      key={level}
                      points={generateGridPoints(level)}
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Spokes */}
                  {LIFE_AREAS.map((area, index) => {
                    const angle = (index * 2 * Math.PI) / LIFE_AREAS.length - Math.PI / 2;
                    const x = 150 + 120 * Math.cos(angle);
                    const y = 150 + 120 * Math.sin(angle);
                    return (
                      <line
                        key={area.id}
                        x1="150"
                        y1="150"
                        x2={x}
                        y2={y}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* User's balance shape */}
                  <polygon
                    points={generateWheelPoints()}
                    fill="rgba(99, 102, 241, 0.3)"
                    stroke="#6366f1"
                    strokeWidth="2"
                    className="balance-polygon"
                  />

                  {/* Area labels */}
                  {LIFE_AREAS.map((area, index) => {
                    const angle = (index * 2 * Math.PI) / LIFE_AREAS.length - Math.PI / 2;
                    const x = 150 + 135 * Math.cos(angle);
                    const y = 150 + 135 * Math.sin(angle);
                    const isSelected = selectedArea === area.id;
                    return (
                      <text
                        key={area.id}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className={`area-label ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedArea(area.id === selectedArea ? null : area.id)}
                      >
                        {area.icon}
                      </text>
                    );
                  })}
                </svg>

                <div className="overall-score">
                  <div className="score-circle" style={{ borderColor: overallStatus.color }}>
                    <span className="score-value" style={{ color: overallStatus.color }}>
                      {average.toFixed(1)}
                    </span>
                    <span className="score-label">/10</span>
                  </div>
                  <div className="score-status" style={{ color: overallStatus.color }}>
                    {overallStatus.emoji} {overallStatus.label}
                  </div>
                </div>
              </div>

              <div className="wheel-instructions">
                <p>💡 Click an area below to rate it. A balanced life creates a full wheel!</p>
              </div>
            </div>

            {/* Area Rating Cards */}
            <div className="areas-grid">
              {LIFE_AREAS.map(area => {
                const rating = getAreaRating(area.id);
                const isSelected = selectedArea === area.id;
                const status = getRatingLabel(rating);
                
                return (
                  <div 
                    key={area.id} 
                    className={`area-card ${isSelected ? 'selected' : ''}`}
                    style={{ '--area-color': area.color }}
                    onClick={() => setSelectedArea(area.id === selectedArea ? null : area.id)}
                  >
                    <div className="area-header">
                      <span className="area-icon">{area.icon}</span>
                      <span className="area-name">{area.name}</span>
                      <span className="area-rating" style={{ color: status.color }}>
                        {rating}/10
                      </span>
                    </div>
                    
                    {isSelected && (
                      <div className="area-controls" onClick={e => e.stopPropagation()}>
                        <p className="area-description">{area.description}</p>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={rating}
                          onChange={(e) => handleRatingChange(area.id, e.target.value)}
                          className="rating-slider"
                        />
                        <div className="rating-labels">
                          <span>1</span>
                          <span style={{ color: status.color }}>{status.emoji} {status.label}</span>
                          <span>10</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Insights */}
            {hasData && (
              <div className="insights-section">
                <h4>🔍 Insights</h4>
                <div className="insights-grid">
                  <div className="insight-card">
                    <h5>🎯 Focus Areas</h5>
                    <p>Consider improving:</p>
                    <ul>
                      {weakestAreas.map(area => (
                        <li key={area.id}>
                          {area.icon} {area.name} ({area.rating}/10)
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="insight-card">
                    <h5>💪 Strengths</h5>
                    <p>You're thriving in:</p>
                    <ul>
                      {strongestAreas.map(area => (
                        <li key={area.id}>
                          {area.icon} {area.name} ({area.rating}/10)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Reflection */}
            <div className="reflection-section">
              <h4>📝 Reflection</h4>
              <textarea
                placeholder="What actions will you take to improve your life balance?"
                value={reflection}
                onChange={(e) => {
                  setReflection(e.target.value);
                  saveData({ ratings, history, reflection: e.target.value });
                }}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="life-balance-actions">
              <button className="save-snapshot-btn" onClick={saveSnapshot}>
                📸 Save Snapshot
              </button>
              <button className="clear-data-btn" onClick={clearData}>
                🗑️ Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}