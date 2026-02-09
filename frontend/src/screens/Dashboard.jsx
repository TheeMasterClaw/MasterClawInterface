import React, { useState, useRef, useEffect } from 'react';
import API from '../config.js';
import GatewayClient from '../lib/gateway.js';
import './Dashboard.css';

export default function Dashboard({ mode, avatar }) {
  const [messages, setMessages] = useState([
    { id: 1, type: 'mc', text: 'Ready. What do you need?' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const messagesEndRef = useRef(null);
  const gatewayRef = useRef(null);
  const messageCountRef = useRef(1);

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
        const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || 'https://tawny-diatropic-rurally.ngrok-free.dev';
        const gatewayToken = import.meta.env.VITE_GATEWAY_TOKEN || '1be194421c99a45e77ef46f58ee88045c51c14fa10554cd8';

        const client = new GatewayClient(gatewayUrl, gatewayToken);

        // Handle connection
        client.onConnect(() => {
          console.log('Gateway connected');
          setIsConnected(true);
          setConnectionStatus('connected');
        });

        // Handle messages from MC
        client.onMessage((data) => {
          const mcResponse = {
            id: ++messageCountRef.current,
            type: 'mc',
            text: data.message || data.response || JSON.stringify(data)
          };
          setMessages(prev => [...prev, mcResponse]);
        });

        // Handle errors
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

        // Fallback: at least use the backend
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

    // Cleanup on unmount
    return () => {
      if (gatewayRef.current) {
        gatewayRef.current.disconnect();
      }
    };
  }, []);

  const handleSendText = async () => {
    if (!input.trim()) return;

    const userText = input;
    messageCountRef.current++;

    // Add user message
    const userMsg = {
      id: messageCountRef.current,
      type: 'user',
      text: userText
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // If connected to gateway, send directly
    if (isConnected && gatewayRef.current) {
      gatewayRef.current.send(userText);
      return;
    }

    // Fallback: local task management
    try {
      // Store task if it looks like one
      if (userText.toLowerCase().startsWith('task:') || userText.toLowerCase().startsWith('add task')) {
        const title = userText.replace(/^(task:|add task)/i, '').trim();
        const response = await fetch(`${API.BASE_URL}/tasks`, {
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
        return;
      }
      
      // List tasks
      if (userText.toLowerCase() === 'tasks' || userText.toLowerCase() === 'list tasks') {
        const response = await fetch(`${API.BASE_URL}/tasks`);
        const tasks = await response.json();
        messageCountRef.current++;
        const mcResponse = {
          id: messageCountRef.current,
          type: 'mc',
          text: tasks.length === 0 ? 'No tasks yet.' : `📋 Tasks:\n${tasks.map(t => `• ${t.title}`).join('\n')}`
        };
        setMessages(prev => [...prev, mcResponse]);
        return;
      }

      // Default: acknowledge message
      messageCountRef.current++;
      const mcResponse = {
        id: messageCountRef.current,
        type: 'mc',
        text: `📝 Message acknowledged. (Awaiting direct connection to MC)`
      };
      setMessages(prev => [...prev, mcResponse]);
    } catch (err) {
      messageCountRef.current++;
      const errorMsg = {
        id: messageCountRef.current,
        type: 'mc',
        text: `Error: ${err.message}`
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleVoiceInput = () => {
    if (!isListening) {
      setIsListening(true);
      // Trigger voice input (browser SpeechRecognition)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(r => r[0].transcript)
            .join('');
          setInput(transcript);
          setIsListening(false);
        };
        recognition.start();
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-sidebar">
        <div className="mc-avatar-sidebar">
          {avatar}
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
        </div>
      </div>

      <div className="dashboard-main">
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
