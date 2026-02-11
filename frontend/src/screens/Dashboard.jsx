import React, { useState, useRef, useEffect } from 'react';
import API from '../config.js';
import GatewayClient from '../lib/gateway.js';
import Settings from '../components/Settings';
import './Dashboard.css';

export default function Dashboard({ mode, avatar }) {
  const [messages, setMessages] = useState([
    { id: 1, type: 'mc', text: 'Ready. What do you need?' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [avatarState, setAvatarState] = useState('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const messagesEndRef = useRef(null);
  const gatewayRef = useRef(null);
  const messageCountRef = useRef(1);
  const audioRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to OpenClaw gateway on mount
  useEffect(() => {
    const initGateway = async () => {
      try {
        const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
        const gatewayUrl = settings.gatewayUrl || import.meta.env.VITE_GATEWAY_URL || 'https://tawny-diatropic-rurally.ngrok-free.dev';
        const gatewayToken = settings.gatewayToken || import.meta.env.VITE_GATEWAY_TOKEN || '1be194421c99a45e77ef46f58ee88045c51c14fa10554cd8';

        const client = new GatewayClient(gatewayUrl, gatewayToken);

        client.onConnect(() => {
          console.log('Gateway connected');
          setIsConnected(true);
          setConnectionStatus('connected');
        });

        client.onMessage((data) => {
          const mcResponse = {
            id: ++messageCountRef.current,
            type: 'mc',
            text: data.message || data.response || JSON.stringify(data)
          };
          setMessages(prev => [...prev, mcResponse]);
          setAvatarState('idle');
          
          // Auto-play TTS for MC responses
          playTTS(mcResponse.text);
        });

        client.onError((err) => {
          console.error('Gateway error:', err);
          setIsConnected(false);
          setConnectionStatus('error');
        });

        await client.connect();
        gatewayRef.current = client;
      } catch (err) {
        console.error('Failed to connect to gateway:', err);
        setConnectionStatus('offline');
        setIsConnected(false);

        try {
          const response = await fetch(API.health);
          if (response.ok) {
            setConnectionStatus('backend-only');
          }
        } catch (e) {
          console.log('Backend also unavailable');
        }
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
    if (mode !== 'context') return;

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

  const playTTS = async (text) => {
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

  const handleSendText = async () => {
    if (!input.trim()) return;

    const userText = input;
    messageCountRef.current++;

    const userMsg = {
      id: messageCountRef.current,
      type: 'user',
      text: userText
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAvatarState('thinking');

    if (isConnected && gatewayRef.current) {
      gatewayRef.current.send(userText);
      return;
    }

    // Fallback: local task management
    try {
      if (userText.toLowerCase().startsWith('task:') || userText.toLowerCase().startsWith('add task')) {
        const title = userText.replace(/^(task:|add task)/i, '').trim();
        const response = await fetch(API.tasks.create, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, priority: 'normal' })
        });
        const task = await response.json();
        messageCountRef.current++;
        const mcResponse = {
          id: messageCountRef.current,
          type: 'mc',
          text: `✅ Task created: "${task.title}"`
        };
        setMessages(prev => [...prev, mcResponse]);
        setAvatarState('idle');
        playTTS(mcResponse.text);
        return;
      }
      
      if (userText.toLowerCase() === 'tasks' || userText.toLowerCase() === 'list tasks') {
        const response = await fetch(API.tasks.list);
        const tasks = await response.json();
        messageCountRef.current++;
        const mcResponse = {
          id: messageCountRef.current,
          type: 'mc',
          text: tasks.length === 0 ? 'No tasks yet.' : `📋 Tasks:\n${tasks.map(t => `• ${t.title}`).join('\n')}`
        };
        setMessages(prev => [...prev, mcResponse]);
        setAvatarState('idle');
        playTTS(mcResponse.text);
        return;
      }

      messageCountRef.current++;
      const mcResponse = {
        id: messageCountRef.current,
        type: 'mc',
        text: `📝 Message acknowledged. (Gateway connection unavailable - configure in Settings)`
      };
      setMessages(prev => [...prev, mcResponse]);
      setAvatarState('idle');
    } catch (err) {
      messageCountRef.current++;
      const errorMsg = {
        id: messageCountRef.current,
        type: 'mc',
        text: `Error: ${err.message}`
      };
      setMessages(prev => [...prev, errorMsg]);
      setAvatarState('idle');
    }
  };

  const handleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true);
      setAvatarState('listening');
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(r => r[0].transcript)
            .join('');
          setInput(transcript);
          setIsListening(false);
          setAvatarState('idle');
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
    }
  };

  // Clone avatar element and pass state
  const AvatarWithState = React.cloneElement(avatar, { 
    state: avatarState,
    size: 'small'
  });

  return (
    <div className="dashboard">
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)} 
          onSave={() => window.location.reload()}
        />
      )}

      <div className="dashboard-sidebar">
        <div className="mc-avatar-sidebar">
          {AvatarWithState}
        </div>
        
        <div className="mode-indicator">
          <span className="mode-badge">{mode}</span>
          
          <div className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' && (
              <>
                <span>🟢</span>
                <small>Direct</small>
              </>
            )}
            {connectionStatus === 'backend-only' && (
              <>
                <span>🟡</span>
                <small>Backend</small>
              </>
            )}
            {connectionStatus === 'connecting' && (
              <>
                <span>⏳</span>
                <small>Connecting...</small>
              </>
            )}
            {(connectionStatus === 'error' || connectionStatus === 'offline') && (
              <>
                <span>🔴</span>
                <small>Offline</small>
              </>
            )}
          </div>
          
          <button 
            className="settings-btn"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        {/* Proactive alerts for Context mode */}
        {mode === 'context' && alerts.length > 0 && (
          <div className="alerts-container">
            {alerts.map(alert => (
              <div key={alert.id} className="alert-item">
                {alert.message}
              </div>
            ))}
          </div>
        )}

        <div className="messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`message message-${msg.type}`}>
              <div className="message-content">
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          {(mode === 'text' || mode === 'hybrid') && (
            <div className="text-input-group">
              <input
                type="text"
                className="text-input"
                placeholder="What's on your mind?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
              />
              <button className="send-button" onClick={handleSendText}>
                →
              </button>
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
        </div>
      </div>
    </div>
  );
}
