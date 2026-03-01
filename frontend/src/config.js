// API Configuration for Next.js
const getApiBase = () => {
  // Use NEXT_PUBLIC_API_URL for client-side, fallback to localhost
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // Convert WebSocket URLs to HTTP for fetch requests
  if (url.startsWith('wss://')) {
    return url.replace('wss://', 'https://');
  } else if (url.startsWith('ws://')) {
    return url.replace('ws://', 'http://');
  }
  
  return url;
};

const API_BASE = getApiBase();

export const API = {
  BASE_URL: API_BASE,
  
  chat: {
    message: `${API_BASE}/chat/message`,
    history: `${API_BASE}/chat/history`
  },
  
  tasks: {
    list: `${API_BASE}/tasks`,
    get: (id) => `${API_BASE}/tasks/${id}`,
    create: `${API_BASE}/tasks`,
    update: (id) => `${API_BASE}/tasks/${id}`,
    delete: (id) => `${API_BASE}/tasks/${id}`
  },
  
  calendar: {
    events: `${API_BASE}/calendar/events`,
    upcoming: `${API_BASE}/calendar/upcoming`,
    create: `${API_BASE}/calendar/events`,
    sync: `${API_BASE}/calendar/sync`
  },

  time: {
    list: `${API_BASE}/time`,
    stats: `${API_BASE}/time/stats`,
    running: `${API_BASE}/time/running`,
    start: `${API_BASE}/time`,
    stop: `${API_BASE}/time/stop`,
    get: (id) => `${API_BASE}/time/${id}`,
    update: (id) => `${API_BASE}/time/${id}`,
    delete: (id) => `${API_BASE}/time/${id}`
  },

  tts: {
    synthesize: `${API_BASE}/tts`
  },
  
  health: `${API_BASE}/health`
};

export default API;
