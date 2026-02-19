import React, { useState, useEffect, useCallback } from 'react';
// import './WeeklyReview.css';

const REVIEW_CATEGORIES = [
  {
    id: 'collect',
    title: '📥 Collect',
    description: 'Gather all loose ends',
    items: [
      { id: 'inbox_zero', label: 'Clear physical inbox', checked: false },
      { id: 'digital_inbox', label: 'Process digital inboxes (email, messages)', checked: false },
      { id: 'notes_review', label: 'Review scattered notes and ideas', checked: false },
      { id: 'voice_memos', label: 'Check voice memos and recordings', checked: false },
    ]
  },
  {
    id: 'process',
    title: '🧠 Process',
    description: 'Decide next actions',
    items: [
      { id: 'empty_head', label: 'Empty your head - brain dump everything', checked: false },
      { id: 'clarify', label: 'Clarify: What is it? Is it actionable?', checked: false },
      { id: 'next_actions', label: 'Define clear next actions', checked: false },
      { id: 'trash_archive', label: 'Trash or archive completed/irrelevant items', checked: false },
    ]
  },
  {
    id: 'organize',
    title: '📂 Organize',
    description: 'Put things where they belong',
    items: [
      { id: 'update_projects', label: 'Review and update active projects', checked: false },
      { id: 'calendar_review', label: 'Review past and upcoming calendar', checked: false },
      { id: 'waiting_for', label: 'Check "Waiting For" list', checked: false },
      { id: 'someday_maybe', label: 'Review Someday/Maybe list', checked: false },
    ]
  },
  {
    id: 'review',
    title: '👀 Review',
    description: 'Keep your system current',
    items: [
      { id: 'action_lists', label: 'Review Next Actions lists', checked: false },
      { id: 'project_plans', label: 'Review project plans and materials', checked: false },
      { id: 'goals_check', label: 'Check alignment with goals', checked: false },
      { id: 'stale_items', label: 'Identify stale items and refresh them', checked: false },
    ]
  },
  {
    id: 'reflect',
    title: '🪞 Reflect',
    description: 'Learn and grow',
    items: [
      { id: 'wins', label: 'Celebrate this week\'s wins (big and small)', checked: false },
      { id: 'challenges', label: 'What were the main challenges?', checked: false },
      { id: 'lessons', label: 'What did you learn this week?', checked: false },
      { id: 'gratitude', label: 'What are you grateful for?', checked: false },
    ]
  },
  {
    id: 'plan',
    title: '🎯 Plan',
    description: 'Look ahead',
    items: [
      { id: 'next_week_preview', label: 'Preview next week\'s calendar', checked: false },
      { id: 'priorities', label: 'Set top 3 priorities for next week', checked: false },
      { id: 'time_block', label: 'Time-block important activities', checked: false },
      { id: 'energy_plan', label: 'Plan around your energy levels', checked: false },
    ]
  }
];

const isBrowser = typeof window !== 'undefined';

export default function WeeklyReview({ isOpen, onClose }) {
  const [categories, setCategories] = useState(REVIEW_CATEGORIES);
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [reviewHistory, setReviewHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);

  // Get start of week (Monday)
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff)).toDateString();
  }

  // Load saved data
  useEffect(() => {
    if (!isBrowser || !isOpen) return;

    const savedData = localStorage.getItem('mc-weekly-review');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const weekStart = getWeekStart(new Date());
        
        // Check if we have data for current week
        if (parsed.weekStart === weekStart && parsed.categories) {
          setCategories(parsed.categories);
          setReflectionNotes(parsed.reflectionNotes || '');
        }
        
        if (parsed.history) {
          setReviewHistory(parsed.history);
          calculateStreak(parsed.history);
        }
      } catch (e) {
        console.error('Failed to parse weekly review data:', e);
      }
    }
  }, [isOpen]);

  // Save data when categories or notes change
  useEffect(() => {
    if (!isBrowser) return;

    const completionPercentage = calculateCompletion();
    const data = {
      weekStart: getWeekStart(new Date()),
      categories,
      reflectionNotes,
      lastSaved: new Date().toISOString(),
      completionPercentage,
      history: reviewHistory
    };

    localStorage.setItem('mc-weekly-review', JSON.stringify(data));
    setTotalCompleted(reviewHistory.filter(h => h.completed).length);
  }, [categories, reflectionNotes, reviewHistory]);

  // Calculate streak of consecutive weekly reviews
  const calculateStreak = (history) => {
    if (!history || history.length === 0) {
      setStreak(0);
      return;
    }

    const sorted = [...history].sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
    let currentStreak = 0;
    let currentWeek = new Date();

    for (const review of sorted) {
      const reviewWeek = new Date(review.weekStart);
      const weekDiff = Math.floor((currentWeek - reviewWeek) / (7 * 24 * 60 * 60 * 1000));
      
      if (weekDiff === currentStreak && review.completed) {
        currentStreak++;
      } else if (weekDiff > currentStreak) {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const toggleItem = (categoryId, itemId) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => 
          item.id === itemId ? { ...item, checked: !item.checked } : item
        )
      };
    }));
  };

  const calculateCompletion = () => {
    const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const checkedItems = categories.reduce((acc, cat) => 
      acc + cat.items.filter(item => item.checked).length, 0
    );
    return Math.round((checkedItems / totalItems) * 100);
  };

  const getCategoryCompletion = (category) => {
    const checked = category.items.filter(item => item.checked).length;
    return Math.round((checked / category.items.length) * 100);
  };

  const markReviewComplete = () => {
    const weekStart = getWeekStart(new Date());
    const completionPercentage = calculateCompletion();
    
    const newReview = {
      weekStart,
      completed: true,
      completionPercentage,
      completedAt: new Date().toISOString(),
      notes: reflectionNotes
    };

    setReviewHistory(prev => {
      const filtered = prev.filter(h => h.weekStart !== weekStart);
      const updated = [...filtered, newReview];
      calculateStreak(updated);
      return updated;
    });

    // Log activity
    if (isBrowser) {
      const activityLog = JSON.parse(localStorage.getItem('mc-activity-log') || '[]');
      activityLog.unshift({
        id: Date.now(),
        type: 'milestone',
        title: 'Weekly Review Completed',
        description: `Completed ${completionPercentage}% of weekly review checklist`,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('mc-activity-log', JSON.stringify(activityLog.slice(0, 100)));
    }
  };

  const resetWeek = () => {
    if (confirm('Are you sure you want to reset this week\'s review?')) {
      setCategories(REVIEW_CATEGORIES);
      setReflectionNotes('');
    }
  };

  const exportReview = () => {
    const data = {
      weekStarting: getWeekStart(new Date()),
      completion: calculateCompletion(),
      categories: categories.map(cat => ({
        title: cat.title,
        completed: cat.items.filter(i => i.checked).length,
        total: cat.items.length
      })),
      reflection: reflectionNotes
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-review-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completionPercentage = calculateCompletion();
  const allCompleted = completionPercentage === 100;

  if (!isOpen) return null;

  return (
    <div className="weekly-review-overlay" onClick={onClose}>
      <div className="weekly-review-panel" onClick={e => e.stopPropagation()}>
        <div className="weekly-review-header">
          <div className="header-title">
            <h3>🗓️ Weekly Review</h3>
            <span className="week-label">
              Week of {new Date(currentWeekStart).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="header-actions">
            <div className="streak-badge" title="Consecutive weeks completed">
              🔥 {streak} week{streak !== 1 ? 's' : ''}
            </div>
            <button 
              className="history-btn"
              onClick={() => setShowHistory(!showHistory)}
              title="View history"
            >
              📜
            </button>
            <button 
              className="export-btn"
              onClick={exportReview}
              title="Export review"
            >
              📤
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showHistory ? (
          <div className="review-history">
            <h4>Review History</h4>
            {reviewHistory.length === 0 ? (
              <p className="empty-history">No completed reviews yet. Start your first one!</p>
            ) : (
              <div className="history-list">
                {[...reviewHistory]
                  .sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart))
                  .map((review, index) => (
                    <div key={review.weekStart} className={`history-item ${review.completed ? 'completed' : ''}`}>
                      <div className="history-week">
                        {new Date(review.weekStart).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="history-progress">
                        <div className="history-bar">
                          <div 
                            className="history-fill" 
                            style={{ width: `${review.completionPercentage}%` }}
                          />
                        </div>
                        <span>{review.completionPercentage}%</span>
                      </div>
                      <div className="history-status">
                        {review.completed ? '✅' : '⏳'}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            <button className="back-btn" onClick={() => setShowHistory(false)}>
              ← Back to Review
            </button>
          </div>
        ) : (
          <>
            <div className="completion-banner">
              <div className="progress-ring">
                <svg viewBox="0 0 100 100">
                  <circle className="ring-bg" cx="50" cy="50" r="45" />
                  <circle 
                    className="ring-progress" 
                    cx="50" 
                    cy="50" 
                    r="45"
                    style={{
                      strokeDasharray: `${2 * Math.PI * 45}`,
                      strokeDashoffset: `${2 * Math.PI * 45 * (1 - completionPercentage / 100)}`
                    }}
                  />
                </svg>
                <div className="progress-text">{completionPercentage}%</div>
              </div>
              <div className="completion-message">
                {allCompleted ? (
                  <>
                    <span className="celebration">🎉</span>
                    <p>Amazing! Your week is reviewed and ready!</p>
                  </>
                ) : completionPercentage >= 75 ? (
                  <>
                    <span className="celebration">💪</span>
                    <p>Almost there! Keep going!</p>
                  </>
                ) : completionPercentage >= 50 ? (
                  <>
                    <span className="celebration">🚀</span>
                    <p>Halfway there! You're doing great!</p>
                  </>
                ) : completionPercentage > 0 ? (
                  <>
                    <span className="celebration">✨</span>
                    <p>Good start! Every step counts!</p>
                  </>
                ) : (
                  <>
                    <span className="celebration">🌟</span>
                    <p>Ready to review your week? Let's begin!</p>
                  </>
                )}
              </div>
            </div>

            <div className="review-categories">
              {categories.map(category => {
                const catCompletion = getCategoryCompletion(category);
                return (
                  <div key={category.id} className={`review-category ${catCompletion === 100 ? 'completed' : ''}`}>
                    <div className="category-header">
                      <div className="category-title-row">
                        <h4>{category.title}</h4>
                        <span className="category-progress">{catCompletion}%</span>
                      </div>
                      <p className="category-description">{category.description}</p>
                    </div>
                    <div className="category-items">
                      {category.items.map(item => (
                        <label key={item.id} className={`review-item ${item.checked ? 'checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleItem(category.id, item.id)}
                          />
                          <span className="checkmark">{item.checked ? '✓' : ''}</span>
                          <span className="item-label">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="reflection-section">
              <h4>📝 Weekly Reflection</h4>
              <p className="reflection-prompt">
                Take a moment to write about your week. What went well? What would you do differently?
              </p>
              <textarea
                className="reflection-textarea"
                placeholder="Write your thoughts here..."
                value={reflectionNotes}
                onChange={(e) => setReflectionNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="review-actions">
              <button className="reset-btn" onClick={resetWeek}>
                🔄 Reset Week
              </button>
              <button 
                className={`complete-btn ${allCompleted ? 'fully-complete' : ''}`}
                onClick={markReviewComplete}
              >
                {allCompleted ? '🎉 Mark Complete' : '💾 Save Progress'}
              </button>
            </div>

            <div className="review-tips">
              <h4>💡 Tips for a Great Review</h4>
              <ul>
                <li>Set aside 30-60 minutes of uninterrupted time</li>
                <li>Do this at the same time each week (e.g., Friday afternoon or Sunday evening)</li>
                <li>Go somewhere different from your usual workspace</li>
                <li>Don't skip the reflection - it's where growth happens</li>
                <li>Celebrate your wins, no matter how small!</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
