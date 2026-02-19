/**
 * Subscription Manager Router
 * Track recurring subscriptions and their costs
 */

import express from 'express';
import { getDb, genId } from '../db.js';

const router = express.Router();

// Get all subscriptions
router.get('/', (req, res) => {
  const db = getDb();
  if (!db.subscriptions) db.subscriptions = [];
  
  const { status } = req.query;
  let items = [...db.subscriptions];
  
  if (status) {
    items = items.filter(i => i.status === status);
  }
  
  // Sort by renewal date
  items.sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
  
  res.json({ subscriptions: items });
});

// Get stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const subs = db.subscriptions || [];
  
  const active = subs.filter(s => s.status === 'active');
  const paused = subs.filter(s => s.status === 'paused');
  const cancelled = subs.filter(s => s.status === 'cancelled');
  
  // Calculate monthly cost
  const monthlyCost = active.reduce((sum, s) => {
    if (s.billingCycle === 'monthly') return sum + s.cost;
    if (s.billingCycle === 'yearly') return sum + (s.cost / 12);
    if (s.billingCycle === 'quarterly') return sum + (s.cost / 3);
    return sum;
  }, 0);
  
  // Calculate yearly cost
  const yearlyCost = active.reduce((sum, s) => {
    if (s.billingCycle === 'monthly') return sum + (s.cost * 12);
    if (s.billingCycle === 'yearly') return sum + s.cost;
    if (s.billingCycle === 'quarterly') return sum + (s.cost * 4);
    return sum;
  }, 0);
  
  // By category
  const byCategory = active.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + s.cost;
    return acc;
  }, {});
  
  // Upcoming renewals (next 7 days)
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingRenewals = active.filter(s => {
    const renewal = new Date(s.renewalDate);
    return renewal >= now && renewal <= nextWeek;
  });
  
  res.json({
    total: subs.length,
    active: active.length,
    paused: paused.length,
    cancelled: cancelled.length,
    monthlyCost: Math.round(monthlyCost * 100) / 100,
    yearlyCost: Math.round(yearlyCost * 100) / 100,
    byCategory,
    upcomingRenewals: upcomingRenewals.length
  });
});

// Create subscription
router.post('/', (req, res) => {
  const db = getDb();
  if (!db.subscriptions) db.subscriptions = [];
  
  const {
    name,
    category,
    cost,
    billingCycle,
    renewalDate,
    description
  } = req.body;
  
  if (!name || !cost || !billingCycle) {
    return res.status(400).json({ error: 'Name, cost, and billing cycle are required' });
  }
  
  const sub = {
    id: genId(),
    name,
    category: category || 'other',
    cost: parseFloat(cost),
    billingCycle, // monthly, yearly, quarterly
    renewalDate: renewalDate || new Date().toISOString().split('T')[0],
    description: description || '',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.subscriptions.push(sub);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(sub);
});

// Update subscription
router.patch('/:id', (req, res) => {
  const db = getDb();
  const sub = db.subscriptions?.find(s => s.id === req.params.id);
  
  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  Object.assign(sub, req.body, { updatedAt: new Date().toISOString() });
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(sub);
});

// Delete subscription
router.delete('/:id', (req, res) => {
  const db = getDb();
  if (!db.subscriptions) return res.json({ success: true });
  
  const index = db.subscriptions.findIndex(s => s.id === req.params.id);
  if (index > -1) {
    db.subscriptions.splice(index, 1);
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json({ success: true });
});

export default router;
