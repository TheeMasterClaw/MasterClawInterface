/**
 * Habit Tracker Router
 * Track daily habits and build streaks
 */

import express from 'express';
import { getDb, genId } from '../db.js';

const router = express.Router();

// Get all habits with today's status
router.get('/', (req, res) => {
  const db = getDb();
  if (!db.habits) db.habits = [];
  if (!db.habit_logs) db.habit_logs = [];
  
  const habits = db.habits.map(habit => {
    const today = new Date().toISOString().split('T')[0];
    const todayLog = db.habit_logs.find(l => l.habitId === habit.id && l.date === today);
    
    // Calculate streak
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const log = db.habit_logs.find(l => l.habitId === habit.id && l.date === dateStr);
      
      if (log?.completed) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === today && !log) {
        // Today not yet completed, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Calculate weekly progress
    const weekLogs = db.habit_logs.filter(l => {
      if (l.habitId !== habit.id || !l.completed) return false;
      const logDate = new Date(l.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    });
    
    // Get last 7 days for heatmap
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const log = db.habit_logs.find(l => l.habitId === habit.id && l.date === ds);
      last7Days.push({
        date: ds,
        completed: log?.completed || false
      });
    }
    
    return {
      ...habit,
      completedToday: todayLog?.completed || false,
      streak,
      weeklyProgress: weekLogs.length,
      last7Days
    };
  });
  
  res.json({ habits });
});

// Get stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const habits = db.habits || [];
  const logs = db.habit_logs || [];
  
  const total = habits.length;
  const active = habits.filter(h => h.archived !== true).length;
  const archived = habits.filter(h => h.archived === true).length;
  
  // Today's completion
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.date === today && l.completed);
  const todayCompleted = todayLogs.length;
  const todayRate = active > 0 ? Math.round((todayCompleted / active) * 100) : 0;
  
  // Total completions
  const totalCompletions = logs.filter(l => l.completed).length;
  
  // Best streak
  let bestStreak = 0;
  habits.forEach(habit => {
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const log = logs.find(l => l.habitId === habit.id && l.date === dateStr);
      
      if (log?.completed) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === today) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    bestStreak = Math.max(bestStreak, streak);
  });
  
  // By category
  const byCategory = habits.reduce((acc, h) => {
    if (!h.archived) {
      acc[h.category] = (acc[h.category] || 0) + 1;
    }
    return acc;
  }, {});
  
  res.json({
    total,
    active,
    archived,
    todayCompleted,
    todayRate,
    totalCompletions,
    bestStreak,
    byCategory
  });
});

// Create habit
router.post('/', (req, res) => {
  const db = getDb();
  if (!db.habits) db.habits = [];
  
  const { name, category, description, color, icon } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const habit = {
    id: genId(),
    name,
    category: category || 'general',
    description: description || '',
    color: color || '#3498db',
    icon: icon || '✓',
    archived: false,
    createdAt: new Date().toISOString()
  };
  
  db.habits.push(habit);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(habit);
});

// Log habit completion
router.post('/:id/log', (req, res) => {
  const db = getDb();
  if (!db.habit_logs) db.habit_logs = [];
  
  const habit = db.habits?.find(h => h.id === req.params.id);
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  
  const date = req.body.date || new Date().toISOString().split('T')[0];
  
  // Check if log exists
  const existingIndex = db.habit_logs.findIndex(
    l => l.habitId === req.params.id && l.date === date
  );
  
  const log = {
    habitId: req.params.id,
    date,
    completed: req.body.completed !== false,
    note: req.body.note || '',
    loggedAt: new Date().toISOString()
  };
  
  if (existingIndex > -1) {
    db.habit_logs[existingIndex] = log;
  } else {
    db.habit_logs.push(log);
  }
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(log);
});

// Update habit
router.patch('/:id', (req, res) => {
  const db = getDb();
  const habit = db.habits?.find(h => h.id === req.params.id);
  
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  
  Object.assign(habit, req.body);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(habit);
});

// Delete habit
router.delete('/:id', (req, res) => {
  const db = getDb();
  if (!db.habits) return res.json({ success: true });
  
  const index = db.habits.findIndex(h => h.id === req.params.id);
  if (index > -1) {
    db.habits.splice(index, 1);
    // Also delete logs
    db.habit_logs = db.habit_logs?.filter(l => l.habitId !== req.params.id) || [];
    
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json({ success: true });
});

export default router;
