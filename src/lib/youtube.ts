import { getAccessToken } from './auth';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  // Add API Key if needed, but OAuth token should be enough for these scopes
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export async function getMyChannel() {
  const data = await fetchWithAuth('/channels?part=snippet,contentDetails,statistics&mine=true');
  return data.items?.[0] || null;
}

export async function getChannelVideos(playlistId: string, maxResults = 50) {
  const data = await fetchWithAuth(`/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${maxResults}`);
  return data.items || [];
}

export async function getVideoStats(videoIds: string[]) {
  const ids = videoIds.join(',');
  const data = await fetchWithAuth(`/videos?part=snippet,statistics&id=${ids}`);
  return data.items || [];
}
