/**
 * Watchlist Router
 * Track movies and TV shows to watch, watching, and watched
 */

import express from 'express';
import { getDb, genId } from '../db.js';

const router = express.Router();

// Get all watchlist items
router.get('/', (req, res) => {
  const db = getDb();
  if (!db.watchlist) db.watchlist = [];
  
  const { status, type, genre } = req.query;
  let items = [...db.watchlist];
  
  if (status) items = items.filter(i => i.status === status);
  if (type) items = items.filter(i => i.type === type);
  if (genre) items = items.filter(i => i.genre?.toLowerCase().includes(genre.toLowerCase()));
  
  // Sort by rating (highest first) for watched, then by added date
  items.sort((a, b) => {
    if (a.status === 'watched' && b.status === 'watched') {
      return (b.rating || 0) - (a.rating || 0);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  res.json({ items });
});

// Get stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const items = db.watchlist || [];
  
  const total = items.length;
  const toWatch = items.filter(i => i.status === 'to-watch').length;
  const watching = items.filter(i => i.status === 'watching').length;
  const watched = items.filter(i => i.status === 'watched').length;
  
  // Calculate average rating
  const rated = items.filter(i => i.rating);
  const avgRating = rated.length 
    ? (rated.reduce((sum, i) => sum + i.rating, 0) / rated.length).toFixed(1)
    : 0;
  
  // By type
  const movies = items.filter(i => i.type === 'movie').length;
  const shows = items.filter(i => i.type === 'tv').length;
  
  // Top genres
  const genres = items.reduce((acc, i) => {
    if (i.genre) {
      acc[i.genre] = (acc[i.genre] || 0) + 1;
    }
    return acc;
  }, {});
  
  const topGenres = Object.entries(genres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
  
  // Recently watched
  const recentlyWatched = items
    .filter(i => i.status === 'watched' && i.watchedAt)
    .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
    .slice(0, 5);
  
  res.json({
    total,
    toWatch,
    watching,
    watched,
    avgRating,
    movies,
    shows,
    topGenres,
    recentlyWatched
  });
});

// Create item
router.post('/', (req, res) => {
  const db = getDb();
  if (!db.watchlist) db.watchlist = [];
  
  const { title, type, genre, platform, notes } = req.body;
  
  if (!title || !type) {
    return res.status(400).json({ error: 'Title and type are required' });
  }
  
  const item = {
    id: genId(),
    title,
    type, // 'movie' or 'tv'
    genre: genre || '',
    platform: platform || '',
    notes: notes || '',
    status: 'to-watch',
    rating: null,
    review: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.watchlist.push(item);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(item);
});

// Update item
router.patch('/:id', (req, res) => {
  const db = getDb();
  const item = db.watchlist?.find(i => i.id === req.params.id);
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  const updates = req.body;
  
  // If marking as watched
  if (updates.status === 'watched' && item.status !== 'watched') {
    updates.watchedAt = new Date().toISOString();
  }
  
  Object.assign(item, updates, { updatedAt: new Date().toISOString() });
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(item);
});

// Delete item
router.delete('/:id', (req, res) => {
  const db = getDb();
  if (!db.watchlist) return res.json({ success: true });
  
  const index = db.watchlist.findIndex(i => i.id === req.params.id);
  if (index > -1) {
    db.watchlist.splice(index, 1);
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json({ success: true });
});

export default router;
