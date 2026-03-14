import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const SECTION_CONFIG = {
  contact_info: { label: "Contact Information", icon: "📇" },
  professional_summary: { label: "Professional Summary", icon: "📝" },
  work_experience: { label: "Work Experience", icon: "💼" },
  education: { label: "Education", icon: "🎓" },
  skills: { label: "Skills Section", icon: "⚙️" },
  projects: { label: "Projects", icon: "🚀" },
  achievements: { label: "Achievements", icon: "🏆" },
  certifications: { label: "Certifications", icon: "📜" },
};

function ScoreCircle({ score }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? "var(--success)"
      : score >= 60
        ? "var(--accent-primary)"
        : score >= 40
          ? "var(--warning)"
          : "var(--danger)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold heading-font" style={{ color }}>
          {score}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          /100
        </span>
      </div>
    </div>
  );
}

function SectionRow({ sectionKey, data }) {
  const config = SECTION_CONFIG[sectionKey] || { label: sectionKey, icon: "📋" };

  const statusIcon = !data.present ? "❌" : data.score >= 7 ? "✅" : "⚠️";

  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <span className="text-base flex-shrink-0 mt-0.5">{statusIcon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {config.icon} {config.label}
          </span>
          {data.present && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: data.score >= 7 ? "var(--success-subtle)" : "var(--warning-subtle)",
                color: data.score >= 7 ? "var(--success)" : "var(--warning)",
              }}
            >
              {data.score}/10
            </span>
          )}
        </div>
        {data.note && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {data.note}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ResumeQualityScore({ userId, hasResume }) {
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (hasResume && userId && !quality && !loading) {
      loadQuality(false);
    }
  }, [hasResume, userId]);

  async function loadQuality(forceRefresh = false) {
    if (!userId) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/resume/quality`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, force_refresh: forceRefresh }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed");
      }

      const data = await res.json();
      setQuality(data);
      setExpanded(true);
    } catch (err) {
      setError(err.message || "Could not analyse resume");
    } finally {
      setLoading(false);
    }
  }

  if (!hasResume) return null;

  if (!quality && !loading) {
    return (
      <div
        className="rounded-2xl p-5 mb-6"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Resume Quality Score
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                AI analyses your resume for ATS compatibility and improvement areas
              </p>
            </div>
          </div>
          <button
            onClick={() => loadQuality(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            Analyse →
          </button>
        </div>
        {error && (
          <p className="text-xs mt-3" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="rounded-2xl p-8 mb-6 text-center"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{
              borderColor: "var(--border-default)",
              borderTopColor: "var(--accent-primary)",
            }}
          />
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Analysing your resume...
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Checking ATS compatibility, sections, keywords
          </p>
        </div>
      </div>
    );
  }

  const scoreColor =
    quality.overall_score >= 80
      ? "var(--success)"
      : quality.overall_score >= 60
        ? "var(--accent-primary)"
        : quality.overall_score >= 40
          ? "var(--warning)"
          : "var(--danger)";

  const sections = quality.sections || {};
  const ats = quality.ats_analysis || {};
  const improvements = quality.improvements || [];
  const insights = quality.job_match_insights;
  const strengths = quality.strengths || [];

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6 animate-fadeUp"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <span className="font-semibold text-sm heading-font" style={{ color: "var(--text-primary)" }}>
            Resume Quality Score
          </span>
          {quality.from_cache && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
              }}
            >
              Cached
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadQuality(true)}
            className="text-xs px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-muted)",
            }}
          >
            🔄 Re-analyse
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-muted)",
            }}
          >
            {expanded ? "Collapse ↑" : "Expand ↓"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 px-5 py-4">
        <ScoreCircle score={quality.overall_score || 0} />
        <div>
          <div className="text-xl font-bold heading-font mb-0.5" style={{ color: scoreColor }}>
            {quality.grade}
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {quality.grade_reason}
          </p>
          {strengths.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {strengths.slice(0, 2).map((s, i) => (
                <span
                  key={`${s}-${i}`}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--success-subtle)",
                    color: "var(--success)",
                    border: "1px solid rgba(34,197,94,0.15)",
                  }}
                >
                  ✓ {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div className="pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              Resume Sections
            </h4>
            <div>
              {Object.entries(sections).map(([key, data]) => (
                <SectionRow key={key} sectionKey={key} data={data || { present: false, score: 0, note: "" }} />
              ))}
            </div>
          </div>

          {ats.target_role && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                ATS Compatibility · {ats.target_role}
              </h4>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: "var(--text-secondary)" }}>Keyword Match</span>
                  <span className="font-semibold" style={{ color: scoreColor }}>
                    {ats.keyword_match_percent || 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${ats.keyword_match_percent || 0}%`,
                      background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))",
                    }}
                  />
                </div>
              </div>

              {ats.keywords_found?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                    ✅ Found ({ats.keywords_found.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ats.keywords_found.slice(0, 8).map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded-md text-xs"
                        style={{
                          background: "var(--success-subtle)",
                          color: "var(--success)",
                          border: "1px solid rgba(34,197,94,0.15)",
                        }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ats.keywords_missing?.length > 0 && (
                <div>
                  <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                    ❌ Missing:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ats.keywords_missing.slice(0, 6).map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded-md text-xs"
                        style={{
                          background: "var(--danger-subtle)",
                          color: "var(--danger)",
                          border: "1px solid rgba(239,68,68,0.15)",
                        }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ats.ats_issues?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {ats.ats_issues.map((issue, i) => (
                    <p key={`${issue}-${i}`} className="text-xs flex items-start gap-1.5" style={{ color: "var(--warning)" }}>
                      <span>⚠️</span> {issue}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {insights?.skills_to_add?.length > 0 && (
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--accent-subtle)",
                border: "1px solid rgba(124,106,255,0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span>🔗</span>
                <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent-primary)" }}>
                  From Your Job Matches
                </h4>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
                These skills appear in your job matches but are <strong>not on your resume</strong> - adding them could
                significantly improve match scores:
              </p>
              <div className="flex flex-wrap gap-2">
                {insights.skills_to_add.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-xl text-xs font-semibold"
                    style={{ background: "var(--accent-primary)", color: "white" }}
                  >
                    + {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {improvements.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Top {improvements.length} Improvements
              </h4>
              <div className="space-y-3">
                {improvements.map((imp, i) => {
                  const impactColor =
                    imp.impact === "High" ? "var(--danger)" : imp.impact === "Medium" ? "var(--warning)" : "var(--success)";

                  return (
                    <div
                      key={`${imp.title}-${i}`}
                      className="flex items-start gap-3 p-3 rounded-xl"
                      style={{
                        background: "var(--bg-overlay)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "var(--accent-primary)" }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            {imp.title}
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              background: `${impactColor}15`,
                              color: impactColor,
                            }}
                          >
                            {imp.impact}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {imp.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
