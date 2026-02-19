/**
 * Reading Tracker Router
 * Track books, articles, and reading progress
 */

import express from 'express';
import { getDb, genId } from '../db.js';

const router = express.Router();

// Get all reading items
router.get('/', (req, res) => {
  const db = getDb();
  if (!db.reading_items) db.reading_items = [];
  
  const { status, type } = req.query;
  let items = [...db.reading_items];
  
  if (status) items = items.filter(i => i.status === status);
  if (type) items = items.filter(i => i.type === type);
  
  // Sort: currently reading first, then by updated date
  items.sort((a, b) => {
    if (a.status === 'reading' && b.status !== 'reading') return -1;
    if (b.status === 'reading' && a.status !== 'reading') return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
  
  res.json({ items });
});

// Get stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const items = db.reading_items || [];
  
  const total = items.length;
  const reading = items.filter(i => i.status === 'reading').length;
  const finished = items.filter(i => i.status === 'finished').length;
  const wantToRead = items.filter(i => i.status === 'want-to-read').length;
  
  // Calculate total pages read
  const finishedBooks = items.filter(i => i.status === 'finished' && i.totalPages);
  const totalPagesRead = finishedBooks.reduce((sum, i) => sum + (i.totalPages || 0), 0);
  
  // Pages in progress
  const inProgress = items.filter(i => i.status === 'reading');
  const pagesInProgress = inProgress.reduce((sum, i) => sum + (i.currentPage || 0), 0);
  
  // Current book
  const currentBook = inProgress[0] || null;
  
  // By type
  const books = items.filter(i => i.type === 'book').length;
  const articles = items.filter(i => i.type === 'article').length;
  
  res.json({
    total,
    reading,
    finished,
    wantToRead,
    totalPagesRead,
    pagesInProgress,
    currentBook,
    books,
    articles
  });
});

// Create item
router.post('/', (req, res) => {
  const db = getDb();
  if (!db.reading_items) db.reading_items = [];
  
  const {
    title,
    author,
    type,
    totalPages,
    genre,
    notes
  } = req.body;
  
  if (!title || !type) {
    return res.status(400).json({ error: 'Title and type are required' });
  }
  
  const item = {
    id: genId(),
    title,
    author: author || '',
    type, // 'book' or 'article'
    totalPages: parseInt(totalPages) || 0,
    currentPage: 0,
    genre: genre || '',
    notes: notes || '',
    status: 'want-to-read',
    startedAt: null,
    finishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.reading_items.push(item);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(item);
});

// Update item
router.patch('/:id', (req, res) => {
  const db = getDb();
  const item = db.reading_items?.find(i => i.id === req.params.id);
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  const updates = req.body;
  
  // If starting to read
  if (updates.status === 'reading' && item.status !== 'reading') {
    updates.startedAt = new Date().toISOString();
  }
  
  // If finishing
  if (updates.status === 'finished' && item.status !== 'finished') {
    updates.finishedAt = new Date().toISOString();
    updates.currentPage = item.totalPages;
  }
  
  Object.assign(item, updates, { updatedAt: new Date().toISOString() });
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(item);
});

// Delete item
router.delete('/:id', (req, res) => {
  const db = getDb();
  if (!db.reading_items) return res.json({ success: true });
  
  const index = db.reading_items.findIndex(i => i.id === req.params.id);
  if (index > -1) {
    db.reading_items.splice(index, 1);
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json({ success: true });
});

export default router;
