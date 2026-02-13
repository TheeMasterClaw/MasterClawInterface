import express from 'express';
import { 
  queryTasks, 
  getTask, 
  createTask, 
  updateTask, 
  deleteTask 
} from '../db.js';
import { 
  validateIdParam, 
  validateTaskExists,
  sanitizeBody,
  asyncHandler 
} from '../middleware/security.js';

export const tasksRouter = express.Router();

// Apply body sanitization to all routes
tasksRouter.use(sanitizeBody);

// Get all tasks with optional filtering
tasksRouter.get('/', asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  const filter = {};
  
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  
  const tasks = queryTasks(filter);
  res.json({ 
    tasks, 
    count: tasks.length,
    filter: Object.keys(filter).length > 0 ? filter : undefined
  });
}));

// Get task by ID - with validation
tasksRouter.get('/:id', validateTaskExists, (req, res) => {
  res.json({ task: req.task });
});

// Create task - with improved validation
tasksRouter.post('/', asyncHandler(async (req, res) => {
  const { title, description, priority, dueDate, tags } = req.body;
  
  // Validate required fields
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Title is required and must be a non-empty string',
      code: 'INVALID_TITLE'
    });
  }
  
  // Validate title length
  if (title.length > 200) {
    return res.status(400).json({
      error: 'Title must not exceed 200 characters',
      code: 'TITLE_TOO_LONG'
    });
  }
  
  // Validate priority if provided
  const validPriorities = ['low', 'normal', 'high'];
  const validatedPriority = priority?.toLowerCase();
  if (priority && !validPriorities.includes(validatedPriority)) {
    return res.status(400).json({
      error: `Priority must be one of: ${validPriorities.join(', ')}`,
      code: 'INVALID_PRIORITY',
      validPriorities
    });
  }
  
  // Validate dueDate if provided
  if (dueDate) {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid dueDate format',
        code: 'INVALID_DATE'
      });
    }
  }
  
  // Validate tags if provided
  let validatedTags = null;
  if (tags) {
    if (Array.isArray(tags)) {
      validatedTags = tags
        .filter(t => typeof t === 'string' && t.trim().length > 0)
        .map(t => t.trim())
        .slice(0, 10); // Max 10 tags
    } else if (typeof tags === 'string') {
      validatedTags = [tags.trim()];
    }
  }

  const task = createTask({
    title: title.trim(),
    description: description?.trim() || null,
    priority: validatedPriority || 'normal',
    dueDate: dueDate || null,
    tags: validatedTags
  });
  
  res.status(201).json({
    message: 'Task created successfully',
    task
  });
}));

// Update task - with validation and existence check
tasksRouter.patch('/:id', validateTaskExists, asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, tags } = req.body;
  const updates = {};
  
  // Validate and apply updates
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Title must be a non-empty string',
        code: 'INVALID_TITLE'
      });
    }
    if (title.length > 200) {
      return res.status(400).json({
        error: 'Title must not exceed 200 characters',
        code: 'TITLE_TOO_LONG'
      });
    }
    updates.title = title.trim();
  }
  
  if (description !== undefined) {
    updates.description = description?.trim() || null;
  }
  
  if (status !== undefined) {
    const validStatuses = ['open', 'in_progress', 'done', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS',
        validStatuses
      });
    }
    updates.status = status;
  }
  
  if (priority !== undefined) {
    const validPriorities = ['low', 'normal', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: `Priority must be one of: ${validPriorities.join(', ')}`,
        code: 'INVALID_PRIORITY',
        validPriorities
      });
    }
    updates.priority = priority;
  }
  
  if (dueDate !== undefined) {
    if (dueDate === null) {
      updates.dueDate = null;
    } else {
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid dueDate format',
          code: 'INVALID_DATE'
        });
      }
      updates.dueDate = dueDate;
    }
  }
  
  if (tags !== undefined) {
    if (tags === null) {
      updates.tags = null;
    } else if (Array.isArray(tags)) {
      updates.tags = tags
        .filter(t => typeof t === 'string' && t.trim().length > 0)
        .map(t => t.trim())
        .slice(0, 10);
    } else if (typeof tags === 'string') {
      updates.tags = [tags.trim()];
    }
  }
  
  // Only update if there are changes
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: 'No valid fields provided for update',
      code: 'NO_UPDATES'
    });
  }
  
  const task = updateTask(req.params.id, updates);
  
  res.json({
    message: 'Task updated successfully',
    task
  });
}));

// Delete task - with validation and proper error handling
tasksRouter.delete('/:id', validateTaskExists, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedTask = req.task;
  
  deleteTask(id);
  
  res.json({ 
    message: 'Task deleted successfully',
    deleted: {
      id: deletedTask.id,
      title: deletedTask.title
    }
  });
}));
