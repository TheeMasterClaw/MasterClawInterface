import express from 'express';
import { asyncHandler } from '../middleware/security.js';
import {
  registerSkill,
  listSkills,
  getSkill,
  updateSkill,
  removeSkill,
  invokeSkill,
} from '../services/skillRegistry.js';

export const skillsRouter = express.Router();

// List all registered skills
skillsRouter.get('/', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const skills = listSkills(filter);
  res.json({ skills, count: skills.length });
}));

// Get a specific skill by ID
skillsRouter.get('/:id', asyncHandler(async (req, res) => {
  const skill = getSkill(req.params.id);
  if (!skill) {
    return res.status(404).json({ error: 'Skill not found', code: 'SKILL_NOT_FOUND' });
  }
  res.json(skill);
}));

// Register a new skill
skillsRouter.post('/', asyncHandler(async (req, res) => {
  const { name, description, trigger, parameters, endpoint } = req.body;

  if (!name || !description || !trigger) {
    return res.status(400).json({
      error: 'name, description, and trigger are required',
      code: 'MISSING_FIELDS',
    });
  }

  try {
    const skill = registerSkill({ name, description, trigger, parameters, endpoint });
    res.status(201).json(skill);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}));

// Update a skill
skillsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const skill = updateSkill(req.params.id, req.body);
  if (!skill) {
    return res.status(404).json({ error: 'Skill not found', code: 'SKILL_NOT_FOUND' });
  }
  res.json(skill);
}));

// Remove a skill
skillsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const removed = removeSkill(req.params.id);
  if (!removed) {
    return res.status(404).json({ error: 'Skill not found', code: 'SKILL_NOT_FOUND' });
  }
  res.json({ success: true });
}));

// Invoke a skill by trigger
skillsRouter.post('/invoke/:trigger', asyncHandler(async (req, res) => {
  const { trigger } = req.params;
  const params = req.body.params || req.body;

  try {
    const result = await invokeSkill(trigger, params);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
}));
