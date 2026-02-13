import express from 'express';
import { queryChatHistory, clearChatHistory } from '../db.js';
import { processChatMessage } from '../services/chatGateway.js';

export const chatRouter = express.Router();

chatRouter.get('/history', (req, res) => {
  const { limit = 100, before } = req.query;
  const messages = queryChatHistory(parseInt(limit), before);
  res.json({ messages });
});

chatRouter.delete('/history', (req, res) => {
  clearChatHistory();
  res.json({ success: true, message: 'Chat history cleared' });
});

chatRouter.post('/message', async (req, res) => {
  const { message, saveHistory = true } = req.body;

  try {
    const data = await processChatMessage({ message, saveHistory });
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
});
