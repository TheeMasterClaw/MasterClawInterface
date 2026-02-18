import express from 'express';
import { 
  queryTimeEntries, 
  getTimeEntry, 
  getRunningTimeEntry,
  createTimeEntry, 
  updateTimeEntry, 
  deleteTimeEntry,
  getTimeStats
} from '../db.js';
import { 
  validateIdParam,
  asyncHandler 
} from '../middleware/security.js';

export const timeRouter = express.Router();

// Inspirational quotes
const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Everything is figureoutable.", author: "Marie Forleo" },
  { text: "Small progress is still progress.", author: "Unknown" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" }
];

// Get daily quote
// Returns a quote based on the day of the month (consistent throughout the day)
timeRouter.get('/quote', asyncHandler(async (req, res) => {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const quoteIndex = dayOfYear % QUOTES.length;
  
  res.json({
    ...QUOTES[quoteIndex],
    date: today.toISOString().split('T')[0],
    index: quoteIndex
  });
}));

// Get weather (mock - returns simulated weather data)
timeRouter.get('/weather', asyncHandler(async (req, res) => {
  // Generate somewhat realistic mock weather based on date
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  // Simulate seasonal temperature variation
  const baseTemp = 15 + 10 * Math.sin((dayOfYear - 100) * 2 * Math.PI / 365);
  const dailyVariation = Math.sin(today.getHours() * Math.PI / 12) * 5;
  const temperature = Math.round((baseTemp + dailyVariation) * 10) / 10;
  
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Overcast', 'Light Rain', 'Clear'];
  const conditionIndex = (dayOfYear + today.getDate()) % conditions.length;
  
  res.json({
    temperature,
    condition: conditions[conditionIndex],
    humidity: 40 + (dayOfYear % 40),
    windSpeed: 5 + (today.getDate() % 15),
    location: 'Local',
    updatedAt: new Date().toISOString()
  });
}));

// Query parameter validation schemas
const timeQuerySchema = {
  project: { type: 'string', maxLength: 100 },
  taskId: { type: 'string', maxLength: 24 },
  after: { type: 'date' },
  before: { type: 'date' },
  running: { type: 'boolean' }
};

// Get all time entries with optional filtering
timeRouter.get('/', asyncHandler(async (req, res) => {
  const { project, taskId, after, before, running } = req.query;
  const filter = {};
  
  if (project) filter.project = project;
  if (taskId) filter.taskId = taskId;
  if (after) filter.after = after;
  if (before) filter.before = before;
  if (running === 'true') filter.running = true;
  
  const entries = queryTimeEntries(filter);
  res.json({ 
    entries, 
    count: entries.length,
    filter: Object.keys(filter).length > 0 ? filter : undefined
  });
}));

// Get time statistics
timeRouter.get('/stats', asyncHandler(async (req, res) => {
  const { period = 'today' } = req.query;
  const validPeriods = ['today', 'week', 'month'];
  
  if (!validPeriods.includes(period)) {
    return res.status(400).json({
      error: `Period must be one of: ${validPeriods.join(', ')}`,
      code: 'INVALID_PERIOD'
    });
  }
  
  const stats = getTimeStats(period);
  res.json(stats);
}));

// Get currently running time entry
timeRouter.get('/running', asyncHandler(async (req, res) => {
  const entry = getRunningTimeEntry();
  
  if (!entry) {
    return res.json({ running: false, entry: null });
  }
  
  // Calculate current duration
  const now = new Date();
  const startTime = new Date(entry.startTime);
  const currentDuration = Math.floor((now - startTime) / 1000);
  
  res.json({ 
    running: true, 
    entry: {
      ...entry,
      currentDuration
    }
  });
}));

// Get single time entry by ID
timeRouter.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const entry = getTimeEntry(req.params.id);
  
  if (!entry) {
    return res.status(404).json({
      error: 'Time entry not found',
      code: 'TIME_ENTRY_NOT_FOUND'
    });
  }
  
  res.json({ entry });
}));

// Start a new time entry
timeRouter.post('/', asyncHandler(async (req, res) => {
  const { description, project, taskId } = req.body;
  
  // Validate description if provided
  if (description !== undefined) {
    if (typeof description !== 'string') {
      return res.status(400).json({
        error: 'Description must be a string',
        code: 'INVALID_DESCRIPTION'
      });
    }
    if (description.length > 500) {
      return res.status(400).json({
        error: 'Description must not exceed 500 characters',
        code: 'DESCRIPTION_TOO_LONG'
      });
    }
  }
  
  // Validate project if provided
  if (project !== undefined) {
    if (typeof project !== 'string') {
      return res.status(400).json({
        error: 'Project must be a string',
        code: 'INVALID_PROJECT'
      });
    }
    if (project.length > 100) {
      return res.status(400).json({
        error: 'Project must not exceed 100 characters',
        code: 'PROJECT_TOO_LONG'
      });
    }
  }
  
  // Check if there's already a running entry
  const runningEntry = getRunningTimeEntry();
  let stoppedEntry = null;
  
  if (runningEntry) {
    stoppedEntry = updateTimeEntry(runningEntry.id, { 
      endTime: new Date().toISOString() 
    });
  }
  
  const entry = createTimeEntry({
    description: description?.trim() || null,
    project: project?.trim() || null,
    taskId: taskId || null
  });
  
  res.status(201).json({
    message: 'Time tracking started',
    entry,
    previousEntry: stoppedEntry ? {
      id: stoppedEntry.id,
      duration: stoppedEntry.duration,
      description: stoppedEntry.description
    } : null
  });
}));

// Stop the currently running time entry
timeRouter.post('/stop', asyncHandler(async (req, res) => {
  const runningEntry = getRunningTimeEntry();
  
  if (!runningEntry) {
    return res.status(400).json({
      error: 'No time entry is currently running',
      code: 'NO_RUNNING_ENTRY'
    });
  }
  
  const entry = updateTimeEntry(runningEntry.id, { 
    endTime: new Date().toISOString() 
  });
  
  res.json({
    message: 'Time tracking stopped',
    entry
  });
}));

// Update a time entry
timeRouter.patch('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const { description, project, startTime, endTime } = req.body;
  const entry = getTimeEntry(req.params.id);
  
  if (!entry) {
    return res.status(404).json({
      error: 'Time entry not found',
      code: 'TIME_ENTRY_NOT_FOUND'
    });
  }
  
  const updates = {};
  
  if (description !== undefined) {
    if (typeof description !== 'string' || description.length > 500) {
      return res.status(400).json({
        error: 'Description must be a string not exceeding 500 characters',
        code: 'INVALID_DESCRIPTION'
      });
    }
    updates.description = description.trim() || null;
  }
  
  if (project !== undefined) {
    if (typeof project !== 'string' || project.length > 100) {
      return res.status(400).json({
        error: 'Project must be a string not exceeding 100 characters',
        code: 'INVALID_PROJECT'
      });
    }
    updates.project = project.trim() || null;
  }
  
  if (startTime !== undefined) {
    const parsedDate = new Date(startTime);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid startTime format',
        code: 'INVALID_START_TIME'
      });
    }
    updates.startTime = startTime;
  }
  
  if (endTime !== undefined) {
    if (endTime === null) {
      updates.endTime = null;
      updates.duration = 0;
    } else {
      const parsedDate = new Date(endTime);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid endTime format',
          code: 'INVALID_END_TIME'
        });
      }
      
      const start = new Date(updates.startTime || entry.startTime);
      if (parsedDate <= start) {
        return res.status(400).json({
          error: 'endTime must be after startTime',
          code: 'INVALID_TIME_RANGE'
        });
      }
      
      updates.endTime = endTime;
    }
  }
  
  // Recalculate duration if times changed
  if (updates.startTime || updates.endTime || endTime === null) {
    const start = new Date(updates.startTime || entry.startTime);
    const end = updates.endTime !== undefined 
      ? (updates.endTime ? new Date(updates.endTime) : null)
      : (entry.endTime ? new Date(entry.endTime) : null);
    
    if (end) {
      updates.duration = Math.floor((end - start) / 1000);
    } else {
      updates.duration = 0;
    }
  }
  
  const updatedEntry = updateTimeEntry(req.params.id, updates);
  
  res.json({
    message: 'Time entry updated successfully',
    entry: updatedEntry
  });
}));

// Delete a time entry
timeRouter.delete('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const entry = getTimeEntry(req.params.id);
  
  if (!entry) {
    return res.status(404).json({
      error: 'Time entry not found',
      code: 'TIME_ENTRY_NOT_FOUND'
    });
  }
  
  deleteTimeEntry(req.params.id);
  
  res.json({
    message: 'Time entry deleted successfully',
    deleted: {
      id: entry.id,
      description: entry.description,
      duration: entry.duration
    }
  });
}));
