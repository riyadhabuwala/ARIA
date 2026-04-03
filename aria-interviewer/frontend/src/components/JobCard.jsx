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

  function formatSalary(min, max) {
    if (!min && !max) return null;
    const fmt = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`);
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    if (max) return `Up to ${fmt(max)}`;
    return null;
  }

  const salary = formatSalary(job.salary_min, job.salary_max);

  return (
    <div className="card-premium relative group p-8 flex flex-col md:flex-row gap-10 overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-primary)]/5 blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Index Badge */}
      <div className="absolute top-0 left-0 px-4 py-1.5 bg-[var(--bg-elevated)] border-b border-r border-[var(--border-subtle)] rounded-br-2xl text-[10px] font-black font-geist uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors">
        #{rank}
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 pt-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span 
              className="px-3 py-1 rounded-full text-[10px] font-black font-geist uppercase tracking-wider border border-transparent shadow-sm"
              style={{ background: vc.bg, color: vc.text, borderColor: `${vc.text}22` }}
            >
              {job.verdict}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-black font-geist uppercase tracking-wider text-[var(--text-muted)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              {job.source}
            </span>
          </div>

          <h3 className="text-3xl font-black font-geist tracking-tighter uppercase leading-tight text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors duration-300">
            {job.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold tracking-tight text-[var(--text-secondary)]">
            <span className="flex items-center gap-2 italic">
              {job.company}
            </span>
            {job.location && (
              <span className="flex items-center gap-2 text-[var(--text-muted)]">
                <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                {job.location}
              </span>
            )}
            {salary && (
              <span className="flex items-center gap-2 text-[var(--accent-primary)]">
                <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                {salary}
              </span>
            )}
          </div>
        </div>

        {/* AI Insight Section */}
        {job.match_reason && (
          <div className="relative p-5 rounded-3xl bg-[var(--bg-base)]/40 border border-[var(--border-subtle)] space-y-2 group/insight">
            <div className="flex items-center gap-2 text-[10px] font-black font-geist uppercase tracking-[0.2em] text-[var(--accent-primary)] opacity-70">
              <span className="animate-pulse">●</span> AI Insight
            </div>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)] font-medium italic">
              "{job.match_reason}"
            </p>
          </div>
        )}

        {/* Missing Skills */}
        {job.missing_skills?.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black font-geist uppercase tracking-widest text-[var(--text-muted)]">Key Focus Areas:</h4>
            <div className="flex flex-wrap gap-2">
              {job.missing_skills.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-tight bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Action Column */}
      <div className="flex flex-col items-center justify-between gap-8 md:w-48 py-4">
        {/* Match Circle */}
        <div className="relative w-28 h-28 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="52"
              stroke="var(--border-subtle)"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="56"
              cy="56"
              r="52"
              stroke={scoreColor}
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - job.match_score / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 0 12px ${scoreColor}88)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-0.5">
            <span className="text-3xl font-black font-geist tracking-tighter text-[var(--text-primary)]">{job.match_score}%</span>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">PROBABILITY</span>
          </div>
        </div>

        {job.apply_url && (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full py-4 text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-3 overflow-hidden group/btn"
          >
            Apply Now
            <svg 
              className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
