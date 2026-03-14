export default function ProfileSummary({ profile, lastScanned, onRescan }) {
  if (!profile) return null;

  const topSkills = profile.top_skills || [];
  const locations = profile.preferred_locations || [];

  function timeAgo(isoString) {
    if (!isoString) return "Never";
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div
      className="rounded-2xl p-5 mb-6"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📄</span>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {profile.current_role || "Professional"}
            </span>
            {profile.experience_years > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--accent-subtle)", color: "var(--accent-primary)" }}
              >
                {profile.experience_years} yr{profile.experience_years !== 1 ? "s" : ""}
              </span>
            )}
            {profile.is_fresher && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--success-subtle)", color: "var(--success)" }}
              >
                Fresher
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {topSkills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-md text-xs font-medium"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {skill}
              </span>
            ))}
          </div>

          {locations.length > 0 && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {locations.slice(0, 3).join(" · ")}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {lastScanned && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Last scan: {timeAgo(lastScanned)}
            </p>
          )}
          <button
            onClick={onRescan}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 active:scale-[0.97]"
            style={{
              background: "var(--accent-subtle)",
              border: "1px solid rgba(124,106,255,0.2)",
              color: "var(--accent-primary)",
            }}
          >
            Re-scan
          </button>
        </div>
      </div>
    </div>
  );
}
