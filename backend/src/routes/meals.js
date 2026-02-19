/**
 * Meal Planner Router
 * Track meals, recipes, and nutrition
 */

import express from 'express';
import { getDb, genId } from '../db.js';

const router = express.Router();

// Get all meals
router.get('/', (req, res) => {
  const db = getDb();
  if (!db.meals) db.meals = [];
  
  const { date, mealType } = req.query;
  let meals = [...db.meals];
  
  if (date) {
    meals = meals.filter(m => m.date === date);
  }
  
  if (mealType) {
    meals = meals.filter(m => m.mealType === mealType);
  }
  
  meals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({ meals });
});

// Get daily summary
router.get('/daily/:date', (req, res) => {
  const db = getDb();
  const meals = db.meals?.filter(m => m.date === req.params.date) || [];
  
  const summary = {
    totalCalories: meals.reduce((sum, m) => sum + (m.calories || 0), 0),
    totalProtein: meals.reduce((sum, m) => sum + (m.protein || 0), 0),
    totalCarbs: meals.reduce((sum, m) => sum + (m.carbs || 0), 0),
    totalFat: meals.reduce((sum, m) => sum + (m.fat || 0), 0),
    mealCount: meals.length,
    meals
  };
  
  res.json(summary);
});

// Get stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const meals = db.meals || [];
  
  const totalMeals = meals.length;
  const uniqueDates = [...new Set(meals.map(m => m.date))];
  const activeDays = uniqueDates.length;
  
  // Average daily calories
  const dailyCalories = uniqueDates.map(date => {
    return meals
      .filter(m => m.date === date)
      .reduce((sum, m) => sum + (m.calories || 0), 0);
  });
  
  const avgDailyCalories = dailyCalories.length 
    ? Math.round(dailyCalories.reduce((a, b) => a + b, 0) / dailyCalories.length)
    : 0;
  
  // Today
  const today = new Date().toISOString().split('T')[0];
  const todayMeals = meals.filter(m => m.date === today);
  const todayCalories = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
  
  res.json({
    totalMeals,
    activeDays,
    avgDailyCalories,
    todayCalories,
    todayMeals: todayMeals.length
  });
});

// Create meal
router.post('/', (req, res) => {
  const db = getDb();
  if (!db.meals) db.meals = [];
  
  const {
    name,
    mealType,
    date,
    calories,
    protein,
    carbs,
    fat,
    notes
  } = req.body;
  
  if (!name || !mealType || !date) {
    return res.status(400).json({ error: 'Name, meal type, and date are required' });
  }
  
  const meal = {
    id: genId(),
    name,
    mealType, // breakfast, lunch, dinner, snack
    date,
    calories: parseInt(calories) || 0,
    protein: parseFloat(protein) || 0,
    carbs: parseFloat(carbs) || 0,
    fat: parseFloat(fat) || 0,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  
  db.meals.push(meal);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(meal);
});

// Update meal
router.patch('/:id', (req, res) => {
  const db = getDb();
  const meal = db.meals?.find(m => m.id === req.params.id);
  
  if (!meal) {
    return res.status(404).json({ error: 'Meal not found' });
  }
  
  Object.assign(meal, req.body);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(meal);
});

// Delete meal
router.delete('/:id', (req, res) => {
  const db = getDb();
  if (!db.meals) return res.json({ success: true });
  
  const index = db.meals.findIndex(m => m.id === req.params.id);
  if (index > -1) {
    db.meals.splice(index, 1);
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json({ success: true });
});

export default router;
