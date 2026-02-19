/**
 * Goal Tracker Router
 * Track long-term goals with milestones and progress
 */

import express from 'express';
import { getDb, genId } from '../db.js';

const router = express.Router();

// Get all goals
router.get('/', (req, res) => {
  const db = getDb();
  if (!db.goals) db.goals = [];
  
  const { status, category, timeframe } = req.query;
  let items = [...db.goals];
  
  if (status) items = items.filter(i => i.status === status);
  if (category) items = items.filter(i => i.category === category);
  if (timeframe) items = items.filter(i => i.timeframe === timeframe);
  
  // Calculate progress for each goal
  items = items.map(goal => {
    const totalMilestones = goal.milestones?.length || 0;
    const completedMilestones = goal.milestones?.filter(m => m.completed).length || 0;
    const progress = totalMilestones > 0 
      ? Math.round((completedMilestones / totalMilestones) * 100) 
      : 0;
    
    // Days remaining
    let daysRemaining = null;
    if (goal.targetDate) {
      daysRemaining = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
    }
    
    return {
      ...goal,
      progress,
      completedMilestones,
      totalMilestones,
      daysRemaining
    };
  });
  
  // Sort by status (active first), then by target date
  items.sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    if (a.targetDate && b.targetDate) {
      return new Date(a.targetDate) - new Date(b.targetDate);
    }
    return 0;
  });
  
  res.json({ goals: items });
});

// Get stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const goals = db.goals || [];
  
  const total = goals.length;
  const active = goals.filter(g => g.status === 'active').length;
  const completed = goals.filter(g => g.status === 'completed').length;
  const archived = goals.filter(g => g.status === 'archived').length;
  
  // Calculate overall progress
  let totalProgress = 0;
  let activeWithMilestones = 0;
  
  goals.forEach(goal => {
    if (goal.status === 'active' && goal.milestones?.length > 0) {
      const completed = goal.milestones.filter(m => m.completed).length;
      totalProgress += (completed / goal.milestones.length) * 100;
      activeWithMilestones++;
    }
  });
  
  const avgProgress = activeWithMilestones > 0 
    ? Math.round(totalProgress / activeWithMilestones) 
    : 0;
  
  // By category
  const byCategory = goals.reduce((acc, g) => {
    if (g.status === 'active') {
      acc[g.category] = (acc[g.category] || 0) + 1;
    }
    return acc;
  }, {});
  
  // By timeframe
  const byTimeframe = goals.reduce((acc, g) => {
    if (g.status === 'active') {
      acc[g.timeframe] = (acc[g.timeframe] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Upcoming deadlines (next 30 days)
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  
  const upcomingDeadlines = goals.filter(g => {
    if (!g.targetDate || g.status !== 'active') return false;
    const d = new Date(g.targetDate);
    return d >= now && d <= nextMonth;
  }).length;
  
  res.json({
    total,
    active,
    completed,
    archived,
    avgProgress,
    byCategory,
    byTimeframe,
    upcomingDeadlines
  });
});

// Create goal
router.post('/', (req, res) => {
  const db = getDb();
  if (!db.goals) db.goals = [];
  
  const {
    name,
    description,
    category,
    timeframe,
    targetDate,
    milestones,
    color,
    icon
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const goal = {
    id: genId(),
    name,
    description: description || '',
    category: category || 'personal',
    timeframe: timeframe || 'medium',
    targetDate: targetDate || null,
    milestones: (milestones || []).map((m, i) => ({
      id: genId(),
      name: m.name,
      completed: false,
      order: i
    })),
    color: color || '#3498db',
    icon: icon || '🎯',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.goals.push(goal);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(goal);
});

// Update goal
router.patch('/:id', (req, res) => {
  const db = getDb();
  const goal = db.goals?.find(g => g.id === req.params.id);
  
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }
  
  Object.assign(goal, req.body, { updatedAt: new Date().toISOString() });
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(goal);
});

// Toggle milestone
router.post('/:id/milestones/:milestoneId/toggle', (req, res) => {
  const db = getDb();
  const goal = db.goals?.find(g => g.id === req.params.id);
  
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }
  
  const milestone = goal.milestones?.find(m => m.id === req.params.milestoneId);
  if (!milestone) {
    return res.status(404).json({ error: 'Milestone not found' });
  }
  
  milestone.completed = !milestone.completed;
  milestone.completedAt = milestone.completed ? new Date().toISOString() : null;
  goal.updatedAt = new Date().toISOString();
  
  // Check if all milestones are completed
  const allCompleted = goal.milestones.every(m => m.completed);
  if (allCompleted && goal.milestones.length > 0) {
    goal.status = 'completed';
    goal.completedAt = new Date().toISOString();
  } else if (goal.status === 'completed' && !allCompleted) {
    goal.status = 'active';
    goal.completedAt = null;
  }
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(goal);
});

// Delete goal
router.delete('/:id', (req, res) => {
  const db = getDb();
  if (!db.goals) return res.json({ success: true });
  
  const index = db.goals.findIndex(g => g.id === req.params.id);
  if (index > -1) {
    db.goals.splice(index, 1);
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json({ success: true });
});

export default router;
