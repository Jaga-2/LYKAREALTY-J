const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const isLocalBrowser = typeof window !== 'undefined'
  && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

// In local development, never send frontend requests to the production backend.
// This keeps auth, properties, CRM, and the assistant on the local Express server.
export const API_BASE_URL = isLocalBrowser
  ? ''
  : (configuredApiUrl || 'https://newlyka.onrender.com');

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}
