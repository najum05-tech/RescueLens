const browserHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE = (import.meta.env.VITE_API_URL || `http://${browserHost}:8000/api`).replace(/\/$/, '');

export const getToken = () => localStorage.getItem('rl.access_token');

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || payload.message || `Request failed (${response.status})`);
  return payload;
}

export const getIncidents = () => api('/incidents');
export const getMyReports = () => api('/reports/mine');
export const getTeams = (params = '') => api(`/teams${params}`);
export const getAnalytics = (params = '') => api(`/analytics${params}`);
export const getGuidance = (params = '') => api(`/guidance${params}`);
export const getDuplicateSuggestions = () => api('/duplicates');
export const decideDuplicate = (id, status) => api(`/duplicates/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const getNotifications = () => api('/notifications?limit=30');
export const markNotificationRead = (id) => api(`/notifications/${id}/read`, { method: 'PATCH' });
export const markAllNotificationsRead = () => api('/notifications/read-all', { method: 'POST' });
