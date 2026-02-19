/**
 * Learning Tracker Router
 * Track courses, books, tutorials and learning progress
 */

import express from 'express';
import { getDb, genId } from '../db.js';

const router = express.Router();

// Get all learning items
router.get('/', (req, res) => {
  const db = getDb();
  if (!db.learning_items) db.learning_items = [];
  
  const { status, type, priority } = req.query;
  let items = [...db.learning_items];
  
  if (status) items = items.filter(i => i.status === status);
  if (type) items = items.filter(i => i.type === type);
  if (priority) items = items.filter(i => i.priority === priority);
  
  // Sort by updated date
  items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  res.json({ items });
});

// Get learning stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const items = db.learning_items || [];
  
  const total = items.length;
  const completed = items.filter(i => i.status === 'completed').length;
  const inProgress = items.filter(i => i.status === 'in-progress').length;
  const queued = items.filter(i => i.status === 'queued').length;
  
  // Calculate total hours
  const totalHours = items.reduce((sum, i) => sum + (i.hoursSpent || 0), 0);
  
  // By type
  const byType = items.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});
  
  // By topic
  const byTopic = items.reduce((acc, i) => {
    acc[i.topic] = (acc[i.topic] || 0) + 1;
    return acc;
  }, {});
  
  // Completion rate
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Recent completions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentCompletions = items.filter(i => 
    i.status === 'completed' && 
    i.completedAt && 
    new Date(i.completedAt) >= thirtyDaysAgo
  ).length;
  
  res.json({
    total,
    completed,
    inProgress,
    queued,
    totalHours,
    completionRate,
    recentCompletions,
    byType,
    byTopic
  });
});

// Create learning item
router.post('/', (req, res) => {
  const db = getDb();
  if (!db.learning_items) db.learning_items = [];
  
  const { 
    title, 
    type, 
    topic, 
    provider, 
    url,
    description,
    estimatedHours,
    priority = 'medium',
    deadline
  } = req.body;
  
  if (!title || !type) {
    return res.status(400).json({ error: 'Title and type are required' });
  }
  
  const item = {
    id: genId(),
    title,
    type, // course, book, video, article, tutorial, podcast, other
    topic: topic || 'General',
    provider: provider || '',
    url: url || '',
    description: description || '',
    estimatedHours: parseFloat(estimatedHours) || 0,
    hoursSpent: 0,
    progress: 0,
    priority,
    status: 'queued',
    deadline: deadline || null,
    notes: '',
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.learning_items.push(item);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(item);
});

// Update learning item
router.patch('/:id', (req, res) => {
  const db = getDb();
  if (!db.learning_items) db.learning_items = [];
  
  const item = db.learning_items.find(i => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  const updates = req.body;
  
  // If marking as completed
  if (updates.status === 'completed' && item.status !== 'completed') {
    updates.completedAt = new Date().toISOString();
    updates.progress = 100;
  }
  
  // If adding hours
  if (updates.addHours) {
    item.hoursSpent += parseFloat(updates.addHours);
    delete updates.addHours;
  }
  
  Object.assign(item, updates, { updatedAt: new Date().toISOString() });
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(item);
});

// Delete learning item
router.delete('/:id', (req, res) => {
  const db = getDb();
  if (!db.learning_items) db.learning_items = [];
  
  const index = db.learning_items.findIndex(i => i.id === req.params.id);
  if (index > -1) {
    db.learning_items.splice(index, 1);
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json({ success: true });
});

// Get learning path suggestions
router.get('/suggestions/topics', (req, res) => {
  const commonTopics = [
    'Programming', 'Design', 'Business', 'Marketing', 'Data Science',
    'Languages', 'Music', 'Photography', 'Writing', 'Health', 'Finance'
  ];
  
  res.json({ topics: commonTopics });
});

export default router;
