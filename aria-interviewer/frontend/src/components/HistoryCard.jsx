import { formatDate, formatDuration, gradeEmoji } from "../utils/formatters";

const domainColors = {
  "Software Engineering": { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", text: "#3b82f6" },
  "Web Development":      { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", text: "#10b981" },
  "Data Science":         { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#f59e0b" },
  "Artificial Intelligence": { bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)", text: "#8b5cf6" },
  "HR / Behavioral":      { bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.2)", text: "#ec4899" },
};

export default function HistoryCard({ session, onView, index = 0 }) {
  const dc = domainColors[session.domain] || {
    bg: "var(--accent-subtle)", border: "var(--border-default)",
    text: "var(--accent-primary)"
  };
  const score = session.overall_score || 0;
  const scoreColor = score >= 80 ? "var(--success)"
    : score >= 60 ? "var(--accent-primary)"
    : score >= 40 ? "var(--warning)"
    : "var(--danger)";

  return (
    <div
      className={`group rounded-xl p-5 cursor-pointer
                  transition-all duration-200 hover:-translate-y-1
                  animate-fadeUp stagger-${(index % 5) + 1}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.borderColor = "var(--border-default)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <span className="px-2.5 py-1 rounded-md text-xs font-semibold"
              style={{
                background: dc.bg, border: `1px solid ${dc.border}`,
                color: dc.text
              }}>
          {session.domain}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {formatDate(session.created_at)}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-end gap-3 mb-4">
        <span className="text-4xl font-bold heading-font"
              style={{ color: scoreColor }}>
          {score}
        </span>
        <div className="pb-1">
          <span className="text-sm font-semibold"
                style={{ color: scoreColor }}>
            {gradeEmoji(session.grade)} {session.grade}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-1.5 rounded-full mb-4 overflow-hidden"
           style={{ background: "var(--bg-elevated)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}aa)`
          }}
        />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-xs"
              style={{ color: "var(--text-muted)" }}>
          ⏱ {formatDuration(session.duration_seconds)}
        </span>
        {session.confidence_score && (
          <span className="flex items-center gap-1.5 text-xs"
                style={{ color: "var(--text-muted)" }}>
            💪 {session.confidence_score}% confidence
          </span>
        )}
      </div>

      {/* Button */}
      <button
        onClick={onView}
        className="w-full py-2.5 rounded-lg text-sm font-semibold
                   transition-all duration-200 hover:opacity-90
                   active:scale-[0.98]"
        style={{
          background: "var(--accent-subtle)",
          border: "1px solid rgba(124,106,255,0.2)",
          color: "var(--accent-primary)",
        }}>
        View Full Report →
      </button>
    </div>
  );
}
