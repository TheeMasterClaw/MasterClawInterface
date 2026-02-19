import React, { useState, useEffect, useRef } from 'react';
// import './WorkoutTracker.css';

const EXERCISE_DATABASE = {
  chest: [
    { id: 'bench_press', name: 'Bench Press', category: 'chest', icon: '🏋️' },
    { id: 'incline_press', name: 'Incline Press', category: 'chest', icon: '🏋️' },
    { id: 'dumbbell_fly', name: 'Dumbbell Fly', category: 'chest', icon: '🦋' },
    { id: 'push_ups', name: 'Push-ups', category: 'chest', icon: '💪' },
    { id: 'cable_cross', name: 'Cable Crossover', category: 'chest', icon: '🔗' },
  ],
  back: [
    { id: 'deadlift', name: 'Deadlift', category: 'back', icon: '🏋️' },
    { id: 'pull_ups', name: 'Pull-ups', category: 'back', icon: '🔼' },
    { id: 'barbell_row', name: 'Barbell Row', category: 'back', icon: '🚣' },
    { id: 'lat_pulldown', name: 'Lat Pulldown', category: 'back', icon: '⬇️' },
    { id: 'face_pulls', name: 'Face Pulls', category: 'back', icon: '🎯' },
  ],
  legs: [
    { id: 'squat', name: 'Squat', category: 'legs', icon: '🏋️' },
    { id: 'leg_press', name: 'Leg Press', category: 'legs', icon: '🦵' },
    { id: 'lunges', name: 'Lunges', category: 'legs', icon: '🚶' },
    { id: 'leg_curl', name: 'Leg Curl', category: 'legs', icon: '🦿' },
    { id: 'calf_raise', name: 'Calf Raise', category: 'legs', icon: '🦶' },
  ],
  shoulders: [
    { id: 'overhead_press', name: 'Overhead Press', category: 'shoulders', icon: '🏋️' },
    { id: 'lateral_raise', name: 'Lateral Raise', category: 'shoulders', icon: '🦅' },
    { id: 'front_raise', name: 'Front Raise', category: 'shoulders', icon: '⬆️' },
    { id: 'rear_delt', name: 'Rear Delt Fly', category: 'shoulders', icon: '🦋' },
    { id: 'shrugs', name: 'Shrugs', category: 'shoulders', icon: '🤷' },
  ],
  arms: [
    { id: 'bicep_curl', name: 'Bicep Curl', category: 'arms', icon: '💪' },
    { id: 'tricep_pushdown', name: 'Tricep Pushdown', category: 'arms', icon: '⬇️' },
    { id: 'hammer_curl', name: 'Hammer Curl', category: 'arms', icon: '🔨' },
    { id: 'skullcrusher', name: 'Skullcrusher', category: 'arms', icon: '💀' },
    { id: 'preacher_curl', name: 'Preacher Curl', category: 'arms', icon: '🙏' },
  ],
  core: [
    { id: 'plank', name: 'Plank', category: 'core', icon: '📏' },
    { id: 'crunches', name: 'Crunches', category: 'core', icon: '🍞' },
    { id: 'leg_raise', name: 'Leg Raise', category: 'core', icon: '🦵' },
    { id: 'russian_twist', name: 'Russian Twist', category: 'core', icon: '🌀' },
    { id: 'ab_wheel', name: 'Ab Wheel', category: 'core', icon: '🛞' },
  ],
  cardio: [
    { id: 'running', name: 'Running', category: 'cardio', icon: '🏃' },
    { id: 'cycling', name: 'Cycling', category: 'cardio', icon: '🚴' },
    { id: 'rowing', name: 'Rowing', category: 'cardio', icon: '🚣' },
    { id: 'jump_rope', name: 'Jump Rope', category: 'cardio', icon: '🪢' },
    { id: 'swimming', name: 'Swimming', category: 'cardio', icon: '🏊' },
  ],
};

const WORKOUT_TEMPLATES = [
  {
    id: 'push_day',
    name: 'Push Day',
    description: 'Chest, shoulders, triceps',
    exercises: ['bench_press', 'overhead_press', 'incline_press', 'lateral_raise', 'tricep_pushdown'],
  },
  {
    id: 'pull_day',
    name: 'Pull Day',
    description: 'Back, biceps, rear delts',
    exercises: ['deadlift', 'pull_ups', 'barbell_row', 'face_pulls', 'bicep_curl'],
  },
  {
    id: 'leg_day',
    name: 'Leg Day',
    description: 'Quads, hamstrings, calves',
    exercises: ['squat', 'leg_press', 'leg_curl', 'lunges', 'calf_raise'],
  },
  {
    id: 'upper_body',
    name: 'Upper Body',
    description: 'Full upper body workout',
    exercises: ['bench_press', 'pull_ups', 'overhead_press', 'barbell_row', 'bicep_curl'],
  },
  {
    id: 'full_body',
    name: 'Full Body',
    description: 'Complete body workout',
    exercises: ['squat', 'bench_press', 'deadlift', 'overhead_press', 'pull_ups'],
  },
  {
    id: 'core_focus',
    name: 'Core Focus',
    description: 'Abdominal and core strength',
    exercises: ['plank', 'crunches', 'leg_raise', 'russian_twist', 'ab_wheel'],
  },
];

const CATEGORY_COLORS = {
  chest: '#ef4444',
  back: '#3b82f6',
  legs: '#22c55e',
  shoulders: '#f59e0b',
  arms: '#8b5cf6',
  core: '#ec4899',
  cardio: '#14b8a6',
};

export default function WorkoutTracker({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('current'); // current, history, exercises, prs
  const [workouts, setWorkouts] = useState([]);
  const [personalRecords, setPersonalRecords] = useState({});
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('chest');
  const [customRestTime, setCustomRestTime] = useState(90);
  const restIntervalRef = useRef(null);

  // Load data from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const savedWorkouts = localStorage.getItem('mc-workouts');
      const savedPRs = localStorage.getItem('mc-workout-prs');
      const savedCurrent = localStorage.getItem('mc-current-workout');
      
      if (savedWorkouts) {
        try {
          setWorkouts(JSON.parse(savedWorkouts));
        } catch (e) {
          console.error('Failed to parse workouts:', e);
        }
      }
      
      if (savedPRs) {
        try {
          setPersonalRecords(JSON.parse(savedPRs));
        } catch (e) {
          console.error('Failed to parse PRs:', e);
        }
      }
      
      if (savedCurrent) {
        try {
          setCurrentWorkout(JSON.parse(savedCurrent));
        } catch (e) {
          console.error('Failed to parse current workout:', e);
        }
      }
    }
  }, [isOpen]);

  // Save data to localStorage
  const saveWorkouts = (data) => {
    setWorkouts(data);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-workouts', JSON.stringify(data));
    }
  };

  const savePRs = (data) => {
    setPersonalRecords(data);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-workout-prs', JSON.stringify(data));
    }
  };

  const saveCurrentWorkout = (data) => {
    setCurrentWorkout(data);
    if (typeof window !== 'undefined') {
      if (data) {
        localStorage.setItem('mc-current-workout', JSON.stringify(data));
      } else {
        localStorage.removeItem('mc-current-workout');
      }
    }
  };

  // Rest timer logic
  useEffect(() => {
    if (isResting && restTimer > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            playTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, [isResting, restTimer]);

  const playTimerComplete = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Audio notification not available');
    }
  };

  const startRestTimer = (seconds = customRestTime) => {
    setRestTimer(seconds);
    setIsResting(true);
  };

  const stopRestTimer = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start a new workout from template
  const startWorkoutFromTemplate = (template) => {
    const newWorkout = {
      id: Date.now().toString(),
      name: template.name,
      startTime: new Date().toISOString(),
      exercises: template.exercises.map(exId => {
        const exercise = Object.values(EXERCISE_DATABASE).flat().find(e => e.id === exId);
        return {
          exerciseId: exId,
          exerciseName: exercise?.name || exId,
          category: exercise?.category || 'other',
          sets: [],
        };
      }),
    };
    saveCurrentWorkout(newWorkout);
    setActiveTab('current');
  };

  // Start empty workout
  const startEmptyWorkout = () => {
    const newWorkout = {
      id: Date.now().toString(),
      name: 'Custom Workout',
      startTime: new Date().toISOString(),
      exercises: [],
    };
    saveCurrentWorkout(newWorkout);
    setActiveTab('current');
  };

  // Add exercise to current workout
  const addExerciseToWorkout = (exercise) => {
    if (!currentWorkout) return;
    
    const updated = {
      ...currentWorkout,
      exercises: [
        ...currentWorkout.exercises,
        {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          category: exercise.category,
          sets: [],
        },
      ],
    };
    saveCurrentWorkout(updated);
    setShowExercisePicker(false);
  };

  // Add set to exercise
  const addSet = (exerciseIndex, reps, weight) => {
    if (!currentWorkout) return;
    
    const numReps = parseInt(reps) || 0;
    const numWeight = parseFloat(weight) || 0;
    
    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex].sets.push({
      id: Date.now().toString(),
      reps: numReps,
      weight: numWeight,
      timestamp: new Date().toISOString(),
    });
    
    const updated = {
      ...currentWorkout,
      exercises: updatedExercises,
    };
    saveCurrentWorkout(updated);
    
    // Check and update PR
    updatePersonalRecord(updatedExercises[exerciseIndex].exerciseId, numWeight, numReps);
    
    // Start rest timer
    startRestTimer();
  };

  // Update personal record
  const updatePersonalRecord = (exerciseId, weight, reps) => {
    const currentPR = personalRecords[exerciseId];
    const estimatedOneRepMax = weight * (1 + reps / 30); // Epley formula
    
    if (!currentPR || estimatedOneRepMax > currentPR.estimatedOneRepMax) {
      const newPRs = {
        ...personalRecords,
        [exerciseId]: {
          weight,
          reps,
          estimatedOneRepMax,
          date: new Date().toISOString(),
        },
      };
      savePRs(newPRs);
    }
  };

  // Remove set
  const removeSet = (exerciseIndex, setIndex) => {
    if (!currentWorkout) return;
    
    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
    
    const updated = {
      ...currentWorkout,
      exercises: updatedExercises,
    };
    saveCurrentWorkout(updated);
  };

  // Remove exercise from workout
  const removeExercise = (exerciseIndex) => {
    if (!currentWorkout) return;
    
    const updatedExercises = [...currentWorkout.exercises];
    updatedExercises.splice(exerciseIndex, 1);
    
    const updated = {
      ...currentWorkout,
      exercises: updatedExercises,
    };
    saveCurrentWorkout(updated);
  };

  // Finish workout
  const finishWorkout = () => {
    if (!currentWorkout) return;
    
    const completedWorkout = {
      ...currentWorkout,
      endTime: new Date().toISOString(),
      duration: Math.floor((new Date() - new Date(currentWorkout.startTime)) / 1000 / 60),
      totalSets: currentWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0),
      totalVolume: currentWorkout.exercises.reduce((acc, ex) => 
        acc + ex.sets.reduce((setAcc, set) => setAcc + (set.weight * set.reps), 0), 0
      ),
    };
    
    saveWorkouts([completedWorkout, ...workouts]);
    saveCurrentWorkout(null);
    setActiveTab('history');
  };

  // Cancel workout
  const cancelWorkout = () => {
    if (confirm('Discard this workout? All progress will be lost.')) {
      saveCurrentWorkout(null);
    }
  };

  // Delete workout from history
  const deleteWorkout = (workoutId) => {
    if (confirm('Delete this workout from history?')) {
      const updated = workouts.filter(w => w.id !== workoutId);
      saveWorkouts(updated);
    }
  };

  // Get exercise by ID
  const getExerciseById = (id) => {
    return Object.values(EXERCISE_DATABASE).flat().find(e => e.id === id);
  };

  // Calculate stats
  const getWorkoutStats = () => {
    const totalWorkouts = workouts.length;
    const thisWeek = workouts.filter(w => {
      const date = new Date(w.startTime);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length;
    
    const totalVolume = workouts.reduce((acc, w) => acc + (w.totalVolume || 0), 0);
    const avgDuration = totalWorkouts > 0 
      ? Math.round(workouts.reduce((acc, w) => acc + (w.duration || 0), 0) / totalWorkouts)
      : 0;
    
    return { totalWorkouts, thisWeek, totalVolume: Math.round(totalVolume), avgDuration };
  };

  const stats = getWorkoutStats();

  if (!isOpen) return null;

  return (
    <div className="workout-panel-overlay" onClick={onClose}>
      <div className="workout-panel" onClick={e => e.stopPropagation()}>
        <div className="workout-panel-header">
          <h3>💪 Workout Tracker</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Stats Bar */}
        <div className="workout-stats-bar">
          <div className="stat-box">
            <span className="stat-value">{stats.totalWorkouts}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.thisWeek}</span>
            <span className="stat-label">This Week</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.totalVolume.toLocaleString()}</span>
            <span className="stat-label">Total Volume</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.avgDuration}</span>
            <span className="stat-label">Avg Min</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="workout-tabs">
          <button 
            className={activeTab === 'current' ? 'active' : ''}
            onClick={() => setActiveTab('current')}
          >
            {currentWorkout ? '🔴 Current' : '▶️ Start'}
          </button>
          <button 
            className={activeTab === 'history' ? 'active' : ''}
            onClick={() => setActiveTab('history')}
          >
            📜 History
          </button>
          <button 
            className={activeTab === 'prs' ? 'active' : ''}
            onClick={() => setActiveTab('prs')}
          >
            🏆 PRs
          </button>
          <button 
            className={activeTab === 'exercises' ? 'active' : ''}
            onClick={() => setActiveTab('exercises')}
          >
            📋 Exercises
          </button>
        </div>

        {/* Current Workout Tab */}
        {activeTab === 'current' && (
          <div className="workout-tab-content">
            {!currentWorkout ? (
              <div className="start-workout-section">
                <h4>Quick Start</h4>
                <div className="template-grid">
                  {WORKOUT_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      className="workout-template-card"
                      onClick={() => startWorkoutFromTemplate(template)}
                    >
                      <span className="template-name">{template.name}</span>
                      <span className="template-desc">{template.description}</span>
                      <span className="template-count">{template.exercises.length} exercises</span>
                    </button>
                  ))}
                </div>
                <button className="start-empty-btn" onClick={startEmptyWorkout}>
                  + Start Empty Workout
                </button>
              </div>
            ) : (
              <div className="active-workout">
                {/* Rest Timer */}
                {isResting && (
                  <div className="rest-timer-banner">
                    <div className="rest-timer-display">
                      <span className="rest-label">Rest</span>
                      <span className="rest-time">{formatTime(restTimer)}</span>
                    </div>
                    <div className="rest-actions">
                      <button onClick={() => startRestTimer(30)}>+30s</button>
                      <button onClick={() => startRestTimer(60)}>+60s</button>
                      <button onClick={stopRestTimer}>Skip</button>
                    </div>
                  </div>
                )}

                {/* Workout Header */}
                <div className="active-workout-header">
                  <div className="workout-title-section">
                    <input
                      type="text"
                      className="workout-title-input"
                      value={currentWorkout.name}
                      onChange={(e) => saveCurrentWorkout({ ...currentWorkout, name: e.target.value })}
                    />
                    <span className="workout-timer">
                      {formatTime(Math.floor((new Date() - new Date(currentWorkout.startTime)) / 1000))}
                    </span>
                  </div>
                  <div className="workout-actions">
                    <button className="add-exercise-btn" onClick={() => setShowExercisePicker(true)}>
                      + Add Exercise
                    </button>
                    <button className="finish-btn" onClick={finishWorkout}>
                      ✓ Finish
                    </button>
                    <button className="cancel-btn" onClick={cancelWorkout}>
                      ✕ Cancel
                    </button>
                  </div>
                </div>

                {/* Exercises List */}
                <div className="exercises-list">
                  {currentWorkout.exercises.length === 0 ? (
                    <div className="empty-workout">
                      <p>No exercises yet. Add one to get started!</p>
                      <button onClick={() => setShowExercisePicker(true)}>Add Exercise</button>
                    </div>
                  ) : (
                    currentWorkout.exercises.map((exercise, exIndex) => (
                      <div key={exIndex} className="exercise-card">
                        <div className="exercise-header">
                          <div className="exercise-info">
                            <span 
                              className="exercise-icon"
                              style={{ backgroundColor: `${CATEGORY_COLORS[exercise.category]}20` }}
                            >
                              {getExerciseById(exercise.exerciseId)?.icon || '🏋️'}
                            </span>
                            <span className="exercise-name">{exercise.exerciseName}</span>
                            <span 
                              className="exercise-category"
                              style={{ color: CATEGORY_COLORS[exercise.category] }}
                            >
                              {exercise.category}
                            </span>
                          </div>
                          <button 
                            className="remove-exercise-btn"
                            onClick={() => removeExercise(exIndex)}
                          >
                            🗑️
                          </button>
                        </div>

                        {/* Sets Table */}
                        <div className="sets-table">
                          <div className="sets-header">
                            <span>Set</span>
                            <span>Reps</span>
                            <span>Weight</span>
                            <span></span>
                          </div>
                          {exercise.sets.map((set, setIndex) => (
                            <div key={set.id} className="set-row">
                              <span>{setIndex + 1}</span>
                              <span>{set.reps}</span>
                              <span>{set.weight > 0 ? `${set.weight}kg` : 'BW'}</span>
                              <button onClick={() => removeSet(exIndex, setIndex)}>×</button>
                            </div>
                          ))}
                        </div>

                        {/* Add Set Form */}
                        <AddSetForm onAdd={(reps, weight) => addSet(exIndex, reps, weight)} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="workout-tab-content">
            {workouts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>No workouts completed yet</p>
                <button onClick={() => setActiveTab('current')}>Start Your First Workout</button>
              </div>
            ) : (
              <div className="workout-history-list">
                {workouts.map(workout => (
                  <div key={workout.id} className="history-item">
                    <div className="history-main">
                      <span className="history-name">{workout.name}</span>
                      <span className="history-date">
                        {new Date(workout.startTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="history-stats">
                      <span>⏱️ {workout.duration} min</span>
                      <span>📊 {workout.totalSets} sets</span>
                      <span>🏋️ {Math.round(workout.totalVolume || 0).toLocaleString()} kg</span>
                    </div>
                    <div className="history-exercises">
                      {workout.exercises.slice(0, 3).map((ex, i) => (
                        <span key={i} className="history-exercise-tag">
                          {ex.exerciseName} ({ex.sets.length})
                        </span>
                      ))}
                      {workout.exercises.length > 3 && (
                        <span className="history-exercise-more">
                          +{workout.exercises.length - 3} more
                        </span>
                      )}
                    </div>
                    <button 
                      className="delete-workout-btn"
                      onClick={() => deleteWorkout(workout.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRs Tab */}
        {activeTab === 'prs' && (
          <div className="workout-tab-content">
            {Object.keys(personalRecords).length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🏆</span>
                <p>No personal records yet</p>
                <p>Complete some workouts to see your PRs!</p>
              </div>
            ) : (
              <div className="prs-list">
                {Object.entries(personalRecords)
                  .sort((a, b) => b[1].estimatedOneRepMax - a[1].estimatedOneRepMax)
                  .map(([exerciseId, pr]) => {
                    const exercise = getExerciseById(exerciseId);
                    return (
                      <div key={exerciseId} className="pr-card">
                        <div className="pr-exercise">
                          <span className="pr-icon">{exercise?.icon || '🏋️'}</span>
                          <span className="pr-name">{exercise?.name || exerciseId}</span>
                        </div>
                        <div className="pr-details">
                          <div className="pr-main">
                            <span className="pr-weight">{pr.weight}kg</span>
                            <span className="pr-reps">× {pr.reps}</span>
                          </div>
                          <div className="pr-estimated">
                            Est. 1RM: <strong>{Math.round(pr.estimatedOneRepMax)}kg</strong>
                          </div>
                          <div className="pr-date">
                            {new Date(pr.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Exercises Tab */}
        {activeTab === 'exercises' && (
          <div className="workout-tab-content">
            <div className="exercise-categories">
              {Object.keys(EXERCISE_DATABASE).map(category => (
                <button
                  key={category}
                  className={selectedCategory === category ? 'active' : ''}
                  onClick={() => setSelectedCategory(category)}
                  style={{ 
                    borderColor: selectedCategory === category ? CATEGORY_COLORS[category] : undefined,
                    color: selectedCategory === category ? CATEGORY_COLORS[category] : undefined
                  }}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
            <div className="exercise-list-grid">
              {EXERCISE_DATABASE[selectedCategory].map(exercise => (
                <div key={exercise.id} className="exercise-item">
                  <span className="exercise-item-icon">{exercise.icon}</span>
                  <span className="exercise-item-name">{exercise.name}</span>
                  {personalRecords[exercise.id] && (
                    <span className="exercise-item-pr">
                      PR: {personalRecords[exercise.id].weight}kg × {personalRecords[exercise.id].reps}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exercise Picker Modal */}
        {showExercisePicker && (
          <div className="exercise-picker-overlay" onClick={() => setShowExercisePicker(false)}>
            <div className="exercise-picker" onClick={e => e.stopPropagation()}>
              <h4>Add Exercise</h4>
              <div className="picker-categories">
                {Object.keys(EXERCISE_DATABASE).map(category => (
                  <button
                    key={category}
                    className={selectedCategory === category ? 'active' : ''}
                    onClick={() => setSelectedCategory(category)}
                    style={{ 
                      backgroundColor: selectedCategory === category ? CATEGORY_COLORS[category] : undefined
                    }}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
              <div className="picker-exercises">
                {EXERCISE_DATABASE[selectedCategory].map(exercise => (
                  <button
                    key={exercise.id}
                    className="picker-exercise-btn"
                    onClick={() => addExerciseToWorkout(exercise)}
                  >
                    <span className="picker-icon">{exercise.icon}</span>
                    <span className="picker-name">{exercise.name}</span>
                    {personalRecords[exercise.id] && (
                      <span className="picker-pr">🏆</span>
                    )}
                  </button>
                ))}
              </div>
              <button className="picker-close" onClick={() => setShowExercisePicker(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add Set Form Component
function AddSetForm({ onAdd }) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reps) {
      onAdd(reps, weight);
      setReps('');
      setWeight('');
    }
  };

  return (
    <form className="add-set-form" onSubmit={handleSubmit}>
      <input
        type="number"
        placeholder="Reps"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        min="1"
        required
      />
      <input
        type="number"
        placeholder="Weight (kg)"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        min="0"
        step="0.5"
      />
      <button type="submit">Add Set</button>
    </form>
  );
}
