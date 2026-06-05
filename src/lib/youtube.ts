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

export async function uploadVideo(
  file: File,
  metadata: { title: string; description: string; tags: string[]; privacyStatus: string },
  onProgress: (progress: number) => void
) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  // 1. Initial Request to get resumable upload URI
  const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Length': file.size.toString(),
      'X-Upload-Content-Type': file.type,
    },
    body: JSON.stringify({
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
      },
      status: {
        privacyStatus: metadata.privacyStatus,
        selfDeclaredMadeForKids: true, // Specific for Joy Kids, ensure it's safe! Or let them decide.
      },
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to initialize upload');
  }

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) throw new Error('Upload URL not returned');

  // 2. Upload the file using XMLHttpRequest to track progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress((e.loaded / e.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}
