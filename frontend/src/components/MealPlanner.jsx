import React, { useState, useEffect } from 'react';
import './MealPlanner.css';

import { getApiUrl } from '../lib/apiUrl';

const API_URL = getApiUrl();

const MEAL_TYPES = [
  { id: 'breakfast', name: 'Breakfast', icon: '🍳', color: '#feca57' },
  { id: 'lunch', name: 'Lunch', icon: '🥗', color: '#1dd1a1' },
  { id: 'dinner', name: 'Dinner', icon: '🍽️', color: '#ff6b6b' },
  { id: 'snack', name: 'Snack', icon: '🍎', color: '#48dbfb' }
];

export default function MealPlanner({ isOpen, onClose }) {
  const [meals, setMeals] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    mealType: 'breakfast',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, dailyRes] = await Promise.all([
        fetch(`${API_URL}/meals/stats`),
        fetch(`${API_URL}/meals/daily/${selectedDate}`)
      ]);

      setStats(await statsRes.json());
      setDailySummary(await dailyRes.json());
      setMeals((await dailyRes.clone?.json?.())?.meals || []);
    } catch (err) {
      console.error('Failed to fetch meal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await fetch(`${API_URL}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: selectedDate
        })
      });

      setFormData({
        name: '',
        mealType: 'breakfast',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        notes: ''
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add meal:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this meal?')) return;

    try {
      await fetch(`${API_URL}/meals/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete meal:', err);
    }
  };

  const getMealTypeInfo = (typeId) => MEAL_TYPES.find(t => t.id === typeId) || MEAL_TYPES[0];

  const getProgressPercent = (current, goal = 2000) => {
    return Math.min(100, Math.round((current / goal) * 100));
  };

  const navigateDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="meal-planner-overlay" onClick={onClose}>
      <div className="meal-planner-panel" onClick={e => e.stopPropagation()}>
        <div className="meal-planner-header">
          <div className="header-title">
            <span className="header-icon">🥗</span>
            <h2>Meal Planner</h2>
            {stats && (
              <span className="header-stats">
                {stats.todayCalories} cal today
              </span>
            )}
          </div>
          <div className="header-actions">
            <button
              className="btn-primary small"
              onClick={() => setShowForm(true)}
            >
              ➕ Log Meal
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="date-navigator">
          <button onClick={() => navigateDate(-1)}>←</button>
          <div className="current-date">
            <span className="date-label">{formatDate(selectedDate)}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button onClick={() => navigateDate(1)}>→</button>
        </div>

        {/* Daily Summary */}
        {dailySummary && (
          <div className="daily-summary">
            <div className="summary-card calories">
              <div className="summary-header">
                <span className="summary-label">🔥 Calories</span>
                <span className="summary-value">{dailySummary.totalCalories}</span>
              </div>
              <div className="summary-bar">
                <div
                  className="summary-fill"
                  style={{ width: `${getProgressPercent(dailySummary.totalCalories)}%` }}
                />
              </div>
            </div>

            <div className="summary-grid">
              <div className="summary-item">
                <span className="item-label">Protein</span>
                <span className="item-value">{dailySummary.totalProtein}g</span>
              </div>

              <div className="summary-item">
                <span className="item-label">Carbs</span>
                <span className="item-value">{dailySummary.totalCarbs}g</span>
              </div>

              <div className="summary-item">
                <span className="item-label">Fat</span>
                <span className="item-value">{dailySummary.totalFat}g</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="meal-content">
          {loading ? (
            <div className="loading-state">⏳ Loading...</div>
          ) : (
            <>
              {/* Add Form */}
              {showForm && (
                <div className="meal-form">
                  <h3>Log Meal</h3>

                  <form onSubmit={handleSubmit}>
                    <input
                      type="text"
                      placeholder="Meal name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />

                    <div className="meal-type-selector">
                      {MEAL_TYPES.map(type => (
                        <button
                          key={type.id}
                          type="button"
                          className={formData.mealType === type.id ? 'active' : ''}
                          style={{ '--meal-color': type.color }}
                          onClick={() => setFormData({ ...formData, mealType: type.id })}
                        >
                          <span>{type.icon}</span>
                          {type.name}
                        </button>
                      ))}
                    </div>

                    <div className="form-row">
                      <input
                        type="number"
                        placeholder="Calories"
                        value={formData.calories}
                        onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                      />

                      <input
                        type="number"
                        placeholder="Protein (g)"
                        value={formData.protein}
                        onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                      />
                    </div>

                    <div className="form-row">
                      <input
                        type="number"
                        placeholder="Carbs (g)"
                        value={formData.carbs}
                        onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                      />

                      <input
                        type="number"
                        placeholder="Fat (g)"
                        value={formData.fat}
                        onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                      />
                    </div>

                    <textarea
                      placeholder="Notes (optional)"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                    />

                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">Log Meal</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Meals List */}
              {dailySummary?.meals?.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🥗</div>
                  <h3>No meals logged</h3>
                  <p>Start tracking your nutrition today!</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    Log First Meal
                  </button>
                </div>
              ) : (
                <div className="meals-list">
                  {MEAL_TYPES.map(mealType => {
                    const typeMeals = dailySummary?.meals?.filter(m => m.mealType === mealType.id) || [];
                    if (typeMeals.length === 0) return null;

                    return (
                      <div key={mealType.id} className="meal-section">
                        <div className="section-header" style={{ color: mealType.color }}>
                          <span className="section-icon">{mealType.icon}</span>
                          <span className="section-name">{mealType.name}</span>
                        </div>

                        {typeMeals.map(meal => (
                          <div key={meal.id} className="meal-card">
                            <div className="meal-info">
                              <h4>{meal.name}</h4>
                              {meal.notes && <p className="meal-notes">{meal.notes}</p>}

                              <div className="meal-macros">
                                <span>🔥 {meal.calories} cal</span>
                                {meal.protein > 0 && <span>🥩 {meal.protein}g protein</span>}
                                {meal.carbs > 0 && <span>🍞 {meal.carbs}g carbs</span>}
                                {meal.fat > 0 && <span>🥑 {meal.fat}g fat</span>}
                              </div>
                            </div>

                            <button
                              className="delete-btn"
                              onClick={() => handleDelete(meal.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
