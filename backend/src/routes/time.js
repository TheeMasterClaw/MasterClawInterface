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
