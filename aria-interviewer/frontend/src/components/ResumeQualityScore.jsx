import { useEffect, useMemo, useState } from "react";
import { getResumeQuality } from "../api/profileApi";

const SECTION_CONFIG = {
  contact_info: { label: "ContactInfo", noteFallback: "Standard formatting identified." },
  professional_summary: { label: "Professional Summary", noteFallback: "Strong summary with role intent." },
  work_experience: { label: "Work Experience", noteFallback: "Missing quantifiable impact in key roles." },
  skills: { label: "Skills", noteFallback: "Missing key skills in target stack." },
  projects: { label: "Projects", noteFallback: "Relevant projects listed." },
  education: { label: "Education", noteFallback: "Strong academic section." },
  achievements: { label: "Achievements", noteFallback: "Optional section but recommended." },
  certifications: { label: "Certifications", noteFallback: "Add certifications for credibility." },
};

const SECTION_ORDER = [
  "contact_info",
  "professional_summary",
  "work_experience",
  "skills",
  "projects",
  "education",
  "achievements",
  "certifications",
];

function scoreState(score, present) {
  if (!present || score <= 0) {
    return {
      leftBorder: "var(--border-strong)",
      dot: "var(--text-muted)",
      value: "var(--text-secondary)",
    };
  }
  if (score >= 8) {
    return {
      leftBorder: "rgba(16,185,129,0.45)",
      dot: "#34d399",
      value: "#86efac",
    };
  }
  if (score >= 6) {
    return {
      leftBorder: "rgba(245,158,11,0.45)",
      dot: "#fbbf24",
      value: "#fcd34d",
    };
  }
  return {
    leftBorder: "#ef4444",
    dot: "#f87171",
    value: "#ef4444",
  };
}

function ScoreRing({ score }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const normalized = Math.max(0, Math.min(100, Number(score) || 0));
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center overflow-hidden" style={{ width: 124, height: 124 }}>
      <svg width="124" height="124" className="-rotate-90">
        <circle cx="62" cy="62" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
        <circle
          cx="62"
          cy="62"
          r={radius}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl leading-none font-black italic text-[var(--text-primary)] heading-font">
          {normalized}
        </span>
        <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] mt-1">
          Score
        </span>
      </div>
    </div>
  );
}

function SectionRow({ sectionKey, data }) {
  const config = SECTION_CONFIG[sectionKey] || { label: sectionKey, noteFallback: "Section quality details unavailable." };
  const present = Boolean(data?.present);
  const score = Number(data?.score || 0);
  const note = data?.note || config.noteFallback;
  const state = scoreState(score, present);

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-start justify-between gap-4"
      style={{
        background: "var(--bg-base)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `3px solid ${state.leftBorder}`,
      }}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="mt-1 w-2.5 h-2.5 rounded-full" style={{ background: state.dot }} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{config.label}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{note}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold" style={{ color: state.value }}>
          {present ? `${score}/10` : "0/10"}
        </span>
        <span className="text-[var(--text-muted)] opacity-50">&gt;</span>
      </div>
    </div>
  );
}

export default function ResumeQualityScore({ userId, hasResume }) {
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const data = await getResumeQuality(userId, forceRefresh);
      setQuality(data);
    } catch (err) {
      setError(err.message || "Could not analyse resume");
    } finally {
      setLoading(false);
    }
  }

  const sections = useMemo(() => {
    const source = quality?.sections || {};
    return SECTION_ORDER.map((key) => [
      key,
      source[key] || {
        present: false,
        score: 0,
        note: "Section missing.",
      },
    ]);
  }, [quality]);

  const strengths = quality?.strengths || [];
  const topImprovement = quality?.improvements?.[0];
  const score = quality?.overall_score || 0;
  const statusLabel = score >= 80 ? "Excellent" : score >= 65 ? "Solid" : score >= 45 ? "Needs Work" : "Needs Major Work";

  if (!hasResume) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)]"
    >
      <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-subtle)]">
        <div>
          <p className="text-[11px] tracking-[0.22em] uppercase text-[var(--text-muted)]">Resume Score</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">AI Intelligence Summary</p>
        </div>
        <button
          onClick={() => loadQuality(true)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 bg-[var(--bg-overlay)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]"
        >
          {loading ? "Analysing..." : "Re-analyze"}
        </button>
      </div>

      {!quality && !loading && !error && (
        <div className="px-5 py-10 text-center">
          <p className="text-[var(--text-secondary)] text-sm mb-4">Run AI analysis to generate your resume score card.</p>
          <button
            onClick={() => loadQuality(false)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}
          >
            Analyze Resume
          </button>
        </div>
      )}

      {error && (
        <div className="px-5 py-4">
          <p className="text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        </div>
      )}

      {(loading || quality) && (
        <>
          <div className="px-5 py-5 grid grid-cols-1 lg:grid-cols-[160px_minmax(0,1fr)] gap-6 border-b border-[var(--border-subtle)]">
            <div className="flex flex-col items-center gap-3">
              <ScoreRing score={score} />
              <div className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20">
                {statusLabel}
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-sm sm:text-base md:text-lg font-semibold text-[var(--text-primary)] leading-relaxed break-words">
                {topImprovement?.description || quality?.grade_reason || "Resume quality summary is ready."}
              </p>

              {strengths.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {strengths.slice(0, 3).map((item) => (
                    <span
                      key={item}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(16,185,129,0.12)",
                        color: "#34d399",
                        border: "1px solid rgba(16,185,129,0.25)",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-4">
            <p className="text-[11px] tracking-[0.22em] uppercase text-[var(--text-muted)] mb-3">Structural Breakdown</p>
            <div className="space-y-2.5">
              {sections.map(([key, data]) => (
                <SectionRow key={key} sectionKey={key} data={data} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
