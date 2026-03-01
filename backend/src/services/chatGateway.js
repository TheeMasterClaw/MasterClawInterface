import { createChatMessage } from '../db.js';
import { listSkills, findSkillByTrigger, invokeSkill } from './skillRegistry.js';

/**
 * Chat Gateway — Federated Skill Pattern
 *
 * Instead of connecting outbound to an external OpenClaw gateway with a stored
 * token, we rely on agents that voluntarily connect INBOUND via Socket.IO and
 * register a "chat" skill.  Free-form messages are routed to whichever agent
 * registered that skill; if none is connected the user gets a clear message.
 */

// Reference to the Socket.IO server (set by socket.js at startup)
let ioServer = null;

/**
 * Provide the Socket.IO server instance so we can emit to skill providers.
 * Called once from socket.js after the io server is created.
 */
export function setIOServer(io) {
  ioServer = io;
}

export async function processChatMessage({ message, saveHistory = true }) {
  if (!message || !message.trim()) {
    const err = new Error('Message is required');
    err.statusCode = 400;
    throw err;
  }

  if (saveHistory) {
    createChatMessage({
      type: 'user',
      content: message,
      role: 'user'
    });
  }

  // 1. Try slash commands first
  const commandResult = await handleSlashCommand(message.trim());
  if (commandResult) {
    if (saveHistory) {
      createChatMessage({
        type: 'mc',
        content: commandResult.text,
        role: 'assistant',
        command: commandResult.command
      });
    }
    return commandResult;
  }

  // 2. Look for a registered "chat" skill (an agent that opted in)
  const chatSkill = findSkillByTrigger('chat');

  if (!chatSkill || chatSkill.status !== 'active') {
    const response = {
      error: 'No chat agent connected',
      text: '🔌 No agent is connected. Install an OpenClaw skill that registers a "chat" handler, or connect a bot via Socket.IO.',
      debug: { registeredSkills: listSkills().map(s => s.trigger) }
    };

    if (saveHistory) {
      createChatMessage({
        type: 'mc',
        content: response.text,
        role: 'assistant',
        error: true
      });
    }

    const err = new Error(response.text);
    err.statusCode = 503;
    err.payload = response;
    throw err;
  }

  // 3. Route to the chat skill's socket
  if (chatSkill.socketId && ioServer) {
    const requestId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const response = {
          error: 'Agent timeout',
          text: '⏳ The connected agent took too long to respond. Please try again.',
          debug: { requestId, agent: chatSkill.name }
        };

        if (saveHistory) {
          createChatMessage({
            type: 'mc',
            content: response.text,
            role: 'assistant',
            error: true
          });
        }

        const err = new Error(response.text);
        err.statusCode = 504;
        err.payload = response;
        reject(err);
      }, 30000); // 30 second timeout

      const targetSocket = ioServer.sockets.sockets.get(chatSkill.socketId);
      if (!targetSocket) {
        clearTimeout(timeout);
        const response = {
          error: 'Agent disconnected',
          text: '🔌 The chat agent disconnected. Please wait for it to reconnect.',
          debug: { socketId: chatSkill.socketId }
        };

        if (saveHistory) {
          createChatMessage({
            type: 'mc',
            content: response.text,
            role: 'assistant',
            error: true
          });
        }

        const err = new Error(response.text);
        err.statusCode = 503;
        err.payload = response;
        reject(err);
        return;
      }

      // Listen for the response from the agent
      const responseHandler = (data) => {
        if (data.requestId === requestId) {
          clearTimeout(timeout);
          targetSocket.off('skill:result', responseHandler);

          const responseText = data.result?.text || data.result?.message || data.result || 'Message delivered';

          if (saveHistory) {
            createChatMessage({
              type: 'mc',
              content: typeof responseText === 'string' ? responseText : JSON.stringify(responseText),
              role: 'assistant',
              agentResponse: true
            });
          }

          resolve({
            status: 'sent',
            text: typeof responseText === 'string' ? responseText : JSON.stringify(responseText),
            message,
            agent: chatSkill.name
          });
        }
      };

      targetSocket.on('skill:result', responseHandler);

      // Send the message to the agent
      targetSocket.emit('skill:execute', {
        trigger: 'chat',
        params: { message, requestId },
        requesterId: null, // No specific requester socket — this came from the API/chat
        requestId
      });
    });
  }

  // 4. If the skill has an HTTP endpoint instead
  if (chatSkill.endpoint) {
    try {
      const result = await invokeSkill('chat', { message });
      const responseText = result.result?.text || result.result?.message || JSON.stringify(result.result || {});

      if (saveHistory) {
        createChatMessage({
          type: 'mc',
          content: responseText,
          role: 'assistant',
          agentResponse: true
        });
      }

      return {
        status: 'sent',
        text: responseText,
        message,
        agent: chatSkill.name
      };
    } catch (err) {
      if (saveHistory) {
        createChatMessage({
          type: 'mc',
          content: `Agent error: ${err.message}`,
          role: 'assistant',
          error: true
        });
      }
      throw err;
    }
  }

  // Should not reach here, but just in case
  const err = new Error('Chat skill has no handler configured');
  err.statusCode = 500;
  throw err;
}

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
        const { createTask } = await import('../db.js');
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
      const taskList = tasks.map((t) => {
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
      const { getTask, updateTask, queryTasks } = await import('../db.js');
      if (!args.trim()) {
        return { command, text: '❌ Usage: /done <task-id> or /done <task-name>', type: 'error' };
      }

      let task = getTask(args);
      if (!task) {
        task = queryTasks().find((t) => t.title.toLowerCase().includes(args.toLowerCase()));
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
      if (!args.trim()) {
        return {
          command,
          text: '❌ Usage: /event "Meeting" today 3pm\n/event "Lunch" tomorrow 12:00',
          type: 'error'
        };
      }

      try {
        const parsed = parseEventInput(args);
        const { createEvent } = await import('../db.js');
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

      const eventList = events.slice(0, 10).map((e) => {
        const date = new Date(e.startTime);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `📅 ${dateStr} ${timeStr} — ${e.title}`;
      }).join('\n');

      return {
        command,
        text: `📅 Upcoming events (${events.length}):\n${eventList}`,
        type: 'info',
        data: events
      };
    }

    case 'clear':
    case 'cls': {
      const { clearChatHistory } = await import('../db.js');
      clearChatHistory();
      return { command, text: '🧹 Chat history cleared.', type: 'success' };
    }

    case 'help': {
      return {
        command,
        text: `🤖 Available commands:\n\n/task [title] [priority] - Create task\n/tasks - List tasks\n/done [id] - Complete task\n/event [title] [when] - Create event\n/events - List upcoming events\n/skills - List registered skills\n/skill [trigger] [args] - Invoke a skill\n/clear - Clear chat history\n/help - Show this help`,
        type: 'info'
      };
    }

    case 'skills': {
      const registeredSkills = listSkills({ status: 'active' });
      if (registeredSkills.length === 0) {
        return { command, text: '🧩 No skills registered. Connect a bot to add skills.', type: 'info' };
      }
      const skillList = registeredSkills.map((s) =>
        `🧩 /${s.trigger} — ${s.name}: ${s.description}`
      ).join('\n');
      return {
        command,
        text: `🧩 Registered skills (${registeredSkills.length}):\n${skillList}`,
        type: 'info',
        data: registeredSkills
      };
    }

    case 'skill': {
      if (!args.trim()) {
        return {
          command,
          text: '❌ Usage: /skill <trigger> [arguments]\nExample: /skill weather city=London',
          type: 'error'
        };
      }

      const skillParts = args.split(' ');
      const skillTrigger = skillParts[0];
      const skillArgs = skillParts.slice(1).join(' ');

      const skill = findSkillByTrigger(skillTrigger);
      if (!skill) {
        return {
          command,
          text: `❌ Skill not found: "${skillTrigger}". Use /skills to see available skills.`,
          type: 'error'
        };
      }

      const params = {};
      if (skillArgs) {
        const kvPairs = skillArgs.match(/(\w+)=([^\s]*)/g);
        if (kvPairs) {
          for (const pair of kvPairs) {
            const eqIdx = pair.indexOf('=');
            const key = pair.slice(0, eqIdx);
            let value = pair.slice(eqIdx + 1);
            params[key] = value;
          }
        } else {
          params.input = skillArgs;
        }
      }

      try {
        const result = await invokeSkill(skillTrigger, params);
        const resultText = result.result?.text || result.result?.message || JSON.stringify(result.result || {});
        return {
          command,
          text: `🧩 ${skill.name}: ${resultText}`,
          type: 'success',
          data: result
        };
      } catch (err) {
        return {
          command,
          text: `❌ Skill error: ${err.message}`,
          type: 'error'
        };
      }
    }

    default:
      return {
        command,
        text: `❌ Unknown command: /${command}. Type /help for commands.`,
        type: 'error'
      };
  }
}

function parseEventInput(input) {
  const quotedMatch = input.match(/^"([^"]+)"\s+(.+)$/);
  let title;
  let when;

  if (quotedMatch) {
    title = quotedMatch[1];
    when = quotedMatch[2];
  } else {
    const parts = input.split(' ');
    title = parts.slice(0, -2).join(' ');
    when = parts.slice(-2).join(' ');
  }

  const date = new Date();
  const lowerWhen = when.toLowerCase();

  if (lowerWhen.includes('tomorrow')) {
    date.setDate(date.getDate() + 1);
    const timeMatch = when.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || '0');
      const ampm = timeMatch[3]?.toLowerCase();

      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;

      date.setHours(hours, minutes, 0, 0);
    }
  } else if (lowerWhen.includes('today')) {
    const timeMatch = when.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || '0');
      const ampm = timeMatch[3]?.toLowerCase();

      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;

      date.setHours(hours, minutes, 0, 0);
    }
  } else {
    const parsed = new Date(when);
    if (!isNaN(parsed.getTime())) {
      return {
        title,
        startTime: parsed.toISOString(),
        source: 'manual'
      };
    }
  }

  return {
    title,
    startTime: date.toISOString(),
    source: 'manual'
  };
}

/**
 * Get the status of connected agents and registered skills.
 * Replaces the old gateway status function.
 */
export function getGatewayStatus() {
  const skills = listSkills({ status: 'active' });
  const chatSkill = findSkillByTrigger('chat');

  return {
    connected: !!chatSkill,
    agents: skills.length,
    skills: skills.map(s => ({ name: s.name, trigger: s.trigger, socketId: s.socketId })),
    chatAgent: chatSkill ? { name: chatSkill.name, socketId: chatSkill.socketId } : null
  };
}

/**
 * Force reconnect is no longer applicable in the federated model.
 * Agents connect inbound — we can't force them to reconnect.
 * Returns status information instead.
 */
export function forceReconnect() {
  return getGatewayStatus();
}
