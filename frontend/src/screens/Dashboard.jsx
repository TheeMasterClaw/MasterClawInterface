import React, { useState, useRef, useEffect, useCallback } from 'react';
import API from '../config.js';
import GatewayClient from '../lib/gateway.js';
import Settings from '../components/Settings';
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
  const [alerts, setAlerts] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const messagesEndRef = useRef(null);
  const gatewayRef = useRef(null);
  const messageCountRef = useRef(0);
  const audioRef = useRef(null);
  const inputRef = useRef(null);

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
        const gatewayUrl = settings.gatewayUrl || import.meta.env.VITE_GATEWAY_URL || 'https://tawny-diatropic-rurally.ngrok-free.dev';
        const gatewayToken = settings.gatewayToken || import.meta.env.VITE_GATEWAY_TOKEN;

        if (!gatewayToken) {
          setConnectionStatus('unconfigured');
          return;
        }

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
    if (!isBrowser || mode !== 'context') return;

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
  }, [mode]);

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
      
      if (e.key === 'Escape') {
        setShowSettings(false);
        setShowHelp(false);
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
    if (!isBrowser || !isListening) return;
    
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

  const handleSaveSettings = () => {
    if (isBrowser) {
      window.location.reload();
    }
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
                  <li><strong>⌘/Ctrl + Enter</strong> — Send message</li>
                  <li><strong>⌘/Ctrl + .</strong> — Toggle settings</li>
                  <li><strong>⌘/Ctrl + /</strong> — Show help</li>
                  <li><strong>Escape</strong> — Close modals</li>
                </ul>
              </section>
              <section>
                <h4>Commands</h4>
                <ul>
                  <li><strong>/task <title></strong> — Create task</li>
                  <li><strong>/tasks</strong> — List tasks</li>
                  <li><strong>/done <id></strong> — Complete task</li>
                  <li><strong>/event "<title>" <when></strong> — Create event</li>
                  <li><strong>/events</strong> — Upcoming events</li>
                  <li><strong>/clear</strong> — Clear chat</li>
                  <li><strong>/help</strong> — Show help</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-sidebar">
        <div className="mc-avatar-sidebar">
          {AvatarWithState}
        </div>
        
        <div className="mode-indicator">
          <span className="mode-badge">{mode}</span>
          
          <div className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' && (<><span>🟢</span><small>Live</small></>)}
            {connectionStatus === 'reconnecting' && (<><span>🔄</span><small>Reconnecting...</small></>)}
            {connectionStatus === 'backend-only' && (<><span>🟡</span><small>API</small></>)}
            {connectionStatus === 'connecting' && (<><span>⏳</span><small>Connecting...</small></>)}
            {connectionStatus === 'unconfigured' && (<><span>⚙️</span><small>Setup</small></>)}
            {(connectionStatus === 'error' || connectionStatus === 'offline') && (<><span>🔴</span><small>Offline</small></>)}
          </div>
          
          <button className="icon-btn" onClick={() => setShowHelp(true)} title="Help">❓</button>
          <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
        </div>
      </div>

      <div className="dashboard-main">
        {mode === 'context' && alerts.length > 0 && (
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
          {(mode === 'text' || mode === 'hybrid') && (
            <div className="text-input-group">
              <input
                ref={inputRef}
                type="text"
                className="text-input"
                placeholder="Type /help for commands or just ask..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendText()}
              />
              <button className="send-button" onClick={handleSendText} title="Send">→</button>
            </div>
          )}

          {(mode === 'voice' || mode === 'hybrid') && (
            <button
              className={`voice-button ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceInput}
            >
              {isListening ? '🎤 Listening...' : '🎤 Speak'}
            </button>
          )}

          {mode === 'context' && (
            <div className="context-info">
              <p>👁️ MC is watching your calendar and tasks.</p>
              <p>I'll alert you to what matters.</p>
            </div>
          )}
          
          <div className="input-hints">
            <span>Press <strong>⌘Enter</strong> to send · <strong>/</strong> for commands</span>
          </div>
        </div>
      </div>
    </div>
  );
}
