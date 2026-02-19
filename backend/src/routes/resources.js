/**
 * Resource Library Router
 * Manages bookmarks, articles, videos, and web resources
 */

import express from 'express';
import { getDb, genId } from '../db.js';

const router = express.Router();

// Get all resources with optional filtering
router.get('/', (req, res) => {
  const db = getDb();
  if (!db.resources) db.resources = [];
  
  const { category, status, tag, search, sortBy = 'newest' } = req.query;
  let resources = [...db.resources];
  
  // Apply filters
  if (category) {
    resources = resources.filter(r => r.category?.toLowerCase() === category.toLowerCase());
  }
  
  if (status) {
    resources = resources.filter(r => r.status === status);
  }
  
  if (tag) {
    resources = resources.filter(r => r.tags?.some(t => t.toLowerCase().includes(tag.toLowerCase())));
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    resources = resources.filter(r => 
      r.title?.toLowerCase().includes(searchLower) ||
      r.description?.toLowerCase().includes(searchLower) ||
      r.url?.toLowerCase().includes(searchLower) ||
      r.notes?.toLowerCase().includes(searchLower) ||
      r.tags?.some(t => t.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply sorting
  switch (sortBy) {
    case 'newest':
      resources.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case 'oldest':
      resources.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'title':
      resources.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
    case 'priority':
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      resources.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      break;
  }
  
  // Get stats
  const stats = {
    total: resources.length,
    byStatus: {
      unread: resources.filter(r => r.status === 'unread').length,
      reading: resources.filter(r => r.status === 'reading').length,
      completed: resources.filter(r => r.status === 'completed').length,
      archived: resources.filter(r => r.status === 'archived').length
    },
    byCategory: resources.reduce((acc, r) => {
      const cat = r.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  };
  
  res.json({ resources, stats });
});

// Get a single resource
router.get('/:id', (req, res) => {
  const db = getDb();
  if (!db.resources) db.resources = [];
  
  const resource = db.resources.find(r => r.id === req.params.id);
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }
  
  res.json(resource);
});

// Create a new resource
router.post('/', (req, res) => {
  const db = getDb();
  if (!db.resources) db.resources = [];
  
  const { url, title, description, category, tags, priority = 'medium', notes } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // Check for duplicate URL
  const existing = db.resources.find(r => r.url === url);
  if (existing) {
    return res.status(409).json({ error: 'Resource with this URL already exists', resource: existing });
  }
  
  // Extract domain for favicon
  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch (e) {
    domain = url;
  }
  
  const newResource = {
    id: genId(),
    url,
    title: title || url,
    description: description || '',
    category: category || 'Uncategorized',
    tags: tags || [],
    priority,
    status: 'unread',
    notes: notes || '',
    domain,
    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.resources.push(newResource);
  
  // Update DB
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(newResource);
});

// Update a resource
router.patch('/:id', (req, res) => {
  const db = getDb();
  if (!db.resources) db.resources = [];
  
  const resource = db.resources.find(r => r.id === req.params.id);
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }
  
  const updates = req.body;
  
  // Handle status change with timestamp tracking
  if (updates.status && updates.status !== resource.status) {
    if (!resource.statusHistory) resource.statusHistory = [];
    resource.statusHistory.push({
      from: resource.status,
      to: updates.status,
      timestamp: new Date().toISOString()
    });
    
    // Track when completed
    if (updates.status === 'completed') {
      updates.completedAt = new Date().toISOString();
    }
  }
  
  Object.assign(resource, updates, { updatedAt: new Date().toISOString() });
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(resource);
});

// Delete a resource
router.delete('/:id', (req, res) => {
  const db = getDb();
  if (!db.resources) db.resources = [];
  
  const index = db.resources.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Resource not found' });
  }
  
  const deleted = db.resources.splice(index, 1)[0];
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json({ success: true, deleted });
});

// Bulk update resources
router.post('/bulk', (req, res) => {
  const db = getDb();
  if (!db.resources) db.resources = [];
  
  const { ids, action, category, tags } = req.body;
  
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids array is required' });
  }
  
  let updated = 0;
  
  ids.forEach(id => {
    const resource = db.resources.find(r => r.id === id);
    if (resource) {
      if (action === 'archive') resource.status = 'archived';
      if (action === 'markRead') resource.status = 'completed';
      if (action === 'markUnread') resource.status = 'unread';
      if (category) resource.category = category;
      if (tags) resource.tags = [...new Set([...resource.tags, ...tags])];
      resource.updatedAt = new Date().toISOString();
      updated++;
    }
  });
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json({ success: true, updated });
});

// Get all categories
router.get('/meta/categories', (req, res) => {
  const db = getDb();
  if (!db.resources) db.resources = [];
  
  const categories = [...new Set(db.resources.map(r => r.category).filter(Boolean))];
  const defaultCategories = ['Article', 'Video', 'Tutorial', 'Documentation', 'Podcast', 'Tool', 'Inspiration', 'Uncategorized'];
  
  res.json([...new Set([...categories, ...defaultCategories])]);
});

// Get all tags
router.get('/meta/tags', (req, res) => {
  const db = getDb();
  if (!db.resources) db.resources = [];
  
  const tagCounts = {};
  db.resources.forEach(r => {
    (r.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  const tags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  res.json(tags);
});

// Get reading stats
router.get('/meta/stats', (req, res) => {
  const db = getDb();
  if (!db.resources) db.resources = [];
  
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  
  const stats = {
    total: db.resources.length,
    thisWeek: db.resources.filter(r => new Date(r.createdAt) >= weekAgo).length,
    thisMonth: db.resources.filter(r => new Date(r.createdAt) >= monthAgo).length,
    completed: db.resources.filter(r => r.status === 'completed').length,
    unread: db.resources.filter(r => r.status === 'unread').length,
    reading: db.resources.filter(r => r.status === 'reading').length,
    archived: db.resources.filter(r => r.status === 'archived').length,
    byCategory: db.resources.reduce((acc, r) => {
      const cat = r.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {}),
    completionRate: db.resources.length > 0 
      ? Math.round((db.resources.filter(r => r.status === 'completed').length / db.resources.length) * 100)
      : 0
  };
  
  res.json(stats);
});

// Quick add endpoint (minimal data)
router.post('/quick', (req, res) => {
  const db = getDb();
  if (!db.resources) db.resources = [];
  
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // Check for duplicate
  const existing = db.resources.find(r => r.url === url);
  if (existing) {
    return res.status(409).json({ error: 'Already saved', resource: existing });
  }
  
  let domain = '';
  let title = url;
  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname;
    title = urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    domain = url;
  }
  
  const newResource = {
    id: genId(),
    url,
    title,
    description: '',
    category: 'Uncategorized',
    tags: [],
    priority: 'medium',
    status: 'unread',
    notes: '',
    domain,
    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.resources.push(newResource);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(newResource);
});

export default router;
