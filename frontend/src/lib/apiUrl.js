// API URL utility - handles both Vite env vars and WebSocket URL conversion
export function getApiUrl() {
  // Try Vite env vars first, then fall back to localhost
  let url = process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
    'http://localhost:3001';

  // Convert WebSocket URLs to HTTP for fetch requests
  if (url.startsWith('wss://')) {
    url = url.replace('wss://', 'https://');
  } else if (url.startsWith('ws://')) {
    url = url.replace('ws://', 'http://');
  }

  return url;
}

export function getWsUrl() {
  // For WebSocket connections, ensure we have wss:// or ws://
  let url = process.env.NEXT_PUBLIC_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'ws://localhost:3001';

  // If it's http/https, convert to ws/wss
  if (url.startsWith('https://')) {
    url = url.replace('https://', 'wss://');
  } else if (url.startsWith('http://')) {
    url = url.replace('http://', 'ws://');
  }

  return url;
}

export default { getApiUrl, getWsUrl };
