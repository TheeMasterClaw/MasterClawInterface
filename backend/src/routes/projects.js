const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage for projects (in production, use a database)
let projects = [];

// Get all projects
router.get('/', (req, res) => {
  res.json(projects);
});

// Get a single project
router.get('/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

// Create a new project
router.post('/', (req, res) => {
  const { name, description, category, status, deadline, targetHours } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const newProject = {
    id: uuidv4(),
    name: name.trim(),
    description: description || '',
    category: category || 'other',
    status: status || 'active',
    deadline: deadline || null,
    targetHours: targetHours || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null
  };

  projects.push(newProject);
  res.status(201).json(newProject);
});

// Update a project
router.patch('/:id', (req, res) => {
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const updates = req.body;
  const project = projects[projectIndex];

  // Handle status change to completed
  if (updates.status === 'completed' && project.status !== 'completed') {
    updates.completedAt = new Date().toISOString();
  } else if (updates.status && updates.status !== 'completed') {
    updates.completedAt = null;
  }

  projects[projectIndex] = {
    ...project,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  res.json(projects[projectIndex]);
});

// Delete a project
router.delete('/:id', (req, res) => {
  const projectIndex = projects.findIndex(p => p.id === req.params.id);
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  projects.splice(projectIndex, 1);
  res.status(204).send();
});

// Get project statistics
router.get('/stats/overview', (req, res) => {
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    paused: projects.filter(p => p.status === 'paused').length,
    archived: projects.filter(p => p.status === 'archived').length,
    byCategory: {}
  };

  // Calculate by category
  projects.forEach(p => {
    stats.byCategory[p.category] = (stats.byCategory[p.category] || 0) + 1;
  });

  res.json(stats);
});

module.exports = router;
