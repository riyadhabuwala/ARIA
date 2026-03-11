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
    Excellent: "text-green-400",
    Good: "text-blue-400",
    Average: "text-yellow-400",
    "Needs Improvement": "text-red-400",
  };
  return colors[grade] || "text-gray-400";
}

export function getScoreColor(score) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}
