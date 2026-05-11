import { get } from './apiClient.js';

/**
 * Fetch all dashboard data in a single API call.
 * Replaces 5 separate calls (history, analytics, profile, jobs, resume quality)
 * with one round-trip to the backend.
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Combined dashboard data
 */
export async function getDashboardData(userId) {
  return get(`/api/dashboard/${encodeURIComponent(userId)}`);
}

/**
 * Ping the backend health endpoint to prevent Render cold starts.
 * Called on app mount to wake up the server early.
 */
export async function pingBackend() {
  try {
    await get('/health');
  } catch {
    // Silent fail — this is just a warm-up ping
  }
}
