/**
 * Contact Manager Router
 * Personal CRM for managing relationships and interactions
 */

import express from 'express';
import { getDb, genId } from '../db.js';

const router = express.Router();

// Get all contacts with optional filtering
router.get('/', (req, res) => {
  const db = getDb();
  if (!db.contacts) db.contacts = [];
  
  const { category, search, sortBy = 'name' } = req.query;
  let contacts = [...db.contacts];
  
  // Apply filters
  if (category) {
    contacts = contacts.filter(c => c.category?.toLowerCase() === category.toLowerCase());
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    contacts = contacts.filter(c => 
      c.name?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.phone?.toLowerCase().includes(searchLower) ||
      c.company?.toLowerCase().includes(searchLower) ||
      c.notes?.toLowerCase().includes(searchLower) ||
      c.tags?.some(t => t.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply sorting
  switch (sortBy) {
    case 'name':
      contacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'recent':
      contacts.sort((a, b) => new Date(b.lastContactDate || 0) - new Date(a.lastContactDate || 0));
      break;
    case 'oldest':
      contacts.sort((a, b) => {
        const aNeeds = (a.interactionHistory || []).length;
        const bNeeds = (b.interactionHistory || []).length;
        return aNeeds - bNeeds;
      });
      break;
    case 'priority':
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      contacts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      break;
  }
  
  // Enrich with last interaction
  contacts = contacts.map(contact => {
    const history = contact.interactionHistory || [];
    const lastInteraction = history[0];
    const daysSinceContact = lastInteraction 
      ? Math.floor((Date.now() - new Date(lastInteraction.date)) / (1000 * 60 * 60 * 24))
      : null;
    
    return {
      ...contact,
      lastInteraction,
      daysSinceContact,
      interactionCount: history.length
    };
  });
  
  res.json({ contacts });
});

// Get a single contact
router.get('/:id', (req, res) => {
  const db = getDb();
  if (!db.contacts) db.contacts = [];
  
  const contact = db.contacts.find(c => c.id === req.params.id);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  
  res.json(contact);
});

// Create a new contact
router.post('/', (req, res) => {
  const db = getDb();
  if (!db.contacts) db.contacts = [];
  
  const { name, email, phone, company, title, category, tags, notes, priority, birthday, socialLinks, reminderFrequency } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const newContact = {
    id: genId(),
    name,
    email: email || '',
    phone: phone || '',
    company: company || '',
    title: title || '',
    category: category || 'personal',
    tags: tags || [],
    notes: notes || '',
    priority: priority || 'medium',
    birthday: birthday || null,
    socialLinks: socialLinks || {},
    reminderFrequency: reminderFrequency || 'monthly',
    interactionHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.contacts.push(newContact);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(newContact);
});

// Update a contact
router.patch('/:id', (req, res) => {
  const db = getDb();
  if (!db.contacts) db.contacts = [];
  
  const contact = db.contacts.find(c => c.id === req.params.id);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  
  const updates = req.body;
  delete updates.id; // Prevent ID change
  delete updates.interactionHistory; // Handle separately
  delete updates.createdAt; // Preserve creation date
  
  Object.assign(contact, updates, { updatedAt: new Date().toISOString() });
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(contact);
});

// Delete a contact
router.delete('/:id', (req, res) => {
  const db = getDb();
  if (!db.contacts) db.contacts = [];
  
  const index = db.contacts.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  
  const deleted = db.contacts.splice(index, 1)[0];
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json({ success: true, deleted });
});

// Add interaction to contact
router.post('/:id/interactions', (req, res) => {
  const db = getDb();
  if (!db.contacts) db.contacts = [];
  
  const contact = db.contacts.find(c => c.id === req.params.id);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  
  const { type, date, notes, location, duration } = req.body;
  
  const interaction = {
    id: genId(),
    type: type || 'other', // meeting, call, text, email, video, social, other
    date: date || new Date().toISOString(),
    notes: notes || '',
    location: location || '',
    duration: duration || 0, // minutes
    createdAt: new Date().toISOString()
  };
  
  if (!contact.interactionHistory) contact.interactionHistory = [];
  contact.interactionHistory.unshift(interaction);
  contact.lastContactDate = interaction.date;
  contact.updatedAt = new Date().toISOString();
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(interaction);
});

// Delete an interaction
router.delete('/:contactId/interactions/:interactionId', (req, res) => {
  const db = getDb();
  if (!db.contacts) db.contacts = [];
  
  const contact = db.contacts.find(c => c.id === req.params.contactId);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }
  
  if (!contact.interactionHistory) {
    return res.status(404).json({ error: 'No interactions found' });
  }
  
  const index = contact.interactionHistory.findIndex(i => i.id === req.params.interactionId);
  if (index === -1) {
    return res.status(404).json({ error: 'Interaction not found' });
  }
  
  contact.interactionHistory.splice(index, 1);
  contact.updatedAt = new Date().toISOString();
  
  // Update lastContactDate if we deleted the most recent
  if (index === 0 && contact.interactionHistory.length > 0) {
    contact.lastContactDate = contact.interactionHistory[0].date;
  } else if (contact.interactionHistory.length === 0) {
    contact.lastContactDate = null;
  }
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json({ success: true });
});

// Get reminders - contacts that need attention
router.get('/meta/reminders', (req, res) => {
  const db = getDb();
  if (!db.contacts) db.contacts = [];
  
  const now = new Date();
  const reminders = [];
  
  db.contacts.forEach(contact => {
    const history = contact.interactionHistory || [];
    const lastContact = history[0];
    const daysSince = lastContact 
      ? Math.floor((now - new Date(lastContact.date)) / (1000 * 60 * 60 * 24))
      : 999;
    
    const frequency = contact.reminderFrequency || 'monthly';
    const thresholdDays = {
      weekly: 7,
      biweekly: 14,
      monthly: 30,
      quarterly: 90,
      yearly: 365
    }[frequency] || 30;
    
    if (daysSince >= thresholdDays) {
      reminders.push({
        contactId: contact.id,
        name: contact.name,
        daysSince,
        frequency,
        priority: contact.priority,
        lastContactDate: lastContact?.date,
        overdue: daysSince > thresholdDays
      });
    }
  });
  
  // Sort by priority and days since
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  reminders.sort((a, b) => {
    if (a.overdue !== b.overdue) return b.overdue - a.overdue;
    if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
    return b.daysSince - a.daysSince;
  });
  
  res.json({ reminders });
});

// Get upcoming birthdays
router.get('/meta/birthdays', (req, res) => {
  const db = getDb();
  if (!db.contacts) db.contacts = [];
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  
  const birthdays = db.contacts
    .filter(c => c.birthday)
    .map(c => {
      const bday = new Date(c.birthday);
      const bdayMonth = bday.getMonth();
      const bdayDay = bday.getDate();
      
      let daysUntil;
      if (bdayMonth > currentMonth || (bdayMonth === currentMonth && bdayDay >= currentDay)) {
        // Birthday is later this year
        const nextBday = new Date(now.getFullYear(), bdayMonth, bdayDay);
        daysUntil = Math.floor((nextBday - now) / (1000 * 60 * 60 * 24));
      } else {
        // Birthday is next year
        const nextBday = new Date(now.getFullYear() + 1, bdayMonth, bdayDay);
        daysUntil = Math.floor((nextBday - now) / (1000 * 60 * 60 * 24));
      }
      
      return {
        contactId: c.id,
        name: c.name,
        birthday: c.birthday,
        age: now.getFullYear() - bday.getFullYear() - (daysUntil > 365 ? 1 : 0),
        daysUntil,
        thisMonth: bdayMonth === currentMonth
      };
    })
    .filter(b => b.daysUntil <= 30) // Next 30 days
    .sort((a, b) => a.daysUntil - b.daysUntil);
  
  res.json({ birthdays });
});

// Get stats
router.get('/meta/stats', (req, res) => {
  const db = getDb();
  if (!db.contacts) db.contacts = [];
  
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  
  const totalInteractions = db.contacts.reduce((acc, c) => acc + (c.interactionHistory?.length || 0), 0);
  
  const thisWeekInteractions = db.contacts.reduce((acc, c) => {
    const weekInteractions = (c.interactionHistory || []).filter(i => new Date(i.date) >= weekAgo).length;
    return acc + weekInteractions;
  }, 0);
  
  const thisMonthInteractions = db.contacts.reduce((acc, c) => {
    const monthInteractions = (c.interactionHistory || []).filter(i => new Date(i.date) >= monthAgo).length;
    return acc + monthInteractions;
  }, 0);
  
  const stats = {
    totalContacts: db.contacts.length,
    byCategory: db.contacts.reduce((acc, c) => {
      const cat = c.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {}),
    byPriority: db.contacts.reduce((acc, c) => {
      acc[c.priority || 'medium'] = (acc[c.priority || 'medium'] || 0) + 1;
      return acc;
    }, {}),
    totalInteractions,
    thisWeekInteractions,
    thisMonthInteractions,
    withBirthdays: db.contacts.filter(c => c.birthday).length,
    avgInteractionsPerContact: db.contacts.length > 0 ? Math.round(totalInteractions / db.contacts.length * 10) / 10 : 0
  };
  
  res.json(stats);
});

// Get all categories
router.get('/meta/categories', (req, res) => {
  const db = getDb();
  if (!db.contacts) db.contacts = [];
  
  const categories = [...new Set(db.contacts.map(c => c.category).filter(Boolean))];
  const defaults = ['personal', 'professional', 'family', 'friend', 'networking', 'mentor', 'client', 'vendor'];
  
  res.json([...new Set([...categories, ...defaults])]);
});

// Get all tags
router.get('/meta/tags', (req, res) => {
  const db = getDb();
  if (!db.contacts) db.contacts = [];
  
  const tagCounts = {};
  db.contacts.forEach(c => {
    (c.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  const tags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  res.json(tags);
});

export default router;
