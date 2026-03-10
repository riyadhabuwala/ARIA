const BASE_URL = "http://localhost:8000";

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
