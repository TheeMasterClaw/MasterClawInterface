import { getDb, genId } from '../backend/src/db.js';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const db = getDb();
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY dueDate ASC').all();
    return res.status(200).json(tasks);
  }

  if (req.method === 'POST') {
    const db = getDb();
    const { title, description, priority, dueDate, tags } = req.body;
    const id = genId();

    try {
      db.prepare(
        'INSERT INTO tasks (id, title, description, priority, dueDate, tags) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, title, description || null, priority || 'normal', dueDate || null, tags || null);

      return res.status(201).json({ id, title, description, priority, dueDate, tags });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
