import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'mc.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory JSON-based database for Railway compatibility
let db = {
  tasks: [],
  calendar_events: [],
  memories: [],
  settings: {}
};

// Load from disk if exists
function loadDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      db = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading database:', err.message);
  }
}

// Save to disk
function saveDb() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error saving database:', err.message);
  }
}

// Load on startup
loadDb();

export function getDb() {
  return db;
}

export function updateDb() {
  saveDb();
}

export async function initDb() {
  console.log('✅ Database initialized (JSON-based)');
}

// Helper to generate IDs
export function genId() {
  return crypto.randomBytes(12).toString('hex');
}

// Helper functions
export function queryTasks(filter = {}) {
  let tasks = db.tasks;
  if (filter.status) tasks = tasks.filter(t => t.status === filter.status);
  if (filter.priority) tasks = tasks.filter(t => t.priority === filter.priority);
  return tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

export function getTask(id) {
  return db.tasks.find(t => t.id === id);
}

export function createTask(task) {
  const newTask = {
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'open',
    ...task
  };
  db.tasks.push(newTask);
  saveDb();
  return newTask;
}

export function updateTask(id, updates) {
  const task = getTask(id);
  if (!task) return null;
  Object.assign(task, updates, { updatedAt: new Date().toISOString() });
  saveDb();
  return task;
}

export function deleteTask(id) {
  db.tasks = db.tasks.filter(t => t.id !== id);
  saveDb();
}

export function queryEvents(filter = {}) {
  let events = db.calendar_events;
  if (filter.after) events = events.filter(e => new Date(e.startTime) >= new Date(filter.after));
  if (filter.before) events = events.filter(e => new Date(e.startTime) <= new Date(filter.before));
  return events.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
}

export function getEvent(id) {
  return db.calendar_events.find(e => e.id === id);
}

export function createEvent(event) {
  const newEvent = {
    id: genId(),
    synced_at: new Date().toISOString(),
    ...event
  };
  db.calendar_events.push(newEvent);
  saveDb();
  return newEvent;
}

export function createMemory(memory) {
  const newMemory = {
    id: genId(),
    createdAt: new Date().toISOString(),
    ...memory
  };
  db.memories.push(newMemory);
  saveDb();
  return newMemory;
}

export function queryMemories(filter = {}) {
  let memories = db.memories;
  if (filter.type) memories = memories.filter(m => m.type === filter.type);
  return memories;
}
