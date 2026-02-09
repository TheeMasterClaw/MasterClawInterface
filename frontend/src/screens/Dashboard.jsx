import React, { useState, useRef, useEffect } from 'react';
import API from '../config.js';
import './Dashboard.css';

export default function Dashboard({ mode, avatar }) {
  const [messages, setMessages] = useState([
    { id: 1, type: 'mc', text: 'Ready. What do you need?' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check backend connection on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(API.health);
        if (response.ok) {
          setIsConnected(true);
        }
      } catch (err) {
        console.log('Backend unavailable:', err.message);
        setIsConnected(false);
      }
    };
    checkHealth();
  }, []);

  const handleSendText = async () => {
    if (!input.trim()) return;

    const userText = input;

    // Add user message
    const userMsg = {
      id: messages.length + 1,
      type: 'user',
      text: userText
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // For now, store locally and show confirmation
    // Real-time chat requires WebSocket connection to OpenClaw
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
        const mcResponse = {
          id: userMsg.id + 1,
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
        const mcResponse = {
          id: userMsg.id + 1,
          type: 'mc',
          text: tasks.length === 0 ? 'No tasks yet.' : `📋 Tasks:\n${tasks.map(t => `• ${t.title}`).join('\n')}`
        };
        setMessages(prev => [...prev, mcResponse]);
        return;
      }

      // Default: acknowledge message
      const mcResponse = {
        id: userMsg.id + 1,
        type: 'mc',
        text: `📝 Noted: "${userText}"\n\n(Direct chat with MC coming soon. Use Telegram for now.)`
      };
      setMessages(prev => [...prev, mcResponse]);
    } catch (err) {
      const errorMsg = {
        id: userMsg.id + 1,
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
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢' : '🔴'}
          </span>
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
