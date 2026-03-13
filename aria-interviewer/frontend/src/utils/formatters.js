export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getGradeColor(grade) {
  const colors = {
    Excellent: "var(--success)",
    Good: "var(--accent-primary)",
    Average: "var(--warning)",
    "Needs Improvement": "var(--danger)",
  };
  return colors[grade] || "var(--text-muted)";
}

export function gradeColor(grade) {
  return getGradeColor(grade);
}

export function gradeEmoji(grade) {
  const emojis = {
    Excellent: "🌟",
    Good: "👍",
    Average: "📈",
    "Needs Improvement": "💪",
  };
  return emojis[grade] || "📊";
}

export function getScoreColor(score) {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--accent-primary)";
  if (score >= 40) return "var(--warning)";
  return "var(--danger)";
}
