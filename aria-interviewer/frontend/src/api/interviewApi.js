const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function parseResume(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/api/parse-resume`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to parse resume");
  }
  return res.json();
}

export async function startInterview(domain, candidateName, resumeText = "") {
  const res = await fetch(`${BASE_URL}/api/start-interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain,
      candidate_name: candidateName,
      resume_text: resumeText,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to start interview");
  }
  return res.json();
}

export async function sendMessage(sessionId, message) {
  const res = await fetch(`${BASE_URL}/api/send-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to send message");
  }
  return res.json();
}

export async function generateReport(sessionId) {
  const res = await fetch(`${BASE_URL}/api/generate-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to generate report");
  }
  return res.json();
}

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
  const res = await fetch(`${BASE_URL}/api/save-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      domain,
      candidate_name: candidateName,
      report,
      confidence_data: confidenceData,
      confidence_breakdown: confidenceBreakdown,
      duration_seconds: durationSeconds,
      messages,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to save session");
  }
  return res.json();
}

export async function getHistory(userId) {
  const res = await fetch(`${BASE_URL}/api/history/${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch history");
  }
  return res.json();
}

export async function getSession(sessionId) {
  const res = await fetch(`${BASE_URL}/api/session/${encodeURIComponent(sessionId)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch session");
  }
  return res.json();
}

export async function getAnalytics(userId) {
  const res = await fetch(`${BASE_URL}/api/analytics/${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch analytics");
  }
  return res.json();
}
