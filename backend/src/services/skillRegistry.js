import { genId } from '../db.js';

/**
 * In-memory skill registry for MasterClaw bot skills.
 * Skills are capabilities that the claw bot registers with the interface,
 * allowing the interface to discover and invoke them.
 *
 * A skill has:
 *  - id: unique identifier
 *  - name: human-readable name (unique)
 *  - description: what the skill does
 *  - trigger: slash command or keyword to invoke it (e.g. "weather")
 *  - parameters: array of { name, type, required, description } for invocation
 *  - handler: optional local function (for built-in skills)
 *  - endpoint: optional remote URL to POST to when invoking (for remote skills)
 *  - socketId: optional Socket.IO id of the connected bot that registered it
 *  - status: 'active' | 'inactive'
 *  - registeredAt: ISO timestamp
 */

const skills = new Map();

/**
 * Normalize a trigger string: strip leading slash, lowercase, trim.
 * @param {string} trigger
 * @returns {string}
 */
function normalizeTrigger(trigger) {
  return trigger.replace(/^\//, '').toLowerCase().trim();
}

/**
 * Register a new skill.
 * @param {Object} opts
 * @param {string} opts.name - Unique skill name
 * @param {string} opts.description - What the skill does
 * @param {string} opts.trigger - Slash-command trigger word (no leading slash)
 * @param {Array}  [opts.parameters] - Parameter definitions
 * @param {string} [opts.endpoint] - Remote URL for invocation
 * @param {string} [opts.socketId] - Socket.IO id of registering client
 * @returns {Object} The registered skill
 */
export function registerSkill({ name, description, trigger, parameters = [], endpoint, socketId }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Skill name is required'), { statusCode: 400 });
  }
  if (!description || typeof description !== 'string' || !description.trim()) {
    throw Object.assign(new Error('Skill description is required'), { statusCode: 400 });
  }
  if (!trigger || typeof trigger !== 'string' || !trigger.trim()) {
    throw Object.assign(new Error('Skill trigger is required'), { statusCode: 400 });
  }

  // Normalize trigger — strip leading slash if provided
  const normalizedTrigger = normalizeTrigger(trigger);

  if (!/^[a-z0-9_-]+$/.test(normalizedTrigger)) {
    throw Object.assign(
      new Error('Trigger must contain only lowercase letters, numbers, hyphens, and underscores'),
      { statusCode: 400 }
    );
  }

  // Check for duplicate trigger
  for (const skill of skills.values()) {
    if (skill.trigger === normalizedTrigger) {
      throw Object.assign(
        new Error(`A skill with trigger "${normalizedTrigger}" is already registered`),
        { statusCode: 409 }
      );
    }
  }

  const skill = {
    id: genId(),
    name: name.trim(),
    description: description.trim(),
    trigger: normalizedTrigger,
    parameters: Array.isArray(parameters) ? parameters : [],
    endpoint: endpoint || null,
    socketId: socketId || null,
    status: 'active',
    registeredAt: new Date().toISOString(),
  };

  skills.set(skill.id, skill);
  return skill;
}

/**
 * List all registered skills.
 * @param {Object} [filter]
 * @param {string} [filter.status] - Filter by status
 * @returns {Array} List of skills
 */
export function listSkills(filter = {}) {
  let result = Array.from(skills.values());
  if (filter.status) {
    result = result.filter((s) => s.status === filter.status);
  }
  return result;
}

/**
 * Get a single skill by ID.
 * @param {string} id
 * @returns {Object|null}
 */
export function getSkill(id) {
  return skills.get(id) || null;
}

/**
 * Find a skill by its trigger word.
 * @param {string} trigger
 * @returns {Object|null}
 */
export function findSkillByTrigger(trigger) {
  const normalized = normalizeTrigger(trigger);
  for (const skill of skills.values()) {
    if (skill.trigger === normalized) {
      return skill;
    }
  }
  return null;
}

/**
 * Update a skill by ID.
 * @param {string} id
 * @param {Object} updates
 * @returns {Object|null} Updated skill or null if not found
 */
export function updateSkill(id, updates) {
  const skill = skills.get(id);
  if (!skill) return null;

  const allowed = ['name', 'description', 'parameters', 'endpoint', 'status'];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      skill[key] = updates[key];
    }
  }
  return skill;
}

/**
 * Remove a skill by ID.
 * @param {string} id
 * @returns {boolean} True if removed
 */
export function removeSkill(id) {
  return skills.delete(id);
}

/**
 * Remove all skills registered by a specific socket.
 * Used to clean up when a bot disconnects.
 * @param {string} socketId
 * @returns {number} Number of skills removed
 */
export function removeSkillsBySocket(socketId) {
  let count = 0;
  for (const [id, skill] of skills.entries()) {
    if (skill.socketId === socketId) {
      skills.delete(id);
      count++;
    }
  }
  return count;
}

/**
 * Invoke a skill by trigger word.
 * For socket-based skills, returns skill info so the caller can emit to the right socket.
 * For endpoint-based skills, makes an HTTP POST to the skill's endpoint.
 *
 * @param {string} trigger - The trigger word
 * @param {Object} [params] - Parameters to pass
 * @returns {Promise<Object>} Invocation result
 */
export async function invokeSkill(trigger, params = {}) {
  const skill = findSkillByTrigger(trigger);
  if (!skill) {
    throw Object.assign(new Error(`No skill found for trigger: ${trigger}`), { statusCode: 404 });
  }

  if (skill.status !== 'active') {
    throw Object.assign(new Error(`Skill "${skill.name}" is currently inactive`), { statusCode: 503 });
  }

  // Validate required parameters
  for (const param of skill.parameters) {
    if (param.required && (params[param.name] === undefined || params[param.name] === '')) {
      throw Object.assign(
        new Error(`Missing required parameter: ${param.name}`),
        { statusCode: 400 }
      );
    }
  }

  // If the skill has a remote endpoint, POST to it
  if (skill.endpoint) {
    const response = await fetch(skill.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill: skill.trigger, params }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw Object.assign(
        new Error(`Skill endpoint error: ${response.status} ${text}`),
        { statusCode: 502 }
      );
    }

    const data = await response.json();
    return {
      skill: skill.trigger,
      name: skill.name,
      result: data,
    };
  }

  // For socket-based skills, return the skill info and let the caller handle the socket emit
  if (skill.socketId) {
    return {
      skill: skill.trigger,
      name: skill.name,
      socketId: skill.socketId,
      params,
      type: 'socket',
    };
  }

  // No handler available
  throw Object.assign(
    new Error(`Skill "${skill.name}" has no endpoint or socket handler configured`),
    { statusCode: 500 }
  );
}

/**
 * Clear all skills. Useful for testing.
 */
export function clearSkills() {
  skills.clear();
}
