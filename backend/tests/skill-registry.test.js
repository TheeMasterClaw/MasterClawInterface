import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerSkill,
  listSkills,
  getSkill,
  findSkillByTrigger,
  updateSkill,
  removeSkill,
  removeSkillsBySocket,
  invokeSkill,
  clearSkills,
} from '../src/services/skillRegistry.js';

describe('Skill Registry', () => {
  beforeEach(() => {
    clearSkills();
  });

  describe('registerSkill', () => {
    it('should register a valid skill', () => {
      const skill = registerSkill({
        name: 'Weather',
        description: 'Get weather info',
        trigger: 'weather',
      });

      expect(skill).toBeDefined();
      expect(skill.id).toBeTruthy();
      expect(skill.name).toBe('Weather');
      expect(skill.description).toBe('Get weather info');
      expect(skill.trigger).toBe('weather');
      expect(skill.status).toBe('active');
      expect(skill.registeredAt).toBeTruthy();
    });

    it('should normalize trigger by removing leading slash', () => {
      const skill = registerSkill({
        name: 'Test',
        description: 'Test skill',
        trigger: '/test',
      });

      expect(skill.trigger).toBe('test');
    });

    it('should reject duplicate triggers', () => {
      registerSkill({ name: 'A', description: 'A skill', trigger: 'hello' });
      expect(() =>
        registerSkill({ name: 'B', description: 'B skill', trigger: 'hello' })
      ).toThrow('already registered');
    });

    it('should reject missing name', () => {
      expect(() =>
        registerSkill({ description: 'Test', trigger: 'test' })
      ).toThrow('name is required');
    });

    it('should reject missing description', () => {
      expect(() =>
        registerSkill({ name: 'Test', trigger: 'test' })
      ).toThrow('description is required');
    });

    it('should reject missing trigger', () => {
      expect(() =>
        registerSkill({ name: 'Test', description: 'Test' })
      ).toThrow('trigger is required');
    });

    it('should reject invalid trigger characters', () => {
      expect(() =>
        registerSkill({ name: 'Test', description: 'Test', trigger: 'bad trigger!' })
      ).toThrow('lowercase letters');
    });

    it('should store parameters', () => {
      const skill = registerSkill({
        name: 'Weather',
        description: 'Get weather',
        trigger: 'weather',
        parameters: [{ name: 'city', type: 'string', required: true }],
      });

      expect(skill.parameters).toHaveLength(1);
      expect(skill.parameters[0].name).toBe('city');
    });

    it('should store endpoint URL', () => {
      const skill = registerSkill({
        name: 'Remote',
        description: 'Remote skill',
        trigger: 'remote',
        endpoint: 'https://example.com/skill',
      });

      expect(skill.endpoint).toBe('https://example.com/skill');
    });

    it('should store socketId', () => {
      const skill = registerSkill({
        name: 'Bot',
        description: 'Bot skill',
        trigger: 'bot',
        socketId: 'socket123',
      });

      expect(skill.socketId).toBe('socket123');
    });
  });

  describe('listSkills', () => {
    it('should return all skills', () => {
      registerSkill({ name: 'A', description: 'A', trigger: 'a' });
      registerSkill({ name: 'B', description: 'B', trigger: 'b' });

      const skills = listSkills();
      expect(skills).toHaveLength(2);
    });

    it('should filter by status', () => {
      const skill = registerSkill({ name: 'A', description: 'A', trigger: 'a' });
      registerSkill({ name: 'B', description: 'B', trigger: 'b' });
      updateSkill(skill.id, { status: 'inactive' });

      const active = listSkills({ status: 'active' });
      expect(active).toHaveLength(1);
      expect(active[0].name).toBe('B');
    });

    it('should return empty array when no skills', () => {
      expect(listSkills()).toHaveLength(0);
    });
  });

  describe('getSkill', () => {
    it('should return skill by ID', () => {
      const registered = registerSkill({ name: 'X', description: 'X', trigger: 'x' });
      const skill = getSkill(registered.id);
      expect(skill).toBeDefined();
      expect(skill.name).toBe('X');
    });

    it('should return null for unknown ID', () => {
      expect(getSkill('nonexistent')).toBeNull();
    });
  });

  describe('findSkillByTrigger', () => {
    it('should find skill by trigger', () => {
      registerSkill({ name: 'W', description: 'W', trigger: 'weather' });
      const skill = findSkillByTrigger('weather');
      expect(skill).toBeDefined();
      expect(skill.name).toBe('W');
    });

    it('should normalize trigger with leading slash', () => {
      registerSkill({ name: 'W', description: 'W', trigger: 'weather' });
      const skill = findSkillByTrigger('/weather');
      expect(skill).toBeDefined();
    });

    it('should return null for unknown trigger', () => {
      expect(findSkillByTrigger('nonexistent')).toBeNull();
    });
  });

  describe('updateSkill', () => {
    it('should update skill fields', () => {
      const skill = registerSkill({ name: 'Old', description: 'Old', trigger: 'old' });
      const updated = updateSkill(skill.id, { name: 'New', description: 'New desc' });
      expect(updated.name).toBe('New');
      expect(updated.description).toBe('New desc');
      expect(updated.trigger).toBe('old'); // trigger not updated
    });

    it('should return null for unknown ID', () => {
      expect(updateSkill('nonexistent', { name: 'X' })).toBeNull();
    });
  });

  describe('removeSkill', () => {
    it('should remove skill by ID', () => {
      const skill = registerSkill({ name: 'R', description: 'R', trigger: 'r' });
      expect(removeSkill(skill.id)).toBe(true);
      expect(getSkill(skill.id)).toBeNull();
    });

    it('should return false for unknown ID', () => {
      expect(removeSkill('nonexistent')).toBe(false);
    });
  });

  describe('removeSkillsBySocket', () => {
    it('should remove all skills for a socket', () => {
      registerSkill({ name: 'A', description: 'A', trigger: 'a', socketId: 'sock1' });
      registerSkill({ name: 'B', description: 'B', trigger: 'b', socketId: 'sock1' });
      registerSkill({ name: 'C', description: 'C', trigger: 'c', socketId: 'sock2' });

      const removed = removeSkillsBySocket('sock1');
      expect(removed).toBe(2);
      expect(listSkills()).toHaveLength(1);
      expect(listSkills()[0].name).toBe('C');
    });

    it('should return 0 when no skills match', () => {
      expect(removeSkillsBySocket('unknown')).toBe(0);
    });
  });

  describe('invokeSkill', () => {
    it('should throw for unknown trigger', async () => {
      await expect(invokeSkill('unknown')).rejects.toThrow('No skill found');
    });

    it('should throw for inactive skill', async () => {
      const skill = registerSkill({ name: 'I', description: 'I', trigger: 'inactive', endpoint: 'http://x' });
      updateSkill(skill.id, { status: 'inactive' });
      await expect(invokeSkill('inactive')).rejects.toThrow('currently inactive');
    });

    it('should throw for missing required parameter', async () => {
      registerSkill({
        name: 'P',
        description: 'P',
        trigger: 'param',
        endpoint: 'http://x',
        parameters: [{ name: 'city', required: true }],
      });
      await expect(invokeSkill('param', {})).rejects.toThrow('Missing required parameter: city');
    });

    it('should return socket info for socket-based skill', async () => {
      registerSkill({
        name: 'S',
        description: 'S',
        trigger: 'sockskill',
        socketId: 'bot123',
      });

      const result = await invokeSkill('sockskill', { input: 'hello' });
      expect(result.type).toBe('socket');
      expect(result.socketId).toBe('bot123');
    });

    it('should throw when no endpoint or socket is configured', async () => {
      registerSkill({ name: 'N', description: 'N', trigger: 'nohandler' });
      await expect(invokeSkill('nohandler')).rejects.toThrow('no endpoint or socket handler');
    });
  });
});
