import express from 'express';
import { 
  queryTasks, 
  getTask, 
  createTask, 
  updateTask, 
  deleteTask 
} from '../db.js';

export const tasksRouter = express.Router();

// Get all tasks
tasksRouter.get('/', (req, res) => {
  const tasks = queryTasks();
  res.json(tasks);
});

// Get task by ID
tasksRouter.get('/:id', (req, res) => {
  const task = getTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// Create task
tasksRouter.post('/', (req, res) => {
  const { title, description, priority, dueDate, tags } = req.body;
  
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const task = createTask({
      title,
      description: description || null,
      priority: priority || 'normal',
      dueDate: dueDate || null,
      tags: tags || null
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task
tasksRouter.patch('/:id', (req, res) => {
  const { title, description, status, priority, dueDate, tags } = req.body;

  try {
    const task = updateTask(req.params.id, {
      title,
      description,
      status,
      priority,
      dueDate,
      tags
    });
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task
tasksRouter.delete('/:id', (req, res) => {
  deleteTask(req.params.id);
  res.json({ success: true });
});
