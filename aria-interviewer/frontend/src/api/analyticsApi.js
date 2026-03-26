import { get } from './apiClient.js';

/**
 * Get user analytics data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Analytics data with scores, trends, and stats
 */
export async function getAnalytics(userId) {
  return get(`/api/analytics/${encodeURIComponent(userId)}`);
}

/**
 * Get user interview streak data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Streak data with current streak, longest streak, etc.
 */
export async function getStreakData(userId) {
  return get(`/api/streak/${encodeURIComponent(userId)}`);
}