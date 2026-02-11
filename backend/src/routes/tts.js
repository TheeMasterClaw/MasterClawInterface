import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.join(__dirname, '../../data/audio');

// Ensure audio directory exists
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

export const ttsRouter = express.Router();

// Text-to-Speech endpoint
// Supports multiple providers: OpenAI, ElevenLabs, local
ttsRouter.post('/', async (req, res) => {
  const { text, voice = 'alloy', provider = 'openai' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // Limit text length
  if (text.length > 4000) {
    return res.status(400).json({ error: 'Text too long (max 4000 chars)' });
  }

  try {
    let audioUrl = null;
    let audioPath = null;

    if (provider === 'openai') {
      audioPath = await synthesizeWithOpenAI(text, voice);
    } else if (provider === 'elevenlabs') {
      audioPath = await synthesizeWithElevenLabs(text, voice);
    }

    if (audioPath) {
      // Generate URL path for the audio file
      const filename = path.basename(audioPath);
      audioUrl = `/tts/audio/${filename}`;
    }

    res.json({ 
      audioUrl, 
      text, 
      voice,
      provider,
      cached: audioPath ? true : false 
    });
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'TTS synthesis failed', message: error.message });
  }
});

// Serve audio files
ttsRouter.get('/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  // Sanitize filename to prevent directory traversal
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '');
  const filePath = path.join(audioDir, safeFilename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Audio file not found' });
  }
  
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(filePath).pipe(res);
});

async function synthesizeWithOpenAI(text, voice) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('[TTS] OPENAI_API_KEY not configured');
    return null;
  }

  // Validate voice
  const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  const selectedVoice = validVoices.includes(voice) ? voice : 'alloy';

  // Create cache key based on text + voice
  const cacheKey = crypto.createHash('md5').update(`${text}:${selectedVoice}`).digest('hex');
  const cachePath = path.join(audioDir, `openai-${cacheKey}.mp3`);

  // Check cache
  if (fs.existsSync(cachePath)) {
    console.log(`[TTS] Cache hit: ${cacheKey}`);
    return cachePath;
  }

  console.log(`[TTS] Synthesizing with OpenAI: "${text.substring(0, 50)}..." (voice: ${selectedVoice})`);

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
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    // Save audio to file
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(cachePath, buffer);
    
    console.log(`[TTS] Saved to: ${cachePath}`);
    return cachePath;
  } catch (error) {
    console.error('[TTS] OpenAI synthesis failed:', error.message);
    return null;
  }
}

async function synthesizeWithElevenLabs(text, voice) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.warn('[TTS] ELEVENLABS_API_KEY not configured');
    return null;
  }

  // Default voice ID for ElevenLabs (Rachel)
  const voiceId = voice || '21m00Tcm4TlvDq8ikWAM';

  // Create cache key
  const cacheKey = crypto.createHash('md5').update(`${text}:${voiceId}`).digest('hex');
  const cachePath = path.join(audioDir, `elevenlabs-${cacheKey}.mp3`);

  // Check cache
  if (fs.existsSync(cachePath)) {
    console.log(`[TTS] Cache hit: ${cacheKey}`);
    return cachePath;
  }

  console.log(`[TTS] Synthesizing with ElevenLabs: "${text.substring(0, 50)}..."`);

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
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} ${error}`);
    }

    // Save audio to file
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(cachePath, buffer);
    
    console.log(`[TTS] Saved to: ${cachePath}`);
    return cachePath;
  } catch (error) {
    console.error('[TTS] ElevenLabs synthesis failed:', error.message);
    return null;
  }
}
