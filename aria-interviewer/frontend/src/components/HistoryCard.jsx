export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

const DOMAIN_COLORS = {
  "Software Engineering": "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "Web Development": "bg-green-500/10 text-green-400 border-green-500/30",
  "Data Science": "bg-purple-500/10 text-purple-400 border-purple-500/30",
  "Artificial Intelligence": "bg-pink-500/10 text-pink-400 border-pink-500/30",
  "HR / Behavioral": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
};

const GRADE_COLORS = {
  Excellent: "text-green-400",
  Good: "text-blue-400",
  Average: "text-yellow-400",
  "Needs Improvement": "text-red-400",
};

export default function HistoryCard({ session, onView }) {
  const date = session.created_at
    ? new Date(session.created_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric"
      })
    : "—";

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
      {/* Domain badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            DOMAIN_COLORS[session.domain] || "bg-gray-700 text-gray-300 border-gray-600"
          }`}
        >
          {session.domain}
        </span>
        <span className="text-xs text-gray-500">{date}</span>
      </div>

      {/* Score and grade */}
      <div className="flex items-end gap-3 mb-3">
        <span className="text-4xl font-bold text-white">
          {session.overall_score ?? "—"}
        </span>
        <span className={`text-sm font-medium pb-1 ${GRADE_COLORS[session.grade] || "text-gray-400"}`}>
          {session.grade || "—"}
        </span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
        <span>⏱ {formatDuration(session.duration_seconds)}</span>
        {session.confidence_score != null && (
          <span>🎯 Confidence: {session.confidence_score}%</span>
        )}
      </div>

      {/* View button */}
      <button
        onClick={() => onView && onView(session)}
        className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-lg transition"
      >
        View Report
      </button>
    </div>
  );
}
