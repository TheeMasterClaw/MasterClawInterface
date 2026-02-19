import React, { useState, useEffect, useCallback } from 'react';
import './AchievementVault.css';

const isBrowser = typeof window !== 'undefined';

const ACHIEVEMENTS = {
  taskMaster: {
    id: 'taskMaster',
    title: 'Task Master',
    description: 'Complete 100 tasks',
    icon: '✅',
    category: 'productivity',
    tiers: [
      { level: 1, requirement: 10, xp: 50, title: 'Beginner' },
      { level: 2, requirement: 50, xp: 150, title: 'Organized' },
      { level: 3, requirement: 100, xp: 300, title: 'Task Master' }
    ]
  },
  focusChampion: {
    id: 'focusChampion',
    title: 'Focus Champion',
    description: 'Complete 50 focus sessions',
    icon: '🎯',
    category: 'productivity',
    tiers: [
      { level: 1, requirement: 5, xp: 50, title: 'Focused' },
      { level: 2, requirement: 25, xp: 150, title: 'Disciplined' },
      { level: 3, requirement: 50, xp: 300, title: 'Deep Worker' }
    ]
  },
  habitStreak: {
    id: 'habitStreak',
    title: 'Habit Builder',
    description: 'Maintain a 30-day habit streak',
    icon: '🔥',
    category: 'wellness',
    tiers: [
      { level: 1, requirement: 7, xp: 75, title: 'Starter' },
      { level: 2, requirement: 14, xp: 150, title: 'Consistent' },
      { level: 3, requirement: 30, xp: 500, title: 'Unstoppable' }
    ]
  },
  journalKeeper: {
    id: 'journalKeeper',
    title: 'Journal Keeper',
    description: 'Write 50 journal entries',
    icon: '📔',
    category: 'mindfulness',
    tiers: [
      { level: 1, requirement: 5, xp: 50, title: 'Writer' },
      { level: 2, requirement: 25, xp: 150, title: 'Reflective' },
      { level: 3, requirement: 50, xp: 300, title: 'Storyteller' }
    ]
  },
  deepWork: {
    id: 'deepWork',
    title: 'Deep Work Devotee',
    description: 'Log 100 hours of deep work',
    icon: '🧠',
    category: 'productivity',
    tiers: [
      { level: 1, requirement: 10, xp: 75, title: 'Dabbler' },
      { level: 2, requirement: 50, xp: 200, title: 'Practitioner' },
      { level: 3, requirement: 100, xp: 500, title: 'Master' }
    ]
  },
  waterDrinker: {
    id: 'waterDrinker',
    title: 'Hydration Hero',
    description: 'Track 200 glasses of water',
    icon: '💧',
    category: 'wellness',
    tiers: [
      { level: 1, requirement: 20, xp: 40, title: 'Thirsty' },
      { level: 2, requirement: 100, xp: 120, title: 'Hydrated' },
      { level: 3, requirement: 200, xp: 250, title: 'Aquatic' }
    ]
  },
  moodTracker: {
    id: 'moodTracker',
    title: 'Emotion Explorer',
    description: 'Track mood for 60 days',
    icon: '🎭',
    category: 'mindfulness',
    tiers: [
      { level: 1, requirement: 7, xp: 50, title: 'Aware' },
      { level: 2, requirement: 30, xp: 150, title: 'In Tune' },
      { level: 3, requirement: 60, xp: 350, title: 'Emotion Master' }
    ]
  },
  snippetCollector: {
    id: 'snippetCollector',
    title: 'Code Curator',
    description: 'Save 50 code snippets',
    icon: '📦',
    category: 'knowledge',
    tiers: [
      { level: 1, requirement: 5, xp: 40, title: 'Collector' },
      { level: 2, requirement: 25, xp: 120, title: 'Librarian' },
      { level: 3, requirement: 50, xp: 250, title: 'Archivist' }
    ]
  },
  reader: {
    id: 'reader',
    title: 'Book Worm',
    description: 'Finish 10 books',
    icon: '📚',
    category: 'knowledge',
    tiers: [
      { level: 1, requirement: 1, xp: 50, title: 'Reader' },
      { level: 2, requirement: 5, xp: 150, title: 'Bookworm' },
      { level: 3, requirement: 10, xp: 300, title: 'Scholar' }
    ]
  },
  gratitude: {
    id: 'gratitude',
    title: 'Grateful Soul',
    description: 'Write 40 gratitude entries',
    icon: '🙏',
    category: 'mindfulness',
    tiers: [
      { level: 1, requirement: 5, xp: 50, title: 'Thankful' },
      { level: 2, requirement: 20, xp: 150, title: 'Grateful' },
      { level: 3, requirement: 40, xp: 300, title: 'Enlightened' }
    ]
  },
  workout: {
    id: 'workout',
    title: 'Fitness Fanatic',
    description: 'Complete 50 workouts',
    icon: '💪',
    category: 'wellness',
    tiers: [
      { level: 1, requirement: 5, xp: 75, title: 'Active' },
      { level: 2, requirement: 25, xp: 200, title: 'Athletic' },
      { level: 3, requirement: 50, xp: 400, title: 'Warrior' }
    ]
  },
  meditation: {
    id: 'meditation',
    title: 'Zen Master',
    description: 'Complete 30 meditation sessions',
    icon: '🧘',
    category: 'mindfulness',
    tiers: [
      { level: 1, requirement: 3, xp: 60, title: 'Novice' },
      { level: 2, requirement: 15, xp: 180, title: 'Practitioner' },
      { level: 3, requirement: 30, xp: 400, title: 'Zen Master' }
    ]
  },
  earlyBird: {
    id: 'earlyBird',
    title: 'Early Bird',
    description: 'Log in before 6 AM 20 times',
    icon: '🌅',
    category: 'productivity',
    tiers: [
      { level: 1, requirement: 5, xp: 100, title: 'Riser' },
      { level: 2, requirement: 10, xp: 200, title: 'Early Bird' },
      { level: 3, requirement: 20, xp: 400, title: 'Dawn Breaker' }
    ]
  },
  nightOwl: {
    id: 'nightOwl',
    title: 'Night Owl',
    description: 'Be active after 11 PM 20 times',
    icon: '🦉',
    category: 'productivity',
    tiers: [
      { level: 1, requirement: 5, xp: 100, title: 'Sleeper' },
      { level: 2, requirement: 10, xp: 200, title: 'Night Owl' },
      { level: 3, requirement: 20, xp: 400, title: 'Midnight Coder' }
    ]
  },
  explorer: {
    id: 'explorer',
    title: 'Feature Explorer',
    description: 'Use 20 different features',
    icon: '🗺️',
    category: 'mastery',
    tiers: [
      { level: 1, requirement: 5, xp: 100, title: 'Curious' },
      { level: 2, requirement: 10, xp: 250, title: 'Explorer' },
      { level: 3, requirement: 20, xp: 500, title: 'Power User' }
    ]
  }
};

const LEVELS = [
  { level: 1, xpRequired: 0, title: 'Novice', color: '#8B7355' },
  { level: 2, xpRequired: 500, title: 'Apprentice', color: '#4A90D9' },
  { level: 3, xpRequired: 1500, title: 'Practitioner', color: '#2ECC71' },
  { level: 4, xpRequired: 3500, title: 'Expert', color: '#9B59B6' },
  { level: 5, xpRequired: 7000, title: 'Master', color: '#F39C12' },
  { level: 6, xpRequired: 12000, title: 'Grandmaster', color: '#E74C3C' },
  { level: 7, xpRequired: 20000, title: 'Legend', color: '#FFD700' }
];

const CATEGORIES = {
  all: { label: 'All', color: '#6366f1' },
  productivity: { label: 'Productivity', color: '#3b82f6' },
  wellness: { label: 'Wellness', color: '#22c55e' },
  mindfulness: { label: 'Mindfulness', color: '#a855f7' },
  knowledge: { label: 'Knowledge', color: '#f59e0b' },
  mastery: { label: 'Mastery', color: '#ef4444' }
};

export default function AchievementVault({ isOpen, onClose }) {
  const [progress, setProgress] = useState({});
  const [totalXP, setTotalXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(null);
  const [recentUnlocks, setRecentUnlocks] = useState([]);
  const [showStats, setShowStats] = useState(false);

  const calculateLevel = useCallback((xp) => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].xpRequired) {
        return LEVELS[i].level;
      }
    }
    return 1;
  }, []);

  const getNextLevelXP = useCallback((level) => {
    const nextLevel = LEVELS.find(l => l.level === level + 1);
    return nextLevel ? nextLevel.xpRequired : LEVELS[LEVELS.length - 1].xpRequired;
  }, []);

  const getCurrentLevelInfo = useCallback((level) => {
    return LEVELS.find(l => l.level === level) || LEVELS[0];
  }, []);

  // Load progress from localStorage and simulate data from other components
  useEffect(() => {
    if (!isBrowser) return;

    const loadProgress = () => {
      const saved = localStorage.getItem('mc-achievement-progress');
      const savedXP = localStorage.getItem('mc-total-xp');
      const savedUnlocks = localStorage.getItem('mc-recent-unlocks');

      if (saved) {
        setProgress(JSON.parse(saved));
      } else {
        // Initialize empty progress
        const initial = {};
        Object.keys(ACHIEVEMENTS).forEach(key => {
          initial[key] = { current: 0, tier: 0 };
        });
        setProgress(initial);
      }

      if (savedXP) {
        const xp = parseInt(savedXP, 10);
        setTotalXP(xp);
        setUserLevel(calculateLevel(xp));
      }

      if (savedUnlocks) {
        setRecentUnlocks(JSON.parse(savedUnlocks));
      }
    };

    loadProgress();

    // Simulate aggregating stats from other components
    const aggregateStats = () => {
      const newProgress = { ...progress };
      let updated = false;

      // Get data from various localStorage keys that other components use
      const tasks = JSON.parse(localStorage.getItem('mc-tasks') || '[]');
      const habits = JSON.parse(localStorage.getItem('mc-habits') || '[]');
      const journal = JSON.parse(localStorage.getItem('mc-journal') || '[]');
      const gratitude = JSON.parse(localStorage.getItem('mc-gratitude') || '[]');
      const snippets = JSON.parse(localStorage.getItem('mc-snippets') || '[]');
      const reading = JSON.parse(localStorage.getItem('mc-reading') || '[]');
      const focusSessions = JSON.parse(localStorage.getItem('mc-focus-sessions') || '[]');
      const water = JSON.parse(localStorage.getItem('mc-water-logs') || '[]');
      const mood = JSON.parse(localStorage.getItem('mc-mood-entries') || '[]');
      const workouts = JSON.parse(localStorage.getItem('mc-workouts') || '[]');
      const deepWork = JSON.parse(localStorage.getItem('mc-deepwork') || '[]');

      // Task Master
      const completedTasks = tasks.filter(t => t.completed).length;
      if (newProgress.taskMaster?.current !== completedTasks) {
        newProgress.taskMaster = { ...newProgress.taskMaster, current: completedTasks };
        updated = true;
      }

      // Focus Champion
      if (newProgress.focusChampion?.current !== focusSessions.length) {
        newProgress.focusChampion = { ...newProgress.focusChampion, current: focusSessions.length };
        updated = true;
      }

      // Habit Streak (max streak across all habits)
      const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
      if (newProgress.habitStreak?.current !== maxStreak) {
        newProgress.habitStreak = { ...newProgress.habitStreak, current: maxStreak };
        updated = true;
      }

      // Journal Keeper
      if (newProgress.journalKeeper?.current !== journal.length) {
        newProgress.journalKeeper = { ...newProgress.journalKeeper, current: journal.length };
        updated = true;
      }

      // Deep Work
      const totalDeepHours = deepWork.reduce((sum, d) => sum + (d.duration || 0), 0);
      if (newProgress.deepWork?.current !== totalDeepHours) {
        newProgress.deepWork = { ...newProgress.deepWork, current: totalDeepHours };
        updated = true;
      }

      // Water Drinker
      if (newProgress.waterDrinker?.current !== water.length) {
        newProgress.waterDrinker = { ...newProgress.waterDrinker, current: water.length };
        updated = true;
      }

      // Mood Tracker
      if (newProgress.moodTracker?.current !== mood.length) {
        newProgress.moodTracker = { ...newProgress.moodTracker, current: mood.length };
        updated = true;
      }

      // Snippet Collector
      if (newProgress.snippetCollector?.current !== snippets.length) {
        newProgress.snippetCollector = { ...newProgress.snippetCollector, current: snippets.length };
        updated = true;
      }

      // Reader
      const finishedBooks = reading.filter(b => b.status === 'completed').length;
      if (newProgress.reader?.current !== finishedBooks) {
        newProgress.reader = { ...newProgress.reader, current: finishedBooks };
        updated = true;
      }

      // Gratitude
      if (newProgress.gratitude?.current !== gratitude.length) {
        newProgress.gratitude = { ...newProgress.gratitude, current: gratitude.length };
        updated = true;
      }

      // Workout
      if (newProgress.workout?.current !== workouts.length) {
        newProgress.workout = { ...newProgress.workout, current: workouts.length };
        updated = true;
      }

      if (updated) {
        setProgress(newProgress);
        localStorage.setItem('mc-achievement-progress', JSON.stringify(newProgress));
      }
    };

    aggregateStats();
    const interval = setInterval(aggregateStats, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  // Check for tier upgrades
  useEffect(() => {
    if (!isBrowser || Object.keys(progress).length === 0) return;

    let xpGained = 0;
    const newUnlocks = [];

    Object.entries(ACHIEVEMENTS).forEach(([key, achievement]) => {
      const prog = progress[key] || { current: 0, tier: 0 };
      const currentTier = achievement.tiers[prog.tier] || null;
      const nextTier = achievement.tiers[prog.tier];

      // Check if we should unlock a tier
      if (nextTier && prog.current >= nextTier.requirement) {
        const newTier = prog.tier + 1;
        xpGained += nextTier.xp;

        newUnlocks.push({
          achievement: achievement.title,
          tier: nextTier.title,
          icon: achievement.icon,
          xp: nextTier.xp,
          timestamp: Date.now()
        });

        setProgress(prev => ({
          ...prev,
          [key]: { ...prog, tier: newTier }
        }));

        setShowUnlockAnimation({
          achievement: achievement.title,
          tier: nextTier.title,
          icon: achievement.icon,
          xp: nextTier.xp
        });

        setTimeout(() => setShowUnlockAnimation(null), 3000);
      }
    });

    if (xpGained > 0) {
      const newTotal = totalXP + xpGained;
      setTotalXP(newTotal);
      setUserLevel(calculateLevel(newTotal));
      localStorage.setItem('mc-total-xp', newTotal.toString());

      const updatedUnlocks = [...newUnlocks, ...recentUnlocks].slice(0, 10);
      setRecentUnlocks(updatedUnlocks);
      localStorage.setItem('mc-recent-unlocks', JSON.stringify(updatedUnlocks));
    }
  }, [progress, totalXP, recentUnlocks, calculateLevel]);

  const getAchievementStatus = (achievementId) => {
    const achievement = ACHIEVEMENTS[achievementId];
    const prog = progress[achievementId] || { current: 0, tier: 0 };
    const currentTier = achievement.tiers[prog.tier - 1];
    const nextTier = achievement.tiers[prog.tier];

    return {
      ...achievement,
      progress: prog.current,
      currentTier,
      nextTier,
      isMaxed: prog.tier >= achievement.tiers.length,
      percentage: nextTier
        ? Math.min(100, (prog.current / nextTier.requirement) * 100)
        : 100
    };
  };

  const filteredAchievements = () => {
    if (selectedCategory === 'all') return Object.keys(ACHIEVEMENTS);
    return Object.keys(ACHIEVEMENTS).filter(key =>
      ACHIEVEMENTS[key].category === selectedCategory
    );
  };

  const getStats = () => {
    const achievements = Object.keys(ACHIEVEMENTS).map(getAchievementStatus);
    const maxedCount = achievements.filter(a => a.isMaxed).length;
    const inProgressCount = achievements.filter(a => !a.isMaxed && a.progress > 0).length;
    const notStartedCount = achievements.filter(a => a.progress === 0).length;
    const totalTiers = achievements.reduce((sum, a) => sum + (a.currentTier ? 1 : 0), 0);

    return { maxedCount, inProgressCount, notStartedCount, totalTiers };
  };

  const stats = getStats();
  const currentLevelInfo = getCurrentLevelInfo(userLevel);
  const nextLevelXP = getNextLevelXP(userLevel);
  const xpToNext = nextLevelXP - totalXP;
  const levelProgress = ((totalXP - currentLevelInfo.xpRequired) /
    (nextLevelXP - currentLevelInfo.xpRequired)) * 100;

  if (!isOpen) return null;

  return (
    <div className="achievement-vault-overlay" onClick={onClose}>
      <div className="achievement-vault" onClick={e => e.stopPropagation()}>
        <div className="achievement-vault-header">
          <div className="achievement-vault-title">
            <span className="vault-icon">🏆</span>
            <div>
              <h2>Achievement Vault</h2>
              <p>Track your progress and earn rewards</p>
            </div>
          </div>
          <div className="achievement-vault-actions">
            <button
              className="vault-btn stats-btn"
              onClick={() => setShowStats(!showStats)}
              title="Toggle Stats"
            >
              📊
            </button>
            <button className="vault-btn close-btn" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {showUnlockAnimation && (
          <div className="unlock-animation">
            <div className="unlock-content">
              <span className="unlock-icon">{showUnlockAnimation.icon}</span>
              <h3>Achievement Unlocked!</h3>
              <p className="unlock-title">{showUnlockAnimation.achievement}</p>
              <p className="unlock-tier">{showUnlockAnimation.tier}</p>
              <span className="unlock-xp">+{showUnlockAnimation.xp} XP</span>
            </div>
          </div>
        )}

        <div className="level-progress-section">
          <div className="level-badge" style={{ backgroundColor: currentLevelInfo.color }}>
            <span className="level-number">{userLevel}</span>
            <span className="level-title">{currentLevelInfo.title}</span>
          </div>
          <div className="xp-info">
            <div className="xp-header">
              <span className="total-xp">{totalXP.toLocaleString()} XP</span>
              {userLevel < LEVELS.length ? (
                <span className="xp-to-next">{xpToNext.toLocaleString()} XP to next level</span>
              ) : (
                <span className="xp-to-next">Max Level Reached!</span>
              )}
            </div>
            <div className="xp-bar-container">
              <div
                className="xp-bar"
                style={{
                  width: `${Math.max(0, Math.min(100, levelProgress))}%`,
                  backgroundColor: currentLevelInfo.color
                }}
              />
            </div>
          </div>
        </div>

        {showStats && (
          <div className="stats-panel">
            <div className="stat-card">
              <span className="stat-value">{stats.maxedCount}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.inProgressCount}</span>
              <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.notStartedCount}</span>
              <span className="stat-label">Not Started</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.totalTiers}</span>
              <span className="stat-label">Tiers Unlocked</span>
            </div>
          </div>
        )}

        {recentUnlocks.length > 0 && (
          <div className="recent-unlocks">
            <h4>🎉 Recent Unlocks</h4>
            <div className="unlocks-list">
              {recentUnlocks.slice(0, 3).map((unlock, idx) => (
                <div key={idx} className="unlock-item">
                  <span className="unlock-item-icon">{unlock.icon}</span>
                  <div className="unlock-item-info">
                    <span className="unlock-item-title">{unlock.achievement}</span>
                    <span className="unlock-item-tier">{unlock.tier}</span>
                  </div>
                  <span className="unlock-item-xp">+{unlock.xp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="category-filters">
          {Object.entries(CATEGORIES).map(([key, { label, color }]) => (
            <button
              key={key}
              className={`category-btn ${selectedCategory === key ? 'active' : ''}`}
              style={{
                backgroundColor: selectedCategory === key ? color : 'transparent',
                borderColor: color,
                color: selectedCategory === key ? 'white' : color
              }}
              onClick={() => setSelectedCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="achievements-grid">
          {filteredAchievements().map(key => {
            const status = getAchievementStatus(key);
            const categoryColor = CATEGORIES[ACHIEVEMENTS[key].category].color;

            return (
              <div
                key={key}
                className={`achievement-card ${status.isMaxed ? 'maxed' : ''} ${status.progress > 0 ? 'started' : ''}`}
                style={{ '--category-color': categoryColor }}
              >
                <div className="achievement-header">
                  <span className="achievement-icon">{status.icon}</span>
                  <div className="achievement-info">
                    <h4>{status.title}</h4>
                    <p>{status.description}</p>
                  </div>
                </div>

                <div className="achievement-progress">
                  {status.isMaxed ? (
                    <div className="maxed-badge">
                      <span>⭐ MAXED</span>
                      <span className="completed-tier">{status.currentTier?.title}</span>
                    </div>
                  ) : (
                    <>
                      <div className="progress-info">
                        <span className="progress-current">{status.progress}</span>
                        <span className="progress-separator">/</span>
                        <span className="progress-target">{status.nextTier?.requirement}</span>
                        <span className="progress-tier">→ {status.nextTier?.title}</span>
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar"
                          style={{ width: `${status.percentage}%` }}
                        />
                      </div>
                      <span className="progress-reward">+{status.nextTier?.xp} XP reward</span>
                    </>
                  )}
                </div>

                <div className="achievement-tiers">
                  {status.tiers.map((tier, idx) => {
                    const unlocked = idx < (status.currentTier ? status.tiers.indexOf(status.currentTier) + 1 : 0);
                    return (
                      <div
                        key={idx}
                        className={`tier-dot ${unlocked ? 'unlocked' : ''}`}
                        title={`${tier.title}: ${tier.requirement}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
