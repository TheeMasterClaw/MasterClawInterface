import { logActivity } from "../components/ActivityLogPanel";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import API from '../config.js';
import GatewayClient from '../lib/gateway.js';
import { useUIStore } from '../lib/store';
import CommandPalette from '../components/CommandPalette';
// import './Dashboard.css';

// Browser detection
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const OVERLAY_COMMAND_MAP = {
  'tasks': 'tasks',
  'calendar': 'calendar',
  'notes': 'notes',
  'quicklinks': 'quickLinks',
  'health': 'health',
  'activity': 'activityLog',
  'focus': 'focusTimer',
  'weather': 'weather',
  'habits': 'habitTracker',
  'quotes': 'dailyQuote',
  'time': 'timeTracker',
  'mood': 'moodTracker',
  'breathing': 'breathing',
  'productivity': 'productivity',
  'journal': 'journal',
  'snippets': 'snippets',
  'knowledge': 'knowledge',
  'system': 'system',
  'whiteboard': 'whiteboard',
  'gratitude': 'gratitude',
  'reading': 'reading',
  'books': 'reading',
  'ambient': 'ambient',
  'mixer': 'ambient',
  'skills': 'skills',
  'learning': 'skills',
  'weekly-review': 'weekly',
  'review': 'weekly',
  'idea': 'ideas',
  'ideas': 'ideas',
  'challenge': 'challenges',
  'challenges': 'challenges',
  'expense': 'expenses',
  'expenses': 'expenses',
  'finance': 'expenses',
  'energy': 'energy',
  'meeting': 'meeting',
  'meetings': 'meeting',
  'projects': 'projects',
  'project': 'projects',
  'vision': 'vision',
  'visions': 'vision',
  'board': 'vision',
  'vault': 'vault',
  'passwords': 'vault',
  'balance': 'balance',
  'wheel': 'balance',
  'deepwork': 'deepWork',
  'deep': 'deepWork',
  'prompts': 'prompts',
  'prompt-library': 'prompts',
  'study': 'study',
  'learn': 'study',
  'courses': 'study',
  'capsule': 'capsule',
  'timecapsule': 'capsule',
  'letter': 'capsule',
  'detox': 'detox',
  'digitaldetox': 'detox',
  'screentime': 'detox',
  'reminder': 'reminders',
  'reminders': 'reminders',
  'alarm': 'reminders',
  'history': 'history',
  'chat': 'history',
  'conversations': 'history',
  'reflect': 'reflection',
  'studio': 'reflection',
  'mindfulness': 'reflection',
  'achievements': 'achievements',
  'rewards': 'achievements',
  'sprint': 'sprint',
  'sprints': 'sprint',
  'agile': 'sprint',
  'resources': 'resources',
  'library': 'resources',
  'bookmarks': 'resources'
};

export default function Dashboard({ mode, avatar, onConnectionStatusChange }) {
  // Global Store
  const { overlays, openOverlay, closeOverlay, toggleOverlay, setConnectionStatus: setGlobalConnectionStatus } = useUIStore();
  const showCommandPalette = overlays.commandPalette;
  const showHelp = overlays.help;

  // Local Chat State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // Keep local for HUD sync for now
  const [avatarState, setAvatarState] = useState('idle');
  const [alerts, setAlerts] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode || 'hybrid');
  const [isVideoActive, setIsVideoActive] = useState(false);

  // Refs
  const messagesContainerRef = useRef(null);
  const gatewayRef = useRef(null);
  const messageCountRef = useRef(0);
  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);

  // Cleanup video stream on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Sync connection status with global store
  const updateConnectionStatus = useCallback((status) => {
    setConnectionStatus(status);
    setGlobalConnectionStatus(status);
    if (onConnectionStatusChange) {
      onConnectionStatusChange(status);
    }
  }, [onConnectionStatusChange, setGlobalConnectionStatus]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Load chat history on mount
  useEffect(() => {
    if (!isBrowser) return;
    loadChatHistory();
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${API.chat.history}?limit=50`);
      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        const formatted = data.messages.map(m => ({
          id: m.id || ++messageCountRef.current,
          type: m.role === 'user' ? 'user' : 'mc',
          text: m.content,
          timestamp: m.createdAt,
          command: m.command
        }));
        setMessages(formatted);
        messageCountRef.current = formatted.length;
      } else {
        setMessages([{
          id: ++messageCountRef.current,
          type: 'mc',
          text: 'Ready. What do you need? Type /help for commands.'
        }]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setMessages([{
        id: ++messageCountRef.current,
        type: 'mc',
        text: 'Ready. What do you need? Type /help for commands.'
      }]);
    }
  };

  const requestNotificationPermission = () => {
    if (!isBrowser) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const sendNotification = (title, body) => {
    if (!isBrowser) return;
    const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
    if (settings.notifications !== false && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  // Connect to OpenClaw gateway
  useEffect(() => {
    if (!isBrowser) return;

    const initGateway = async () => {
      try {
        const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
        const gatewayUrl = settings.gatewayUrl || process.env.NEXT_PUBLIC_GATEWAY_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const gatewayToken = settings.gatewayToken || process.env.NEXT_PUBLIC_GATEWAY_TOKEN || '';

        const client = new GatewayClient(gatewayUrl, gatewayToken, {
          maxReconnectAttempts: 10,
          reconnectDelay: 2000
        });

        client.onConnect(() => {
          setIsConnected(true);
          updateConnectionStatus('connected');
        });

        client.onDisconnect(() => {
          setIsConnected(false);
          updateConnectionStatus('reconnecting');
        });

        client.onMessage((data) => {
          const responseText = data.message || data.response || JSON.stringify(data);
          const mcResponse = {
            id: ++messageCountRef.current,
            type: 'mc',
            text: responseText,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, mcResponse]);
          setIsTyping(false);
          setAvatarState('idle');
          sendNotification('MC', responseText.substring(0, 100));
          playTTS(responseText);
        });

        client.onError(() => {
          updateConnectionStatus('error');
        });

        await client.connect();
        gatewayRef.current = client;
      } catch (err) {
        console.error('Gateway connection failed:', err);
        updateConnectionStatus('offline');
      }
    };

    initGateway();

    return () => {
      if (gatewayRef.current) {
        gatewayRef.current.disconnect();
      }
    };
  }, []);

  // Proactive alerts for Context mode
  useEffect(() => {
    if (!isBrowser || currentMode !== 'context') return;

    const checkAlerts = async () => {
      try {
        const response = await fetch(API.calendar.upcoming);
        const events = await response.json();

        const now = new Date();
        const upcomingAlerts = events
          .filter(e => {
            const startTime = new Date(e.startTime);
            const diffMinutes = (startTime - now) / (1000 * 60);
            return diffMinutes > 0 && diffMinutes <= 60;
          })
          .map(e => ({
            id: e.id,
            message: `📅 "${e.title}" in ${Math.round((new Date(e.startTime) - now) / (1000 * 60))} min`,
            time: e.startTime
          }));

        setAlerts(upcomingAlerts);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [currentMode]);

  // Keyboard shortcuts (Chat specific only, others in GlobalShortcuts)
  useEffect(() => {
    if (!isBrowser) return;

    const handleKeyDown = (e) => {
      // Focus input on typing (unless in input or showing overlay)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tagName = document.activeElement?.tagName;
        // Check if any overlay is open using global store state if needed, 
        // but checking visible modals via DOM or simplified check is easier.
        // For now, if command palette is open, don't focus chat.
        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA' && !showCommandPalette && !showHelp) {
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, showHelp]);

  const playTTS = async (text) => {
    if (!isBrowser || text.length > 500) return;

    try {
      const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
      const provider = settings.ttsProvider || 'openai';
      const voice = settings.ttsVoice || 'alloy';

      const response = await fetch(API.tts.synthesize, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, provider, voice })
      });

      const data = await response.json();
      if (data.audioUrl) {
        const audioUrl = `${API.BASE_URL.replace(/\/$/, '')}${data.audioUrl}`;
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      }
    } catch (err) {
      console.log('TTS unavailable:', err.message);
    }
  };

  const handleSendText = useCallback(async () => {
    if (!input.trim() || !isBrowser) return;

    const userText = input.trim();
    messageCountRef.current++;

    const userMsg = {
      id: messageCountRef.current,
      type: 'user',
      text: userText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setAvatarState('thinking');

    // Log activity
    logActivity({
      type: 'message',
      title: 'Message sent',
      description: userText.substring(0, 100) + (userText.length > 100 ? '...' : '')
    });

    // Handle slash commands (Use mapping)
    if (userText.startsWith('/')) {
      const command = userText.substring(1).split(' ')[0].toLowerCase();

      // Check map
      if (OVERLAY_COMMAND_MAP[command]) {
        openOverlay(OVERLAY_COMMAND_MAP[command]);
        setIsTyping(false);
        setAvatarState('idle');
        logActivity({ type: 'command', title: 'Command executed', description: `Opened ${command}` });
        return;
      }

      // Special commands not in map
      if (command === 'clear' || command === 'cls') {
        try {
          await fetch(API.chat.history, { method: 'DELETE' });
          setMessages([{
            id: ++messageCountRef.current,
            type: 'mc',
            text: 'Chat history cleared.'
          }]);
          setIsTyping(false);
          setAvatarState('idle');
          return;
        } catch (err) {
          console.error('Failed to clear history:', err);
        }
      }

      if (command === 'help') {
        openOverlay('help');
        setIsTyping(false);
        setAvatarState('idle');
        return;
      }
    }

    if (isConnected && gatewayRef.current) {
      gatewayRef.current.send(userText);
      return;
    }

    try {
      const response = await fetch(API.chat.message, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      const data = await response.json();

      messageCountRef.current++;
      const mcResponse = {
        id: messageCountRef.current,
        type: 'mc',
        text: data.text || data.message || 'No response',
        timestamp: new Date().toISOString(),
        command: data.command
      };

      setMessages(prev => [...prev, mcResponse]);
      setIsTyping(false);
      setAvatarState('idle');
      playTTS(mcResponse.text);
    } catch (err) {
      messageCountRef.current++;
      const errorMsg = {
        id: messageCountRef.current,
        type: 'mc',
        text: `❌ Error: ${err.message}. Make sure the backend is running.`,
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsTyping(false);
      setAvatarState('idle');
    }
  }, [input, isConnected, openOverlay]);

  const handleVoiceInput = () => {
    if (!isBrowser || isListening) return;

    setIsListening(true);
    setAvatarState('listening');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setInput(transcript);

        if (event.results[0].isFinal) {
          setTimeout(() => {
            setIsListening(false);
            setAvatarState('idle');
            handleSendText();
          }, 500);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setAvatarState('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        setAvatarState('idle');
      };

      recognition.start();
    }
  };

  const handleVideoToggle = async () => {
    if (!isBrowser) return;

    if (isVideoActive) {
      // Stop video
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsVideoActive(false);
    } else {
      // Start video
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsVideoActive(true);
      } catch (err) {
        console.error('Failed to access camera:', err);
        const errorMessage = err.name === 'NotAllowedError'
          ? 'Camera access denied. Please grant camera permissions in your browser settings.'
          : 'Camera not available or already in use.';

        messageCountRef.current++;
        const errorMsg = {
          id: messageCountRef.current,
          type: 'mc',
          text: `📷 ${errorMessage}`,
          timestamp: new Date().toISOString(),
          error: true
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    }
  };

  const handleCommandPaletteAction = (command) => {
    switch (command.type) {
      case 'input':
        setInput(command.value);
        setTimeout(() => inputRef.current?.focus(), 100);
        break;
      case 'panel':
        if (OVERLAY_COMMAND_MAP[command.target]) {
          openOverlay(OVERLAY_COMMAND_MAP[command.target]);
        }
        break;
      case 'settings':
        openOverlay('settings');
        break;
      case 'help':
        openOverlay('help');
        break;
      case 'voice':
        handleVoiceInput();
        break;
      case 'theme':
        if (isBrowser) {
          const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
          settings.theme = command.value;
          localStorage.setItem('mc-settings', JSON.stringify(settings));
          window.location.reload();
        }
        break;
    }
  };

  const statusLabelMap = {
    connected: 'Neural link synchronized',
    reconnecting: 'Recovering uplink',
    'backend-only': 'API fallback active',
    connecting: 'Establishing uplink',
    unconfigured: 'Gateway setup required',
    error: 'Network fault detected',
    offline: 'System offline'
  };

  const AvatarWithState = avatar ? React.cloneElement(avatar, {
    state: avatarState,
    size: 'small'
  }) : null;

  return (
    <div className="dashboard">
      <audio ref={audioRef} style={{ display: 'none' }} />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => closeOverlay('commandPalette')}
        onCommand={handleCommandPaletteAction}
        inputRef={inputRef}
      />

      {showHelp && (
        <div className="help-overlay" onClick={() => closeOverlay('help')}>
          <div className="help-panel" onClick={e => e.stopPropagation()}>
            <div className="help-header">
              <h3>📖 Keyboard Shortcuts & Commands</h3>
              <button className="help-close" onClick={() => closeOverlay('help')}>×</button>
            </div>
            <div className="help-content">
              <section>
                <h4>Keyboard Shortcuts</h4>
                <ul>
                  <li><strong>⌘/Ctrl + K</strong> - Open Command Palette</li>
                  <li><strong>⌘/Ctrl + Enter</strong> - Send message</li>
                  <li><strong>⌘/Ctrl + .</strong> - Toggle settings</li>
                  <li><strong>⌘/Ctrl + /</strong> - Show help</li>
                  <li><strong>Escape</strong> - Close modals</li>
                </ul>
              </section>
              <section>
                <h4>Commands</h4>
                <ul>
                  <li><strong>/tasks</strong> – List all tasks</li>
                  <li><strong>/events</strong> – Upcoming events</li>
                  <li><strong>/links</strong> – Open Quick Links</li>
                  <li>... use /help to see all available commands in Command Palette ...</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          <div className="sidebar-brand">
            <span className="sidebar-brand__label">MASTERCLAW</span>
            <span className="sidebar-brand__sub">Neural Console</span>
          </div>

          <div className="mc-avatar-sidebar">
            {AvatarWithState}
          </div>

          <div className="mode-indicator">
            <span className="mode-badge">{currentMode}</span>

            <button className="icon-btn" onClick={() => openOverlay('commandPalette')} title="Command Palette (⌘K)" aria-label="Open command palette">⌘</button>
            <button className="icon-btn" onClick={() => openOverlay('help')} title="Help">❓</button>
            <button className="icon-btn" onClick={() => openOverlay('settings')} title="Settings">⚙️</button>
            <button className="icon-btn" onClick={() => openOverlay('health')} title="Health Monitor">🏥</button>
            <button className="icon-btn" onClick={() => openOverlay('tasks')} title="Tasks">📋</button>
            <button className="icon-btn" onClick={() => openOverlay('calendar')} title="Calendar">📅</button>
            <button className="icon-btn" onClick={() => openOverlay('notes')} title="Notes">📝</button>
            <button className="icon-btn" onClick={() => openOverlay('quickLinks')} title="Quick Links">🔗</button>
            <button className="icon-btn" onClick={() => openOverlay('activityLog')} title="Activity Log">📊</button>
            <button className="icon-btn" onClick={() => openOverlay('focusTimer')} title="Focus Timer">🎯</button>
            <button className="icon-btn" onClick={() => openOverlay('weather')} title="Weather">🌤️</button>
            <button className="icon-btn" onClick={() => openOverlay('habitTracker')} title="Habit Tracker">🎯</button>
            <button className="icon-btn" onClick={() => openOverlay('dailyQuote')} title="Daily Quote">💬</button>
            <button className="icon-btn" onClick={() => openOverlay('timeTracker')} title="Time Tracker">⏱️</button>
            <button className="icon-btn" onClick={() => openOverlay('moodTracker')} title="Mood Tracker">🧠</button>
            {/* Added a few more, list truncated for brevity in UI but actions work via store */}
          </div>
        </div>

        <div className="dashboard-main">
          <div className="chat-shell">
            <div className="dashboard-hud">
              <div className="hud-chip">Mode: <strong>{currentMode}</strong></div>
              <div className={`hud-chip hud-chip--${connectionStatus}`}>{statusLabelMap[connectionStatus] || 'Status unknown'}</div>
              <div className="hud-chip">Messages: <strong>{messages.length}</strong></div>
            </div>

            {currentMode === 'context' && alerts.length > 0 && (
              <div className="alerts-container">
                {alerts.map(alert => (
                  <div key={alert.id} className="alert-item">{alert.message}</div>
                ))}
              </div>
            )}

            <div className="messages-container" ref={messagesContainerRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`message message-${msg.type}`}>
                  <div className="message-content">
                    {msg.command && <span className="command-badge">/{msg.command}</span>}
                    {msg.text}
                  </div>
                  {msg.timestamp && (
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="message message-mc typing">
                  <div className="message-content">
                    <span className="typing-indicator">
                      <span></span><span></span><span></span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="input-area">
              {isVideoActive && (
                <div className="video-preview">
                  <video ref={videoRef} autoPlay muted className="camera-feed" />
                </div>
              )}

              <div className="mode-switcher">
                <button
                  className={`mode-switch-btn ${currentMode === 'text' ? 'active' : ''}`}
                  onClick={() => setCurrentMode('text')}
                  title="Text Mode"
                >
                  💬
                </button>
                <button
                  className={`mode-switch-btn ${currentMode === 'voice' ? 'active' : ''}`}
                  onClick={() => setCurrentMode('voice')}
                  title="Voice Mode"
                >
                  🎤
                </button>
                <button
                  className={`mode-switch-btn ${currentMode === 'hybrid' ? 'active' : ''}`}
                  onClick={() => setCurrentMode('hybrid')}
                  title="Hybrid Mode"
                >
                  🔀
                </button>
                <button
                  className={`mode-switch-btn ${currentMode === 'context' ? 'active' : ''}`}
                  onClick={() => setCurrentMode('context')}
                  title="Context Mode"
                >
                  👁️
                </button>
              </div>

              <div className="input-controls">
                {(currentMode === 'text' || currentMode === 'hybrid') && (
                  <div className="text-input-group">
                    <input
                      ref={inputRef}
                      type="text"
                      className="text-input"
                      placeholder="Transmit command… (/help for shortcuts)"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendText()}
                    />
                    <button className="send-button" onClick={handleSendText} title="Send">→</button>
                  </div>
                )}

                <div className="media-controls">
                  {(currentMode === 'voice' || currentMode === 'hybrid') && (
                    <button
                      className={`voice-button ${isListening ? 'listening' : ''}`}
                      onClick={handleVoiceInput}
                      title="Voice Input"
                    >
                      {isListening ? '🎤 Listening...' : '🎤 Speak'}
                    </button>
                  )}

                  <button
                    className={`camera-button ${isVideoActive ? 'active' : ''}`}
                    onClick={handleVideoToggle}
                    title={isVideoActive ? 'Stop Camera' : 'Start Camera'}
                  >
                    {isVideoActive ? '📹 Stop' : '📷 Camera'}
                  </button>
                </div>

                {currentMode === 'context' && (
                  <div className="context-info">
                    <p>👁️ MC is watching your calendar and tasks.</p>
                    <p>I'll alert you to what matters.</p>
                  </div>
                )}
              </div>

              <div className="input-hints">
                <span>Press <strong>⌘K</strong> for commands · <strong>⌘Enter</strong> to send</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to log activity (stub, since we removed the local import if it was a component, 
// but it was imported as ActivityLogPanel, { logActivity }).
// We need to request `logActivity` from somewhere or mock it.
// The original import was: import ActivityLogPanel, { logActivity } from '../components/ActivityLogPanel';
// So we need to import logActivity.
