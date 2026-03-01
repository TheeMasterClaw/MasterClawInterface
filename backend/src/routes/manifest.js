import express from 'express';
import { listSkills } from '../services/skillRegistry.js';

const router = express.Router();

/**
 * GET /manifest.json
 *
 * Public discovery endpoint for OpenClaw skills and external agents.
 * Agents can fetch this to learn how to connect and what capabilities
 * MasterClawInterface offers.
 */
router.get('/', (req, res) => {
    const activeSkills = listSkills({ status: 'active' });

    res.json({
        name: 'MasterClawInterface',
        version: '0.1.0',
        description: 'MC & Rex — privacy-first personal command interface',
        socket: {
            path: '/socket.io',
            transports: ['websocket', 'polling']
        },
        auth: {
            type: 'socket-handshake',
            description: 'Agents connect via Socket.IO and register skills voluntarily. No tokens required.',
            revocable: true,
            flow: [
                '1. Connect to the Socket.IO server',
                '2. Emit "skill:register" with { name, description, trigger, parameters }',
                '3. Listen for "skill:execute" events to handle invocations',
                '4. Emit "skill:result" with the response'
            ]
        },
        registeredSkills: activeSkills.map(s => ({
            name: s.name,
            trigger: s.trigger,
            description: s.description,
            parameters: s.parameters
        })),
        builtinCommands: [
            '/task', '/tasks', '/done', '/event', '/events',
            '/skills', '/skill', '/clear', '/help'
        ]
    });
});

export default router;
