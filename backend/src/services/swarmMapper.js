/**
 * Swarm Message Mapper
 *
 * Converts Swarm Hub WebSocket message format into the OpenClaw inbound
 * format that chatGateway.js and socket.js expect.  This keeps the bridge
 * decoupled from the rest of the system — only this file knows about the
 * Swarm payload shape.
 */

/**
 * Map a raw Swarm Hub message to an OpenClaw-compatible inbound payload.
 *
 * @param {Object} swarmMsg - Message from Swarm Hub WebSocket
 * @param {string} swarmMsg.id           - Unique message ID
 * @param {string} swarmMsg.channelId    - Swarm channel ID
 * @param {string} swarmMsg.channelName  - Human-readable channel name
 * @param {string} swarmMsg.senderId     - Sender identifier
 * @param {string} swarmMsg.senderName   - Sender display name
 * @param {string} swarmMsg.senderType   - "user" | "agent"
 * @param {string} swarmMsg.text         - Message text
 * @param {number} swarmMsg.timestamp    - Epoch millis
 * @param {string} [swarmMsg.orgId]      - Organisation ID
 * @returns {Object} OpenClaw inbound_meta payload
 */
export function mapSwarmToInbound(swarmMsg) {
    if (!swarmMsg || typeof swarmMsg !== 'object') {
        throw new Error('Invalid Swarm message: expected an object');
    }

    return {
        schema: 'openclaw.inbound_meta.v1',
        channel: 'swarm',
        provider: 'swarm',
        surface: 'swarm',
        chat_type: 'channel',

        // Swarm-specific identifiers (preserved for tracing / dedup)
        swarm_channel_id: swarmMsg.channelId || null,
        swarm_message_id: swarmMsg.id || null,
        swarm_org_id: swarmMsg.orgId || null,

        // Standard fields that agents / chatGateway expect
        sender: {
            id: swarmMsg.senderId || 'unknown',
            name: swarmMsg.senderName || swarmMsg.senderId || 'Unknown',
            type: swarmMsg.senderType || 'user',
        },
        message: {
            text: swarmMsg.text || '',
            timestamp: swarmMsg.timestamp || Date.now(),
        },
        conversation: {
            id: swarmMsg.channelId || null,
            name: swarmMsg.channelName || null,
        },
    };
}

/**
 * Extract the user-facing message text from a mapped inbound payload.
 * Useful when injecting into the chat pipeline.
 *
 * @param {Object} inbound - Result of mapSwarmToInbound()
 * @returns {string}
 */
export function extractMessageText(inbound) {
    return inbound?.message?.text || '';
}
