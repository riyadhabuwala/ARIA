import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import ScoreRadarChart from "./ScoreRadarChart";

export default function FeedbackReport({ report, confidenceData, onReset, audioUrl, onDownload }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!report?.overall_score) return;
    const target = report.overall_score;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setAnimatedScore(current);
      if (current >= target) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [report?.overall_score]);

  useEffect(() => {
    if (report?.overall_score >= 70) {
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }, 800);
    }
  }, [report?.overall_score]);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <p style={{ color: "var(--text-muted)" }}>No report data available.</p>
      </div>
    );
  }

  const gradeStyles = {
    Excellent: { color: "var(--success)", bg: "color-mix(in srgb, var(--success) 10%, transparent)", border: "color-mix(in srgb, var(--success) 30%, transparent)" },
    Good: { color: "var(--info)", bg: "color-mix(in srgb, var(--info) 10%, transparent)", border: "color-mix(in srgb, var(--info) 30%, transparent)" },
    Average: { color: "var(--warning)", bg: "color-mix(in srgb, var(--warning) 10%, transparent)", border: "color-mix(in srgb, var(--warning) 30%, transparent)" },
    "Needs Improvement": { color: "var(--danger)", bg: "color-mix(in srgb, var(--danger) 10%, transparent)", border: "color-mix(in srgb, var(--danger) 30%, transparent)" },
  };

  const hiringStyles = {
    "Strong Yes": { color: "var(--success)", bg: "color-mix(in srgb, var(--success) 10%, transparent)" },
    Yes: { color: "var(--info)", bg: "color-mix(in srgb, var(--info) 10%, transparent)" },
    Maybe: { color: "var(--warning)", bg: "color-mix(in srgb, var(--warning) 10%, transparent)" },
    No: { color: "var(--danger)", bg: "color-mix(in srgb, var(--danger) 10%, transparent)" },
  };

  const gs = gradeStyles[report.grade] || { color: "var(--text-muted)", bg: "var(--bg-surface)", border: "var(--border-default)" };
  const hs = hiringStyles[report.hiring_recommendation] || { color: "var(--text-muted)", bg: "var(--bg-surface)" };

  const ScoreCard = ({ title, score, feedback }) => (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{title}</h4>
        <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{score}</span>
      </div>
      <div className="w-full rounded-full h-2 mb-3" style={{ background: "var(--bg-elevated)" }}>
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))" }}
        />
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{feedback}</p>
    </div>
  );

  const sections = report.sections || {};

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Performance Report</h1>
          <p style={{ color: "var(--text-muted)" }}>Your ARIA interview results</p>
        </div>

        {/* Hero Score */}
        <div
          className="rounded-2xl p-8 mb-8 text-center animate-fade-in"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
        >
          <div
            className="text-8xl font-bold mb-3"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {animatedScore}
          </div>
          <div className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>out of 100</div>
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ color: gs.color, background: gs.bg, border: `1px solid ${gs.border}` }}
          >
            {report.grade}
          </span>
          {report.summary && (
            <p className="text-sm mt-5 max-w-xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {report.summary}
            </p>
          )}
        </div>

        {/* Partial interview banner */}
        {report.partial_interview && (
          <div
            className="mb-6 px-4 py-3 rounded-xl flex items-center gap-3"
            style={{
              background: "var(--warning-subtle)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <span>⚠️</span>
            <p className="text-sm" style={{ color: "var(--warning)" }}>
              This report is based on an early-terminated interview.
              Complete a full interview for a more accurate assessment.
            </p>
          </div>
        )}

        {/* Hiring Recommendation Banner */}
        {report.hiring_recommendation && (
          <div
            className="rounded-xl px-6 py-4 mb-8 flex items-center justify-between"
            style={{ background: hs.bg, border: `1px solid color-mix(in srgb, ${hs.color} 20%, transparent)` }}
          >
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Hiring Recommendation</span>
            <span className="text-lg font-bold" style={{ color: hs.color }}>
              {report.hiring_recommendation}
            </span>
          </div>
        )}

        {/* Score Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {sections.technical_knowledge && (
            <ScoreCard title="Technical Knowledge" score={sections.technical_knowledge.score} feedback={sections.technical_knowledge.feedback} />
          )}
          {sections.communication && (
            <ScoreCard title="Communication" score={sections.communication.score} feedback={sections.communication.feedback} />
          )}
          {sections.problem_solving && (
            <ScoreCard title="Problem Solving" score={sections.problem_solving.score} feedback={sections.problem_solving.feedback} />
          )}
          {sections.confidence && (
            <ScoreCard title="Confidence" score={sections.confidence.score} feedback={sections.confidence.feedback} />
          )}
        </div>

        {/* Skills Radar Chart */}
        <ScoreRadarChart sections={sections} />

        {/* Confidence Analysis */}
        {confidenceData && (
          <div
            className="rounded-xl mb-8 overflow-hidden"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Confidence Analysis</h3>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold" style={{ color: "var(--accent-primary)" }}>
                  {confidenceData.confidence_score ?? "—"}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Confidence Score</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Based on language patterns & delivery</p>
                </div>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: "var(--bg-surface)" }}>
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${confidenceData.confidence_score ?? 0}%`, background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))" }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { val: confidenceData.total_fillers ?? 0, label: "Total Fillers" },
                  { val: `${confidenceData.filler_rate ?? "0.0"}%`, label: "Filler Rate" },
                  { val: confidenceData.strong_openers ?? 0, label: "Strong Openers" },
                  { val: confidenceData.weak_openers ?? 0, label: "Weak Openers" },
                ].map((m, i) => (
                  <div key={i} className="rounded-lg p-3 text-center" style={{ background: "var(--bg-surface)" }}>
                    <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{m.val}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{m.label}</p>
                  </div>
                ))}
              </div>

              {confidenceData.most_used_fillers && Object.keys(confidenceData.most_used_fillers).length > 0 && (
                <div>
                  <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>Most Used Fillers</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(confidenceData.most_used_fillers).map(([word, count]) => (
                      <span
                        key={word}
                        className="px-3 py-1 text-xs rounded-full"
                        style={{
                          color: "var(--danger)",
                          background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
                        }}
                      >
                        "{word}" × {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {confidenceData.trend && (
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>Trend:</span>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: confidenceData.trend === "improving"
                        ? "var(--success)"
                        : confidenceData.trend === "declining"
                        ? "var(--danger)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {confidenceData.trend === "improving" ? "📈 Improving" : confidenceData.trend === "declining" ? "📉 Declining" : "➡️ Steady"}
                  </span>
                </div>
              )}

              {confidenceData.tips?.length > 0 && (
                <div>
                  <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>Improvement Tips</p>
                  <ul className="space-y-1">
                    {confidenceData.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                        <span style={{ color: "var(--info)" }} className="mt-0.5">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Strengths & Improvements Columns */}
        {sections.technical_knowledge && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {sections.technical_knowledge.strong_points?.length > 0 && (
              <div className="rounded-xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--success)" }}>Strong Points</h4>
                <ul className="space-y-2">
                  {sections.technical_knowledge.strong_points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--success)" }} className="mt-0.5">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {sections.technical_knowledge.weak_points?.length > 0 && (
              <div className="rounded-xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--warning)" }}>Areas to Work On</h4>
                <ul className="space-y-2">
                  {sections.technical_knowledge.weak_points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--warning)" }} className="mt-0.5">→</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Question Breakdown — Rich Per-Answer Feedback */}
        {report.question_breakdown?.length > 0 && (
          <div className="mb-8 space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Question Breakdown</h3>
            {report.question_breakdown.map((item, i) => {
              const scoreColor = item.score >= 8 ? "var(--success)"
                : item.score >= 6 ? "var(--accent-primary)"
                : item.score >= 4 ? "var(--warning)"
                : "var(--danger)";

              return (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
                >
                  {/* Question header */}
                  <div
                    className="flex items-start justify-between gap-4 p-4"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                        style={{ background: "var(--accent-primary)" }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {item.question}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <span className="text-lg font-bold" style={{ color: scoreColor }}>
                        {item.score}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>/10</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="h-1" style={{ background: "var(--bg-elevated)" }}>
                    <div
                      className="h-full transition-all duration-700"
                      style={{ width: `${item.score * 10}%`, background: scoreColor }}
                    />
                  </div>

                  {/* Answer details */}
                  <div className="p-4 space-y-3">
                    {item.answer_summary && (
                      <div
                        className="text-xs px-3 py-2 rounded-lg italic"
                        style={{
                          background: "var(--bg-overlay)",
                          color: "var(--text-secondary)",
                          borderLeft: "2px solid var(--border-default)",
                        }}
                      >
                        "{item.answer_summary}"
                      </div>
                    )}

                    {item.what_was_good && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 flex-shrink-0" style={{ color: "var(--success)" }}>✓</span>
                        <span style={{ color: "var(--text-secondary)" }}>{item.what_was_good}</span>
                      </div>
                    )}

                    {item.what_was_missing && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 flex-shrink-0" style={{ color: "var(--warning)" }}>△</span>
                        <span style={{ color: "var(--text-secondary)" }}>{item.what_was_missing}</span>
                      </div>
                    )}

                    {item.ideal_answer_hint && (
                      <div
                        className="flex items-start gap-2 text-sm px-3 py-2 rounded-lg"
                        style={{
                          background: "var(--info-subtle)",
                          border: "1px solid rgba(59,130,246,0.15)",
                        }}
                      >
                        <span className="flex-shrink-0">💡</span>
                        <span style={{ color: "var(--info)" }}>{item.ideal_answer_hint}</span>
                      </div>
                    )}

                    {item.feedback && (
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                        {item.feedback}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Top Strengths, Improvements, Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {report.top_strengths?.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--success)" }}>Top Strengths</h4>
              <ul className="space-y-2">
                {report.top_strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--success)" }}>✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.improvement_areas?.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--warning)" }}>Improvement Areas</h4>
              <ul className="space-y-2">
                {report.improvement_areas.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--warning)" }}>→</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.recommended_resources?.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
              <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--info)" }}>Recommended Resources</h4>
              <ul className="space-y-2">
                {report.recommended_resources.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--info)" }}>📘</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Interview Recording */}
        {audioUrl && (
          <div
            className="rounded-xl mb-8 p-5"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>Interview Recording</h4>
            <audio controls src={audioUrl} className="w-full mb-3" />
            {onDownload && (
              <button
                onClick={onDownload}
                className="px-4 py-2 text-sm rounded-lg transition"
                style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
              >
                ⬇ Download Recording
              </button>
            )}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center pb-8">
          <button
            onClick={onReset}
            className="px-8 py-3 font-semibold rounded-xl transition"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              color: "#fff",
            }}
          >
            Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}
