/**
 * Gift Ideas Router
 * Track gift ideas for people and occasions
 */

import express from 'express';
import { getDb, genId } from '../db.js';

const router = express.Router();

// Get all gift ideas
router.get('/', (req, res) => {
  const db = getDb();
  if (!db.gift_ideas) db.gift_ideas = [];
  
  const { status, recipient, occasion } = req.query;
  let items = [...db.gift_ideas];
  
  if (status) items = items.filter(i => i.status === status);
  if (recipient) items = items.filter(i => i.recipient?.toLowerCase().includes(recipient.toLowerCase()));
  if (occasion) items = items.filter(i => i.occasion?.toLowerCase().includes(occasion.toLowerCase()));
  
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({ gifts: items });
});

// Get stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const gifts = db.gift_ideas || [];
  
  const total = gifts.length;
  const planned = gifts.filter(g => g.status === 'planned').length;
  const purchased = gifts.filter(g => g.status === 'purchased').length;
  const given = gifts.filter(g => g.status === 'given').length;
  
  // Total budget
  const totalBudget = gifts.reduce((sum, g) => sum + (g.price || 0), 0);
  const spent = gifts
    .filter(g => g.status === 'purchased' || g.status === 'given')
    .reduce((sum, g) => sum + (g.price || 0), 0);
  
  // By occasion
  const byOccasion = gifts.reduce((acc, g) => {
    acc[g.occasion] = (acc[g.occasion] || 0) + 1;
    return acc;
  }, {});
  
  // Unique recipients
  const recipients = [...new Set(gifts.map(g => g.recipient))];
  
  // Upcoming occasions (next 30 days)
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  
  const upcoming = gifts.filter(g => {
    if (!g.date) return false;
    const d = new Date(g.date);
    return d >= now && d <= nextMonth && g.status !== 'given';
  });
  
  res.json({
    total,
    planned,
    purchased,
    given,
    totalBudget,
    spent,
    remaining: totalBudget - spent,
    byOccasion,
    recipientCount: recipients.length,
    upcoming: upcoming.length
  });
});

// Create gift idea
router.post('/', (req, res) => {
  const db = getDb();
  if (!db.gift_ideas) db.gift_ideas = [];
  
  const {
    name,
    recipient,
    occasion,
    price,
    url,
    notes,
    date
  } = req.body;
  
  if (!name || !recipient) {
    return res.status(400).json({ error: 'Name and recipient are required' });
  }
  
  const gift = {
    id: genId(),
    name,
    recipient,
    occasion: occasion || 'General',
    price: parseFloat(price) || 0,
    url: url || '',
    notes: notes || '',
    date: date || null,
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.gift_ideas.push(gift);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(gift);
});

// Update gift
router.patch('/:id', (req, res) => {
  const db = getDb();
  const gift = db.gift_ideas?.find(g => g.id === req.params.id);
  
  if (!gift) {
    return res.status(404).json({ error: 'Gift not found' });
  }
  
  Object.assign(gift, req.body, { updatedAt: new Date().toISOString() });
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(gift);
});

// Delete gift
router.delete('/:id', (req, res) => {
  const db = getDb();
  if (!db.gift_ideas) return res.json({ success: true });
  
  const index = db.gift_ideas.findIndex(g => g.id === req.params.id);
  if (index > -1) {
    db.gift_ideas.splice(index, 1);
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json({ success: true });
});

export default router;
