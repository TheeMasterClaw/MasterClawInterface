import express from 'express';
import { queryChatHistory, clearChatHistory } from '../db.js';
import { processChatMessage } from '../services/chatGateway.js';
import { validateQueryParams, asyncHandler } from '../middleware/security.js';

export const chatRouter = express.Router();

// Query parameter validation schema for chat history
const historyQuerySchema = {
  limit: { type: 'number', min: 1, max: 500 },
  before: { type: 'date' },
};

// Get chat history with validated query params
chatRouter.get('/history', validateQueryParams(historyQuerySchema), asyncHandler(async (req, res) => {
  const { limit = 100, before } = req.sanitizedQuery;
  const messages = queryChatHistory(limit, before);
  res.json({ 
    messages,
    count: messages.length,
    limit
  });
}));

// Clear chat history
chatRouter.delete('/history', asyncHandler(async (req, res) => {
  clearChatHistory();
  res.json({ success: true, message: 'Chat history cleared' });
}));

// Send a chat message
chatRouter.post('/message', asyncHandler(async (req, res) => {
  const { message, saveHistory = true } = req.body;

  // Validate message input
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      error: 'Message is required and must be a non-empty string',
      code: 'INVALID_MESSAGE'
    });
  }

  if (message.length > 10000) {
    return res.status(400).json({
      error: 'Message must not exceed 10000 characters',
      code: 'MESSAGE_TOO_LONG'
    });
  }

  try {
    const data = await processChatMessage({ message: message.trim(), saveHistory });
    return res.json(data);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(error.statusCode || 500).json(error.payload || {
      error: 'Failed to send message to MC',
      text: error.message
    });
  }
}));
