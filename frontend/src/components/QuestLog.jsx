'use client';

import React, { useState, useEffect } from 'react';
// import './QuestLog.css';

const DIFFICULTY_LEVELS = {
  easy: { label: 'Easy', xp: 50, color: '#22d3ee', icon: '🌱' },
  medium: { label: 'Medium', xp: 100, color: '#fbbf24', icon: '⚡' },
  hard: { label: 'Hard', xp: 200, color: '#f472b6', icon: '🔥' },
  epic: { label: 'Epic', xp: 500, color: '#a78bfa', icon: '👑' }
};

const CATEGORIES = {
  personal: { label: 'Personal', icon: '🎯' },
  work: { label: 'Career', icon: '💼' },
  health: { label: 'Health', icon: '💪' },
  learning: { label: 'Learning', icon: '📚' },
  creative: { label: 'Creative', icon: '🎨' },
  social: { label: 'Social', icon: '🤝' }
};

const ACHIEVEMENTS = [
  { id: 'first_quest', name: 'First Steps', description: 'Complete your first quest', icon: '🏃', condition: (stats) => stats.completedQuests >= 1 },
  { id: 'quest_master', name: 'Quest Master', description: 'Complete 10 quests', icon: '🏆', condition: (stats) => stats.completedQuests >= 10 },
  { id: 'xp_hunter', name: 'XP Hunter', description: 'Earn 1000 XP total', icon: '💎', condition: (stats) => stats.totalXP >= 1000 },
  { id: 'epic_winner', name: 'Epic Victor', description: 'Complete an Epic quest', icon: '👑', condition: (stats, quests) => quests.some(q => q.difficulty === 'epic' && q.status === 'completed') },
  { id: 'streak_keeper', name: 'Streak Keeper', description: 'Complete quests 3 days in a row', icon: '🔥', condition: (stats) => stats.currentStreak >= 3 }
];

export default function QuestLog({ isOpen, onClose }) {
  const [quests, setQuests] = useState([]);
  const [stats, setStats] = useState({
    totalXP: 0,
    level: 1,
    completedQuests: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState(null);
  const [filter, setFilter] = useState('all');
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    category: 'personal',
    milestones: [{ text: '', completed: false }]
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    checkAchievements();
  }, [stats, quests]);

  const loadData = () => {
    try {
      const savedQuests = localStorage.getItem('mc-quests');
      const savedStats = localStorage.getItem('mc-quest-stats');
      const savedAchievements = localStorage.getItem('mc-achievements');
      
      if (savedQuests) setQuests(JSON.parse(savedQuests));
      if (savedStats) setStats(JSON.parse(savedStats));
      if (savedAchievements) setUnlockedAchievements(JSON.parse(savedAchievements));
    } catch (err) {
      console.error('Failed to load quest data:', err);
    }
  };

  const saveData = (newQuests, newStats, newAchievements) => {
    try {
      localStorage.setItem('mc-quests', JSON.stringify(newQuests || quests));
      localStorage.setItem('mc-quest-stats', JSON.stringify(newStats || stats));
      localStorage.setItem('mc-achievements', JSON.stringify(newAchievements || unlockedAchievements));
    } catch (err) {
      console.error('Failed to save quest data:', err);
    }
  };

  const checkAchievements = () => {
    const newlyUnlockedList = [];
    
    ACHIEVEMENTS.forEach(achievement => {
      if (!unlockedAchievements.includes(achievement.id) && achievement.condition(stats, quests)) {
        newlyUnlockedList.push(achievement);
      }
    });

    if (newlyUnlockedList.length > 0) {
      const updatedAchievements = [...unlockedAchievements, ...newlyUnlockedList.map(a => a.id)];
      setUnlockedAchievements(updatedAchievements);
      setNewlyUnlocked(newlyUnlockedList[0]);
      setShowAchievementModal(true);
      saveData(quests, stats, updatedAchievements);
    }
  };

  const calculateLevel = (xp) => {
    return Math.floor(xp / 500) + 1;
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastDate = stats.lastCompletedDate;
    
    if (!lastDate) {
      return { currentStreak: 1, longestStreak: 1, lastCompletedDate: today };
    }
    
    const lastDateObj = new Date(lastDate);
    const todayObj = new Date();
    const diffTime = todayObj - lastDateObj;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return { ...stats };
    } else if (diffDays === 1) {
      const newStreak = stats.currentStreak + 1;
      return {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, stats.longestStreak),
        lastCompletedDate: today
      };
    } else {
      return {
        currentStreak: 1,
        longestStreak: stats.longestStreak,
        lastCompletedDate: today
      };
    }
  };

  const addQuest = () => {
    if (!newQuest.title.trim()) return;
    
    const quest = {
      id: Date.now().toString(),
      ...newQuest,
      status: 'active',
      createdAt: new Date().toISOString(),
      completedAt: null,
      milestones: newQuest.milestones.filter(m => m.text.trim()).map(m => ({ ...m, completed: false }))
    };
    
    const updatedQuests = [...quests, quest];
    setQuests(updatedQuests);
    saveData(updatedQuests, stats, unlockedAchievements);
    
    setNewQuest({
      title: '',
      description: '',
      difficulty: 'medium',
      category: 'personal',
      milestones: [{ text: '', completed: false }]
    });
    setShowAddModal(false);
  };

  const completeQuest = (questId) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const xp = DIFFICULTY_LEVELS[quest.difficulty].xp;
    const streakUpdate = updateStreak();
    
    const updatedStats = {
      totalXP: stats.totalXP + xp,
      level: calculateLevel(stats.totalXP + xp),
      completedQuests: stats.completedQuests + 1,
      ...streakUpdate
    };
    
    const updatedQuests = quests.map(q => 
      q.id === questId 
        ? { ...q, status: 'completed', completedAt: new Date().toISOString() }
        : q
    );
    
    setQuests(updatedQuests);
    setStats(updatedStats);
    saveData(updatedQuests, updatedStats, unlockedAchievements);
  };

  const toggleMilestone = (questId, milestoneIndex) => {
    const updatedQuests = quests.map(q => {
      if (q.id === questId) {
        const updatedMilestones = q.milestones.map((m, i) => 
          i === milestoneIndex ? { ...m, completed: !m.completed } : m
        );
        return { ...q, milestones: updatedMilestones };
      }
      return q;
    });
    
    setQuests(updatedQuests);
    saveData(updatedQuests, stats, unlockedAchievements);
  };

  const deleteQuest = (questId) => {
    const updatedQuests = quests.filter(q => q.id !== questId);
    setQuests(updatedQuests);
    saveData(updatedQuests, stats, unlockedAchievements);
  };

  const addMilestone = () => {
    setNewQuest({
      ...newQuest,
      milestones: [...newQuest.milestones, { text: '', completed: false }]
    });
  };

  const updateMilestone = (index, text) => {
    const updatedMilestones = newQuest.milestones.map((m, i) => 
      i === index ? { ...m, text } : m
    );
    setNewQuest({ ...newQuest, milestones: updatedMilestones });
  };

  const removeMilestone = (index) => {
    const updatedMilestones = newQuest.milestones.filter((_, i) => i !== index);
    setNewQuest({ ...newQuest, milestones: updatedMilestones });
  };

  const filteredQuests = quests.filter(q => {
    if (filter === 'all') return true;
    if (filter === 'active') return q.status === 'active';
    if (filter === 'completed') return q.status === 'completed';
    if (filter === 'epic') return q.difficulty === 'epic';
    return true;
  });

  const activeQuests = quests.filter(q => q.status === 'active');
  const completedQuests = quests.filter(q => q.status === 'completed');
  const completionRate = quests.length > 0 ? Math.round((completedQuests.length / quests.length) * 100) : 0;
  const xpToNextLevel = 500 - (stats.totalXP % 500);
  const xpProgress = ((stats.totalXP % 500) / 500) * 100;

  if (!isOpen) return null;

  return (
    <div className="quest-log-overlay" onClick={onClose}>
      <div className="quest-log" onClick={e => e.stopPropagation()}>
        <div className="quest-log-header">
          <div className="quest-log-title">
            <span className="title-icon">🗡️</span>
            <h3>Quest Log</h3>
          </div>
          <button className="add-quest-btn" onClick={() => setShowAddModal(true)}>
            + New Quest
          </button>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Player Stats Card */}
        <div className="player-stats-card">
          <div className="level-badge">
            <span className="level-number">{stats.level}</span>
            <span className="level-label">LVL</span>
          </div>
          <div className="stats-info">
            <div className="xp-bar">
              <div className="xp-progress" style={{ width: `${xpProgress}%` }}></div>
            </div>
            <div className="xp-text">{xpToNextLevel} XP to next level</div>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.totalXP}</span>
              <span className="stat-label">Total XP</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.completedQuests}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.currentStreak}</span>
              <span className="stat-label">Day Streak</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{completionRate}%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </div>

        {/* Achievements Preview */}
        <div className="achievements-preview">
          <h4>🏅 Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})</h4>
          <div className="achievement-list">
            {ACHIEVEMENTS.slice(0, 5).map(achievement => {
              const isUnlocked = unlockedAchievements.includes(achievement.id);
              return (
                <div 
                  key={achievement.id} 
                  className={`achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`}
                  title={achievement.description}
                >
                  <span className="achievement-icon">{achievement.icon}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="quest-filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            All ({quests.length})
          </button>
          <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>
            Active ({activeQuests.length})
          </button>
          <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>
            Completed ({completedQuests.length})
          </button>
          <button className={filter === 'epic' ? 'active' : ''} onClick={() => setFilter('epic')}>
            Epic
          </button>
        </div>

        {/* Quest List */}
        <div className="quest-list">
          {filteredQuests.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📜</span>
              <p>No quests found</p>
              <span className="empty-hint">Create your first quest to begin your adventure!</span>
            </div>
          ) : (
            filteredQuests.map(quest => {
              const difficulty = DIFFICULTY_LEVELS[quest.difficulty];
              const category = CATEGORIES[quest.category];
              const progress = quest.milestones.length > 0
                ? Math.round((quest.milestones.filter(m => m.completed).length / quest.milestones.length) * 100)
                : 0;

              return (
                <div 
                  key={quest.id} 
                  className={`quest-card ${quest.status} ${quest.difficulty}`}
                  style={{ '--difficulty-color': difficulty.color }}
                >
                  <div className="quest-card-header">
                    <div className="quest-meta">
                      <span className="quest-category">{category.icon}</span>
                      <span className="quest-difficulty" style={{ color: difficulty.color }}>
                        {difficulty.icon} {difficulty.label}
                      </span>
                      <span className="quest-xp">+{difficulty.xp} XP</span>
                    </div>
                    {quest.status === 'active' && (
                      <button className="delete-btn" onClick={() => deleteQuest(quest.id)}>
                        🗑️
                      </button>
                    )}
                  </div>

                  <div className="quest-content">
                    <h4 className="quest-title">{quest.title}</h4>
                    {quest.description && (
                      <p className="quest-description">{quest.description}</p>
                    )}
                  </div>

                  {/* Milestones */}
                  {quest.milestones.length > 0 && (
                    <div className="quest-milestones">
                      <div className="milestone-progress">
                        <div className="milestone-bar">
                          <div className="milestone-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="milestone-text">{progress}%</span>
                      </div>
                      {quest.milestones.map((milestone, index) => (
                        <label key={index} className={`milestone-item ${milestone.completed ? 'completed' : ''}`}>
                          <input
                            type="checkbox"
                            checked={milestone.completed}
                            onChange={() => toggleMilestone(quest.id, index)}
                            disabled={quest.status === 'completed'}
                          />
                          <span>{milestone.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {quest.status === 'active' && (
                    <button 
                      className="complete-quest-btn"
                      onClick={() => completeQuest(quest.id)}
                    >
                      Complete Quest ✓
                    </button>
                  )}

                  {quest.status === 'completed' && (
                    <div className="completed-badge">
                      ✓ Completed {new Date(quest.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add Quest Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal quest-modal" onClick={e => e.stopPropagation()}>
              <h4>🗡️ New Quest</h4>
              
              <input
                type="text"
                placeholder="Quest title..."
                value={newQuest.title}
                onChange={e => setNewQuest({...newQuest, title: e.target.value})}
              />
              
              <textarea
                placeholder="Description (optional)..."
                value={newQuest.description}
                onChange={e => setNewQuest({...newQuest, description: e.target.value})}
                rows={2}
              />

              <div className="form-row">
                <label>
                  <span>Difficulty</span>
                  <select 
                    value={newQuest.difficulty}
                    onChange={e => setNewQuest({...newQuest, difficulty: e.target.value})}
                  >
                    {Object.entries(DIFFICULTY_LEVELS).map(([key, { label, xp }]) => (
                      <option key={key} value={key}>{label} (+{xp} XP)</option>
                    ))}
                  </select>
                </label>
                
                <label>
                  <span>Category</span>
                  <select 
                    value={newQuest.category}
                    onChange={e => setNewQuest({...newQuest, category: e.target.value})}
                  >
                    {Object.entries(CATEGORIES).map(([key, { label, icon }]) => (
                      <option key={key} value={key}>{icon} {label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="milestones-section">
                <label>Milestones</label>
                {newQuest.milestones.map((milestone, index) => (
                  <div key={index} className="milestone-input-row">
                    <input
                      type="text"
                      placeholder={`Milestone ${index + 1}`}
                      value={milestone.text}
                      onChange={e => updateMilestone(index, e.target.value)}
                    />
                    {newQuest.milestones.length > 1 && (
                      <button className="remove-milestone" onClick={() => removeMilestone(index)}>
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button className="add-milestone-btn" onClick={addMilestone}>
                  + Add Milestone
                </button>
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="primary" onClick={addQuest}>Create Quest</button>
              </div>
            </div>
          </div>
        )}

        {/* Achievement Unlocked Modal */}
        {showAchievementModal && newlyUnlocked && (
          <div className="modal-overlay achievement-overlay" onClick={() => setShowAchievementModal(false)}>
            <div className="modal achievement-modal" onClick={e => e.stopPropagation()}>
              <div className="achievement-unlocked">
                <div className="achievement-glow"></div>
                <span className="achievement-icon-large">{newlyUnlocked.icon}</span>
                <h4>Achievement Unlocked!</h4>
                <h3>{newlyUnlocked.name}</h3>
                <p>{newlyUnlocked.description}</p>
                <button className="primary" onClick={() => setShowAchievementModal(false)}>
                  Awesome! 🎉
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
