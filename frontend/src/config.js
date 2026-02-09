// API Configuration
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  
  tts: {
    synthesize: `${API_BASE}/tts`
  },
  
  health: `${API_BASE}/health`
};

export default API;
