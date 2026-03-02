import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mapSwarmToInbound, extractMessageText } from '../src/services/swarmMapper.js';
import { SwarmBridge, destroySwarmBridge } from '../src/services/swarmBridge.js';

// =============================================================================
// Swarm Mapper Tests
// =============================================================================

describe('Swarm Mapper', () => {
    describe('mapSwarmToInbound', () => {
        const validMsg = {
            id: 'msg_abc123',
            channelId: 'ch_xyz',
            channelName: 'general',
            senderId: 'user_42',
            senderName: 'nifty',
            senderType: 'user',
            text: 'Hello from Swarm!',
            timestamp: 1709400000000,
            orgId: 'org_1',
        };

        it('should map all fields correctly', () => {
            const result = mapSwarmToInbound(validMsg);

            expect(result.schema).toBe('openclaw.inbound_meta.v1');
            expect(result.channel).toBe('swarm');
            expect(result.provider).toBe('swarm');
            expect(result.surface).toBe('swarm');

            expect(result.swarm_channel_id).toBe('ch_xyz');
            expect(result.swarm_message_id).toBe('msg_abc123');
            expect(result.swarm_org_id).toBe('org_1');

            expect(result.sender).toEqual({
                id: 'user_42',
                name: 'nifty',
                type: 'user',
            });

            expect(result.message).toEqual({
                text: 'Hello from Swarm!',
                timestamp: 1709400000000,
            });

            expect(result.conversation).toEqual({
                id: 'ch_xyz',
                name: 'general',
            });
        });

        it('should provide defaults for missing optional fields', () => {
            const result = mapSwarmToInbound({ text: 'hi' });

            expect(result.sender.id).toBe('unknown');
            expect(result.sender.name).toBe('Unknown');
            expect(result.sender.type).toBe('user');
            expect(result.swarm_channel_id).toBeNull();
            expect(result.swarm_message_id).toBeNull();
            expect(result.conversation.id).toBeNull();
        });

        it('should throw for null input', () => {
            expect(() => mapSwarmToInbound(null)).toThrow('Invalid Swarm message');
        });

        it('should throw for non-object input', () => {
            expect(() => mapSwarmToInbound('hello')).toThrow('Invalid Swarm message');
        });

        it('should use senderId as name fallback', () => {
            const result = mapSwarmToInbound({ senderId: 'bot_99' });
            expect(result.sender.name).toBe('bot_99');
        });
    });

    describe('extractMessageText', () => {
        it('should extract text from mapped message', () => {
            const inbound = mapSwarmToInbound({ text: 'hello world' });
            expect(extractMessageText(inbound)).toBe('hello world');
        });

        it('should return empty string for null', () => {
            expect(extractMessageText(null)).toBe('');
        });

        it('should return empty string for missing message', () => {
            expect(extractMessageText({})).toBe('');
        });
    });
});

// =============================================================================
// Swarm Bridge Tests
// =============================================================================

describe('SwarmBridge', () => {
    afterEach(() => {
        destroySwarmBridge();
    });

    describe('constructor', () => {
        it('should throw if hubUrl is missing', () => {
            expect(() => new SwarmBridge({ agentId: 'test' })).toThrow('hubUrl is required');
        });

        it('should throw if agentId is missing', () => {
            expect(() => new SwarmBridge({ hubUrl: 'wss://hub.example.com' })).toThrow('agentId is required');
        });

        it('should create instance with valid params', () => {
            const bridge = new SwarmBridge({
                hubUrl: 'wss://hub.example.com',
                agentId: 'agent_1',
            });

            expect(bridge.hubUrl).toBe('wss://hub.example.com');
            expect(bridge.agentId).toBe('agent_1');
            expect(bridge.state).toBe('disconnected');
            expect(bridge.lastTimestamp).toBe(0);
        });

        it('should normalise http:// to ws://', () => {
            const bridge = new SwarmBridge({
                hubUrl: 'http://hub.example.com',
                agentId: 'agent_1',
            });

            expect(bridge.hubUrl).toBe('ws://hub.example.com');
        });

        it('should normalise https:// to wss://', () => {
            const bridge = new SwarmBridge({
                hubUrl: 'https://hub.example.com',
                agentId: 'agent_1',
            });

            expect(bridge.hubUrl).toBe('wss://hub.example.com');
        });
    });

    describe('getState', () => {
        it('should return current state snapshot', () => {
            const bridge = new SwarmBridge({
                hubUrl: 'wss://hub.example.com',
                agentId: 'agent_1',
            });

            const state = bridge.getState();
            expect(state.state).toBe('disconnected');
            expect(state.agentId).toBe('agent_1');
            expect(state.hubUrl).toBe('wss://hub.example.com');
            expect(state.lastTimestamp).toBe(0);
            expect(state.reconnectAttempt).toBe(0);
            expect(state.connected).toBe(false);
            expect(state.hasAuthKey).toBe(false);
        });
    });

    describe('isLive', () => {
        it('should return false when disconnected', () => {
            const bridge = new SwarmBridge({
                hubUrl: 'wss://hub.example.com',
                agentId: 'agent_1',
            });

            expect(bridge.isLive()).toBe(false);
        });
    });

    describe('_calcBackoff', () => {
        it('should increase exponentially', () => {
            const bridge = new SwarmBridge({
                hubUrl: 'wss://hub.example.com',
                agentId: 'agent_1',
                reconnectBaseMs: 1000,
                reconnectMaxMs: 60000,
                reconnectJitter: 0,  // disable jitter for deterministic test
            });

            bridge.reconnectAttempt = 0;
            expect(bridge._calcBackoff()).toBe(1000);

            bridge.reconnectAttempt = 1;
            expect(bridge._calcBackoff()).toBe(2000);

            bridge.reconnectAttempt = 2;
            expect(bridge._calcBackoff()).toBe(4000);
        });

        it('should cap at reconnectMaxMs', () => {
            const bridge = new SwarmBridge({
                hubUrl: 'wss://hub.example.com',
                agentId: 'agent_1',
                reconnectBaseMs: 1000,
                reconnectMaxMs: 10000,
                reconnectJitter: 0,
            });

            bridge.reconnectAttempt = 10;
            expect(bridge._calcBackoff()).toBe(10000);
        });
    });

    describe('disconnect', () => {
        it('should set state to disconnected', () => {
            const bridge = new SwarmBridge({
                hubUrl: 'wss://hub.example.com',
                agentId: 'agent_1',
            });

            bridge.disconnect();
            expect(bridge.state).toBe('disconnected');
        });

        it('should emit disconnected event', () => {
            const bridge = new SwarmBridge({
                hubUrl: 'wss://hub.example.com',
                agentId: 'agent_1',
            });

            let emitted = false;
            bridge.on('disconnected', () => { emitted = true; });
            bridge.disconnect();
            expect(emitted).toBe(true);
        });
    });
});
