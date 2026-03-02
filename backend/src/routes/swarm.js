import express from 'express';
import { asyncHandler } from '../middleware/security.js';
import { getSwarmBridge, initSwarmBridge, destroySwarmBridge } from '../services/swarmBridge.js';

export const swarmRouter = express.Router();

/**
 * GET /swarm/status
 * Returns the current state of the Swarm WebSocket bridge.
 */
swarmRouter.get('/status', asyncHandler(async (req, res) => {
    const bridge = getSwarmBridge();

    if (!bridge) {
        return res.json({
            enabled: false,
            message: 'Swarm bridge not configured. Set SWARM_HUB_URL and SWARM_AGENT_ID env vars.',
        });
    }

    res.json({
        enabled: true,
        ...bridge.getState(),
    });
}));

/**
 * POST /swarm/connect
 * Manually trigger a (re)connect to the Swarm Hub.
 */
swarmRouter.post('/connect', asyncHandler(async (req, res) => {
    let bridge = getSwarmBridge();

    // If not initialised yet, try to init from env
    if (!bridge) {
        bridge = initSwarmBridge();
    }

    if (!bridge) {
        return res.status(400).json({
            error: 'Cannot connect — SWARM_HUB_URL and SWARM_AGENT_ID must be set.',
        });
    }

    const { since = 0 } = req.body || {};

    try {
        await bridge.connect(since);
        res.json({
            ok: true,
            message: 'Connect initiated',
            ...bridge.getState(),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}));

/**
 * POST /swarm/disconnect
 * Gracefully disconnect from the Swarm Hub.
 */
swarmRouter.post('/disconnect', asyncHandler(async (req, res) => {
    const bridge = getSwarmBridge();

    if (!bridge) {
        return res.status(400).json({ error: 'No bridge instance to disconnect.' });
    }

    bridge.disconnect();

    res.json({
        ok: true,
        message: 'Disconnected',
        ...bridge.getState(),
    });
}));
