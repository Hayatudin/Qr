/**
 * Central API configuration.
 * In production (Vercel), the API is served from the same domain at /api/*.
 * In development, the PHP backend runs on localhost:8000.
 */

const isDev = import.meta.env.DEV;

// In dev mode, point to PHP server using the current hostname so network peers (like phones) can connect.
export const API_BASE = isDev ? `http://${window.location.hostname}:8000/api` : '/api';

// For uploaded images: in dev they're served from PHP server; in prod they won't exist (images are stored as URLs)
export const UPLOADS_BASE = isDev ? `http://${window.location.hostname}:8000` : '';

/**
 * Build full API url.
 * Usage: apiUrl('/services.php') in dev => http://localhost:8000/api/services.php
 *        apiUrl('/services') in prod => /api/services
 */
export function apiUrl(path: string): string {
  // In production, strip .php extension (Vercel serverless functions don't use .php)
  const cleanPath = isDev ? path : path.replace('.php', '');
  return `${API_BASE}${cleanPath}`;
}

/**
 * Build full URL for uploaded images.
 * Usage: uploadsUrl('uploads/foo.jpg') => http://localhost:8000/uploads/foo.jpg (dev)
 *        uploadsUrl('https://...') => https://... (prod, already full URL)
 */
export function uploadsUrl(path: string): string {
  if (!path) return '/placeholder.svg';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${UPLOADS_BASE}/${path}`;
}
