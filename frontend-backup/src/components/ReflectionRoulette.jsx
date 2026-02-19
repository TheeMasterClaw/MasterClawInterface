import React, { useState, useEffect, useCallback } from 'react';
import './ReflectionRoulette.css';

// Curated reflection prompts organized by category
const REFLECTION_PROMPTS = [
  // Mindfulness & Presence
  { text: "What are three things you can hear right now? How do they make you feel?", category: "mindfulness", difficulty: "easy" },
  { text: "Describe your current emotional state in three words. What's driving these feelings?", category: "mindfulness", difficulty: "easy" },
  { text: "What is one thing you're avoiding right now? Why?", category: "mindfulness", difficulty: "medium" },
  { text: "If you could pause time for an hour, what would you do?", category: "mindfulness", difficulty: "easy" },
  { text: "What's one small joy you experienced today that you almost missed?", category: "mindfulness", difficulty: "easy" },
  
  // Personal Growth
  { text: "What belief about yourself have you outgrown but still hold onto?", category: "growth", difficulty: "hard" },
  { text: "What's a mistake you keep repeating? What is it trying to teach you?", category: "growth", difficulty: "medium" },
  { text: "If your younger self could see you now, what would surprise them most?", category: "growth", difficulty: "medium" },
  { text: "What skill or trait have you developed in the last year that you're proud of?", category: "growth", difficulty: "easy" },
  { text: "What's one limiting story you tell yourself? How can you rewrite it?", category: "growth", difficulty: "hard" },
  
  // Relationships
  { text: "Who has influenced you positively recently? Have you told them?", category: "relationships", difficulty: "easy" },
  { text: "What relationship in your life needs more attention? What's one small step you can take?", category: "relationships", difficulty: "medium" },
  { text: "How do you show love to others? Is this how you prefer to receive it?", category: "relationships", difficulty: "medium" },
  { text: "Who can you forgive today, including yourself?", category: "relationships", difficulty: "hard" },
  { text: "What boundary do you need to set or reinforce?", category: "relationships", difficulty: "medium" },
  
  // Values & Purpose
  { text: "What are your top three values? Are your current actions aligned with them?", category: "values", difficulty: "medium" },
  { text: "If you could only work on one project for the next year, what would it be?", category: "values", difficulty: "medium" },
  { text: "What legacy do you want to leave behind?", category: "values", difficulty: "hard" },
  { text: "When do you feel most alive and authentic?", category: "values", difficulty: "easy" },
  { text: "What would you do if you knew you couldn't fail?", category: "values", difficulty: "medium" },
  
  // Future & Dreams
  { text: "What does your ideal day look like five years from now?", category: "future", difficulty: "medium" },
  { text: "What adventure or experience is calling to you right now?", category: "future", difficulty: "easy" },
  { text: "What would you attempt if you had unlimited resources?", category: "future", difficulty: "medium" },
  { text: "What part of your future self are you already becoming?", category: "future", difficulty: "hard" },
  
  // Gratitude & Appreciation
  { text: "What challenge are you grateful for today?", category: "gratitude", difficulty: "medium" },
  { text: "Who or what made your life better this week?", category: "gratitude", difficulty: "easy" },
  { text: "What privilege do you have that you often take for granted?", category: "gratitude", difficulty: "medium" },
  { text: "What's something beautiful you noticed today?", category: "gratitude", difficulty: "easy" },
  
  // Courage & Fear
  { text: "What are you most afraid of right now? What's the worst that could happen?", category: "courage", difficulty: "hard" },
  { text: "When was the last time you stepped outside your comfort zone?", category: "courage", difficulty: "easy" },
  { text: "What would you do if you weren't worried about others' opinions?", category: "courage", difficulty: "medium" },
  { text: "What's a risk you've been wanting to take? What's holding you back?", category: "courage", difficulty: "medium" },
  
  // Work & Career
  { text: "What part of your work energizes you? What drains you?", category: "work", difficulty: "easy" },
  { text: "If money weren't a factor, how would your career change?", category: "work", difficulty: "medium" },
  { text: "What problem in the world do you feel called to help solve?", category: "work", difficulty: "hard" },
  { text: "What's one professional skill you'd like to develop? Why?", category: "work", difficulty: "easy" },
  
  // Self-Compassion
  { text: "What would you tell a friend who is going through what you're experiencing?", category: "selfcare", difficulty: "medium" },
  { text: "How can you be kinder to yourself today?", category: "selfcare", difficulty: "easy" },
  { text: "What are you holding onto that you need to release?", category: "selfcare", difficulty: "medium" },
  { text: "When did you last celebrate yourself? What for?", category: "selfcare", difficulty: "easy" },
  
  // Creativity & Play
  { text: "What creative activity did you enjoy as a child? When did you last do it?", category: "creativity", difficulty: "easy" },
  { text: "If you had to create something this week, what would it be?", category: "creativity", difficulty: "medium" },
  { text: "When do you lose track of time? What does this tell you about your passions?", category: "creativity", difficulty: "medium" },
  { text: "What's a crazy idea you've been afraid to share?", category: "creativity", difficulty: "hard" }
];

const CATEGORIES = {
  all: { label: 'All Prompts', icon: '🎲', color: '#8b5cf6' },
  mindfulness: { label: 'Mindfulness', icon: '🧘', color: '#10b981' },
  growth: { label: 'Personal Growth', icon: '🌱', color: '#22c55e' },
  relationships: { label: 'Relationships', icon: '💝', color: '#f43f5e' },
  values: { label: 'Values & Purpose', icon: '🎯', color: '#f59e0b' },
  future: { label: 'Future & Dreams', icon: '🔮', color: '#8b5cf6' },
  gratitude: { label: 'Gratitude', icon: '🙏', color: '#eab308' },
  courage: { label: 'Courage & Fear', icon: '🦁', color: '#ef4444' },
  work: { label: 'Work & Career', icon: '💼', color: '#3b82f6' },
  selfcare: { label: 'Self-Compassion', icon: '💚', color: '#ec4899' },
  creativity: { label: 'Creativity & Play', icon: '🎨', color: '#a855f7' }
};

const DIFFICULTY_LABELS = {
  easy: { label: 'Gentle', color: '#10b981' },
  medium: { label: 'Thoughtful', color: '#f59e0b' },
  hard: { label: 'Deep', color: '#ef4444' }
};

export default function ReflectionRoulette({ isOpen, onClose }) {
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [reflection, setReflection] = useState('');
  const [savedReflections, setSavedReflections] = useState([]);
  const [view, setView] = useState('roulette'); // roulette, browse, history, favorites
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSpinning, setIsSpinning] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [streak, setStreak] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({ total: 0, categories: {}, streak: 0 });

  // Load data on mount
  useEffect(() => {
    if (!isOpen) return;
    
    const saved = localStorage.getItem('mc-reflections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedReflections(parsed);
        updateStats(parsed);
      } catch (e) {
        console.error('Failed to parse reflections:', e);
      }
    }
    
    const savedFavorites = localStorage.getItem('mc-reflection-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }
    
    const savedStreak = localStorage.getItem('mc-reflection-streak');
    if (savedStreak) {
      try {
        const { count, lastDate } = JSON.parse(savedStreak);
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (lastDate === today) {
          setStreak(count);
        } else if (lastDate === yesterday) {
          setStreak(count); // Will update if they reflect today
        } else {
          setStreak(0);
        }
      } catch (e) {
        setStreak(0);
      }
    }
    
    // Set initial random prompt
    spinRoulette(false);
  }, [isOpen]);

  const updateStats = (reflections) => {
    const categoryCount = {};
    reflections.forEach(r => {
      const cat = r.prompt.category;
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    setStats({
      total: reflections.length,
      categories: categoryCount,
      streak: streak
    });
  };

  const spinRoulette = useCallback((animate = true) => {
    if (animate) {
      setIsSpinning(true);
      setReflection('');
      
      // Animate through several prompts
      let spins = 0;
      const maxSpins = 8;
      const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * getFilteredPrompts().length);
        setCurrentPrompt(getFilteredPrompts()[randomIndex]);
        spins++;
        
        if (spins >= maxSpins) {
          clearInterval(interval);
          setIsSpinning(false);
        }
      }, 100);
    } else {
      const filtered = getFilteredPrompts();
      setCurrentPrompt(filtered[Math.floor(Math.random() * filtered.length)]);
    }
  }, [selectedCategory]);

  const getFilteredPrompts = () => {
    if (selectedCategory === 'all') return REFLECTION_PROMPTS;
    return REFLECTION_PROMPTS.filter(p => p.category === selectedCategory);
  };

  const saveReflection = () => {
    if (!reflection.trim() || !currentPrompt) return;
    
    const newReflection = {
      id: Date.now(),
      prompt: currentPrompt,
      response: reflection.trim(),
      createdAt: new Date().toISOString(),
      date: new Date().toDateString()
    };
    
    const updated = [newReflection, ...savedReflections];
    setSavedReflections(updated);
    localStorage.setItem('mc-reflections', JSON.stringify(updated));
    
    // Update streak
    const today = new Date().toDateString();
    const savedStreak = localStorage.getItem('mc-reflection-streak');
    let newStreak = 1;
    
    if (savedStreak) {
      try {
        const { count, lastDate } = JSON.parse(savedStreak);
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (lastDate === today) {
          newStreak = count;
        } else if (lastDate === yesterday) {
          newStreak = count + 1;
        }
      } catch (e) {}
    }
    
    localStorage.setItem('mc-reflection-streak', JSON.stringify({ count: newStreak, lastDate: today }));
    setStreak(newStreak);
    
    updateStats(updated);
    setReflection('');
    showToastMessage('Reflection saved ✨');
  };

  const toggleFavorite = (prompt) => {
    setFavorites(prev => {
      const exists = prev.some(p => p.text === prompt.text);
      let updated;
      if (exists) {
        updated = prev.filter(p => p.text !== prompt.text);
        showToastMessage('Removed from favorites');
      } else {
        updated = [...prev, { ...prompt, savedAt: new Date().toISOString() }];
        showToastMessage('Added to favorites');
      }
      localStorage.setItem('mc-reflection-favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteReflection = (id) => {
    if (!confirm('Delete this reflection?')) return;
    const updated = savedReflections.filter(r => r.id !== id);
    setSavedReflections(updated);
    localStorage.setItem('mc-reflections', JSON.stringify(updated));
    updateStats(updated);
    showToastMessage('Reflection deleted');
  };

  const showToastMessage = (message) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 2000);
  };

  const isFavorited = (prompt) => {
    return favorites.some(p => p.text === prompt?.text);
  };

  const exportReflections = () => {
    const data = JSON.stringify(savedReflections, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reflections-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToastMessage('Reflections exported');
  };

  if (!isOpen) return null;

  return (
    <div className="reflection-overlay" onClick={onClose}>
      <div className="reflection-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="reflection-header">
          <div className="reflection-title">
            <span className="reflection-icon">🎲</span>
            <h2>Reflection Roulette</h2>
          </div>
          <div className="reflection-nav">
            <button 
              className={view === 'roulette' ? 'active' : ''}
              onClick={() => setView('roulette')}
              title="Roulette"
            >
              🎲
            </button>
            <button 
              className={view === 'browse' ? 'active' : ''}
              onClick={() => setView('browse')}
              title="Browse"
            >
              🔍
            </button>
            <button 
              className={view === 'history' ? 'active' : ''}
              onClick={() => setView('history')}
              title={`History (${savedReflections.length})`}
            >
              📚
            </button>
            <button 
              className={view === 'favorites' ? 'active' : ''}
              onClick={() => setView('favorites')}
              title={`Favorites (${favorites.length})`}
            >
              ⭐
            </button>
            <button onClick={onClose} title="Close">×</button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="reflection-stats-bar">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{streak}</span>
            <span className="stat-label">Day Streak</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{Object.keys(stats.categories).length}</span>
            <span className="stat-label">Categories</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{favorites.length}</span>
            <span className="stat-label">Favorites</span>
          </div>
        </div>

        {/* Toast */}
        {showToast && (
          <div className="reflection-toast">{showToast}</div>
        )}

        {/* Roulette View */}
        {view === 'roulette' && (
          <div className="reflection-roulette">
            {/* Category Filter */}
            <div className="roulette-filter">
              <select 
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setTimeout(() => spinRoulette(false), 100);
                }}
              >
                {Object.entries(CATEGORIES).map(([key, { label, icon }]) => (
                  <option key={key} value={key}>{icon} {label}</option>
                ))}
              </select>
            </div>

            {/* Prompt Card */}
            {currentPrompt && (
              <div className={`prompt-card ${isSpinning ? 'spinning' : ''}`}>
                <div className="prompt-header">
                  <span 
                    className="prompt-category"
                    style={{ backgroundColor: CATEGORIES[currentPrompt.category]?.color + '20', 
                             color: CATEGORIES[currentPrompt.category]?.color }}
                  >
                    {CATEGORIES[currentPrompt.category]?.icon} {CATEGORIES[currentPrompt.category]?.label}
                  </span>
                  <span 
                    className="prompt-difficulty"
                    style={{ color: DIFFICULTY_LABELS[currentPrompt.difficulty]?.color }}
                  >
                    {DIFFICULTY_LABELS[currentPrompt.difficulty]?.label}
                  </span>
                </div>
                
                <div className="prompt-text">
                  "{currentPrompt.text}"
                </div>

                <div className="prompt-actions">
                  <button 
                    className={`prompt-favorite ${isFavorited(currentPrompt) ? 'active' : ''}`}
                    onClick={() => toggleFavorite(currentPrompt)}
                  >
                    {isFavorited(currentPrompt) ? '⭐' : '☆'}
                  </button>
                  <button 
                    className="spin-btn"
                    onClick={() => spinRoulette(true)}
                    disabled={isSpinning}
                  >
                    {isSpinning ? '🎲 Spinning...' : '🎲 Spin Again'}
                  </button>
                </div>
              </div>
            )}

            {/* Reflection Input */}
            <div className="reflection-input-section">
              <textarea
                className="reflection-textarea"
                placeholder="Take a moment to reflect... Write your thoughts here."
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={5}
              />
              <div className="reflection-input-actions">
                <span className="reflection-hint">
                  {reflection.length} characters
                </span>
                <button 
                  className="save-reflection-btn"
                  onClick={saveReflection}
                  disabled={!reflection.trim()}
                >
                  Save Reflection ✨
                </button>
              </div>
            </div>

            {/* Tip */}
            <div className="reflection-tip">
              💡 Tip: There's no right or wrong answer. Be honest with yourself.
            </div>
          </div>
        )}

        {/* Browse View */}
        {view === 'browse' && (
          <div className="reflection-browse">
            <div className="category-filters">
              {Object.entries(CATEGORIES).map(([key, { label, icon, color }]) => (
                <button
                  key={key}
                  className={selectedCategory === key ? 'active' : ''}
                  onClick={() => setSelectedCategory(key)}
                  style={{ 
                    borderColor: selectedCategory === key ? color : 'transparent',
                    backgroundColor: selectedCategory === key ? color + '15' : undefined
                  }}
                >
                  <span style={{ color }}>{icon}</span> {label}
                </button>
              ))}
            </div>

            <div className="prompts-grid">
              {getFilteredPrompts().map((prompt, index) => (
                <div 
                  key={index} 
                  className="prompt-card mini"
                  onClick={() => {
                    setCurrentPrompt(prompt);
                    setView('roulette');
                  }}
                >
                  <div className="prompt-card-header">
                    <span 
                      className="mini-category"
                      style={{ color: CATEGORIES[prompt.category]?.color }}
                    >
                      {CATEGORIES[prompt.category]?.icon}
                    </span>
                    <button 
                      className={`mini-favorite ${isFavorited(prompt) ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prompt);
                      }}
                    >
                      {isFavorited(prompt) ? '⭐' : '☆'}
                    </button>
                  </div>
                  <p className="mini-text">{prompt.text}</p>
                  <span 
                    className="mini-difficulty"
                    style={{ color: DIFFICULTY_LABELS[prompt.difficulty]?.color }}
                  >
                    {DIFFICULTY_LABELS[prompt.difficulty]?.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History View */}
        {view === 'history' && (
          <div className="reflection-history">
            {savedReflections.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No reflections yet</h3>
                <p>Start your journey of self-discovery in the Roulette tab</p>
              </div>
            ) : (
              <>
                <div className="history-header">
                  <span>{savedReflections.length} reflection{savedReflections.length !== 1 ? 's' : ''}</span>
                  <button className="export-btn" onClick={exportReflections}>
                    📥 Export
                  </button>
                </div>
                <div className="reflections-list">
                  {savedReflections.map((item) => (
                    <div key={item.id} className="reflection-item">
                      <div className="reflection-item-header">
                        <div className="reflection-meta">
                          <span 
                            className="reflection-category"
                            style={{ color: CATEGORIES[item.prompt.category]?.color }}
                          >
                            {CATEGORIES[item.prompt.category]?.icon} {CATEGORIES[item.prompt.category]?.label}
                          </span>
                          <span className="reflection-date">
                            {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <button 
                          className="delete-reflection"
                          onClick={() => deleteReflection(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="reflection-prompt">{item.prompt.text}</div>
                      <div className="reflection-response">{item.response}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Favorites View */}
        {view === 'favorites' && (
          <div className="reflection-favorites">
            {favorites.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">⭐</div>
                <h3>No favorites yet</h3>
                <p>Star prompts that resonate with you while browsing</p>
              </div>
            ) : (
              <>
                <div className="favorites-header">
                  <span>{favorites.length} favorite{favorites.length !== 1 ? 's' : ''}</span>
                  <button 
                    className="clear-btn"
                    onClick={() => {
                      if (confirm('Clear all favorites?')) {
                        setFavorites([]);
                        localStorage.removeItem('mc-reflection-favorites');
                      }
                    }}
                  >
                    Clear All
                  </button>
                </div>
                <div className="prompts-grid">
                  {favorites.map((prompt, index) => (
                    <div 
                      key={index} 
                      className="prompt-card mini"
                      onClick={() => {
                        setCurrentPrompt(prompt);
                        setView('roulette');
                      }}
                    >
                      <div className="prompt-card-header">
                        <span 
                          className="mini-category"
                          style={{ color: CATEGORIES[prompt.category]?.color }}
                        >
                          {CATEGORIES[prompt.category]?.icon}
                        </span>
                        <button 
                          className="mini-favorite active"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(prompt);
                          }}
                        >
                          ⭐
                        </button>
                      </div>
                      <p className="mini-text">{prompt.text}</p>
                      <span className="saved-date">
                        Saved {new Date(prompt.savedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
