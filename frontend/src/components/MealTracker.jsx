'use client';

import React, { useState, useEffect, useMemo } from 'react';
// import './MealTracker.css';

const MEAL_TYPES = {
  breakfast: { label: 'Breakfast', icon: '🍳', color: '#f59e0b', timeRange: '06:00-10:00' },
  lunch: { label: 'Lunch', icon: '🥗', color: '#22c55e', timeRange: '11:00-14:00' },
  dinner: { label: 'Dinner', icon: '🍽️', color: '#3b82f6', timeRange: '17:00-21:00' },
  snack: { label: 'Snack', icon: '🥨', color: '#a855f7', timeRange: 'anytime' }
};

const FOOD_CATEGORIES = [
  { id: 'recent', label: 'Recent', icon: '🕐' },
  { id: 'favorites', label: 'Favorites', icon: '⭐' },
  { id: 'custom', label: 'Custom', icon: '✏️' }
];

const QUICK_FOODS = [
  { id: 'coffee', name: 'Coffee', calories: 5, protein: 0, carbs: 1, fat: 0, icon: '☕' },
  { id: 'banana', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0, icon: '🍌' },
  { id: 'egg', name: 'Egg', calories: 70, protein: 6, carbs: 1, fat: 5, icon: '🥚' },
  { id: 'oatmeal', name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3, icon: '🥣' },
  { id: 'chicken', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3, icon: '🍗' },
  { id: 'rice', name: 'Rice (1 cup)', calories: 200, protein: 4, carbs: 45, fat: 0, icon: '🍚' },
  { id: 'salad', name: 'Salad', calories: 80, protein: 3, carbs: 10, fat: 4, icon: '🥗' },
  { id: 'pasta', name: 'Pasta', calories: 220, protein: 8, carbs: 43, fat: 1, icon: '🍝' },
  { id: 'burger', name: 'Burger', calories: 350, protein: 20, carbs: 30, fat: 18, icon: '🍔' },
  { id: 'pizza', name: 'Pizza Slice', calories: 285, protein: 12, carbs: 36, fat: 10, icon: '🍕' },
  { id: 'apple', name: 'Apple', calories: 95, protein: 0, carbs: 25, fat: 0, icon: '🍎' },
  { id: 'yogurt', name: 'Yogurt', calories: 100, protein: 10, carbs: 12, fat: 0, icon: '🥛' },
  { id: 'nuts', name: 'Nuts (1oz)', calories: 160, protein: 6, carbs: 6, fat: 14, icon: '🥜' },
  { id: 'fish', name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, icon: '🐟' },
  { id: 'avocado', name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, icon: '🥑' },
  { id: 'smoothie', name: 'Smoothie', calories: 180, protein: 5, carbs: 35, fat: 2, icon: '🥤' }
];

const STORAGE_KEY = 'mc-meal-tracker';
const FAVORITES_KEY = 'mc-meal-favorites';

export default function MealTracker({ isOpen, onClose }) {
  const [meals, setMeals] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState('today'); // 'today', 'history', 'stats'
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [activeTab, setActiveTab] = useState('recent');
  
  // Goals
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65
  });
  const [showSettings, setShowSettings] = useState(false);
  
  // Custom food form
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });

  // Load data from localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    try {
      const savedMeals = localStorage.getItem(STORAGE_KEY);
      if (savedMeals) {
        const parsed = JSON.parse(savedMeals);
        setMeals(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
      
      const savedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
      
      const savedGoals = localStorage.getItem('mc-meal-goals');
      if (savedGoals) {
        setDailyGoals(JSON.parse(savedGoals));
      }
    } catch (err) {
      console.error('Failed to load meal data:', err);
    }
  }, [isOpen]);

  // Save data to localStorage
  const saveMeals = (data) => {
    setMeals(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save meals:', err);
    }
  };

  const saveFavorites = (data) => {
    setFavorites(data);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save favorites:', err);
    }
  };

  const saveGoals = (goals) => {
    setDailyGoals(goals);
    try {
      localStorage.setItem('mc-meal-goals', JSON.stringify(goals));
    } catch (err) {
      console.error('Failed to save goals:', err);
    }
  };

  // Get today's meals
  const todaysMeals = useMemo(() => {
    const today = new Date().toDateString();
    return meals.filter(m => m.timestamp.toDateString() === today);
  }, [meals]);

  // Calculate totals
  const dailyTotals = useMemo(() => {
    return todaysMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todaysMeals]);

  // Get meals by type
  const mealsByType = useMemo(() => {
    const grouped = { breakfast: [], lunch: [], dinner: [], snack: [] };
    todaysMeals.forEach(meal => {
      if (grouped[meal.type]) grouped[meal.type].push(meal);
    });
    return grouped;
  }, [todaysMeals]);

  // Add meal
  const addMeal = (food, type) => {
    const newMeal = {
      id: 'meal-' + Date.now(),
      ...food,
      type,
      timestamp: new Date()
    };
    saveMeals([...meals, newMeal]);
    setShowAddForm(false);
  };

  // Add custom food
  const addCustomFood = (e) => {
    e.preventDefault();
    if (!customFood.name.trim()) return;
    
    const food = {
      id: 'custom-' + Date.now(),
      name: customFood.name,
      calories: parseInt(customFood.calories) || 0,
      protein: parseInt(customFood.protein) || 0,
      carbs: parseInt(customFood.carbs) || 0,
      fat: parseInt(customFood.fat) || 0,
      icon: '🍽️'
    };
    
    addMeal(food, selectedMealType);
    setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  };

  // Delete meal
  const deleteMeal = (id) => {
    saveMeals(meals.filter(m => m.id !== id));
  };

  // Toggle favorite
  const toggleFavorite = (food) => {
    const exists = favorites.find(f => f.id === food.id);
    if (exists) {
      saveFavorites(favorites.filter(f => f.id !== food.id));
    } else {
      saveFavorites([...favorites, food]);
    }
  };

  // Get recent foods
  const recentFoods = useMemo(() => {
    const unique = [];
    const seen = new Set();
    [...meals].reverse().forEach(meal => {
      const key = meal.name;
      if (!seen.has(key) && unique.length < 10) {
        seen.add(key);
        unique.push({
          id: meal.id,
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          icon: meal.icon || '🍽️'
        });
      }
    });
    return unique;
  }, [meals]);

  // Get foods to display
  const getFoodsToDisplay = () => {
    switch (activeTab) {
      case 'favorites': return favorites;
      case 'recent': return recentFoods;
      case 'custom': return [];
      default: return QUICK_FOODS;
    }
  };

  // Calculate progress percentage
  const getProgress = (current, goal) => Math.min((current / goal) * 100, 100);

  // Get remaining
  const getRemaining = (current, goal) => Math.max(goal - current, 0);

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayMeals = meals.filter(m => m.timestamp.toDateString() === date.toDateString());
      const totals = dayMeals.reduce((acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      days.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        ...totals
      });
    }
    return days;
  }, [meals]);

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="meal-panel-overlay" onClick={onClose}>
      <div className="meal-panel" onClick={e => e.stopPropagation()}>
        <div className="meal-panel-header">
          <h3>🍎 Meal Tracker</h3>
          <div className="header-actions">
            {viewMode === 'today' && (
              <button 
                className="settings-btn"
                onClick={() => setShowSettings(true)}
                title="Settings"
              >
                ⚙️
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="meal-view-tabs">
          <button 
            className={viewMode === 'today' ? 'active' : ''}
            onClick={() => setViewMode('today')}
          >
            Today
          </button>
          <button 
            className={viewMode === 'stats' ? 'active' : ''}
            onClick={() => setViewMode('stats')}
          >
            Stats
          </button>
          <button 
            className={viewMode === 'history' ? 'active' : ''}
            onClick={() => setViewMode('history')}
          >
            History
          </button>
        </div>

        {showSettings ? (
          <div className="meal-settings">
            <h4>Daily Goals</h4>
            <div className="goal-inputs">
              <div className="goal-input-group">
                <label>Calories</label>
                <input 
                  type="number" 
                  value={dailyGoals.calories}
                  onChange={(e) => saveGoals({ ...dailyGoals, calories: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="goal-input-group">
                <label>Protein (g)</label>
                <input 
                  type="number" 
                  value={dailyGoals.protein}
                  onChange={(e) => saveGoals({ ...dailyGoals, protein: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="goal-input-group">
                <label>Carbs (g)</label>
                <input 
                  type="number" 
                  value={dailyGoals.carbs}
                  onChange={(e) => saveGoals({ ...dailyGoals, carbs: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="goal-input-group">
                <label>Fat (g)</label>
                <input 
                  type="number" 
                  value={dailyGoals.fat}
                  onChange={(e) => saveGoals({ ...dailyGoals, fat: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <button className="back-btn" onClick={() => setShowSettings(false)}>
              ← Back
            </button>
          </div>
        ) : viewMode === 'today' ? (
          <>
            {/* Daily Summary */}
            <div className="daily-summary">
              <div className="macro-cards">
                <div className="macro-card calories">
                  <div className="macro-ring">
                    <svg viewBox="0 0 100 100">
                      <circle className="ring-bg" cx="50" cy="50" r="40" />
                      <circle 
                        className="ring-progress"
                        cx="50" 
                        cy="50" 
                        r="40"
                        style={{
                          strokeDasharray: `${2 * Math.PI * 40}`,
                          strokeDashoffset: `${2 * Math.PI * 40 * (1 - getProgress(dailyTotals.calories, dailyGoals.calories) / 100)}`
                        }}
                      />
                    </svg>
                    <div className="macro-value">
                      <span className="current">{dailyTotals.calories}</span>
                      <span className="goal">/{dailyGoals.calories}</span>
                    </div>
                  </div>
                  <span className="macro-label">Calories</span>
                  <span className="macro-remaining">{getRemaining(dailyTotals.calories, dailyGoals.calories)} left</span>
                </div>

                <div className="macro-card protein">
                  <div className="macro-bar">
                    <div 
                      className="macro-bar-fill"
                      style={{ width: `${getProgress(dailyTotals.protein, dailyGoals.protein)}%` }}
                    />
                  </div>
                  <span className="macro-label">Protein</span>
                  <span className="macro-amount">{dailyTotals.protein}/{dailyGoals.protein}g</span>
                </div>

                <div className="macro-card carbs">
                  <div className="macro-bar">
                    <div 
                      className="macro-bar-fill"
                      style={{ width: `${getProgress(dailyTotals.carbs, dailyGoals.carbs)}%` }}
                    />
                  </div>
                  <span className="macro-label">Carbs</span>
                  <span className="macro-amount">{dailyTotals.carbs}/{dailyGoals.carbs}g</span>
                </div>

                <div className="macro-card fat">
                  <div className="macro-bar">
                    <div 
                      className="macro-bar-fill"
                      style={{ width: `${getProgress(dailyTotals.fat, dailyGoals.fat)}%` }}
                    />
                  </div>
                  <span className="macro-label">Fat</span>
                  <span className="macro-amount">{dailyTotals.fat}/{dailyGoals.fat}g</span>
                </div>
              </div>
            </div>

            {/* Add Meal Button */}
            <div className="add-meal-section">
              <button 
                className="add-meal-btn"
                onClick={() => setShowAddForm(true)}
              >
                <span className="btn-icon">+</span>
                <span className="btn-text">Add Meal</span>
              </button>
            </div>

            {/* Meals by Type */}
            <div className="meals-container">
              {Object.entries(MEAL_TYPES).map(([type, config]) => (
                <div key={type} className="meal-section" style={{ '--meal-color': config.color }}>
                  <div className="meal-section-header">
                    <span className="meal-icon">{config.icon}</span>
                    <span className="meal-label">{config.label}</span>
                    <button 
                      className="quick-add"
                      onClick={() => {
                        setSelectedMealType(type);
                        setShowAddForm(true);
                      }}
                    >
                      +
                    </button>
                  </div>
                  
                  {mealsByType[type].length === 0 ? (
                    <div className="empty-meal-type">No {config.label.toLowerCase()} logged</div>
                  ) : (
                    <div className="meal-items">
                      {mealsByType[type].map(meal => (
                        <div key={meal.id} className="meal-item">
                          <span className="meal-item-icon">{meal.icon || '🍽️'}</span>
                          <div className="meal-item-info">
                            <span className="meal-item-name">{meal.name}</span>
                            <span className="meal-item-macros">
                              {meal.calories} cal · P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                            </span>
                          </div>
                          <span className="meal-item-time">{formatTime(meal.timestamp)}</span>
                          <button 
                            className="remove-meal-btn"
                            onClick={() => deleteMeal(meal.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : viewMode === 'stats' ? (
          <div className="stats-view">
            <h4>Weekly Overview</h4>
            <div className="weekly-chart">
              {weeklyStats.map((day, i) => (
                <div key={i} className="day-bar">
                  <div className="bar-container">
                    <div 
                      className="bar-fill"
                      style={{ 
                        height: `${Math.min((day.calories / dailyGoals.calories) * 100, 100)}%`,
                        background: day.calories > dailyGoals.calories ? '#ef4444' : '#22c55e'
                      }}
                    />
                  </div>
                  <span className="day-label">{day.dayName}</span>
                  <span className="day-calories">{day.calories}</span>
                </div>
              ))}
            </div>
            
            <div className="stats-summary">
              <div className="stat-box">
                <span className="stat-value">
                  {Math.round(weeklyStats.reduce((a, b) => a + b.calories, 0) / 7)}
                </span>
                <span className="stat-label">Avg Calories</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">
                  {Math.round(weeklyStats.reduce((a, b) => a + b.protein, 0) / 7)}
                </span>
                <span className="stat-label">Avg Protein</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">
                  {meals.length}
                </span>
                <span className="stat-label">Total Meals</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="history-view">
            <h4>Recent Meals</h4>
            <div className="history-list">
              {[...meals].reverse().slice(0, 50).map(meal => (
                <div key={meal.id} className="history-item">
                  <span className="history-icon">{meal.icon || '🍽️'}</span>
                  <div className="history-info">
                    <span className="history-name">{meal.name}</span>
                    <span className="history-meta">
                      {MEAL_TYPES[meal.type]?.label} · {meal.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                  <span className="history-calories">{meal.calories} cal</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Meal Modal */}
        {showAddForm && (
          <div className="add-meal-modal" onClick={() => setShowAddForm(false)}>
            <div className="add-meal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h4>Add {MEAL_TYPES[selectedMealType].label}</h4>
                <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
              </div>

              {/* Meal Type Selector */}
              <div className="meal-type-selector">
                {Object.entries(MEAL_TYPES).map(([type, config]) => (
                  <button
                    key={type}
                    className={selectedMealType === type ? 'active' : ''}
                    onClick={() => setSelectedMealType(type)}
                    style={{ '--meal-color': config.color }}
                  >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </button>
                ))}
              </div>

              {/* Food Tabs */}
              <div className="food-tabs">
                {FOOD_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={activeTab === cat.id ? 'active' : ''}
                    onClick={() => setActiveTab(cat.id)}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              {/* Food Grid */}
              {activeTab !== 'custom' ? (
                <div className="food-grid">
                  {getFoodsToDisplay().map(food => (
                    <div key={food.id} className="food-item">
                      <button 
                        className="food-btn"
                        onClick={() => addMeal(food, selectedMealType)}
                      >
                        <span className="food-icon">{food.icon}</span>
                        <span className="food-name">{food.name}</span>
                        <span className="food-calories">{food.calories} cal</span>
                      </button>
                      <button 
                        className={`favorite-btn ${favorites.find(f => f.id === food.id) ? 'active' : ''}`}
                        onClick={() => toggleFavorite(food)}
                      >
                        ★
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <form className="custom-food-form" onSubmit={addCustomFood}>
                  <input
                    type="text"
                    placeholder="Food name"
                    value={customFood.name}
                    onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                    required
                  />
                  <div className="macro-inputs">
                    <div>
                      <label>Calories</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={customFood.calories}
                        onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Protein</label>
                      <input
                        type="number"
                        placeholder="0g"
                        value={customFood.protein}
                        onChange={(e) => setCustomFood({ ...customFood, protein: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Carbs</label>
                      <input
                        type="number"
                        placeholder="0g"
                        value={customFood.carbs}
                        onChange={(e) => setCustomFood({ ...customFood, carbs: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Fat</label>
                      <input
                        type="number"
                        placeholder="0g"
                        value={customFood.fat}
                        onChange={(e) => setCustomFood({ ...customFood, fat: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="add-custom-btn">Add Food</button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
