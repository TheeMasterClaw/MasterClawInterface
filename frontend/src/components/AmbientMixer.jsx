import React, { useState, useEffect, useRef, useCallback } from 'react';
// import './AmbientMixer.css';

const SOUND_PRESETS = {
  rain: { name: 'Rain', emoji: '🌧️', freq: 0.5, type: 'rain' },
  cafe: { name: 'Cafe', emoji: '☕', freq: 0.3, type: 'cafe' },
  forest: { name: 'Forest', emoji: '🌲', freq: 0.4, type: 'forest' },
  ocean: { name: 'Ocean', emoji: '🌊', freq: 0.2, type: 'ocean' },
  whitenoise: { name: 'White Noise', emoji: '📻', freq: 1, type: 'whitenoise' },
  fire: { name: 'Fireplace', emoji: '🔥', freq: 0.6, type: 'fire' },
  wind: { name: 'Wind', emoji: '💨', freq: 0.35, type: 'wind' },
  night: { name: 'Night Crickets', emoji: '🦗', freq: 0.8, type: 'night' }
};

const MOOD_PRESETS = {
  focus: { name: 'Deep Focus', sounds: { whitenoise: 30, rain: 40 } },
  relax: { name: 'Relaxation', sounds: { ocean: 50, fire: 30 } },
  nature: { name: 'Nature Walk', sounds: { forest: 50, wind: 25, night: 20 } },
  sleep: { name: 'Sleep', sounds: { rain: 40, night: 30 } },
  creative: { name: 'Creative Flow', sounds: { cafe: 45, rain: 25 } },
  meditate: { name: 'Meditation', sounds: { wind: 35, ocean: 35 } }
};

const AUTO_STOP_OPTIONS = [
  { label: '∞ No limit', minutes: 0 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 }
];

// Generate ambient noise using Web Audio API
class AmbientSoundGenerator {
  constructor(ctx, type) {
    this.ctx = ctx;
    this.type = type;
    this.gainNode = ctx.createGain();
    this.gainNode.connect(ctx.destination);
    this.source = null;
    this.isPlaying = false;
  }

  createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  }

  createBrownNoise() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    
    return buffer;
  }

  createPinkNoise() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }
    
    return buffer;
  }

  start() {
    if (this.isPlaying) return;
    
    this.source = this.ctx.createBufferSource();
    
    switch (this.type) {
      case 'whitenoise':
        this.source.buffer = this.createNoiseBuffer();
        break;
      case 'rain':
      case 'ocean':
      case 'wind':
        this.source.buffer = this.createBrownNoise();
        break;
      case 'cafe':
      case 'forest':
      case 'fire':
      case 'night':
        this.source.buffer = this.createPinkNoise();
        break;
      default:
        this.source.buffer = this.createNoiseBuffer();
    }
    
    this.source.loop = true;
    
    // Add filtering for different sound types
    const filter = this.ctx.createBiquadFilter();
    
    switch (this.type) {
      case 'rain':
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        break;
      case 'cafe':
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 0.5;
        break;
      case 'ocean':
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        break;
      case 'forest':
        filter.type = 'highpass';
        filter.frequency.value = 800;
        break;
      case 'fire':
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        break;
      case 'wind':
        filter.type = 'bandpass';
        filter.frequency.value = 300;
        filter.Q.value = 0.3;
        break;
      case 'night':
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        break;
      default:
        filter.type = 'allpass';
    }
    
    this.source.connect(filter);
    filter.connect(this.gainNode);
    
    // Add modulation for more natural sound
    if (this.type === 'ocean' || this.type === 'wind') {
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = this.type === 'ocean' ? 0.1 : 0.3;
      lfoGain.gain.value = 0.3;
      lfo.connect(lfoGain);
      lfoGain.connect(this.gainNode.gain);
      lfo.start();
      this.lfo = lfo;
      this.lfoGain = lfoGain;
    }
    
    this.source.start();
    this.isPlaying = true;
  }

  stop() {
    if (!this.isPlaying) return;
    
    try {
      this.source?.stop();
      this.source?.disconnect();
      this.lfo?.stop();
      this.lfo?.disconnect();
      this.lfoGain?.disconnect();
    } catch (e) {
      // Ignore errors from already stopped sources
    }
    
    this.isPlaying = false;
  }

  setVolume(value) {
    // Smooth volume transition
    const now = this.ctx.currentTime;
    this.gainNode.gain.setTargetAtTime(value / 100, now, 0.1);
  }

  destroy() {
    this.stop();
    this.gainNode.disconnect();
  }
}

export default function AmbientMixer({ isOpen, onClose }) {
  const [volumes, setVolumes] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSounds, setActiveSounds] = useState([]);
  const [masterVolume, setMasterVolume] = useState(70);
  const [autoStopMinutes, setAutoStopMinutes] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showPresets, setShowPresets] = useState(false);
  const [recentSessions, setRecentSessions] = useState([]);
  const audioCtxRef = useRef(null);
  const generatorsRef = useRef({});
  const timerRef = useRef(null);

  // Load saved preferences
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-ambient-mixer');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setVolumes(data.volumes || {});
          setMasterVolume(data.masterVolume ?? 70);
          setRecentSessions(data.recentSessions || []);
        } catch (e) {
          console.error('Failed to load ambient mixer settings:', e);
        }
      }
    }
  }, [isOpen]);

  // Save preferences
  const savePreferences = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-ambient-mixer', JSON.stringify({
        volumes,
        masterVolume,
        recentSessions: recentSessions.slice(0, 10)
      }));
    }
  }, [volumes, masterVolume, recentSessions]);

  // Initialize AudioContext on user interaction
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Start/stop individual sound
  const toggleSound = useCallback((soundType) => {
    const ctx = initAudio();
    if (!ctx) return;

    setActiveSounds(prev => {
      const isActive = prev.includes(soundType);
      
      if (isActive) {
        // Stop sound
        generatorsRef.current[soundType]?.stop();
        delete generatorsRef.current[soundType];
        return prev.filter(s => s !== soundType);
      } else {
        // Start sound
        const generator = new AmbientSoundGenerator(ctx, soundType);
        const volume = volumes[soundType] || 50;
        generator.setVolume(volume * (masterVolume / 100));
        generator.start();
        generatorsRef.current[soundType] = generator;
        return [...prev, soundType];
      }
    });
    
    setIsPlaying(true);
  }, [initAudio, volumes, masterVolume]);

  // Update volume for a sound
  const updateVolume = useCallback((soundType, value) => {
    setVolumes(prev => ({ ...prev, [soundType]: value }));
    const generator = generatorsRef.current[soundType];
    if (generator) {
      generator.setVolume(value * (masterVolume / 100));
    }
  }, [masterVolume]);

  // Update master volume
  const updateMasterVolume = useCallback((value) => {
    setMasterVolume(value);
    Object.entries(generatorsRef.current).forEach(([type, generator]) => {
      const soundVolume = volumes[type] || 50;
      generator.setVolume(soundVolume * (value / 100));
    });
  }, [volumes]);

  // Stop all sounds
  const stopAll = useCallback(() => {
    Object.values(generatorsRef.current).forEach(gen => gen.stop());
    generatorsRef.current = {};
    setActiveSounds([]);
    setIsPlaying(false);
    setTimeRemaining(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Apply mood preset
  const applyPreset = useCallback((presetKey) => {
    const preset = MOOD_PRESETS[presetKey];
    if (!preset) return;

    // Stop current sounds
    stopAll();
    
    // Apply new volumes
    const newVolumes = {};
    Object.entries(preset.sounds).forEach(([sound, volume]) => {
      newVolumes[sound] = volume;
    });
    setVolumes(newVolumes);
    
    // Start sounds after a brief delay
    setTimeout(() => {
      Object.entries(preset.sounds).forEach(([soundType, volume]) => {
        if (volume > 0) {
          const ctx = initAudio();
          if (!ctx) return;
          
          const generator = new AmbientSoundGenerator(ctx, soundType);
          generator.setVolume(volume * (masterVolume / 100));
          generator.start();
          generatorsRef.current[soundType] = generator;
        }
      });
      setActiveSounds(Object.keys(preset.sounds).filter(s => preset.sounds[s] > 0));
      setIsPlaying(true);
    }, 100);
    
    setShowPresets(false);
  }, [initAudio, masterVolume, stopAll]);

  // Auto-stop timer
  useEffect(() => {
    if (autoStopMinutes > 0 && isPlaying) {
      setTimeRemaining(autoStopMinutes * 60);
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopAll();
            // Record session
            setRecentSessions(prevSessions => [{
              id: Date.now(),
              duration: autoStopMinutes,
              sounds: [...activeSounds],
              date: new Date().toISOString()
            }, ...prevSessions.slice(0, 9)]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeRemaining(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoStopMinutes, isPlaying, activeSounds, stopAll]);

  // Save preferences on change
  useEffect(() => {
    savePreferences();
  }, [volumes, masterVolume, recentSessions, savePreferences]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      audioCtxRef.current?.close();
    };
  }, [stopAll]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="ambient-mixer-overlay" onClick={onClose}>
      <div className="ambient-mixer-panel" onClick={e => e.stopPropagation()}>
        <div className="ambient-mixer-header">
          <h3>🎧 Ambient Sound Mixer</h3>
          <div className="header-actions">
            <button 
              className="presets-btn"
              onClick={() => setShowPresets(!showPresets)}
              title="Mood Presets"
            >
              🎭 Presets
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {showPresets ? (
          <div className="presets-panel">
            <h4>🎭 Mood Presets</h4>
            <div className="presets-grid">
              {Object.entries(MOOD_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  className="preset-card"
                  onClick={() => applyPreset(key)}
                >
                  <span className="preset-name">{preset.name}</span>
                  <span className="preset-sounds">
                    {Object.keys(preset.sounds).map(s => SOUND_PRESETS[s]?.emoji).join(' ')}
                  </span>
                </button>
              ))}
            </div>
            <button className="back-btn" onClick={() => setShowPresets(false)}>
              ← Back to Mixer
            </button>
          </div>
        ) : (
          <>
            <div className="master-controls">
              <div className="master-volume">
                <label>Master Volume</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => updateMasterVolume(parseInt(e.target.value))}
                />
                <span>{masterVolume}%</span>
              </div>
              
              <div className="auto-stop">
                <label>Auto-Stop</label>
                <select 
                  value={autoStopMinutes}
                  onChange={(e) => setAutoStopMinutes(parseInt(e.target.value))}
                >
                  {AUTO_STOP_OPTIONS.map(opt => (
                    <option key={opt.minutes} value={opt.minutes}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {timeRemaining > 0 && (
                <div className="timer-display">
                  ⏱️ {formatTime(timeRemaining)}
                </div>
              )}
            </div>

            <div className="sounds-grid">
              {Object.entries(SOUND_PRESETS).map(([key, sound]) => {
                const isActive = activeSounds.includes(key);
                const volume = volumes[key] || 50;
                
                return (
                  <div 
                    key={key} 
                    className={`sound-card ${isActive ? 'active' : ''}`}
                  >
                    <button
                      className="sound-toggle"
                      onClick={() => toggleSound(key)}
                    >
                      <span className="sound-emoji">{sound.emoji}</span>
                      <span className="sound-name">{sound.name}</span>
                      <span className={`sound-status ${isActive ? 'playing' : ''}`}>
                        {isActive ? '▶' : '⏸'}
                      </span>
                    </button>
                    
                    <div className="volume-control">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => updateVolume(key, parseInt(e.target.value))}
                        disabled={!isActive}
                      />
                      <span className="volume-value">{volume}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mixer-actions">
              <button 
                className="stop-all-btn"
                onClick={stopAll}
                disabled={!isPlaying}
              >
                ⏹ Stop All
              </button>
            </div>

            {recentSessions.length > 0 && (
              <div className="recent-sessions">
                <h4>📊 Recent Sessions</h4>
                <div className="sessions-list">
                  {recentSessions.slice(0, 5).map(session => (
                    <div key={session.id} className="session-item">
                      <span className="session-date">
                        {new Date(session.date).toLocaleDateString()}
                      </span>
                      <span className="session-duration">{session.duration} min</span>
                      <span className="session-sounds">
                        {session.sounds.map(s => SOUND_PRESETS[s]?.emoji).join(' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mixer-tips">
              <p>💡 <strong>Tip:</strong> Mix rain + cafe for focused work, or ocean + fire for relaxation.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
