import { formatDate, formatDuration, gradeEmoji } from "../utils/formatters";

const DOMAIN_STYLES = {
  "Software Engineering": {
    color: "#2563eb",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.2)",
  },
  "Web Development": {
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
  },
  "Data Science": {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
  },
  "Artificial Intelligence": {
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
  },
  "HR / Behavioral": {
    color: "#ec4899",
    bg: "rgba(236,72,153,0.08)",
    border: "rgba(236,72,153,0.2)",
  },
};

const DEFAULT_DOMAIN = {
  color: "#2563eb",
  bg: "rgba(37,99,235,0.08)",
  border: "rgba(37,99,235,0.2)",
};

export default function HistoryCard({ session, onView, index = 0 }) {
  const ds = DOMAIN_STYLES[session.domain] || DEFAULT_DOMAIN;
  const score = session.overall_score || 0;

  // Graduated colors — never alarming red for scores
  const scoreColor =
    score >= 80
      ? "#22c55e"
      : score >= 60
        ? "#2563eb"
        : score >= 40
          ? "#f59e0b"
          : "#94a3b8"; // muted gray for low scores

  return (
    <div
      className={`group dash-history-shell animate-fadeUp stagger-${(index % 5) + 1}`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="px-2.5 py-1 rounded-lg text-xs font-semibold"
          style={{
            background: ds.bg,
            border: `1px solid ${ds.border}`,
            color: ds.color,
          }}
        >
          {session.domain}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {formatDate(session.created_at)}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-end gap-3 mb-1">
        <span
          className="font-geist text-4xl font-bold"
          style={{ color: scoreColor, letterSpacing: "-0.03em" }}
        >
          {score}
        </span>
        <div className="pb-1">
          <span className="text-sm font-semibold" style={{ color: scoreColor }}>
            {gradeEmoji(session.grade)} {session.grade}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div
        className="h-1 rounded-full mb-4 overflow-hidden"
        style={{ background: "var(--bg-elevated)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}88)`,
          }}
        />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          ⏱ {formatDuration(session.duration_seconds)}
        </span>
        {session.confidence_score && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            💪 {session.confidence_score}% conf
          </span>
        )}
      </div>

      {/* CTA button */}
      <button onClick={onView} className="dash-cta">
        View Report →
      </button>
    </div>
  );
}
