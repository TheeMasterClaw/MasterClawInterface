/**
 * Routine Builder Router
 * Create and track daily routines (morning, evening, etc.)
 */

import express from 'express';
import { getDb, genId } from '../db.js';

const router = express.Router();

// Get all routines
router.get('/', (req, res) => {
  const db = getDb();
  if (!db.routines) db.routines = [];
  if (!db.routine_logs) db.routine_logs = [];
  
  const today = new Date().toISOString().split('T')[0];
  
  const routines = db.routines.map(routine => {
    // Get today's log
    const todayLog = db.routine_logs.find(
      l => l.routineId === routine.id && l.date === today
    );
    
    // Calculate streak
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const log = db.routine_logs.find(
        l => l.routineId === routine.id && l.date === dateStr
      );
      
      if (log?.completed) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === today && !log) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Calculate completion rate (last 7 days)
    let completedDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const log = db.routine_logs.find(
        l => l.routineId === routine.id && l.date === ds && l.completed
      );
      if (log) completedDays++;
    }
    
    return {
      ...routine,
      completedToday: todayLog?.completed || false,
      todayProgress: todayLog?.progress || 0,
      streak,
      weeklyRate: Math.round((completedDays / 7) * 100)
    };
  });
  
  res.json({ routines });
});

// Get stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const routines = db.routines || [];
  const logs = db.routine_logs || [];
  
  const total = routines.length;
  const active = routines.filter(r => !r.archived).length;
  
  // Today's completion
  const today = new Date().toISOString().split('T')[0];
  const todayCompleted = logs.filter(
    l => l.date === today && l.completed
  ).length;
  const todayRate = active > 0 ? Math.round((todayCompleted / active) * 100) : 0;
  
  // By type
  const byType = routines.reduce((acc, r) => {
    if (!r.archived) {
      acc[r.type] = (acc[r.type] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Best streak
  let bestStreak = 0;
  routines.forEach(routine => {
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const log = logs.find(
        l => l.routineId === routine.id && l.date === dateStr
      );
      
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
  
  res.json({
    total,
    active,
    todayCompleted,
    todayRate,
    bestStreak,
    byType
  });
});

// Create routine
router.post('/', (req, res) => {
  const db = getDb();
  if (!db.routines) db.routines = [];
  
  const { name, type, description, steps, color, icon } = req.body;
  
  if (!name || !steps || !Array.isArray(steps)) {
    return res.status(400).json({ error: 'Name and steps array are required' });
  }
  
  const routine = {
    id: genId(),
    name,
    type: type || 'custom',
    description: description || '',
    steps: steps.map((s, i) => ({
      id: genId(),
      name: s.name,
      duration: s.duration || 5,
      order: i
    })),
    color: color || '#3498db',
    icon: icon || '☀️',
    archived: false,
    createdAt: new Date().toISOString()
  };
  
  db.routines.push(routine);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(routine);
});

// Update routine
router.patch('/:id', (req, res) => {
  const db = getDb();
  const routine = db.routines?.find(r => r.id === req.params.id);
  
  if (!routine) {
    return res.status(404).json({ error: 'Routine not found' });
  }
  
  Object.assign(routine, req.body);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(routine);
});

// Log routine completion
router.post('/:id/log', (req, res) => {
  const db = getDb();
  if (!db.routine_logs) db.routine_logs = [];
  
  const routine = db.routines?.find(r => r.id === req.params.id);
  if (!routine) {
    return res.status(404).json({ error: 'Routine not found' });
  }
  
  const date = req.body.date || new Date().toISOString().split('T')[0];
  
  const existingIndex = db.routine_logs.findIndex(
    l => l.routineId === req.params.id && l.date === date
  );
  
  const log = {
    routineId: req.params.id,
    date,
    completed: req.body.completed || false,
    progress: req.body.progress || 0,
    completedSteps: req.body.completedSteps || [],
    duration: req.body.duration || 0,
    loggedAt: new Date().toISOString()
  };
  
  if (existingIndex > -1) {
    db.routine_logs[existingIndex] = log;
  } else {
    db.routine_logs.push(log);
  }
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(log);
});

// Delete routine
router.delete('/:id', (req, res) => {
  const db = getDb();
  if (!db.routines) return res.json({ success: true });
  
  const index = db.routines.findIndex(r => r.id === req.params.id);
  if (index > -1) {
    db.routines.splice(index, 1);
    db.routine_logs = db.routine_logs?.filter(l => l.routineId !== req.params.id) || [];
    
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json({ success: true });
});

export default router;
