import express from 'express';
import { createMemory } from '../db.js';

export const chatRouter = express.Router();

// Send message to MC (OpenClaw gateway)
chatRouter.post('/message', async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:3000';
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;

    if (!gatewayToken) {
      return res.status(500).json({ 
        error: 'OpenClaw gateway not configured',
        response: 'MC is offline. Configure OPENCLAW_GATEWAY_TOKEN in environment.'
      });
    }

    // Store message in local memory
    createMemory({
      type: 'chat',
      content: message,
      context: { source: 'app', timestamp: new Date().toISOString() }
    });

    // Send to OpenClaw gateway (sessions_send endpoint)
    const response = await fetch(`${gatewayUrl}/sessions/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`
      },
      body: JSON.stringify({
        message: message,
        label: 'MasterClawInterface' // Route to main session
      })
    });

    if (!response.ok) {
      throw new Error(`Gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      status: 'sent',
      message: message,
      response: data.response || 'Message delivered to MC'
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to send message to MC',
      message: error.message
    });
  }
});

// Get chat history
chatRouter.get('/history', (req, res) => {
  // TODO: Retrieve chat history from memories
  res.json({ messages: [] });
});
