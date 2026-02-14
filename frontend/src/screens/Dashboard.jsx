import React, { useState, useRef, useEffect, useCallback } from 'react';
import API from '../config.js';
import GatewayClient from '../lib/gateway.js';
import Settings from '../components/Settings';
import HealthMonitor from '../components/HealthMonitor';
import TaskPanel from '../components/TaskPanel';
import CalendarPanel from '../components/CalendarPanel';
import NotesPanel from '../components/NotesPanel';
import QuickLinksPanel from '../components/QuickLinksPanel';
import ActivityLogPanel, { logActivity } from '../components/ActivityLogPanel';
import CommandPalette from '../components/CommandPalette';
import FocusTimer from '../components/FocusTimer';
import WeatherPanel from '../components/WeatherPanel';
import HabitTracker from '../components/HabitTracker';
import DailyQuote from '../components/DailyQuote';
import TimeTracker from '../components/TimeTracker';
import MoodTracker from '../components/MoodTracker';
import BreathingExercise from '../components/BreathingExercise';
import ProductivityAnalytics from '../components/ProductivityAnalytics';
import './Dashboard.css';

// Browser detection
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export default function Dashboard({ mode, avatar }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [avatarState, setAvatarState] = useState('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showCalendarPanel, setShowCalendarPanel] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showQuickLinksPanel, setShowQuickLinksPanel] = useState(false);
  const [showActivityLogPanel, setShowActivityLogPanel] = useState(false);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [showWeatherPanel, setShowWeatherPanel] = useState(false);
  const [showHabitTracker, setShowHabitTracker] = useState(false);
  const [showDailyQuote, setShowDailyQuote] = useState(false);
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [showProductivityAnalytics, setShowProductivityAnalytics] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode || 'hybrid');
  const messagesEndRef = useRef(null);
  const gatewayRef = useRef(null);
  const messageCountRef = useRef(0);
  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const [isVideoActive, setIsVideoActive] = useState(false);

  // Cleanup video stream on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        const gatewayUrl = settings.gatewayUrl || import.meta.env.VITE_GATEWAY_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const gatewayToken = settings.gatewayToken || import.meta.env.VITE_GATEWAY_TOKEN || '';

        const client = new GatewayClient(gatewayUrl, gatewayToken, {
          maxReconnectAttempts: 10,
          reconnectDelay: 2000
        });

        client.onConnect(() => {
          setIsConnected(true);
          setConnectionStatus('connected');
        });

        client.onDisconnect(() => {
          setIsConnected(false);
          setConnectionStatus('reconnecting');
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
          setConnectionStatus('error');
        });

        await client.connect();
        gatewayRef.current = client;
      } catch (err) {
        console.error('Gateway connection failed:', err);
        setConnectionStatus('offline');
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

  // Keyboard shortcuts
  useEffect(() => {
    if (!isBrowser) return;

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendText();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }

      if (e.key === 'Escape') {
        setShowSettings(false);
        setShowHelp(false);
        setShowHealthMonitor(false);
        setShowQuickLinksPanel(false);
        setShowCommandPalette(false);
        setShowFocusTimer(false);
        setShowHabitTracker(false);
        setShowTimeTracker(false);
        setShowMoodTracker(false);
        setShowBreathingExercise(false);
        setShowProductivityAnalytics(false);
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tagName = document.activeElement?.tagName;
        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA' && !showSettings) {
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings]);

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

    // Handle slash commands
    if (userText === '/quotes') {
      setShowDailyQuote(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Daily Quotes panel'
      });
      return;
    }

    if (userText === '/time') {
      setShowTimeTracker(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Time Tracker panel'
      });
      return;
    }

    if (userText === '/mood') {
      setShowMoodTracker(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Mood Tracker panel'
      });
      return;
    }

    if (userText === '/breathe') {
      setShowBreathingExercise(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Breathing Exercise panel'
      });
      return;
    }

    if (userText === '/productivity') {
      setShowProductivityAnalytics(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Productivity Analytics panel'
      });
      return;
    }

    if (userText === '/clear' || userText === '/cls') {
      try {
        await fetch(API.chat.history, { method: 'DELETE' });
        setMessages([{
          id: ++messageCountRef.current,
          type: 'mc',
          text: 'Chat history cleared.'
        }]);
        setIsTyping(false);
        setAvatarState('idle');
        logActivity({
          type: 'command',
          title: 'Command executed',
          description: 'Cleared chat history'
        });
        return;
      } catch (err) {
        console.error('Failed to clear history:', err);
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
  }, [input, isConnected]);

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
        
        // Show error in chat instead of alert
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

  const handleSaveSettings = () => {
    if (isBrowser) {
      window.location.reload();
    }
  };

  const handleCommandPaletteAction = (command) => {
    switch (command.type) {
      case 'input':
        setInput(command.value);
        setTimeout(() => inputRef.current?.focus(), 100);
        break;
      case 'panel':
        switch (command.target) {
          case 'tasks':
            setShowTaskPanel(true);
            break;
          case 'calendar':
            setShowCalendarPanel(true);
            break;
          case 'notes':
            setShowNotesPanel(true);
            break;
          case 'quicklinks':
            setShowQuickLinksPanel(true);
            break;
          case 'health':
            setShowHealthMonitor(true);
            break;
          case 'activity':
            setShowActivityLogPanel(true);
            break;
          case 'focus':
            setShowFocusTimer(true);
            break;
          case 'weather':
            setShowWeatherPanel(true);
            break;
          case 'habits':
            setShowHabitTracker(true);
            break;
          case 'quotes':
            setShowDailyQuote(true);
            break;
          case 'time':
            setShowTimeTracker(true);
            break;
          case 'mood':
            setShowMoodTracker(true);
            break;
          case 'breathing':
            setShowBreathingExercise(true);
            break;
          case 'productivity':
            setShowProductivityAnalytics(true);
            break;
        }
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'help':
        setShowHelp(true);
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

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          connectionStatus={connectionStatus}
        />
      )}

      {showHealthMonitor && (
        <HealthMonitor
          isOpen={showHealthMonitor}
          onClose={() => setShowHealthMonitor(false)}
        />
      )}

      {showTaskPanel && (
        <TaskPanel
          isOpen={showTaskPanel}
          onClose={() => setShowTaskPanel(false)}
        />
      )}

      {showCalendarPanel && (
        <CalendarPanel
          isOpen={showCalendarPanel}
          onClose={() => setShowCalendarPanel(false)}
        />
      )}

      {showNotesPanel && (
        <NotesPanel
          isOpen={showNotesPanel}
          onClose={() => setShowNotesPanel(false)}
        />
      )}

      {showQuickLinksPanel && (
        <QuickLinksPanel
          isOpen={showQuickLinksPanel}
          onClose={() => setShowQuickLinksPanel(false)}
        />
      )}

      {showActivityLogPanel && (
        <ActivityLogPanel
          isOpen={showActivityLogPanel}
          onClose={() => setShowActivityLogPanel(false)}
        />
      )}

      {showFocusTimer && (
        <FocusTimer
          isOpen={showFocusTimer}
          onClose={() => setShowFocusTimer(false)}
        />
      )}

      {showWeatherPanel && (
        <WeatherPanel
          isOpen={showWeatherPanel}
          onClose={() => setShowWeatherPanel(false)}
        />
      )}

      {showHabitTracker && (
        <HabitTracker
          isOpen={showHabitTracker}
          onClose={() => setShowHabitTracker(false)}
        />
      )}

      {showDailyQuote && (
        <DailyQuote
          isOpen={showDailyQuote}
          onClose={() => setShowDailyQuote(false)}
        />
      )}

      {showTimeTracker && (
        <TimeTracker
          isOpen={showTimeTracker}
          onClose={() => setShowTimeTracker(false)}
        />
      )}

      {showMoodTracker && (
        <MoodTracker
          isOpen={showMoodTracker}
          onClose={() => setShowMoodTracker(false)}
        />
      )}

      {showBreathingExercise && (
        <BreathingExercise
          isOpen={showBreathingExercise}
          onClose={() => setShowBreathingExercise(false)}
        />
      )}

      {showProductivityAnalytics && (
        <ProductivityAnalytics
          isOpen={showProductivityAnalytics}
          onClose={() => setShowProductivityAnalytics(false)}
        />
      )}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onCommand={handleCommandPaletteAction}
        inputRef={inputRef}
      />

      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-panel" onClick={e => e.stopPropagation()}>
            <div className="help-header">
              <h3>📖 Keyboard Shortcuts & Commands</h3>
              <button className="help-close" onClick={() => setShowHelp(false)}>×</button>
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
                  <li><strong>/task [title]</strong> – Create task</li>
                  <li><strong>/tasks</strong> – List all tasks</li>
                  <li><strong>/done [id]</strong> – Complete task</li>
                  <li><strong>/event "[title]" [when]</strong> – Create event</li>
                  <li><strong>/events</strong> – Upcoming events</li>
                  <li><strong>/links</strong> – Open Quick Links</li>
                  <li><strong>/activity</strong> – Open Activity Log</li>
                  <li><strong>/focus</strong> – Open Focus Timer</li>
                  <li><strong>/weather</strong> – Open Weather</li>
                  <li><strong>/habits</strong> – Open Habit Tracker</li>
                  <li><strong>/quotes</strong> – Open Daily Quotes</li>
                  <li><strong>/time</strong> – Open Time Tracker</li>
                  <li><strong>/mood</strong> – Open Mood Tracker</li>
                  <li><strong>/breathe</strong> – Open Breathing Exercise</li>
                  <li><strong>/productivity</strong> – Open Productivity Analytics</li>
                  <li><strong>/clear</strong> – Clear chat history</li>
                  <li><strong>/help</strong> – Show this help</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}

      <header className="dashboard-header">
        <h1>Mission Control</h1>
        <p>Command center and ability tabs</p>
      </header>

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

            <div className={`connection-status ${connectionStatus}`}>
              {connectionStatus === 'connected' && <span className="status-indicator">🟢 Live</span>}
              {connectionStatus === 'reconnecting' && <span className="status-indicator">🔄 Reconnecting...</span>}
              {connectionStatus === 'backend-only' && <span className="status-indicator">🟡 API</span>}
              {connectionStatus === 'connecting' && <span className="status-indicator">⏳ Connecting...</span>}
              {connectionStatus === 'unconfigured' && <span className="status-indicator">⚙️ Setup</span>}
              {(connectionStatus === 'error' || connectionStatus === 'offline') && <span className="status-indicator">🔴 Offline</span>}
            </div>

            <button className="icon-btn" onClick={() => setShowCommandPalette(true)} title="Command Palette (⌘K)" aria-label="Open command palette">⌘</button>
            <button className="icon-btn" onClick={() => setShowHelp(true)} title="Help">❓</button>
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
            <button className="icon-btn" onClick={() => setShowHealthMonitor(true)} title="Health Monitor">🏥</button>
            <button className="icon-btn" onClick={() => setShowTaskPanel(true)} title="Tasks">📋</button>
            <button className="icon-btn" onClick={() => setShowCalendarPanel(true)} title="Calendar">📅</button>
            <button className="icon-btn" onClick={() => setShowNotesPanel(true)} title="Notes">📝</button>
            <button className="icon-btn" onClick={() => setShowQuickLinksPanel(true)} title="Quick Links">🔗</button>
            <button className="icon-btn" onClick={() => setShowActivityLogPanel(true)} title="Activity Log">📊</button>
            <button className="icon-btn" onClick={() => setShowFocusTimer(true)} title="Focus Timer">🎯</button>
            <button className="icon-btn" onClick={() => setShowWeatherPanel(true)} title="Weather">🌤️</button>
            <button className="icon-btn" onClick={() => setShowHabitTracker(true)} title="Habit Tracker">🎯</button>
            <button className="icon-btn" onClick={() => setShowDailyQuote(true)} title="Daily Quote">💬</button>
            <button className="icon-btn" onClick={() => setShowTimeTracker(true)} title="Time Tracker">⏱️</button>
            <button className="icon-btn" onClick={() => setShowMoodTracker(true)} title="Mood Tracker">🧠</button>
            <button className="icon-btn" onClick={() => setShowBreathingExercise(true)} title="Breathing Exercise">🫁</button>
            <button className="icon-btn" onClick={() => setShowProductivityAnalytics(true)} title="Productivity Analytics">📈</button>
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

            <div className="messages-container">
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

              <div ref={messagesEndRef} />
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
