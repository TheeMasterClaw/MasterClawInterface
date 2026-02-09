import express from 'express';
import { 
  queryEvents, 
  getEvent, 
  createEvent 
} from '../db.js';

export const calendarRouter = express.Router();

// Get all calendar events
calendarRouter.get('/events', (req, res) => {
  const events = queryEvents();
  res.json(events);
});

// Get upcoming events (next 7 days)
calendarRouter.get('/upcoming', (req, res) => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const events = queryEvents({
    after: now.toISOString(),
    before: nextWeek.toISOString()
  });

  res.json(events);
});

// Sync with Google Calendar (stub)
calendarRouter.post('/sync', async (req, res) => {
  res.json({ synced: 0, message: 'Google Calendar sync not yet implemented' });
});

// Create local calendar event
calendarRouter.post('/events', (req, res) => {
  const { title, description, startTime, endTime, location, attendees } = req.body;

  if (!title || !startTime || !endTime) {
    return res.status(400).json({ error: 'Title, startTime, and endTime are required' });
  }

  try {
    const event = createEvent({
      title,
      description: description || null,
      startTime,
      endTime,
      location: location || null,
      attendees: attendees || null
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
