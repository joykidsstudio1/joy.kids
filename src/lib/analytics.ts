import { getAccessToken } from './auth';

const BASE_URL = 'https://youtubeanalytics.googleapis.com/v2';

async function fetchWithAuth(endpoint: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export async function getBasicAnalytics(startDate: string, endDate: string) {
  const endpoint = `/reports?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=views,subscribersGained,estimatedMinutesWatched,averageViewDuration&dimensions=day`;
  return fetchWithAuth(endpoint);
}
