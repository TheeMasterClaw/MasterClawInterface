import express from 'express';
import { createChatMessage, queryChatHistory, clearChatHistory, createTask, createEvent } from '../db.js';

export const chatRouter = express.Router();

// Get chat history
chatRouter.get('/history', (req, res) => {
  const { limit = 100, before } = req.query;
  const messages = queryChatHistory(parseInt(limit), before);
  res.json({ messages });
});

// Clear chat history
chatRouter.delete('/history', (req, res) => {
  clearChatHistory();
  res.json({ success: true, message: 'Chat history cleared' });
});

// Send message to MC (OpenClaw gateway)
chatRouter.post('/message', async (req, res) => {
  const { message, saveHistory = true } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Save user message to history
  if (saveHistory) {
    createChatMessage({
      type: 'user',
      content: message,
      role: 'user'
    });
  }

  // Check for slash commands
  const commandResult = await handleSlashCommand(message.trim());
  if (commandResult) {
    // Save command response to history
    if (saveHistory) {
      createChatMessage({
        type: 'mc',
        content: commandResult.text,
        role: 'assistant',
        command: commandResult.command
      });
    }
    return res.json(commandResult);
  }

  try {
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:3000';
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;

    console.log('Chat request:', { gatewayUrl, hasToken: !!gatewayToken });

    if (!gatewayToken) {
      console.warn('Gateway token not configured');
      const response = {
        error: 'OpenClaw gateway not configured',
        text: 'MC is offline. Configure OPENCLAW_GATEWAY_TOKEN in environment.',
        debug: { gatewayUrl, hasToken: false }
      };
      if (saveHistory) {
        createChatMessage({
          type: 'mc',
          content: response.text,
          role: 'assistant',
          error: true
        });
      }
      return res.status(500).json(response);
    }

    // Send to OpenClaw gateway (sessions_send endpoint)
    console.log(`Sending to gateway: ${gatewayUrl}/v1/sessions/send`);
    
    const response = await fetch(`${gatewayUrl}/v1/sessions/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`
      },
      body: JSON.stringify({
        message: message,
        label: 'MasterClawInterface'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gateway error:', response.status, errorText);
      throw new Error(`Gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Gateway response:', data);
    
    const responseText = data.response || 'Message delivered to MC';
    
    // Save MC response to history
    if (saveHistory) {
      createChatMessage({
        type: 'mc',
        content: responseText,
        role: 'assistant',
        gatewayResponse: true
      });
    }
    
    res.json({
      status: 'sent',
      text: responseText,
      message: message
    });
  } catch (error) {
    console.error('Chat error:', error);
    const errorResponse = {
      error: 'Failed to send message to MC',
      text: `Error: ${error.message}`,
      debug: process.env.NODE_ENV === 'development'
    };
    if (saveHistory) {
      createChatMessage({
        type: 'mc',
        content: errorResponse.text,
        role: 'assistant',
        error: true
      });
    }
    res.status(500).json(errorResponse);
  }
});

// Slash command handler
async function handleSlashCommand(message) {
  if (!message.startsWith('/')) return null;

  const parts = message.slice(1).split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  switch (command) {
    case 'task':
    case 'addtask':
    case 't': {
      if (!args.trim()) {
        return { 
          command,
          text: '❌ Usage: /task Buy groceries | /task "Important task" high',
          type: 'error'
        };
      }
      
      // Parse priority if specified
      let title = args;
      let priority = 'normal';
      
      if (args.toLowerCase().endsWith(' high')) {
        title = args.slice(0, -5).trim();
        priority = 'high';
      } else if (args.toLowerCase().endsWith(' low')) {
        title = args.slice(0, -4).trim();
        priority = 'low';
      }
      
      try {
        const task = createTask({ title, priority });
        return { 
          command,
          text: `✅ Task created: "${task.title}" (${priority})`,
          type: 'success',
          data: task
        };
      } catch (err) {
        return { 
          command,
          text: `❌ Failed to create task: ${err.message}`,
          type: 'error'
        };
      }
    }

    case 'tasks':
    case 'list': {
      const { queryTasks } = await import('../db.js');
      const tasks = queryTasks();
      if (tasks.length === 0) {
        return { command, text: '📋 No tasks yet.', type: 'info' };
      }
      const taskList = tasks.map(t => {
        const status = t.status === 'done' ? '✅' : t.status === 'in_progress' ? '⏳' : '⭕';
        const priority = t.priority === 'high' ? '🔴' : t.priority === 'low' ? '🔵' : '⚪';
        return `${status} ${priority} ${t.title}`;
      }).join('\n');
      return { 
        command, 
        text: `📋 Tasks (${tasks.length}):\n${taskList}`,
        type: 'info',
        data: tasks
      };
    }

    case 'done':
    case 'complete': {
      const { getTask, updateTask } = await import('../db.js');
      if (!args.trim()) {
        return { command, text: '❌ Usage: /done <task-id> or /done <task-name>', type: 'error' };
      }
      
      let task = getTask(args);
      if (!task) {
        // Try to find by title
        const { queryTasks } = await import('../db.js');
        const tasks = queryTasks();
        task = tasks.find(t => t.title.toLowerCase().includes(args.toLowerCase()));
      }
      
      if (!task) {
        return { command, text: `❌ Task not found: "${args}"`, type: 'error' };
      }
      
      updateTask(task.id, { status: 'done' });
      return { 
        command, 
        text: `✅ Marked as done: "${task.title}"`,
        type: 'success'
      };
    }

    case 'event':
    case 'calendar':
    case 'cal': {
      // Format: /event "Meeting title" today 3pm or /event Title 2024-02-15 15:00
      if (!args.trim()) {
        return { 
          command, 
          text: '❌ Usage: /event "Meeting" today 3pm\n/event "Lunch" tomorrow 12:00\n/event "Call" 2024-02-15 15:00',
          type: 'error'
        };
      }
      
      try {
        const parsed = parseEventInput(args);
        const event = createEvent(parsed);
        return { 
          command,
          text: `📅 Event created: "${event.title}" on ${new Date(event.startTime).toLocaleString()}`,
          type: 'success',
          data: event
        };
      } catch (err) {
        return { 
          command,
          text: `❌ Failed to create event: ${err.message}`,
          type: 'error'
        };
      }
    }

    case 'events':
    case 'upcoming': {
      const { queryEvents } = await import('../db.js');
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const events = queryEvents({ after: now.toISOString(), before: nextWeek.toISOString() });
      
      if (events.length === 0) {
        return { command, text: '📅 No upcoming events.', type: 'info' };
      }
      
      const eventList = events.slice(0, 10).map(e => {
        const date = new Date(e.startTime);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `📅 ${dateStr} ${timeStr} — ${e.title}`;
      }).join('\n');
      
      return { 
        command, 
        text: `📅 Upcoming events:\n${eventList}`,
        type: 'info',
        data: events
      };
    }

    case 'clear':
    case 'cls': {
      return { command, text: 'CLEAR_HISTORY', type: 'action' };
    }

    case 'help':
    case 'h':
    case '?': {
      return {
        command,
        text: `📖 **Available Commands:**

**Tasks:**
/task <title> [high|low] - Create a task
/tasks - List all tasks
/done <id or title> - Mark task complete

**Calendar:**
/event "<title>" <when> - Create event
/events - Upcoming events

**General:**
/clear - Clear chat history
/help - Show this help

**Keyboard Shortcuts:**
⌘/Ctrl + Enter - Send message
⌘/Ctrl + K - Focus search
⌘/Ctrl + . - Toggle settings
Escape - Close modals`,
        type: 'info'
      };
    }

    default:
      return { 
        command, 
        text: `❓ Unknown command: /${command}\nType /help for available commands.`,
        type: 'error'
      };
  }
}

// Parse natural language event input
function parseEventInput(input) {
  // Try to extract title in quotes
  let title = input;
  let rest = '';
  
  const quoteMatch = input.match(/^"([^"]+)"\s*(.*)$/);
  if (quoteMatch) {
    title = quoteMatch[1];
    rest = quoteMatch[2];
  } else {
    // Try to find where the date starts
    const dateKeywords = ['today', 'tomorrow', 'next', 'at', 'on'];
    const lowerInput = input.toLowerCase();
    
    for (const keyword of dateKeywords) {
      const idx = lowerInput.indexOf(` ${keyword} `);
      if (idx !== -1) {
        title = input.slice(0, idx).trim();
        rest = input.slice(idx + 1).trim();
        break;
      }
    }
  }
  
  if (!title) throw new Error('Event title required');
  
  // Parse date/time from rest
  const now = new Date();
  let startTime = new Date();
  let endTime = new Date();
  
  const lowerRest = rest.toLowerCase();
  
  // Handle relative dates
  if (lowerRest.includes('today')) {
    startTime = new Date();
  } else if (lowerRest.includes('tomorrow')) {
    startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else if (lowerRest.includes('next week')) {
    startTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  
  // Try to extract time (simple patterns)
  const timeMatch = rest.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const ampm = timeMatch[3]?.toLowerCase();
    
    if (ampm === 'pm' && hours !== 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    
    startTime.setHours(hours, minutes, 0, 0);
  } else {
    // Default to next hour
    startTime.setHours(startTime.getHours() + 1, 0, 0, 0);
  }
  
  // Default duration: 1 hour
  endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  
  return {
    title,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    description: null,
    location: null
  };
}
