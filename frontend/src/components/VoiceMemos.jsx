import React, { useState, useRef, useEffect, useCallback } from 'react';
// import './VoiceMemos.css';

const MAX_RECORDING_DURATION = 300; // 5 minutes in seconds
const MAX_MEMOS = 50; // Maximum stored memos

export default function VoiceMemos({ isOpen, onClose }) {
  const [memos, setMemos] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionState, setPermissionState] = useState('prompt'); // prompt, granted, denied
  const [activeMemo, setActiveMemo] = useState(null);
  const [filter, setFilter] = useState('all'); // all, favorites, today
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, longest, shortest

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const audioElementRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Load memos from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-voice-memos');
      if (saved) {
        try {
          setMemos(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse voice memos:', e);
        }
      }
      checkPermission();
    }
  }, [isOpen]);

  // Save memos to localStorage
  const saveMemos = useCallback((memoList) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-voice-memos', JSON.stringify(memoList.slice(0, MAX_MEMOS)));
    }
  }, []);

  // Check microphone permission
  const checkPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' });
        setPermissionState(result.state);
        result.addEventListener('change', () => {
          setPermissionState(result.state);
        });
      }
    } catch (e) {
      console.log('Permission API not supported');
    }
  };

  // Request microphone access
  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      return true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      setPermissionState('denied');
      return false;
    }
  };

  // Start recording
  const startRecording = async () => {
    if (permissionState === 'denied') {
      alert('Microphone permission is required to record voice memos.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const newMemo = {
          id: Date.now(),
          audioUrl,
          duration: recordingTime,
          createdAt: new Date().toISOString(),
          title: `Voice Memo ${memos.length + 1}`,
          isFavorite: false,
          transcript: null,
          tags: []
        };

        const updatedMemos = [newMemo, ...memos];
        setMemos(updatedMemos);
        saveMemos(updatedMemos);
        setRecordingTime(0);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Start waveform visualization
      startWaveformVisualization(stream);

    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      stopWaveformVisualization();
    }
  };

  // Waveform visualization
  const startWaveformVisualization = (stream) => {
    if (!canvasRef.current) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      if (!isRecording) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, '#a78bfa');
        ctx.fillStyle = gradient;

        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  const stopWaveformVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Play memo
  const playMemo = (memo) => {
    if (activeMemo?.id === memo.id && isPlaying) {
      // Pause current
      audioElementRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    // Stop previous if any
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    setActiveMemo(memo);
    const audio = new Audio(memo.audioUrl);
    audioElementRef.current = audio;

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
    });

    audio.addEventListener('timeupdate', () => {
      setPlaybackProgress((audio.currentTime / audio.duration) * 100);
    });

    audio.play();
    setIsPlaying(true);
  };

  // Delete memo
  const deleteMemo = (id) => {
    if (!confirm('Delete this voice memo?')) return;
    
    const memo = memos.find(m => m.id === id);
    if (memo?.audioUrl) {
      URL.revokeObjectURL(memo.audioUrl);
    }
    
    const updated = memos.filter(m => m.id !== id);
    setMemos(updated);
    saveMemos(updated);
    
    if (activeMemo?.id === id) {
      setActiveMemo(null);
      setIsPlaying(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    const updated = memos.map(m => 
      m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
    );
    setMemos(updated);
    saveMemos(updated);
  };

  // Update memo title
  const updateTitle = (id, newTitle) => {
    const updated = memos.map(m => 
      m.id === id ? { ...m, title: newTitle } : m
    );
    setMemos(updated);
    saveMemos(updated);
  };

  // Add tag to memo
  const addTag = (id, tag) => {
    if (!tag.trim()) return;
    const updated = memos.map(m => 
      m.id === id ? { ...m, tags: [...new Set([...m.tags, tag.trim()])] } : m
    );
    setMemos(updated);
    saveMemos(updated);
  };

  // Remove tag
  const removeTag = (id, tagToRemove, e) => {
    e.stopPropagation();
    const updated = memos.map(m => 
      m.id === id ? { ...m, tags: m.tags.filter(t => t !== tagToRemove) } : m
    );
    setMemos(updated);
    saveMemos(updated);
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter and sort memos
  const getFilteredMemos = () => {
    let filtered = [...memos];

    // Apply filter
    if (filter === 'favorites') {
      filtered = filtered.filter(m => m.isFavorite);
    } else if (filter === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(m => new Date(m.createdAt).toDateString() === today);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(query) ||
        m.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'longest':
          return b.duration - a.duration;
        case 'shortest':
          return a.duration - b.duration;
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  };

  // Get total stats
  const getStats = () => {
    const totalDuration = memos.reduce((acc, m) => acc + m.duration, 0);
    const today = new Date().toDateString();
    const todayCount = memos.filter(m => new Date(m.createdAt).toDateString() === today).length;
    
    return {
      totalCount: memos.length,
      totalDuration,
      todayCount,
      favoritesCount: memos.filter(m => m.isFavorite).length
    };
  };

  if (!isOpen) return null;

  const filteredMemos = getFilteredMemos();
  const stats = getStats();

  return (
    <div className="voice-memos-overlay" onClick={onClose}>
      <div className="voice-memos-panel" onClick={e => e.stopPropagation()}>
        <div className="voice-memos-header">
          <h3>🎙️ Voice Memos</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Recording Section */}
        <div className={`recording-section ${isRecording ? 'recording' : ''}`}>
          <div className="recording-visualizer">
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={80}
              className={`waveform-canvas ${isRecording ? 'active' : ''}`}
            />
            {!isRecording && (
              <div className="recorder-placeholder">
                <span className="mic-icon">🎤</span>
                <p>Tap record to capture your thoughts</p>
              </div>
            )}
          </div>

          <div className="recording-controls">
            {isRecording ? (
              <>
                <div className="recording-timer">
                  <span className="recording-indicator">🔴</span>
                  <span className="timer-value">{formatDuration(recordingTime)}</span>
                  <span className="timer-limit">/ {formatDuration(MAX_RECORDING_DURATION)}</span>
                </div>
                <button className="record-btn stop" onClick={stopRecording}>
                  ⏹️ Stop Recording
                </button>
              </>
            ) : (
              <button 
                className="record-btn start" 
                onClick={startRecording}
                disabled={permissionState === 'denied'}
              >
                🔴 Record New Memo
              </button>
            )}
          </div>

          {permissionState === 'denied' && (
            <div className="permission-warning">
              ⚠️ Microphone access denied. Please enable it in your browser settings.
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="memos-stats">
          <div className="stat-pill">
            <span className="stat-icon">🎙️</span>
            <span className="stat-value">{stats.totalCount}</span>
            <span className="stat-label">total</span>
          </div>
          <div className="stat-pill">
            <span className="stat-icon">⏱️</span>
            <span className="stat-value">{formatDuration(stats.totalDuration)}</span>
            <span className="stat-label">recorded</span>
          </div>
          <div className="stat-pill">
            <span className="stat-icon">📅</span>
            <span className="stat-value">{stats.todayCount}</span>
            <span className="stat-label">today</span>
          </div>
          <div className="stat-pill">
            <span className="stat-icon">⭐</span>
            <span className="stat-value">{stats.favoritesCount}</span>
            <span className="stat-label">favorites</span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="memos-filters">
          <div className="filter-tabs">
            <button 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={filter === 'favorites' ? 'active' : ''} 
              onClick={() => setFilter('favorites')}
            >
              ⭐ Favorites
            </button>
            <button 
              className={filter === 'today' ? 'active' : ''} 
              onClick={() => setFilter('today')}
            >
              📅 Today
            </button>
          </div>
          
          <div className="search-sort-row">
            <input
              type="text"
              placeholder="Search memos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="memo-search"
            />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="longest">Longest First</option>
              <option value="shortest">Shortest First</option>
            </select>
          </div>
        </div>

        {/* Memos List */}
        <div className="memos-list">
          {filteredMemos.length === 0 ? (
            <div className="empty-state">
              {searchQuery ? (
                <>
                  <span className="empty-icon">🔍</span>
                  <p>No memos match your search</p>
                </>
              ) : filter === 'favorites' ? (
                <>
                  <span className="empty-icon">⭐</span>
                  <p>No favorite memos yet</p>
                  <p className="empty-hint">Star memos to find them quickly</p>
                </>
              ) : filter === 'today' ? (
                <>
                  <span className="empty-icon">📅</span>
                  <p>No memos recorded today</p>
                  <p className="empty-hint">Record your first memo of the day!</p>
                </>
              ) : (
                <>
                  <span className="empty-icon">🎙️</span>
                  <p>No voice memos yet</p>
                  <p className="empty-hint">Tap "Record New Memo" to get started</p>
                </>
              )}
            </div>
          ) : (
            filteredMemos.map(memo => (
              <div 
                key={memo.id} 
                className={`memo-item ${activeMemo?.id === memo.id ? 'active' : ''}`}
              >
                <div className="memo-main" onClick={() => playMemo(memo)}>
                  <button className="play-btn">
                    {activeMemo?.id === memo.id && isPlaying ? '⏸️' : '▶️'}
                  </button>
                  
                  <div className="memo-info">
                    <input
                      type="text"
                      value={memo.title}
                      onChange={(e) => updateTitle(memo.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="memo-title-input"
                    />
                    <div className="memo-meta">
                      <span className="memo-duration">⏱️ {formatDuration(memo.duration)}</span>
                      <span className="memo-date">📅 {formatDate(memo.createdAt)}</span>
                    </div>
                    
                    {/* Tags */}
                    {memo.tags.length > 0 && (
                      <div className="memo-tags">
                        {memo.tags.map(tag => (
                          <span key={tag} className="memo-tag">
                            #{tag}
                            <button 
                              className="remove-tag"
                              onClick={(e) => removeTag(memo.id, tag, e)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add tag input */}
                    <input
                      type="text"
                      placeholder="+ Add tag"
                      className="add-tag-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addTag(memo.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Playback progress bar */}
                  {activeMemo?.id === memo.id && (
                    <div className="playback-progress-bar">
                      <div 
                        className="playback-progress-fill" 
                        style={{ width: `${playbackProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="memo-actions">
                  <button 
                    className={`action-btn favorite ${memo.isFavorite ? 'active' : ''}`}
                    onClick={(e) => toggleFavorite(memo.id, e)}
                    title={memo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {memo.isFavorite ? '⭐' : '☆'}
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => deleteMemo(memo.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer tips */}
        <div className="voice-memos-footer">
          <p>💡 <strong>Pro tip:</strong> Use tags to organize memos by topic or project</p>
        </div>
      </div>
    </div>
  );
}
