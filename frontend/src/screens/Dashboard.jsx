import React, { useState, useRef, useEffect } from 'react';
import './Dashboard.css';

export default function Dashboard({ mode, avatar }) {
  const [messages, setMessages] = useState([
    { id: 1, type: 'mc', text: 'Ready. What do you need?' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendText = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMsg = {
      id: messages.length + 1,
      type: 'user',
      text: input
    };
    setMessages([...messages, userMsg]);
    setInput('');

    // Simulate MC response (in real app, this hits backend)
    setTimeout(() => {
      const mcResponse = {
        id: messages.length + 2,
        type: 'mc',
        text: 'Processing: ' + input.substring(0, 50) + '...'
      };
      setMessages(prev => [...prev, mcResponse]);
    }, 500);
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
