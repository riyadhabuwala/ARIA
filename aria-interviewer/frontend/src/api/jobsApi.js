import { get, post } from './apiClient.js';

/**
 * Scan for job matches based on user profile
 * @param {string} userId - User ID
 * @param {Array} keywords - Job search keywords
 * @param {string} location - Job location preference
 * @returns {Promise<Object>} - Job scan results
 */
export async function scanJobMatches(userId, keywords, location) {
  return post("/api/job-match/scan", {
    user_id: userId,
    keywords,
    location,
  });
}

/**
 * Get saved job match results for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Saved job match data
 */
export async function getJobMatchResults(userId) {
  console.log(`[jobsApi] Fetching job results for user: ${userId}`);
  return get(`/api/job-match/results/${encodeURIComponent(userId)}`);
}