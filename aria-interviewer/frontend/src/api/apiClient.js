const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Shared API client with common fetch wrapper functionality
 * @param {string} endpoint - The API endpoint (e.g., '/api/users')
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<any>} - Parsed JSON response or ReadableStream for SSE
 */
export async function apiClient(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  // Set up request timeout (default 30s, configurable per-request)
  const timeoutMs = options.timeout || 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    signal: controller.signal,
    ...options
  };

  // Remove Content-Type for FormData (fetch will set it automatically)
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  }

  let response;
  try {
    response = await fetch(url, defaultOptions);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server may be starting up — please try again in a moment.');
    }
    throw err;
  }
  clearTimeout(timeoutId);

  // For Server-Sent Events or streaming responses, return the response directly
  if (options.stream || response.headers.get('content-type')?.includes('text/event-stream')) {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.message || 'Request failed';
      } catch {
        errorMessage = errorText || 'Request failed';
      }
      throw new Error(errorMessage);
    }
    return response;
  }

  // For regular JSON responses
  if (!response.ok) {
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || 'Request failed';
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional fetch options
 */
export const get = (endpoint, options = {}) =>
  apiClient(endpoint, { method: 'GET', ...options });

/**
 * POST request helper
 * @param {string} endpoint - API endpoint
 * @param {any} body - Request body (will be JSON.stringify'd if object)
 * @param {Object} options - Additional fetch options
 */
export const post = (endpoint, body, options = {}) =>
  apiClient(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
    ...options
  });

/**
 * PUT request helper
 * @param {string} endpoint - API endpoint
 * @param {any} body - Request body (will be JSON.stringify'd if object)
 * @param {Object} options - Additional fetch options
 */
export const put = (endpoint, body, options = {}) =>
  apiClient(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options
  });

/**
 * DELETE request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional fetch options
 */
export const del = (endpoint, options = {}) =>
  apiClient(endpoint, { method: 'DELETE', ...options });