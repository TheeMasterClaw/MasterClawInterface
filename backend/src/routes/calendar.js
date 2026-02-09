import express from 'express';
import { getDb, genId } from '../db.js';

export const calendarRouter = express.Router();

// Get calendar events
calendarRouter.get('/events', (req, res) => {
  const db = getDb();
  const events = db.prepare('SELECT * FROM calendar_events ORDER BY startTime ASC').all();
  res.json(events);
});

// Get upcoming events (next 7 days)
calendarRouter.get('/upcoming', (req, res) => {
  const db = getDb();
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const events = db.prepare(
    'SELECT * FROM calendar_events WHERE startTime >= ? AND startTime <= ? ORDER BY startTime ASC'
  ).all(now.toISOString(), nextWeek.toISOString());

  res.json(events);
});

// Sync with Google Calendar (stub)
calendarRouter.post('/sync', async (req, res) => {
  // TODO: Implement Google Calendar OAuth + sync
  // This would:
  // 1. Use Google Calendar API
  // 2. Pull events
  // 3. Store in local DB
  // 4. Return synced count

  res.json({ synced: 0, message: 'Google Calendar sync not yet implemented' });
});

// Create local calendar event
calendarRouter.post('/events', (req, res) => {
  const db = getDb();
  const { title, description, startTime, endTime, location, attendees } = req.body;
  const id = genId();

  try {
    db.prepare(
      'INSERT INTO calendar_events (id, title, description, startTime, endTime, location, attendees) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, title, description || null, startTime, endTime, location || null, attendees || null);

    res.status(201).json({ id, title, startTime, endTime });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
