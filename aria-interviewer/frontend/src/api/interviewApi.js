import { post, get, apiClient } from './apiClient.js';

/**
 * Parse resume file to extract profile data
 * @param {File} file - Resume file to parse
 * @returns {Promise<Object>} - Parsed resume data
 */
export async function parseResume(file) {
  const formData = new FormData();
  formData.append("file", file);
  return post("/api/parse-resume", formData);
}

/**
 * Start a new interview session
 * @param {string} domain - Interview domain
 * @param {string} candidateName - Name of the candidate
 * @param {string} resumeText - Resume text content (optional)
 * @returns {Promise<Object>} - Interview session data
 */
export async function startInterview(domain, candidateName, resumeText = "") {
  return post("/api/start-interview", {
    domain,
    candidate_name: candidateName,
    resume_text: resumeText,
  });
}

/**
 * Send message during interview
 * @param {string} sessionId - Interview session ID
 * @param {string} message - User message
 * @returns {Promise<Object>} - Response data
 */
export async function sendMessage(sessionId, message) {
  return post("/api/send-message", {
    session_id: sessionId,
    message,
  });
}

/**
 * Generate interview report
 * @param {string} sessionId - Interview session ID
 * @returns {Promise<Object>} - Generated report
 */
export async function generateReport(sessionId) {
  return post("/api/generate-report", {
    session_id: sessionId,
  });
}

/**
 * Save completed interview session
 * @param {Object} params - Session save parameters
 * @param {string} params.userId - User ID
 * @param {string} params.domain - Interview domain
 * @param {string} params.candidateName - Candidate name
 * @param {Object} params.report - Interview report
 * @param {Object} params.confidenceData - Confidence analysis data
 * @param {Object} params.confidenceBreakdown - Detailed confidence breakdown
 * @param {number} params.durationSeconds - Interview duration
 * @param {Array} params.messages - Interview messages
 * @returns {Promise<Object>} - Saved session data
 */
export async function saveSession({
  userId,
  domain,
  candidateName,
  report,
  confidenceData,
  confidenceBreakdown = {},
  durationSeconds,
  messages,
}) {
  return post("/api/save-session", {
    user_id: userId,
    domain,
    candidate_name: candidateName,
    report,
    confidence_data: confidenceData,
    confidence_breakdown: confidenceBreakdown,
    duration_seconds: durationSeconds,
    messages,
  });
}

/**
 * Get user's interview history
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User interview history
 */
export async function getHistory(userId) {
  return get(`/api/history/${encodeURIComponent(userId)}`);
}

/**
 * Get single interview session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} - Interview session data
 */
export async function getSession(sessionId) {
  return get(`/api/session/${encodeURIComponent(sessionId)}`);
}

/**
 * Analyze confidence from user answers
 * @param {Array} answers - User answers to analyze
 * @returns {Promise<Object>} - Confidence analysis results
 */
export async function analyzeConfidence(answers) {
  return post("/api/analyze-confidence", { answers });
}

/**
 * Convert text to speech
 * @param {string} text - Text to convert to speech
 * @returns {Promise<Blob>} - Audio blob for playback
 */
export async function textToSpeech(text) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const response = await fetch(`${BASE_URL}/api/text-to-speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("TTS request failed");
  }

  return response.blob();
}
