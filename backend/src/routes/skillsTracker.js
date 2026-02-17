import express from 'express';
import { 
  querySkills, 
  getSkill, 
  createSkill, 
  updateSkill, 
  deleteSkill,
  queryPracticeSessions,
  getPracticeSession,
  createPracticeSession,
  updatePracticeSession,
  deletePracticeSession,
  getSkillStats
} from '../db.js';
import { 
  validateIdParam, 
  sanitizeBody,
  asyncHandler 
} from '../middleware/security.js';

export const skillsTrackerRouter = express.Router();

// Apply body sanitization to all routes
skillsTrackerRouter.use(sanitizeBody);

// ============================================================================
// SKILLS ENDPOINTS
// ============================================================================

// Get all skills with optional filtering
skillsTrackerRouter.get('/', asyncHandler(async (req, res) => {
  const { category, status, search } = req.query;
  const filter = {};
  
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (search) filter.search = search;
  
  const skills = querySkills(filter);
  
  // Calculate streak and total hours for each skill
  const skillsWithStats = skills.map(skill => {
    const sessions = queryPracticeSessions({ skillId: skill.id });
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    
    // Calculate streak
    const streak = calculateStreak(sessions);
    
    return {
      ...skill,
      totalHours,
      sessionCount: sessions.length,
      streak
    };
  });
  
  res.json({ 
    skills: skillsWithStats, 
    count: skillsWithStats.length,
    filter: Object.keys(filter).length > 0 ? filter : undefined
  });
}));

// Get skill categories
skillsTrackerRouter.get('/categories', asyncHandler(async (req, res) => {
  const skills = querySkills({});
  const categories = [...new Set(skills.map(s => s.category).filter(Boolean))];
  
  res.json({ 
    categories,
    predefined: [
      'Programming',
      'Languages',
      'Music',
      'Art & Design',
      'Fitness',
      'Cooking',
      'Writing',
      'Business',
      'Science',
      'Other'
    ]
  });
}));

// Get skill by ID
skillsTrackerRouter.get('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const skill = getSkill(req.params.id);
  
  if (!skill) {
    return res.status(404).json({ 
      error: 'Skill not found',
      code: 'SKILL_NOT_FOUND'
    });
  }
  
  // Get sessions for this skill
  const sessions = queryPracticeSessions({ skillId: skill.id });
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  
  res.json({ 
    skill: {
      ...skill,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      sessionCount: sessions.length,
      streak: calculateStreak(sessions),
      recentSessions: sessions.slice(0, 10)
    }
  });
}));

// Create skill
skillsTrackerRouter.post('/', asyncHandler(async (req, res) => {
  const { name, description, category, targetHours, targetLevel, color, icon } = req.body;
  
  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Name is required and must be a non-empty string',
      code: 'INVALID_NAME'
    });
  }
  
  // Validate name length
  if (name.length > 100) {
    return res.status(400).json({
      error: 'Name must not exceed 100 characters',
      code: 'NAME_TOO_LONG'
    });
  }
  
  // Validate proficiency level if provided
  const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const currentLevel = req.body.currentLevel || 'beginner';
  if (!validLevels.includes(currentLevel)) {
    return res.status(400).json({
      error: `Current level must be one of: ${validLevels.join(', ')}`,
      code: 'INVALID_LEVEL'
    });
  }
  
  // Validate target level if provided
  if (targetLevel && !validLevels.includes(targetLevel)) {
    return res.status(400).json({
      error: `Target level must be one of: ${validLevels.join(', ')}`,
      code: 'INVALID_TARGET_LEVEL'
    });
  }
  
  // Validate target hours
  if (targetHours !== undefined && (typeof targetHours !== 'number' || targetHours < 0)) {
    return res.status(400).json({
      error: 'Target hours must be a positive number',
      code: 'INVALID_TARGET_HOURS'
    });
  }
  
  const skill = createSkill({
    name: name.trim(),
    description: description?.trim() || null,
    category: category?.trim() || 'Other',
    currentLevel,
    targetLevel: targetLevel || null,
    targetHours: targetHours || null,
    color: color || generateSkillColor(),
    icon: icon || '📚'
  });
  
  res.status(201).json({
    message: 'Skill created successfully',
    skill
  });
}));

// Update skill
skillsTrackerRouter.patch('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const skill = getSkill(req.params.id);
  
  if (!skill) {
    return res.status(404).json({ 
      error: 'Skill not found',
      code: 'SKILL_NOT_FOUND'
    });
  }
  
  const { name, description, category, currentLevel, targetLevel, targetHours, color, icon, status } = req.body;
  const updates = {};
  
  // Validate and apply updates
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Name must be a non-empty string',
        code: 'INVALID_NAME'
      });
    }
    if (name.length > 100) {
      return res.status(400).json({
        error: 'Name must not exceed 100 characters',
        code: 'NAME_TOO_LONG'
      });
    }
    updates.name = name.trim();
  }
  
  if (description !== undefined) {
    updates.description = description?.trim() || null;
  }
  
  if (category !== undefined) {
    updates.category = category?.trim() || 'Other';
  }
  
  if (currentLevel !== undefined) {
    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (!validLevels.includes(currentLevel)) {
      return res.status(400).json({
        error: `Level must be one of: ${validLevels.join(', ')}`,
        code: 'INVALID_LEVEL'
      });
    }
    updates.currentLevel = currentLevel;
  }
  
  if (targetLevel !== undefined) {
    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (targetLevel && !validLevels.includes(targetLevel)) {
      return res.status(400).json({
        error: `Target level must be one of: ${validLevels.join(', ')}`,
        code: 'INVALID_TARGET_LEVEL'
      });
    }
    updates.targetLevel = targetLevel || null;
  }
  
  if (targetHours !== undefined) {
    if (targetHours === null) {
      updates.targetHours = null;
    } else if (typeof targetHours !== 'number' || targetHours < 0) {
      return res.status(400).json({
        error: 'Target hours must be a positive number',
        code: 'INVALID_TARGET_HOURS'
      });
    } else {
      updates.targetHours = targetHours;
    }
  }
  
  if (color !== undefined) {
    updates.color = color;
  }
  
  if (icon !== undefined) {
    updates.icon = icon;
  }
  
  if (status !== undefined) {
    const validStatuses = ['active', 'paused', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS'
      });
    }
    updates.status = status;
  }
  
  // Only update if there are changes
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: 'No valid fields provided for update',
      code: 'NO_UPDATES'
    });
  }
  
  const updatedSkill = updateSkill(req.params.id, updates);
  
  res.json({
    message: 'Skill updated successfully',
    skill: updatedSkill
  });
}));

// Delete skill
skillsTrackerRouter.delete('/:id', validateIdParam, asyncHandler(async (req, res) => {
  const skill = getSkill(req.params.id);
  
  if (!skill) {
    return res.status(404).json({ 
      error: 'Skill not found',
      code: 'SKILL_NOT_FOUND'
    });
  }
  
  deleteSkill(req.params.id);
  
  res.json({ 
    message: 'Skill deleted successfully',
    deleted: {
      id: skill.id,
      name: skill.name
    }
  });
}));

// ============================================================================
// PRACTICE SESSIONS ENDPOINTS
// ============================================================================

// Get all practice sessions with optional filtering
skillsTrackerRouter.get('/sessions/list', asyncHandler(async (req, res) => {
  const { skillId, after, before, limit = 50 } = req.query;
  const filter = {};
  
  if (skillId) filter.skillId = skillId;
  if (after) filter.after = after;
  if (before) filter.before = before;
  
  const sessions = queryPracticeSessions(filter);
  const limitedSessions = sessions.slice(0, parseInt(limit, 10));
  
  // Enrich sessions with skill info
  const enrichedSessions = limitedSessions.map(session => {
    const skill = getSkill(session.skillId);
    return {
      ...session,
      skillName: skill?.name || 'Unknown Skill',
      skillColor: skill?.color || '#6366f1',
      skillIcon: skill?.icon || '📚'
    };
  });
  
  res.json({ 
    sessions: enrichedSessions, 
    count: enrichedSessions.length,
    total: sessions.length,
    filter: Object.keys(filter).length > 0 ? filter : undefined
  });
}));

// Get practice session by ID
skillsTrackerRouter.get('/sessions/:id', validateIdParam, asyncHandler(async (req, res) => {
  const session = getPracticeSession(req.params.id);
  
  if (!session) {
    return res.status(404).json({ 
      error: 'Practice session not found',
      code: 'SESSION_NOT_FOUND'
    });
  }
  
  const skill = getSkill(session.skillId);
  
  res.json({ 
    session: {
      ...session,
      skillName: skill?.name || 'Unknown Skill',
      skillColor: skill?.color || '#6366f1',
      skillIcon: skill?.icon || '📚'
    }
  });
}));

// Create practice session
skillsTrackerRouter.post('/sessions', asyncHandler(async (req, res) => {
  const { skillId, duration, notes, mood, tags, date } = req.body;
  
  // Validate required fields
  if (!skillId) {
    return res.status(400).json({ 
      error: 'Skill ID is required',
      code: 'INVALID_SKILL_ID'
    });
  }
  
  // Check if skill exists
  const skill = getSkill(skillId);
  if (!skill) {
    return res.status(404).json({ 
      error: 'Skill not found',
      code: 'SKILL_NOT_FOUND'
    });
  }
  
  // Validate duration
  if (duration === undefined || typeof duration !== 'number' || duration < 1) {
    return res.status(400).json({ 
      error: 'Duration is required and must be a positive number (in minutes)',
      code: 'INVALID_DURATION'
    });
  }
  
  if (duration > 1440) { // Max 24 hours
    return res.status(400).json({
      error: 'Duration cannot exceed 1440 minutes (24 hours)',
      code: 'DURATION_TOO_LONG'
    });
  }
  
  // Validate mood if provided
  if (mood !== undefined) {
    const validMoods = ['terrible', 'bad', 'neutral', 'good', 'great'];
    if (!validMoods.includes(mood)) {
      return res.status(400).json({
        error: `Mood must be one of: ${validMoods.join(', ')}`,
        code: 'INVALID_MOOD'
      });
    }
  }
  
  // Validate date if provided
  let sessionDate = new Date().toISOString();
  if (date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        code: 'INVALID_DATE'
      });
    }
    sessionDate = parsedDate.toISOString();
  }
  
  const session = createPracticeSession({
    skillId,
    duration,
    notes: notes?.trim() || null,
    mood: mood || null,
    tags: tags || [],
    date: sessionDate
  });
  
  res.status(201).json({
    message: 'Practice session logged successfully',
    session: {
      ...session,
      skillName: skill.name,
      skillColor: skill.color,
      skillIcon: skill.icon
    }
  });
}));

// Update practice session
skillsTrackerRouter.patch('/sessions/:id', validateIdParam, asyncHandler(async (req, res) => {
  const session = getPracticeSession(req.params.id);
  
  if (!session) {
    return res.status(404).json({ 
      error: 'Practice session not found',
      code: 'SESSION_NOT_FOUND'
    });
  }
  
  const { duration, notes, mood, tags, date } = req.body;
  const updates = {};
  
  if (duration !== undefined) {
    if (typeof duration !== 'number' || duration < 1) {
      return res.status(400).json({
        error: 'Duration must be a positive number',
        code: 'INVALID_DURATION'
      });
    }
    if (duration > 1440) {
      return res.status(400).json({
        error: 'Duration cannot exceed 1440 minutes',
        code: 'DURATION_TOO_LONG'
      });
    }
    updates.duration = duration;
  }
  
  if (notes !== undefined) {
    updates.notes = notes?.trim() || null;
  }
  
  if (mood !== undefined) {
    const validMoods = ['terrible', 'bad', 'neutral', 'good', 'great'];
    if (mood && !validMoods.includes(mood)) {
      return res.status(400).json({
        error: `Mood must be one of: ${validMoods.join(', ')}`,
        code: 'INVALID_MOOD'
      });
    }
    updates.mood = mood || null;
  }
  
  if (tags !== undefined) {
    updates.tags = Array.isArray(tags) ? tags : [];
  }
  
  if (date !== undefined) {
    if (date === null) {
      updates.date = new Date().toISOString();
    } else {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format',
          code: 'INVALID_DATE'
        });
      }
      updates.date = parsedDate.toISOString();
    }
  }
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: 'No valid fields provided for update',
      code: 'NO_UPDATES'
    });
  }
  
  const updatedSession = updatePracticeSession(req.params.id, updates);
  const skill = getSkill(updatedSession.skillId);
  
  res.json({
    message: 'Practice session updated successfully',
    session: {
      ...updatedSession,
      skillName: skill?.name || 'Unknown Skill',
      skillColor: skill?.color || '#6366f1',
      skillIcon: skill?.icon || '📚'
    }
  });
}));

// Delete practice session
skillsTrackerRouter.delete('/sessions/:id', validateIdParam, asyncHandler(async (req, res) => {
  const session = getPracticeSession(req.params.id);
  
  if (!session) {
    return res.status(404).json({ 
      error: 'Practice session not found',
      code: 'SESSION_NOT_FOUND'
    });
  }
  
  deletePracticeSession(req.params.id);
  
  res.json({ 
    message: 'Practice session deleted successfully',
    deleted: {
      id: session.id,
      skillId: session.skillId
    }
  });
}));

// ============================================================================
// STATS ENDPOINTS
// ============================================================================

// Get overall learning stats
skillsTrackerRouter.get('/stats/overview', asyncHandler(async (req, res) => {
  const stats = getSkillStats();
  res.json(stats);
}));

// Get stats for specific skill
skillsTrackerRouter.get('/:id/stats', validateIdParam, asyncHandler(async (req, res) => {
  const skill = getSkill(req.params.id);
  
  if (!skill) {
    return res.status(404).json({ 
      error: 'Skill not found',
      code: 'SKILL_NOT_FOUND'
    });
  }
  
  const sessions = queryPracticeSessions({ skillId: skill.id });
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
  
  // Calculate progress to target
  let progressPercent = null;
  if (skill.targetHours && skill.targetHours > 0) {
    progressPercent = Math.min(100, Math.round((totalHours / skill.targetHours) * 100));
  }
  
  // Group by day for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentSessions = sessions.filter(s => new Date(s.date) >= thirtyDaysAgo);
  const dailyBreakdown = {};
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyBreakdown[dateStr] = 0;
  }
  
  recentSessions.forEach(s => {
    const dateStr = new Date(s.date).toISOString().split('T')[0];
    if (dailyBreakdown[dateStr] !== undefined) {
      dailyBreakdown[dateStr] += s.duration;
    }
  });
  
  // Mood distribution
  const moodCounts = sessions.reduce((acc, s) => {
    if (s.mood) {
      acc[s.mood] = (acc[s.mood] || 0) + 1;
    }
    return acc;
  }, {});
  
  res.json({
    skillId: skill.id,
    skillName: skill.name,
    totalHours,
    totalMinutes,
    sessionCount: sessions.length,
    averageSessionMinutes: sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
    streak: calculateStreak(sessions),
    longestStreak: calculateLongestStreak(sessions),
    targetHours: skill.targetHours,
    progressPercent,
    dailyBreakdown,
    moodDistribution: moodCounts,
    currentLevel: skill.currentLevel,
    targetLevel: skill.targetLevel
  });
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;
  
  // Sort by date descending
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Get unique practice days
  const practiceDays = [...new Set(sortedSessions.map(s => {
    const date = new Date(s.date);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }))].sort((a, b) => b - a);
  
  if (practiceDays.length === 0) return 0;
  
  // Check if practiced today or yesterday
  const lastPracticeDay = new Date(practiceDays[0]);
  if (lastPracticeDay < yesterday) return 0; // Streak broken
  
  // Count consecutive days
  let streak = 1;
  for (let i = 1; i < practiceDays.length; i++) {
    const currentDay = new Date(practiceDays[i - 1]);
    const previousDay = new Date(practiceDays[i]);
    
    const diffDays = (currentDay - previousDay) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateLongestStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;
  
  // Get unique practice days sorted
  const practiceDays = [...new Set(sessions.map(s => {
    const date = new Date(s.date);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }))].sort((a, b) => a - b);
  
  if (practiceDays.length === 0) return 0;
  
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < practiceDays.length; i++) {
    const currentDay = new Date(practiceDays[i]);
    const previousDay = new Date(practiceDays[i - 1]);
    
    const diffDays = (currentDay - previousDay) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return longestStreak;
}

function generateSkillColor() {
  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f43f5e', // rose
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#a855f7', // purple
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default skillsTrackerRouter;
