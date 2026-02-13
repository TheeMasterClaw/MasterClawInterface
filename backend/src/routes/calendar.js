import express from 'express';
import { 
  queryEvents, 
  getEvent, 
  createEvent 
} from '../db.js';
import { 
  validateEventExists,
  validateQueryParams,
  asyncHandler 
} from '../middleware/security.js';

export const calendarRouter = express.Router();

// Query parameter validation schemas
const eventsQuerySchema = {
  after: { type: 'date' },
  before: { type: 'date' },
};

const historyQuerySchema = {
  limit: { type: 'number', min: 1, max: 500 },
  before: { type: 'date' },
};

// Get all calendar events - with validated query params
calendarRouter.get('/events', validateQueryParams(eventsQuerySchema), asyncHandler(async (req, res) => {
  const { after, before } = req.sanitizedQuery;
  const filter = {};
  
  if (after) filter.after = after;
  if (before) filter.before = before;
  
  const events = queryEvents(filter);
  res.json({ 
    events, 
    count: events.length 
  });
}));

// Get upcoming events (next 7 days)
calendarRouter.get('/upcoming', asyncHandler(async (req, res) => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const events = queryEvents({
    after: now.toISOString(),
    before: nextWeek.toISOString()
  });

  res.json({ 
    events, 
    period: {
      from: now.toISOString(),
      to: nextWeek.toISOString()
    }
  });
}));

// Get single event by ID
calendarRouter.get('/events/:id', validateEventExists, (req, res) => {
  res.json({ event: req.event });
});

// Sync with Google Calendar (stub)
calendarRouter.post('/sync', asyncHandler(async (req, res) => {
  res.json({ 
    synced: 0, 
    message: 'Google Calendar sync not yet implemented' 
  });
}));

// Create local calendar event - with improved validation
calendarRouter.post('/events', asyncHandler(async (req, res) => {
  const { title, description, startTime, endTime, location, attendees } = req.body;

  // Validate required fields
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Title is required and must be a non-empty string',
      code: 'INVALID_TITLE'
    });
  }
  
  if (title.length > 200) {
    return res.status(400).json({
      error: 'Title must not exceed 200 characters',
      code: 'TITLE_TOO_LONG'
    });
  }

  if (!startTime || !endTime) {
    return res.status(400).json({ 
      error: 'startTime and endTime are required',
      code: 'MISSING_TIMES'
    });
  }
  
  // Validate date formats
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  
  if (isNaN(startDate.getTime())) {
    return res.status(400).json({
      error: 'Invalid startTime format',
      code: 'INVALID_START_TIME'
    });
  }
  
  if (isNaN(endDate.getTime())) {
    return res.status(400).json({
      error: 'Invalid endTime format',
      code: 'INVALID_END_TIME'
    });
  }
  
  if (endDate <= startDate) {
    return res.status(400).json({
      error: 'endTime must be after startTime',
      code: 'INVALID_TIME_RANGE'
    });
  }
  
  // Validate location length if provided
  if (location && location.length > 500) {
    return res.status(400).json({
      error: 'Location must not exceed 500 characters',
      code: 'LOCATION_TOO_LONG'
    });
  }
  
  // Validate attendees if provided
  let validatedAttendees = null;
  if (attendees) {
    if (Array.isArray(attendees)) {
      validatedAttendees = attendees
        .filter(a => typeof a === 'string' && a.trim().length > 0)
        .slice(0, 50); // Max 50 attendees
    } else if (typeof attendees === 'string') {
      validatedAttendees = [attendees];
    }
  }

  const event = createEvent({
    title: title.trim(),
    description: description?.trim() || null,
    startTime,
    endTime,
    location: location?.trim() || null,
    attendees: validatedAttendees
  });

  res.status(201).json({
    message: 'Event created successfully',
    event
  });
}));
