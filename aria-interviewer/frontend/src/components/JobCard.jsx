export default function JobCard({ job, rank }) {
  const scoreColor =
    job.match_score >= 80
      ? "var(--success)"
      : job.match_score >= 60
      ? "var(--accent-primary)"
      : job.match_score >= 40
      ? "var(--warning)"
      : "var(--danger)";

  const verdictColors = {
    "Strong Match": { bg: "var(--success-subtle)", text: "var(--success)" },
    "Good Match": { bg: "var(--accent-subtle)", text: "var(--accent-primary)" },
    "Partial Match": { bg: "var(--warning-subtle)", text: "var(--warning)" },
    "Weak Match": { bg: "var(--danger-subtle)", text: "var(--danger)" },
  };
  const vc = verdictColors[job.verdict] || verdictColors["Partial Match"];

  const sourceColors = {
    Adzuna: "#e94d3a",
    LinkedIn: "#0077b5",
    Indeed: "#2164f3",
    Glassdoor: "#0caa41",
  };
  const sourceColor = sourceColors[job.source] || "var(--text-muted)";

  function formatSalary(min, max) {
    if (!min && !max) return null;
    const fmt = (n) => (n >= 100000 ? `INR ${(n / 100000).toFixed(1)}L` : `INR ${(n / 1000).toFixed(0)}K`);
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    if (max) return `Up to ${fmt(max)}`;
    return null;
  }

  const salary = formatSalary(job.salary_min, job.salary_max);

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 animate-fadeUp"
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
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent-subtle)", color: "var(--accent-primary)" }}
            >
              {rank}
            </span>
            <h3 className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
              {job.title}
            </h3>
          </div>

          <p className="text-sm ml-7" style={{ color: "var(--text-secondary)" }}>
            {job.company}
            {job.location && <span style={{ color: "var(--text-muted)" }}>{" - "}{job.location}</span>}
          </p>
        </div>

        <div className="flex flex-col items-center flex-shrink-0">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg relative"
            style={{
              background: `conic-gradient(${scoreColor} ${job.match_score}%, var(--bg-elevated) 0)`,
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "var(--bg-surface)", color: scoreColor }}
            >
              {job.match_score}
            </div>
          </div>
          <span className="text-xs mt-1 font-medium" style={{ color: scoreColor }}>
            match
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 ml-7">
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: vc.bg, color: vc.text }}>
          {job.verdict}
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: "var(--bg-elevated)",
            color: sourceColor,
            border: "1px solid var(--border-subtle)",
          }}
        >
          {job.source}
        </span>
        {salary && (
          <span
            className="px-2 py-0.5 rounded-full text-xs"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            {salary}
          </span>
        )}
      </div>

      {job.match_reason && (
        <div className="flex items-start gap-2 mb-3 ml-7">
          <span className="text-green-500 flex-shrink-0 text-xs mt-0.5">*</span>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {job.match_reason}
          </p>
        </div>
      )}

      {job.missing_skills?.length > 0 && (
        <div className="flex items-start gap-2 mb-4 ml-7">
          <span className="text-yellow-500 flex-shrink-0 text-xs mt-0.5">!</span>
          <div className="flex flex-wrap gap-1">
            {job.missing_skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-1.5 py-0.5 rounded text-xs"
                style={{
                  background: "var(--warning-subtle)",
                  color: "var(--warning)",
                  border: "1px solid rgba(245,158,11,0.15)",
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {job.apply_url && (
        <a
          href={job.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] ml-0"
          style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}
        >
          Apply Now -&gt;
        </a>
      )}
    </div>
  );
}
