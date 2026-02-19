import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { authenticateApiToken, asyncHandler } from '../middleware/security.js';
import { timeoutFor } from '../middleware/timeout.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.join(__dirname, '../../data/audio');

// Ensure audio directory exists
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

export const ttsRouter = express.Router();

// GET /tts - Return info about the TTS endpoint
ttsRouter.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'TTS endpoint - use POST to synthesize speech',
    method: 'POST',
    endpoint: '/tts',
    body: {
      text: 'string (required)',
      voice: 'string (optional, default: alloy)',
      provider: 'string (optional, default: openai)'
    },
    validProviders: VALID_PROVIDERS,
    validVoices: VALID_VOICES,
    maxTextLength: MAX_TEXT_LENGTH
  });
});

// GET /tts/health - Check TTS provider configuration
ttsRouter.get('/health', (req, res) => {
  const openaiKey = !!process.env.OPENAI_API_KEY;
  const elevenlabsKey = !!process.env.ELEVENLABS_API_KEY;
  const configuredProvider = openaiKey ? 'openai' : elevenlabsKey ? 'elevenlabs' : null;
  
  res.json({
    ok: openaiKey || elevenlabsKey,
    configured: !!configuredProvider,
    provider: configuredProvider,
    providers: {
      openai: openaiKey,
      elevenlabs: elevenlabsKey
    },
    timestamp: new Date().toISOString()
  });
});

// Valid providers and voices
const VALID_PROVIDERS = ['openai', 'elevenlabs'];
const VALID_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
const MAX_TEXT_LENGTH = 4000;

/**
 * Securely resolve a filename within the audio directory
 * Prevents path traversal attacks by ensuring resolved path stays within audioDir
 * @param {string} filename - The requested filename
 * @returns {string|null} - Safe path or null if invalid
 */
function resolveAudioPath(filename) {
  // Reject any path components (directories)
  if (filename.includes('/') || filename.includes('\\')) {
    return null;
  }

  // Reject hidden files and parent directory references
  if (filename.startsWith('.') || filename.includes('..')) {
    return null;
  }

  // Only allow alphanumeric, hyphens, and single dots (for extensions)
  if (!/^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$/.test(filename)) {
    return null;
  }

  // Resolve and verify the path is within audioDir
  const requestedPath = path.join(audioDir, filename);
  const resolvedPath = path.resolve(requestedPath);
  const resolvedAudioDir = path.resolve(audioDir);

  if (!resolvedPath.startsWith(resolvedAudioDir + path.sep) && resolvedPath !== resolvedAudioDir) {
    return null;
  }

  return resolvedPath;
}

// Text-to-Speech endpoint (protected by API token + extended timeout)
// Supports multiple providers: OpenAI, ElevenLabs, local
ttsRouter.post('/', timeoutFor('tts'), authenticateApiToken, asyncHandler(async (req, res) => {
  const { text, voice = 'alloy', provider = 'openai' } = req.body;

  // Validate required fields
  if (!text) {
    return res.status(400).json({
      error: 'Text is required',
      code: 'MISSING_TEXT'
    });
  }

  // Validate text is a string
  if (typeof text !== 'string') {
    return res.status(400).json({
      error: 'Text must be a string',
      code: 'INVALID_TEXT_TYPE'
    });
  }

  // Validate text length
  if (text.length === 0) {
    return res.status(400).json({
      error: 'Text cannot be empty',
      code: 'EMPTY_TEXT'
    });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      error: `Text too long (max ${MAX_TEXT_LENGTH} characters)`,
      code: 'TEXT_TOO_LONG',
      maxLength: MAX_TEXT_LENGTH,
      receivedLength: text.length
    });
  }

  // Validate provider
  if (!VALID_PROVIDERS.includes(provider)) {
    return res.status(400).json({
      error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
      code: 'INVALID_PROVIDER',
      validProviders: VALID_PROVIDERS
    });
  }

  // Validate voice format (alphanumeric only)
  if (typeof voice !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(voice)) {
    return res.status(400).json({
      error: 'Invalid voice format',
      code: 'INVALID_VOICE_FORMAT'
    });
  }

  let audioUrl = null;
  let audioPath = null;
  let cached = false;

  if (provider === 'openai') {
    audioPath = await synthesizeWithOpenAI(text, voice);
  } else if (provider === 'elevenlabs') {
    audioPath = await synthesizeWithElevenLabs(text, voice);
  }

  if (audioPath) {
    // Generate URL path for the audio file
    const filename = path.basename(audioPath);
    audioUrl = `/tts/audio/${filename}`;
    cached = true;
  }

  res.json({
    success: true,
    audioUrl,
    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    voice,
    provider,
    cached
  });
}));

// Serve audio files with path traversal protection
ttsRouter.get('/audio/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;

  // Resolve path securely
  const filePath = resolveAudioPath(filename);

  if (!filePath) {
    return res.status(400).json({
      error: 'Invalid filename',
      code: 'INVALID_FILENAME'
    });
  }

  // Check file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: 'Audio file not found',
      code: 'FILE_NOT_FOUND'
    });
  }

  // Verify it's a file (not a directory)
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    return res.status(400).json({
      error: 'Invalid file',
      code: 'NOT_A_FILE'
    });
  }

  // Set security headers
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Stream the file
  const stream = fs.createReadStream(filePath);

  stream.on('error', (err) => {
    console.error(`[TTS] Error streaming file ${filename}:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Error reading audio file',
        code: 'STREAM_ERROR'
      });
    }
  });

  stream.pipe(res);
}));

async function synthesizeWithOpenAI(text, voice) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('[TTS] OPENAI_API_KEY not configured. Skipping synthesis.');
    return null; // Return null to indicate no audio generated
  }

  // Validate voice against whitelist
  const selectedVoice = VALID_VOICES.includes(voice) ? voice : 'alloy';

  // Create cache key using SHA-256 for collision resistance
  const cacheKey = crypto.createHash('sha256').update(`${text}:${selectedVoice}:openai`).digest('hex');
  const cachePath = path.join(audioDir, `openai-${cacheKey}.mp3`);

  // Check cache
  if (fs.existsSync(cachePath)) {
    console.log(`[TTS] Cache hit: openai-${cacheKey.substring(0, 16)}...`);
    return cachePath;
  }

  console.log(`[TTS] Synthesizing with OpenAI: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" (voice: ${selectedVoice})`);

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: selectedVoice,
        input: text,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    // Save audio to file atomically
    const tempPath = `${cachePath}.tmp`;
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, cachePath);

    console.log(`[TTS] Saved to: ${cachePath}`);
    return cachePath;
  } catch (error) {
    console.error('[TTS] OpenAI synthesis failed:', error.message);
    throw error;
  }
}

async function synthesizeWithElevenLabs(text, voice) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.warn('[TTS] ELEVENLABS_API_KEY not configured');
    const error = new Error('ElevenLabs API key not configured. Set ELEVENLABS_API_KEY environment variable.');
    error.code = 'TTS_API_KEY_MISSING';
    error.status = 503;
    throw error;
  }

  // Validate voice ID format (alphanumeric with hyphens)
  const voiceId = voice && /^[a-zA-Z0-9-]+$/.test(voice)
    ? voice
    : '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel

  // Create cache key using SHA-256
  const cacheKey = crypto.createHash('sha256').update(`${text}:${voiceId}:elevenlabs`).digest('hex');
  const cachePath = path.join(audioDir, `elevenlabs-${cacheKey}.mp3`);

  // Check cache
  if (fs.existsSync(cachePath)) {
    console.log(`[TTS] Cache hit: elevenlabs-${cacheKey.substring(0, 16)}...`);
    return cachePath;
  }

  console.log(`[TTS] Synthesizing with ElevenLabs: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
    }

    // Save audio to file atomically
    const tempPath = `${cachePath}.tmp`;
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, cachePath);

    console.log(`[TTS] Saved to: ${cachePath}`);
    return cachePath;
  } catch (error) {
    console.error('[TTS] ElevenLabs synthesis failed:', error.message);
    throw error;
  }
}
