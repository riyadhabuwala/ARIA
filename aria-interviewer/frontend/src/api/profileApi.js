import { get, post } from './apiClient.js';

/**
 * Get user profile data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile data
 */
export async function getProfile(userId) {
  return get(`/api/profile/${encodeURIComponent(userId)}`);
}

/**
 * Save user resume and profile data
 * @param {string} userId - User ID
 * @param {string} resumeText - Resume text content
 * @param {Object} profile - Extracted profile data
 * @param {string} resumeFilename - Original resume filename
 * @returns {Promise<Object>} - Save result
 */
export async function saveResumeProfile(userId, resumeText, profile, resumeFilename = "") {
  return post("/api/profile/save-resume", {
    user_id: userId,
    resume_text: resumeText,
    extracted_profile: profile,
    resume_filename: resumeFilename,
  });
}

/**
 * Get or analyze resume quality score
 * @param {string} userId - User ID
 * @param {boolean} forceRefresh - Whether to force refresh the analysis
 * @returns {Promise<Object>} - Resume quality analysis with score and suggestions
 */
export async function getResumeQuality(userId, forceRefresh = false) {
  return post("/api/resume/quality", {
    user_id: userId,
    force_refresh: forceRefresh,
  });
}