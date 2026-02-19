import React, { useState, useEffect, useMemo } from 'react';
import './ReflectionStudio.css';

const REFLECTION_CATEGORIES = {
  morning: {
    icon: '🌅',
    title: 'Morning Intention',
    color: '#f59e0b',
    prompts: [
      "What is one thing you're looking forward to today?",
      "What intention do you want to set for today?",
      "How do you want to feel by the end of today?",
      "What would make today great?",
      "What is one small act of kindness you could do today?",
      "What is your main focus for today?",
      "What are you grateful for this morning?"
    ]
  },
  evening: {
    icon: '🌙',
    title: 'Evening Reflection',
    color: '#6366f1',
    prompts: [
      "What was the best part of your day?",
      "What did you learn today?",
      "What are you proud of from today?",
      "What would you do differently if you could relive today?",
      "Who made your day better today?",
      "What challenged you today and how did you handle it?",
      "What are you grateful for from today?"
    ]
  },
  weekly: {
    icon: '📅',
    title: 'Weekly Review',
    color: '#8b5cf6',
    prompts: [
      "What were your top 3 wins this week?",
      "What patterns did you notice in your mood/energy?",
      "What did you learn about yourself this week?",
      "How did you grow this week?",
      "What do you want to carry forward into next week?",
      "What do you want to leave behind?",
      "What are you most proud of from this week?"
    ]
  },
  lettingGo: {
    icon: '🕊️',
    title: 'Letting Go',
    color: '#14b8a6',
    prompts: [
      "What worry can you release right now?",
      "What no longer serves you?",
      "What expectation can you let go of?",
      "What mistake are you ready to forgive yourself for?",
      "What burden can you set down?",
      "What negative thought pattern can you release?",
      "What control can you surrender?"
    ]
  },
  gratitude: {
    icon: '🙏',
    title: 'Deep Gratitude',
    color: '#ec4899',
    prompts: [
      "What simple pleasure are you grateful for?",
      "Who has positively impacted your life recently?",
      "What opportunity do you have that others might not?",
      "What about your body are you grateful for?",
      "What challenge has taught you something valuable?",
      "What in nature brings you joy?",
      "What comfort do you have that you often take for granted?"
    ]
  },
  future: {
    icon: '🔮',
    title: 'Future Self',
    color: '#3b82f6',
    prompts: [
      "What advice would your future self give you right now?",
      "What is one step you can take toward your dream?",
      "Who do you want to become in the next year?",
      "What habits does your ideal self have?",
      "What would you do if you knew you couldn't fail?",
      "What legacy do you want to leave?",
      "What does success look like to you?"
    ]
  }
};

const MOOD_REFLECTIONS = {
  amazing: {
    emoji: '🤩',
    color: '#0891b2',
    message: "You're feeling amazing! What contributed to this high? How can you create more of this?",
    suggestions: ['Celebrate this moment', 'Share your joy with someone', 'Capture what worked']
  },
  good: {
    emoji: '🙂',
    color: '#16a34a',
    message: "You're in a good place. What's sustaining this positive state?",
    suggestions: ['Express gratitude', 'Pay it forward', 'Set an intention to maintain this']
  },
  okay: {
    emoji: '😐',
    color: '#ca8a04',
    message: "You're feeling neutral. Sometimes okay is exactly where we need to be.",
    suggestions: ['Practice self-compassion', 'Do something small that brings joy', 'Check in with your body']
  },
  low: {
    emoji: '😔',
    color: '#ea580c',
    message: "You're having a tough time. Be gentle with yourself right now.",
    suggestions: ['Practice self-care', 'Reach out to someone', 'Remember: this feeling is temporary']
  },
  difficult: {
    emoji: '😫',
    color: '#dc2626',
    message: "You're going through something difficult. It's okay to not be okay.",
    suggestions: ['Be extra kind to yourself', 'Consider what support you need', 'This too shall pass']
  }
};

export default function ReflectionStudio({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('reflect');
  const [selectedCategory, setSelectedCategory] = useState('evening');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [reflections, setReflections] = useState([]);
  const [wins, setWins] = useState([]);
  const [lettingGoItems, setLettingGoItems] = useState([]);
  const [gratitudeItems, setGratitudeItems] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [showMoodDetail, setShowMoodDetail] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastReflectionDate, setLastReflectionDate] = useState(null);

  // Load data from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-reflections');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setReflections(data.reflections || []);
          setWins(data.wins || []);
          setLettingGoItems(data.lettingGoItems || []);
          setGratitudeItems(data.gratitudeItems || []);
          setStreak(data.streak || 0);
          setLastReflectionDate(data.lastReflectionDate || null);
        } catch (e) {
          console.error('Failed to parse reflections:', e);
        }
      }
    }
  }, [isOpen]);

  // Save data to localStorage
  const saveData = (data) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-reflections', JSON.stringify({
        reflections: data.reflections || reflections,
        wins: data.wins || wins,
        lettingGoItems: data.lettingGoItems || lettingGoItems,
        gratitudeItems: data.gratitudeItems || gratitudeItems,
        streak: data.streak !== undefined ? data.streak : streak,
        lastReflectionDate: data.lastReflectionDate !== undefined ? data.lastReflectionDate : lastReflectionDate
      }));
    }
  };

  // Update streak
  const updateStreak = () => {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    let newStreak = streak;
    if (lastReflectionDate === yesterday.toDateString()) {
      newStreak = streak + 1;
    } else if (lastReflectionDate !== today) {
      newStreak = 1;
    }
    
    setStreak(newStreak);
    setLastReflectionDate(today);
    saveData({ streak: newStreak, lastReflectionDate: today });
  };

  // Get random prompt from category
  const getRandomPrompt = (category) => {
    const prompts = REFLECTION_CATEGORIES[category].prompts;
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  // Start reflection
  const startReflection = (category) => {
    setSelectedCategory(category);
    setCurrentPrompt(getRandomPrompt(category));
    setShowInput(true);
    setInputText('');
  };

  // Save reflection
  const saveReflection = () => {
    if (!inputText.trim()) return;

    const newReflection = {
      id: Date.now().toString(),
      category: selectedCategory,
      prompt: currentPrompt,
      response: inputText.trim(),
      timestamp: new Date().toISOString(),
      mood: selectedMood
    };

    const updated = [newReflection, ...reflections];
    setReflections(updated);
    saveData({ reflections: updated });
    updateStreak();
    
    setShowInput(false);
    setInputText('');
    setSelectedMood(null);
  };

  // Add win
  const addWin = () => {
    if (!inputText.trim()) return;
    
    const newWin = {
      id: Date.now().toString(),
      text: inputText.trim(),
      date: new Date().toISOString(),
      celebrated: false
    };
    
    const updated = [newWin, ...wins];
    setWins(updated);
    saveData({ wins: updated });
    setInputText('');
  };

  // Add letting go item
  const addLettingGo = () => {
    if (!inputText.trim()) return;
    
    const newItem = {
      id: Date.now().toString(),
      text: inputText.trim(),
      date: new Date().toISOString(),
      released: false
    };
    
    const updated = [newItem, ...lettingGoItems];
    setLettingGoItems(updated);
    saveData({ lettingGoItems: updated });
    setInputText('');
  };

  // Release letting go item
  const releaseItem = (id) => {
    const updated = lettingGoItems.map(item => 
      item.id === id ? { ...item, released: true, releasedAt: new Date().toISOString() } : item
    );
    setLettingGoItems(updated);
    saveData({ lettingGoItems: updated });
  };

  // Add gratitude
  const addGratitude = () => {
    if (!inputText.trim()) return;
    
    const newItem = {
      id: Date.now().toString(),
      text: inputText.trim(),
      date: new Date().toISOString()
    };
    
    const updated = [newItem, ...gratitudeItems];
    setGratitudeItems(updated);
    saveData({ gratitudeItems: updated });
    setInputText('');
  };

  // Celebrate win
  const celebrateWin = (id) => {
    const updated = wins.map(win => 
      win.id === id ? { ...win, celebrated: true, celebratedAt: new Date().toISOString() } : win
    );
    setWins(updated);
    saveData({ wins: updated });
  };

  // Delete item
  const deleteItem = (type, id) => {
    if (!confirm('Delete this item?')) return;
    
    switch(type) {
      case 'reflection':
        const updatedReflections = reflections.filter(r => r.id !== id);
        setReflections(updatedReflections);
        saveData({ reflections: updatedReflections });
        break;
      case 'win':
        const updatedWins = wins.filter(w => w.id !== id);
        setWins(updatedWins);
        saveData({ wins: updatedWins });
        break;
      case 'lettingGo':
        const updatedLettingGo = lettingGoItems.filter(l => l.id !== id);
        setLettingGoItems(updatedLettingGo);
        saveData({ lettingGoItems: updatedLettingGo });
        break;
      case 'gratitude':
        const updatedGratitude = gratitudeItems.filter(g => g.id !== id);
        setGratitudeItems(updatedGratitude);
        saveData({ gratitudeItems: updatedGratitude });
        break;
    }
  };

  // Get today's wins
  const getTodayWins = () => {
    const today = new Date().toDateString();
    return wins.filter(w => new Date(w.date).toDateString() === today);
  };

  // Get today's gratitude
  const getTodayGratitude = () => {
    const today = new Date().toDateString();
    return gratitudeItems.filter(g => new Date(g.date).toDateString() === today);
  };

  // Get recent reflections
  const getRecentReflections = () => {
    return reflections.slice(0, 10);
  };

  const todayWins = getTodayWins();
  const todayGratitude = getTodayGratitude();
  const recentReflections = getRecentReflections();
  const activeLettingGo = lettingGoItems.filter(l => !l.released);
  const releasedItems = lettingGoItems.filter(l => l.released);

  if (!isOpen) return null;

  return (
    <div className="reflection-panel-overlay" onClick={onClose}>
      <div className="reflection-panel" onClick={e => e.stopPropagation()}>
        <div className="reflection-panel-header">
          <div className="header-left">
            <h3>🧘 Reflection Studio</h3>
            <div className="streak-badge">
              🔥 {streak} day{streak !== 1 ? 's' : ''}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tab Navigation */}
        <div className="reflection-tabs">
          <button 
            className={activeTab === 'reflect' ? 'active' : ''}
            onClick={() => setActiveTab('reflect')}
          >
            📝 Reflect
          </button>
          <button 
            className={activeTab === 'wins' ? 'active' : ''}
            onClick={() => setActiveTab('wins')}
          >
            🏆 Wins
          </button>
          <button 
            className={activeTab === 'gratitude' ? 'active' : ''}
            onClick={() => setActiveTab('gratitude')}
          >
            🙏 Gratitude
          </button>
          <button 
            className={activeTab === 'lettinggo' ? 'active' : ''}
            onClick={() => setActiveTab('lettinggo')}
          >
            🕊️ Let Go
          </button>
          <button 
            className={activeTab === 'history' ? 'active' : ''}
            onClick={() => setActiveTab('history')}
          >
            📜 History
          </button>
        </div>

        {/* Reflect Tab */}
        {activeTab === 'reflect' && (
          <div className="tab-content">
            {!showInput ? (
              <>
                <div className="tab-intro">
                  <p>Choose a reflection practice to cultivate mindfulness and self-awareness.</p>
                </div>
                
                <div className="category-grid">
                  {Object.entries(REFLECTION_CATEGORIES).map(([key, category]) => (
                    <button
                      key={key}
                      className="category-card"
                      onClick={() => startReflection(key)}
                      style={{ '--category-color': category.color }}
                    >
                      <span className="category-icon">{category.icon}</span>
                      <span className="category-title">{category.title}</span>
                      <span className="category-count">
                        {reflections.filter(r => r.category === key).length} reflections
                      </span>
                    </button>
                  ))}
                </div>

                {reflections.length > 0 && (
                  <div className="recent-reflections-preview">
                    <h4>Recent Reflections</h4>
                    {reflections.slice(0, 3).map(r => (
                      <div key={r.id} className="preview-item">
                        <span className="preview-category">
                          {REFLECTION_CATEGORIES[r.category]?.icon}
                        </span>
                        <span className="preview-text">
                          {r.response.substring(0, 60)}{r.response.length > 60 ? '...' : ''}
                        </span>
                        <span className="preview-date">
                          {new Date(r.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="reflection-input">
                <div className="input-header">
                  <button className="back-btn" onClick={() => setShowInput(false)}>
                    ← Back
                  </button>
                  <span 
                    className="category-tag"
                    style={{ color: REFLECTION_CATEGORIES[selectedCategory].color }}
                  >
                    {REFLECTION_CATEGORIES[selectedCategory].icon} {REFLECTION_CATEGORIES[selectedCategory].title}
                  </span>
                </div>

                <div className="prompt-card">
                  <p className="prompt-text">{currentPrompt}</p>
                  <button 
                    className="shuffle-btn"
                    onClick={() => setCurrentPrompt(getRandomPrompt(selectedCategory))}
                    title="Get new prompt"
                  >
                    🎲
                  </button>
                </div>

                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Take your time to reflect..."
                  rows={6}
                  autoFocus
                />

                <div className="mood-selector">
                  <label>How are you feeling right now?</label>
                  <div className="mood-options">
                    {Object.entries(MOOD_REFLECTIONS).map(([key, mood]) => (
                      <button
                        key={key}
                        className={`mood-btn ${selectedMood === key ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedMood(key);
                          setShowMoodDetail(true);
                        }}
                        style={{ 
                          backgroundColor: selectedMood === key ? `${mood.color}30` : 'transparent',
                          borderColor: selectedMood === key ? mood.color : undefined
                        }}
                      >
                        <span className="mood-emoji">{mood.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {showMoodDetail && selectedMood && (
                  <div 
                    className="mood-detail"
                    style={{ borderColor: MOOD_REFLECTIONS[selectedMood].color }}
                  >
                    <p style={{ color: MOOD_REFLECTIONS[selectedMood].color }}>
                      {MOOD_REFLECTIONS[selectedMood].message}
                    </p>
                    <div className="mood-suggestions">
                      {MOOD_REFLECTIONS[selectedMood].suggestions.map((s, i) => (
                        <span key={i} className="suggestion">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  className="save-btn"
                  onClick={saveReflection}
                  disabled={!inputText.trim()}
                >
                  Save Reflection
                </button>
              </div>
            )}
          </div>
        )}

        {/* Wins Tab */}
        {activeTab === 'wins' && (
          <div className="tab-content">
            <div className="input-section">
              <div className="input-row">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addWin()}
                  placeholder="What's a win you want to celebrate?"
                />
                <button onClick={addWin} disabled={!inputText.trim()}>
                  Add Win
                </button>
              </div>
            </div>

            {todayWins.length > 0 && (
              <div className="today-section">
                <h4>🌟 Today's Wins ({todayWins.length})</h4>
                <div className="wins-list">
                  {todayWins.map(win => (
                    <div key={win.id} className={`win-item ${win.celebrated ? 'celebrated' : ''}`}>
                      <span className="win-text">{win.text}</span>
                      <div className="win-actions">
                        {!win.celebrated && (
                          <button 
                            className="celebrate-btn"
                            onClick={() => celebrateWin(win.id)}
                            title="Celebrate!"
                          >
                            🎉
                          </button>
                        )}
                        <button 
                          className="delete-btn"
                          onClick={() => deleteItem('win', win.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wins.filter(w => new Date(w.date).toDateString() !== new Date().toDateString()).length > 0 && (
              <div className="past-section">
                <h4>📅 Previous Wins</h4>
                <div className="wins-list">
                  {wins
                    .filter(w => new Date(w.date).toDateString() !== new Date().toDateString())
                    .slice(0, 10)
                    .map(win => (
                      <div key={win.id} className={`win-item ${win.celebrated ? 'celebrated' : ''}`}>
                        <span className="win-text">{win.text}</span>
                        <span className="win-date">
                          {new Date(win.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {wins.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">🏆</span>
                <p>No wins yet</p>
                <span>Celebrate your achievements, big and small!</span>
              </div>
            )}
          </div>
        )}

        {/* Gratitude Tab */}
        {activeTab === 'gratitude' && (
          <div className="tab-content">
            <div className="input-section">
              <div className="input-row">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addGratitude()}
                  placeholder="What are you grateful for right now?"
                />
                <button onClick={addGratitude} disabled={!inputText.trim()}>
                  Add
                </button>
              </div>
            </div>

            {todayGratitude.length > 0 && (
              <div className="today-section">
                <h4>💝 Today's Gratitude ({todayGratitude.length})</h4>
                <div className="gratitude-list">
                  {todayGratitude.map(item => (
                    <div key={item.id} className="gratitude-item">
                      <span className="gratitude-text">{item.text}</span>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteItem('gratitude', item.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gratitudeItems.filter(g => new Date(g.date).toDateString() !== new Date().toDateString()).length > 0 && (
              <div className="past-section">
                <h4>📅 Past Gratitude</h4>
                <div className="gratitude-list">
                  {gratitudeItems
                    .filter(g => new Date(g.date).toDateString() !== new Date().toDateString())
                    .slice(0, 10)
                    .map(item => (
                      <div key={item.id} className="gratitude-item">
                        <span className="gratitude-text">{item.text}</span>
                        <span className="gratitude-date">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {gratitudeItems.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">🙏</span>
                <p>No gratitude entries yet</p>
                <span>Start noticing the good in your life!</span>
              </div>
            )}
          </div>
        )}

        {/* Letting Go Tab */}
        {activeTab === 'lettinggo' && (
          <div className="tab-content">
            <div className="input-section">
              <div className="input-row">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addLettingGo()}
                  placeholder="What do you want to let go of?"
                />
                <button onClick={addLettingGo} disabled={!inputText.trim()}>
                  Add
                </button>
              </div>
            </div>

            {activeLettingGo.length > 0 && (
              <div className="active-section">
                <h4>🎈 Ready to Release ({activeLettingGo.length})</h4>
                <div className="lettinggo-list">
                  {activeLettingGo.map(item => (
                    <div key={item.id} className="lettinggo-item">
                      <span className="lettinggo-text">{item.text}</span>
                      <div className="lettinggo-actions">
                        <button 
                          className="release-btn"
                          onClick={() => releaseItem(item.id)}
                        >
                          🕊️ Release
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteItem('lettingGo', item.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {releasedItems.length > 0 && (
              <div className="released-section">
                <h4>✨ Released ({releasedItems.length})</h4>
                <div className="released-list">
                  {releasedItems.slice(0, 5).map(item => (
                    <div key={item.id} className="released-item">
                      <span className="released-text">{item.text}</span>
                      <span className="released-date">
                        Released {new Date(item.releasedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lettingGoItems.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">🕊️</span>
                <p>Nothing to release</p>
                <span>Add something you're ready to let go of</span>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="tab-content">
            {recentReflections.length > 0 ? (
              <div className="history-list">
                {recentReflections.map(reflection => (
                  <div key={reflection.id} className="history-item">
                    <div className="history-header">
                      <span 
                        className="history-category"
                        style={{ color: REFLECTION_CATEGORIES[reflection.category]?.color }}
                      >
                        {REFLECTION_CATEGORIES[reflection.category]?.icon} {REFLECTION_CATEGORIES[reflection.category]?.title}
                      </span>
                      <span className="history-date">
                        {new Date(reflection.timestamp).toLocaleDateString()} at{' '}
                        {new Date(reflection.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="history-prompt">{reflection.prompt}</p>
                    <p className="history-response">{reflection.response}</p>
                    {reflection.mood && (
                      <span 
                        className="history-mood"
                        style={{ color: MOOD_REFLECTIONS[reflection.mood]?.color }}
                      >
                        {MOOD_REFLECTIONS[reflection.mood]?.emoji} {reflection.mood}
                      </span>
                    )}
                    <button 
                      className="delete-btn"
                      onClick={() => deleteItem('reflection', reflection.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📜</span>
                <p>No reflections yet</p>
                <span>Your reflection history will appear here</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
