/**
 * Today View Router
 * Aggregates daily data from various trackers
 */

import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

// Get today's aggregated data
router.get('/', (req, res) => {
  const db = getDb();
  const today = new Date();
  const todayStr = today.toDateString();
  const todayIso = today.toISOString().split('T')[0];
  
  // Get today's habits
  const habits = db.habits || [];
  const habitLogs = db.habit_logs || [];
  const todayHabitLogs = habitLogs.filter(l => {
    const logDate = new Date(l.date).toDateString();
    return logDate === todayStr;
  });
  
  const habitsToday = habits.map(h => {
    const log = todayHabitLogs.find(l => l.habitId === h.id);
    return {
      id: h.id,
      name: h.name,
      icon: h.icon || '✓',
      color: h.color || '#667eea',
      completed: !!log,
      streak: h.streak || 0
    };
  });
  
  const completedHabits = habitsToday.filter(h => h.completed).length;
  const habitProgress = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;
  
  // Get today's mood
  const moodLogs = db.mood_logs || [];
  const todayMood = moodLogs.find(l => {
    const logDate = new Date(l.date).toDateString();
    return logDate === todayStr;
  });
  
  // Get today's water intake
  const waterLogs = db.water_logs || [];
  const todayWater = waterLogs
    .filter(l => new Date(l.date).toDateString() === todayStr)
    .reduce((sum, l) => sum + (l.amount || 0), 0);
  const waterGoal = 2500; // Default 2.5L
  const waterProgress = Math.min(100, Math.round((todayWater / waterGoal) * 100));
  
  // Get today's focus sessions
  const timeEntries = db.time_entries || [];
  const todayFocusTime = timeEntries
    .filter(e => {
      const entryDate = new Date(e.startTime).toDateString();
      return entryDate === todayStr && e.duration;
    })
    .reduce((sum, e) => sum + (e.duration || 0), 0);
  const focusMinutes = Math.floor(todayFocusTime / 60);
  
  // Get today's tasks
  const tasks = db.tasks || [];
  const todayTasks = tasks.filter(t => {
    if (t.status === 'completed') {
      const completedDate = t.completedAt ? new Date(t.completedAt).toDateString() : null;
      return completedDate === todayStr;
    }
    if (t.dueDate) {
      const dueDate = new Date(t.dueDate).toDateString();
      return dueDate === todayStr;
    }
    return false;
  });
  
  const completedTasks = todayTasks.filter(t => t.status === 'completed').length;
  const pendingTasks = todayTasks.filter(t => t.status !== 'completed').length;
  
  // Get today's journal entry
  const journals = db.journals || [];
  const todayJournal = journals.find(j => {
    const journalDate = new Date(j.date).toDateString();
    return journalDate === todayStr;
  });
  
  // Get today's gratitude entries
  const gratitudeLogs = db.gratitude_logs || [];
  const todayGratitude = gratitudeLogs.filter(l => {
    const logDate = new Date(l.date).toDateString();
    return logDate === todayStr;
  });
  
  // Get today's wins
  const dailyWins = db.daily_wins || [];
  const todayWins = dailyWins.filter(w => {
    const winDate = new Date(w.date).toDateString();
    return winDate === todayStr;
  });
  
  // Calculate overall day score (0-100)
  const scores = [
    habitProgress * 0.25,
    todayMood ? 20 : 0,
    Math.min(waterProgress, 100) * 0.15,
    Math.min(focusMinutes / 120, 1) * 100 * 0.20, // 2 hours = max
    completedTasks > 0 ? Math.min(completedTasks * 10, 20) : 0
  ];
  const dayScore = Math.round(scores.reduce((a, b) => a + b, 0));
  
  // Determine day status
  let dayStatus = 'neutral';
  let dayMessage = 'Keep going!';
  if (dayScore >= 80) {
    dayStatus = 'excellent';
    dayMessage = 'Amazing day! 🌟';
  } else if (dayScore >= 60) {
    dayStatus = 'good';
    dayMessage = 'Great progress! ✨';
  } else if (dayScore >= 40) {
    dayStatus = 'fair';
    dayMessage = 'Making moves! 💪';
  } else if (dayScore > 0) {
    dayStatus = 'needs-work';
    dayMessage = 'Keep building momentum! 🚀';
  }
  
  // Get recent activity
  const recentActivity = [];
  
  if (todayMood) {
    recentActivity.push({
      type: 'mood',
      icon: todayMood.mood >= 4 ? '😊' : todayMood.mood >= 3 ? '😐' : '😔',
      text: `Mood logged: ${todayMood.label || 'Tracked'}`,
      time: todayMood.createdAt
    });
  }
  
  todayHabitLogs.forEach(log => {
    const habit = habits.find(h => h.id === log.habitId);
    if (habit) {
      recentActivity.push({
        type: 'habit',
        icon: habit.icon || '✓',
        text: `Completed: ${habit.name}`,
        time: log.createdAt || todayIso
      });
    }
  });
  
  waterLogs.filter(l => new Date(l.date).toDateString() === todayStr).forEach(log => {
    recentActivity.push({
      type: 'water',
      icon: '💧',
      text: `Drank ${log.amount}ml water`,
      time: log.createdAt || todayIso
    });
  });
  
  todayTasks.filter(t => t.status === 'completed').forEach(task => {
    recentActivity.push({
      type: 'task',
      icon: '✅',
      text: `Completed task: ${task.title}`,
      time: task.completedAt
    });
  });
  
  // Sort by time, most recent first
  recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));
  
  res.json({
    date: todayIso,
    dayScore,
    dayStatus,
    dayMessage,
    summary: {
      habits: {
        total: habits.length,
        completed: completedHabits,
        progress: habitProgress,
        items: habitsToday
      },
      mood: todayMood ? {
        level: todayMood.mood,
        label: todayMood.label,
        note: todayMood.note,
        color: getMoodColor(todayMood.mood)
      } : null,
      water: {
        current: todayWater,
        goal: waterGoal,
        progress: waterProgress,
        remaining: Math.max(0, waterGoal - todayWater)
      },
      focus: {
        minutes: focusMinutes,
        sessions: timeEntries.filter(e => {
          const entryDate = new Date(e.startTime).toDateString();
          return entryDate === todayStr;
        }).length
      },
      tasks: {
        completed: completedTasks,
        pending: pendingTasks,
        total: todayTasks.length
      },
      journal: todayJournal ? {
        hasEntry: true,
        preview: todayJournal.content?.substring(0, 100) || 'Entry recorded'
      } : { hasEntry: false },
      gratitude: {
        count: todayGratitude.length,
        items: todayGratitude.map(g => g.content).slice(0, 3)
      },
      wins: {
        count: todayWins.length,
        items: todayWins.map(w => w.content).slice(0, 3)
      }
    },
    recentActivity: recentActivity.slice(0, 10),
    quickActions: [
      { id: 'mood', label: 'Log Mood', icon: '😊' },
      { id: 'water', label: 'Add Water', icon: '💧' },
      { id: 'journal', label: 'Write Journal', icon: '📔' },
      { id: 'gratitude', label: 'Gratitude', icon: '🙏' },
      { id: 'win', label: 'Log Win', icon: '🏆' },
      { id: 'task', label: 'Add Task', icon: '✓' }
    ]
  });
});

// Get week overview
router.get('/week', (req, res) => {
  const db = getDb();
  const today = new Date();
  const weekData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    
    // Calculate day score for each day
    const habitLogs = (db.habit_logs || []).filter(l => new Date(l.date).toDateString() === dateStr);
    const moodLog = (db.mood_logs || []).find(l => new Date(l.date).toDateString() === dateStr);
    const waterAmount = (db.water_logs || [])
      .filter(l => new Date(l.date).toDateString() === dateStr)
      .reduce((sum, l) => sum + (l.amount || 0), 0);
    const focusTime = Math.floor((db.time_entries || [])
      .filter(e => new Date(e.startTime).toDateString() === dateStr && e.duration)
      .reduce((sum, e) => sum + (e.duration || 0), 0) / 60);
    const completedTasks = (db.tasks || [])
      .filter(t => t.status === 'completed' && t.completedAt && new Date(t.completedAt).toDateString() === dateStr)
      .length;
    
    const dayScore = Math.round(
      (habitLogs.length * 10) +
      (moodLog ? 15 : 0) +
      Math.min(waterAmount / 2500 * 15, 15) +
      Math.min(focusTime / 120 * 20, 20) +
      Math.min(completedTasks * 5, 20)
    );
    
    weekData.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      score: Math.min(dayScore, 100),
      habits: habitLogs.length,
      hasMood: !!moodLog,
      water: waterAmount,
      focusMinutes: focusTime,
      tasksCompleted: completedTasks
    });
  }
  
  res.json({ weekData });
});

// Helper function
function getMoodColor(level) {
  const colors = {
    1: '#ff6b6b',
    2: '#feca57',
    3: '#48dbfb',
    4: '#1dd1a1',
    5: '#5f27cd'
  };
  return colors[level] || '#8892b0';
}

export default router;
