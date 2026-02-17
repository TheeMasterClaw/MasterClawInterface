import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'mc.json');

/**
 * Set secure file permissions (owner read/write only)
 * Prevents other users from accessing sensitive MasterClaw data
 */
function setSecurePermissions(filePath) {
  try {
    fs.chmodSync(filePath, 0o600);
  } catch (err) {
    console.warn(`[Security] Could not set secure permissions on ${filePath}:`, err.message);
  }
}

/**
 * Set secure directory permissions (owner read/write/execute only)
 */
function setSecureDirPermissions(dirPath) {
  try {
    fs.chmodSync(dirPath, 0o700);
  } catch (err) {
    console.warn(`[Security] Could not set secure permissions on ${dirPath}:`, err.message);
  }
}

/**
 * Ensure data directory exists with secure permissions
 */
function ensureSecureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  // Always ensure secure permissions on data directory
  setSecureDirPermissions(dataDir);
}

// Initialize secure data directory
ensureSecureDataDir();

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

// Save to disk with secure permissions
function saveDb() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    // Ensure database file has secure permissions (owner read/write only)
    setSecurePermissions(dbPath);
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

// Helper functions for time tracking
export function queryTimeEntries(filter = {}) {
  if (!db.time_entries) db.time_entries = [];
  let entries = db.time_entries;
  
  if (filter.project) entries = entries.filter(e => e.project === filter.project);
  if (filter.taskId) entries = entries.filter(e => e.taskId === filter.taskId);
  if (filter.after) entries = entries.filter(e => new Date(e.startTime) >= new Date(filter.after));
  if (filter.before) entries = entries.filter(e => new Date(e.startTime) <= new Date(filter.before));
  if (filter.running) entries = entries.filter(e => !e.endTime);
  
  return entries.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
}

export function getTimeEntry(id) {
  if (!db.time_entries) db.time_entries = [];
  return db.time_entries.find(e => e.id === id);
}

export function getRunningTimeEntry() {
  if (!db.time_entries) db.time_entries = [];
  return db.time_entries.find(e => !e.endTime);
}

export function createTimeEntry(entry) {
  if (!db.time_entries) db.time_entries = [];
  
  // Stop any running entry first
  const running = getRunningTimeEntry();
  if (running) {
    running.endTime = new Date().toISOString();
    running.updatedAt = new Date().toISOString();
  }
  
  const newEntry = {
    id: genId(),
    startTime: new Date().toISOString(),
    endTime: null,
    duration: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...entry
  };
  
  db.time_entries.push(newEntry);
  saveDb();
  return newEntry;
}

export function updateTimeEntry(id, updates) {
  if (!db.time_entries) db.time_entries = [];
  const entry = getTimeEntry(id);
  if (!entry) return null;
  
  // Calculate duration if endTime is being set
  if (updates.endTime && !entry.endTime) {
    const endTime = new Date(updates.endTime);
    const startTime = new Date(entry.startTime);
    updates.duration = Math.floor((endTime - startTime) / 1000); // duration in seconds
  }
  
  Object.assign(entry, updates, { updatedAt: new Date().toISOString() });
  saveDb();
  return entry;
}

export function deleteTimeEntry(id) {
  if (!db.time_entries) db.time_entries = [];
  db.time_entries = db.time_entries.filter(e => e.id !== id);
  saveDb();
}

export function getTimeStats(period = 'today') {
  if (!db.time_entries) db.time_entries = [];
  
  const now = new Date();
  let startOfPeriod;
  
  switch (period) {
    case 'today':
      startOfPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startOfPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      break;
    case 'month':
      startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startOfPeriod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  
  const entries = db.time_entries.filter(e => 
    new Date(e.startTime) >= startOfPeriod && e.endTime
  );
  
  const totalDuration = entries.reduce((acc, e) => acc + (e.duration || 0), 0);
  
  // Group by project
  const byProject = entries.reduce((acc, e) => {
    const project = e.project || 'Uncategorized';
    acc[project] = (acc[project] || 0) + (e.duration || 0);
    return acc;
  }, {});
  
  // Group by day for week/month view
  const byDay = entries.reduce((acc, e) => {
    const day = new Date(e.startTime).toDateString();
    acc[day] = (acc[day] || 0) + (e.duration || 0);
    return acc;
  }, {});
  
  return {
    period,
    totalDuration,
    entryCount: entries.length,
    byProject,
    byDay,
    averageSessionLength: entries.length > 0 ? Math.round(totalDuration / entries.length) : 0
  };
}

// ============================================================================
// SKILL TRACKER - Helper functions for learning/skills management
// ============================================================================

export function querySkills(filter = {}) {
  if (!db.skills) db.skills = [];
  let skills = db.skills;
  
  if (filter.category) {
    skills = skills.filter(s => s.category?.toLowerCase() === filter.category.toLowerCase());
  }
  
  if (filter.status) {
    skills = skills.filter(s => s.status === filter.status);
  }
  
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    skills = skills.filter(s => 
      s.name?.toLowerCase().includes(searchLower) ||
      s.description?.toLowerCase().includes(searchLower)
    );
  }
  
  return skills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getSkill(id) {
  if (!db.skills) db.skills = [];
  return db.skills.find(s => s.id === id);
}

export function createSkill(skill) {
  if (!db.skills) db.skills = [];
  
  const newSkill = {
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    ...skill
  };
  
  db.skills.push(newSkill);
  saveDb();
  return newSkill;
}

export function updateSkill(id, updates) {
  if (!db.skills) db.skills = [];
  
  const skill = getSkill(id);
  if (!skill) return null;
  
  Object.assign(skill, updates, { updatedAt: new Date().toISOString() });
  saveDb();
  return skill;
}

export function deleteSkill(id) {
  if (!db.skills) db.skills = [];
  db.skills = db.skills.filter(s => s.id !== id);
  
  // Also delete associated practice sessions
  if (db.practice_sessions) {
    db.practice_sessions = db.practice_sessions.filter(ps => ps.skillId !== id);
  }
  
  saveDb();
}

export function queryPracticeSessions(filter = {}) {
  if (!db.practice_sessions) db.practice_sessions = [];
  let sessions = db.practice_sessions;
  
  if (filter.skillId) {
    sessions = sessions.filter(ps => ps.skillId === filter.skillId);
  }
  
  if (filter.after) {
    const afterDate = new Date(filter.after);
    sessions = sessions.filter(ps => new Date(ps.date) >= afterDate);
  }
  
  if (filter.before) {
    const beforeDate = new Date(filter.before);
    sessions = sessions.filter(ps => new Date(ps.date) <= beforeDate);
  }
  
  return sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getPracticeSession(id) {
  if (!db.practice_sessions) db.practice_sessions = [];
  return db.practice_sessions.find(ps => ps.id === id);
}

export function createPracticeSession(session) {
  if (!db.practice_sessions) db.practice_sessions = [];
  
  const newSession = {
    id: genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...session
  };
  
  db.practice_sessions.push(newSession);
  saveDb();
  return newSession;
}

export function updatePracticeSession(id, updates) {
  if (!db.practice_sessions) db.practice_sessions = [];
  
  const session = getPracticeSession(id);
  if (!session) return null;
  
  Object.assign(session, updates, { updatedAt: new Date().toISOString() });
  saveDb();
  return session;
}

export function deletePracticeSession(id) {
  if (!db.practice_sessions) db.practice_sessions = [];
  db.practice_sessions = db.practice_sessions.filter(ps => ps.id !== id);
  saveDb();
}

export function getSkillStats() {
  if (!db.skills) db.skills = [];
  if (!db.practice_sessions) db.practice_sessions = [];
  
  const totalSkills = db.skills.length;
  const activeSkills = db.skills.filter(s => s.status === 'active').length;
  const completedSkills = db.skills.filter(s => s.status === 'completed').length;
  
  const totalSessions = db.practice_sessions.length;
  const totalMinutes = db.practice_sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
  
  // Calculate this week's stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const thisWeekSessions = db.practice_sessions.filter(s => 
    new Date(s.date) >= weekAgo
  );
  const thisWeekMinutes = thisWeekSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  
  // Group by category
  const byCategory = db.skills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    const sessions = db.practice_sessions.filter(ps => ps.skillId === skill.id);
    const minutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    
    if (!acc[category]) {
      acc[category] = { skills: 0, hours: 0, sessions: 0 };
    }
    acc[category].skills++;
    acc[category].hours += Math.round(minutes / 60 * 10) / 10;
    acc[category].sessions += sessions.length;
    
    return acc;
  }, {});
  
  // Group by level
  const byLevel = db.skills.reduce((acc, skill) => {
    const level = skill.currentLevel || 'beginner';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalSkills,
    activeSkills,
    completedSkills,
    totalSessions,
    totalHours,
    totalMinutes,
    thisWeekSessions: thisWeekSessions.length,
    thisWeekHours: Math.round(thisWeekMinutes / 60 * 10) / 10,
    thisWeekMinutes,
    averageSessionMinutes: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
    byCategory,
    byLevel
  };
}

// Helper functions for chat history
export function createChatMessage(message) {
  const newMessage = {
    id: genId(),
    createdAt: new Date().toISOString(),
    ...message
  };
  if (!db.chat_history) db.chat_history = [];
  db.chat_history.push(newMessage);
  
  // Keep only last 1000 messages
  if (db.chat_history.length > 1000) {
    db.chat_history = db.chat_history.slice(-1000);
  }
  
  saveDb();
  return newMessage;
}

export function queryChatHistory(limit = 100, before = null) {
  if (!db.chat_history) return [];
  
  let messages = [...db.chat_history].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );
  
  if (before) {
    const beforeDate = new Date(before);
    messages = messages.filter(m => new Date(m.createdAt) < beforeDate);
  }
  
  return messages.slice(-limit);
}

export function clearChatHistory() {
  db.chat_history = [];
  saveDb();
}

/**
 * Run a security audit on the database file and directory permissions
 * Returns a report of security status and any issues found
 */
export function auditSecurity() {
  const audit = {
    secure: true,
    timestamp: new Date().toISOString(),
    checks: [],
    warnings: [],
    recommendations: []
  };

  // Check data directory permissions
  try {
    const dirStats = fs.statSync(dataDir);
    const dirMode = dirStats.mode & 0o777;
    if (dirMode !== 0o700) {
      audit.secure = false;
      audit.warnings.push(`Data directory has permissive permissions: ${dirMode.toString(8)} (expected 700)`);
      audit.recommendations.push(`Run: chmod 700 ${dataDir}`);
    } else {
      audit.checks.push({ name: 'data_directory_permissions', status: 'pass', mode: '700' });
    }
  } catch (err) {
    audit.secure = false;
    audit.warnings.push(`Could not check data directory permissions: ${err.message}`);
  }

  // Check database file permissions
  try {
    if (fs.existsSync(dbPath)) {
      const fileStats = fs.statSync(dbPath);
      const fileMode = fileStats.mode & 0o777;
      if (fileMode !== 0o600) {
        audit.secure = false;
        audit.warnings.push(`Database file has permissive permissions: ${fileMode.toString(8)} (expected 600)`);
        audit.recommendations.push(`Run: chmod 600 ${dbPath}`);
      } else {
        audit.checks.push({ name: 'database_file_permissions', status: 'pass', mode: '600' });
      }
    }
  } catch (err) {
    audit.secure = false;
    audit.warnings.push(`Could not check database file permissions: ${err.message}`);
  }

  return audit;
}
