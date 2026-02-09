import express from 'express';
import { getDb, genId } from '../db.js';

export const tasksRouter = express.Router();

// Get all tasks
tasksRouter.get('/', (req, res) => {
  const db = getDb();
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY dueDate ASC').all();
  res.json(tasks);
});

// Get task by ID
tasksRouter.get('/:id', (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// Create task
tasksRouter.post('/', (req, res) => {
  const db = getDb();
  const { title, description, priority, dueDate, tags } = req.body;
  const id = genId();

  try {
    db.prepare(
      'INSERT INTO tasks (id, title, description, priority, dueDate, tags) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, title, description || null, priority || 'normal', dueDate || null, tags || null);

    res.status(201).json({ id, title, description, priority, dueDate, tags });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task
tasksRouter.patch('/:id', (req, res) => {
  const db = getDb();
  const { title, description, status, priority, dueDate, tags } = req.body;

  try {
    db.prepare(
      'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, dueDate = ?, tags = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(title, description, status, priority, dueDate, tags, req.params.id);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task
tasksRouter.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});
