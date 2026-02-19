'use client';

import React, { useState, useEffect, useMemo } from 'react';
// import './TimeCapsule.css';

const STORAGE_KEY = 'mc-time-capsule';
const OPENED_KEY = 'mc-time-capsule-opened';

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Happy', color: '#fbbf24' },
  { emoji: '🤔', label: 'Thoughtful', color: '#60a5fa' },
  { emoji: '💪', label: 'Motivated', color: '#4ade80' },
  { emoji: '😌', label: 'Peaceful', color: '#a78bfa' },
  { emoji: '😤', label: 'Frustrated', color: '#f87171' },
  { emoji: '🥺', label: 'Vulnerable', color: '#f472b6' },
  { emoji: '🤩', label: 'Excited', color: '#fb923c' },
  { emoji: '😴', label: 'Tired', color: '#94a3b8' }
];

const PROMPT_TEMPLATES = [
  "What are you most proud of right now?",
  "What challenges are you currently facing?",
  "What do you hope to achieve in the next year?",
  "What advice would you give your future self?",
  "What are you grateful for today?",
  "What's something you want to remember about this moment?",
  "What fears do you have right now?",
  "What makes you happiest these days?",
  "What do you want to let go of?",
  "What are your hopes for the future?",
  "Write a letter to your future self about your current journey",
  "What would make your future self proud?"
];

const DELIVERY_PRESETS = [
  { label: '1 Month', days: 30, emoji: '📅' },
  { label: '3 Months', days: 90, emoji: '🗓️' },
  { label: '6 Months', days: 180, emoji: '📆' },
  { label: '1 Year', days: 365, emoji: '🎉' },
  { label: '2 Years', days: 730, emoji: '🎊' },
  { label: '5 Years', days: 1825, emoji: '🏆' }
];

export default function TimeCapsule({ isOpen, onClose }) {
  const [letters, setLetters] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'write', 'read'
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [unopenedCount, setUnopenedCount] = useState(0);
  
  // Write form state
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedMood, setSelectedMood] = useState('Happy');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showPrompts, setShowPrompts] = useState(false);
  const [isSealed, setIsSealed] = useState(false);

  // Load letters from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const restored = parsed.map(l => ({
          ...l,
          createdAt: new Date(l.createdAt),
          deliveryDate: new Date(l.deliveryDate),
          openedAt: l.openedAt ? new Date(l.openedAt) : null
        }));
        setLetters(restored);
      }
      
      // Check for newly deliverable letters
      checkForDeliverableLetters();
    } catch (err) {
      console.error('Failed to load time capsule:', err);
    }
  }, [isOpen]);

  // Save letters when changed
  useEffect(() => {
    if (letters.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
    }
    
    // Count unopened deliverable letters
    const now = new Date();
    const unopened = letters.filter(l => 
      new Date(l.deliveryDate) <= now && !l.openedAt
    ).length;
    setUnopenedCount(unopened);
  }, [letters]);

  const checkForDeliverableLetters = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    
    const parsed = JSON.parse(saved);
    const now = new Date();
    const deliverable = parsed.filter(l => 
      new Date(l.deliveryDate) <= now && !l.openedAt
    );
    
    if (deliverable.length > 0) {
      // Mark as having unopened letters
      localStorage.setItem(OPENED_KEY, JSON.stringify({
        hasUnopened: true,
        count: deliverable.length,
        checkedAt: now.toISOString()
      }));
    }
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.days);
    const date = new Date();
    date.setDate(date.getDate() + preset.days);
    setDeliveryDate(date.toISOString().split('T')[0]);
  };

  const handleCustomDateChange = (e) => {
    setDeliveryDate(e.target.value);
    setSelectedPreset(null);
  };

  const handleSealLetter = async () => {
    if (!content.trim() || !deliveryDate) return;
    
    setIsSealed(true);
    
    // Simulate sealing animation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newLetter = {
      id: 'capsule-' + Date.now(),
      title: title.trim() || `Letter from ${new Date().toLocaleDateString()}`,
      content: content.trim(),
      mood: selectedMood,
      createdAt: new Date(),
      deliveryDate: new Date(deliveryDate),
      openedAt: null
    };
    
    setLetters(prev => [newLetter, ...prev]);
    
    // Reset form
    setContent('');
    setTitle('');
    setSelectedMood('Happy');
    setDeliveryDate('');
    setSelectedPreset(null);
    setIsSealed(false);
    setViewMode('list');
  };

  const handleOpenLetter = (letter) => {
    const now = new Date();
    if (new Date(letter.deliveryDate) > now) {
      return; // Can't open yet
    }
    
    // Mark as opened
    if (!letter.openedAt) {
      setLetters(prev => prev.map(l => 
        l.id === letter.id ? { ...l, openedAt: new Date() } : l
      ));
    }
    
    setSelectedLetter({ ...letter, openedAt: letter.openedAt || new Date() });
    setViewMode('read');
  };

  const handleDeleteLetter = (letterId) => {
    if (confirm('Are you sure you want to delete this letter?')) {
      setLetters(prev => prev.filter(l => l.id !== letterId));
      if (selectedLetter?.id === letterId) {
        setSelectedLetter(null);
        setViewMode('list');
      }
    }
  };

  const getMoodInfo = (moodLabel) => {
    return MOOD_OPTIONS.find(m => m.label === moodLabel) || MOOD_OPTIONS[0];
  };

  const getLetterStatus = (letter) => {
    const now = new Date();
    const delivery = new Date(letter.deliveryDate);
    
    if (letter.openedAt) return { status: 'opened', label: 'Opened', color: '#4ade80' };
    if (delivery <= now) return { status: 'deliverable', label: 'Ready to Open', color: '#fbbf24' };
    
    const daysUntil = Math.ceil((delivery - now) / (1000 * 60 * 60 * 24));
    return { status: 'sealed', label: `${daysUntil} days left`, color: '#60a5fa' };
  };

  const filteredLetters = useMemo(() => {
    return {
      sealed: letters.filter(l => {
        const status = getLetterStatus(l);
        return status.status === 'sealed';
      }),
      deliverable: letters.filter(l => {
        const status = getLetterStatus(l);
        return status.status === 'deliverable';
      }),
      opened: letters.filter(l => {
        const status = getLetterStatus(l);
        return status.status === 'opened';
      })
    };
  }, [letters]);

  const stats = useMemo(() => ({
    total: letters.length,
    sealed: filteredLetters.sealed.length,
    deliverable: filteredLetters.deliverable.length,
    opened: filteredLetters.opened.length
  }), [letters, filteredLetters]);

  if (!isOpen) return null;

  return (
    <div className="time-capsule-overlay" onClick={onClose}>
      <div className="time-capsule-panel" onClick={e => e.stopPropagation()}>
        <div className="time-capsule-header">
          <h3>⏳ Time Capsule</h3>
          <div className="header-actions">
            {viewMode === 'list' && (
              <button 
                className="create-btn"
                onClick={() => setViewMode('write')}
              >
                ✍️ Write Letter
              </button>
            )}
            {viewMode !== 'list' && (
              <button 
                className="back-btn"
                onClick={() => {
                  setViewMode('list');
                  setSelectedLetter(null);
                }}
              >
                ← Back
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {viewMode === 'list' && (
          <>
            {/* Stats */}
            <div className="capsule-stats">
              <div className="capsule-stat">
                <span className="stat-value">{stats.sealed}</span>
                <span className="stat-label">Sealed</span>
              </div>
              <div className="capsule-stat deliverable">
                <span className="stat-value">{stats.deliverable}</span>
                <span className="stat-label">Ready</span>
              </div>
              <div className="capsule-stat opened">
                <span className="stat-value">{stats.opened}</span>
                <span className="stat-label">Opened</span>
              </div>
              <div className="capsule-stat total">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>

            {/* Unopened notification */}
            {filteredLetters.deliverable.length > 0 && (
              <div className="deliverable-banner">
                <span className="banner-icon">📬</span>
                <span className="banner-text">
                  You have {filteredLetters.deliverable.length} letter{filteredLetters.deliverable.length > 1 ? 's' : ''} ready to open!
                </span>
              </div>
            )}

            {/* Letters List */}
            <div className="letters-container">
              {/* Deliverable Letters */}
              {filteredLetters.deliverable.length > 0 && (
                <div className="letter-section">
                  <h4 className="section-title">📬 Ready to Open</h4>
                  <div className="letters-grid">
                    {filteredLetters.deliverable.map(letter => {
                      const status = getLetterStatus(letter);
                      const mood = getMoodInfo(letter.mood);
                      return (
                        <div 
                          key={letter.id}
                          className="letter-card deliverable"
                          onClick={() => handleOpenLetter(letter)}
                        >
                          <div className="letter-card-header">
                            <span className="letter-mood" style={{ backgroundColor: mood.color }}>
                              {mood.emoji}
                            </span>
                            <span className="letter-status" style={{ color: status.color }}>
                              {status.label}
                            </span>
                          </div>
                          <h5 className="letter-title">{letter.title}</h5>
                          <p className="letter-date">
                            Written {new Date(letter.createdAt).toLocaleDateString()}
                          </p>
                          <p className="letter-delivery">
                            📅 Delivered {new Date(letter.deliveryDate).toLocaleDateString()}
                          </p>
                          <button className="open-letter-btn">
                            🔓 Open Letter
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sealed Letters */}
              {filteredLetters.sealed.length > 0 && (
                <div className="letter-section">
                  <h4 className="section-title">🔒 Sealed Letters</h4>
                  <div className="letters-grid">
                    {filteredLetters.sealed.map(letter => {
                      const status = getLetterStatus(letter);
                      const mood = getMoodInfo(letter.mood);
                      const daysUntil = Math.ceil((new Date(letter.deliveryDate) - new Date()) / (1000 * 60 * 60 * 24));
                      return (
                        <div 
                          key={letter.id}
                          className="letter-card sealed"
                        >
                          <div className="letter-card-header">
                            <span className="letter-mood" style={{ backgroundColor: mood.color }}>
                              {mood.emoji}
                            </span>
                            <span className="letter-status" style={{ color: status.color }}>
                              {status.label}
                            </span>
                          </div>
                          <h5 className="letter-title">{letter.title}</h5>
                          <div className="letter-countdown">
                            <div className="countdown-bar">
                              <div 
                                className="countdown-progress"
                                style={{ 
                                  width: `${Math.max(0, 100 - (daysUntil / 365) * 100)}%`,
                                  backgroundColor: mood.color
                                }}
                              />
                            </div>
                            <span className="countdown-text">{daysUntil} days until delivery</span>
                          </div>
                          <p className="letter-delivery">
                            📅 Opens {new Date(letter.deliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Opened Letters */}
              {filteredLetters.opened.length > 0 && (
                <div className="letter-section">
                  <h4 className="section-title">📖 Opened Letters</h4>
                  <div className="letters-grid">
                    {filteredLetters.opened.map(letter => {
                      const status = getLetterStatus(letter);
                      const mood = getMoodInfo(letter.mood);
                      return (
                        <div 
                          key={letter.id}
                          className="letter-card opened"
                          onClick={() => handleOpenLetter(letter)}
                        >
                          <div className="letter-card-header">
                            <span className="letter-mood" style={{ backgroundColor: mood.color }}>
                              {mood.emoji}
                            </span>
                            <span className="letter-status" style={{ color: status.color }}>
                              {status.label}
                            </span>
                          </div>
                          <h5 className="letter-title">{letter.title}</h5>
                          <p className="letter-date">
                            Written {new Date(letter.createdAt).toLocaleDateString()}
                          </p>
                          <p className="letter-opened">
                            🔓 Opened {new Date(letter.openedAt).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {letters.length === 0 && (
                <div className="empty-capsule">
                  <span className="empty-icon">⏳</span>
                  <h4>Your Time Capsule is Empty</h4>
                  <p>Write a letter to your future self. It will be sealed until the delivery date.</p>
                  <button onClick={() => setViewMode('write')}>
                    ✍️ Write Your First Letter
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === 'write' && (
          <div className="write-letter">
            <div className="write-header">
              <h4>✍️ Write to Your Future Self</h4>
              <p className="write-subtitle">Express your thoughts, hopes, and dreams. This letter will be sealed until the delivery date.</p>
            </div>

            <div className="write-form">
              <div className="form-group">
                <label>Title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., My Hopes for the Future"
                  className="title-input"
                />
              </div>

              <div className="form-group">
                <label>How are you feeling?</label>
                <div className="mood-selector">
                  {MOOD_OPTIONS.map(mood => (
                    <button
                      key={mood.label}
                      type="button"
                      className={`mood-option ${selectedMood === mood.label ? 'selected' : ''}`}
                      onClick={() => setSelectedMood(mood.label)}
                      style={{ '--mood-color': mood.color }}
                    >
                      <span className="mood-emoji">{mood.emoji}</span>
                      <span className="mood-label">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>
                  Your Letter
                  <button 
                    className="prompts-toggle"
                    onClick={() => setShowPrompts(!showPrompts)}
                  >
                    💡 Need inspiration?
                  </button>
                </label>
                
                {showPrompts && (
                  <div className="prompts-panel">
                    <p className="prompts-title">Choose a prompt:</p>
                    <div className="prompts-list">
                      {PROMPT_TEMPLATES.map((prompt, idx) => (
                        <button
                          key={idx}
                          className="prompt-btn"
                          onClick={() => {
                            setContent(prev => prev + (prev ? '\n\n' : '') + prompt + '\n\n');
                            setShowPrompts(false);
                          }}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Dear Future Me..."
                  rows={10}
                  className="letter-textarea"
                  autoFocus
                />
                <span className="char-count">{content.length} characters</span>
              </div>

              <div className="form-group">
                <label>When should this be delivered?</label>
                <div className="delivery-presets">
                  {DELIVERY_PRESETS.map(preset => (
                    <button
                      key={preset.days}
                      type="button"
                      className={`preset-btn ${selectedPreset === preset.days ? 'selected' : ''}`}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <span className="preset-emoji">{preset.emoji}</span>
                      <span className="preset-label">{preset.label}</span>
                    </button>
                  ))}
                </div>
                <div className="custom-date">
                  <label>Or choose a specific date:</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={handleCustomDateChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="date-input"
                  />
                </div>
              </div>

              <div className="seal-preview">
                <div className="wax-seal">
                  <span className="seal-icon">🔒</span>
                  <span className="seal-text">
                    {deliveryDate 
                      ? `Sealed until ${new Date(deliveryDate).toLocaleDateString()}`
                      : 'Choose a delivery date'
                    }
                  </span>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setViewMode('list')}
                  disabled={isSealed}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary seal-btn"
                  onClick={handleSealLetter}
                  disabled={!content.trim() || !deliveryDate || isSealed}
                >
                  {isSealed ? (
                    <>
                      <span className="spinner"></span>
                      Sealing...
                    </>
                  ) : (
                    <>
                      🔒 Seal Letter
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'read' && selectedLetter && (
          <div className="read-letter">
            <div className="read-header">
              <div className="read-meta">
                <span 
                  className="read-mood"
                  style={{ backgroundColor: getMoodInfo(selectedLetter.mood).color }}
                >
                  {getMoodInfo(selectedLetter.mood).emoji} {selectedLetter.mood}
                </span>
                <span className="read-date">
                  Written {new Date(selectedLetter.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="read-title">{selectedLetter.title}</h3>
            </div>

            <div className="read-content">
              <div className="letter-paper">
                <div className="letter-text">
                  {selectedLetter.content.split('\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
                <div className="letter-signature">
                  <p>— Past Me</p>
                  <p className="signature-date">
                    {new Date(selectedLetter.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="read-footer">
              <div className="delivery-info">
                <span className="delivery-label">Delivered:</span>
                <span className="delivery-date">
                  {new Date(selectedLetter.deliveryDate).toLocaleDateString()}
                </span>
                {selectedLetter.openedAt && (
                  <>
                    <span className="delivery-label">Opened:</span>
                    <span className="delivery-date">
                      {new Date(selectedLetter.openedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
              <button 
                className="btn-danger"
                onClick={() => handleDeleteLetter(selectedLetter.id)}
              >
                🗑️ Delete Letter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
