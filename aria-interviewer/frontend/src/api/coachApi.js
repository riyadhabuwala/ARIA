import { apiClient } from './apiClient.js';

/**
 * Send message to AI coach with streaming response
 * @param {string} userId - User ID
 * @param {string} message - User message
 * @param {Array} conversationHistory - Previous messages for context
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<ReadableStream>} - Streaming response
 */
export async function sendChatMessage(userId, message, conversationHistory = [], signal = null) {
  return apiClient("/api/chat", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      message,
      conversation_history: conversationHistory,
    }),
    signal,
    stream: true,
  });
}

/**
 * Trigger interview debrief with streaming response
 * @param {string} userId - User ID
 * @param {Object} report - Interview report data
 * @param {Object} confidenceData - Confidence analysis data
 * @param {number} previousScore - Previous interview score for comparison
 * @returns {Promise<Object>} - Debrief response (non-streaming for now)
 */
export async function triggerDebrief(userId, report, confidenceData, previousScore = 0) {
  // Note: This endpoint returns JSON, not streaming
  return apiClient("/api/chat/debrief", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      report,
      confidence_data: confidenceData,
      previous_score: previousScore,
    }),
  });
}