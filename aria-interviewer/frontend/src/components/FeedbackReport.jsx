import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import ScoreRadarChart from "./ScoreRadarChart";
import ScoreGauge from "./ScoreGauge";
import { getSession } from "../api/interviewApi";

export default function FeedbackReport({ report, confidenceData, sessionId, durationSeconds, onReset, audioUrl, onDownload }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [dbReport, setDbReport] = useState(null);
  const [dbConfidence, setDbConfidence] = useState(null);
  const [dbDuration, setDbDuration] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeReport = dbReport || report;
  const activeConfidence = dbConfidence || confidenceData;
  const resolvedDuration =
    dbDuration ??
    durationSeconds ??
    activeReport?.duration_seconds ??
    activeReport?.durationSeconds ??
    0;

  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;
    setLoading(true);
    getSession(sessionId)
      .then((data) => {
        if (!isMounted) return;
        setDbReport(data.report_json || data.report || null);
        setDbConfidence(data.confidence_json || data.confidence_data || null);
        setDbDuration(data.duration_seconds || null);
      })
      .catch(() => {
        // silent
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!activeReport?.overall_score) return;
    const target = activeReport.overall_score;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setAnimatedScore(current);
      if (current >= target) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [activeReport?.overall_score]);

  useEffect(() => {
    if (activeReport?.overall_score >= 70) {
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }, 800);
    }
  }, [activeReport?.overall_score]);

  if (!activeReport && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading report...</p>
      </div>
    );
  }

  if (!activeReport) {
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

  const gs = gradeStyles[activeReport.grade] || { color: "var(--text-muted)", bg: "var(--bg-surface)", border: "var(--border-default)" };
  const hs = hiringStyles[activeReport.hiring_recommendation] || { color: "var(--text-muted)", bg: "var(--bg-surface)" };

  const ScoreCard = ({ title, score, feedback }) => {
    const color = score >= 80 ? "#22c55e" : score >= 60 ? "#2563eb" : "#f59e0b";
    return (
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="text-center mb-3">
          <div
            className="font-geist text-3xl font-bold mb-1"
            style={{ color, letterSpacing: "-0.03em" }}
          >
            {score}
          </div>
          <h4 className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {title}
          </h4>
        </div>
        <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: "var(--bg-elevated)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
          />
        </div>
        {feedback && (
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {feedback.length > 80 ? feedback.slice(0, 80) + "..." : feedback}
          </p>
        )}
      </div>
    );
  };

  const sections = activeReport.sections || activeReport.section_scores || activeReport.sectionScores || {};
  const strengths = activeReport.strengths || activeReport.top_strengths || activeReport.topStrengths || [];
  const improvements = activeReport.improvement_areas || activeReport.improvementAreas || [];
  const questionBreakdown = activeReport.question_breakdown || activeReport.questionBreakdown || activeReport.questions || [];
  const confidenceAnswers = activeConfidence?.answers || activeConfidence?.per_answer_breakdown || activeConfidence?.perAnswerBreakdown || [];
  const sectionOrder = ["technical_knowledge", "communication", "problem_solving", "confidence"];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Navbar */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
              style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
            >
              AI
            </div>
            <span className="font-bold font-geist" style={{ color: "var(--text-primary)" }}>
              ARIA
            </span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              / Performance Report
            </span>
          </div>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {/* Score Hero */}
        <div
          className="rounded-3xl overflow-hidden relative"
          style={{
            background: "linear-gradient(145deg, #020817, #0a1628, #0f1f3d)",
            border: "1px solid rgba(37,99,235,0.2)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.2), transparent 65%)",
            }}
          />
          <div className="relative z-10 py-12 px-8 text-center">
            {activeReport.partial_interview && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  color: "#f59e0b",
                }}
              >
                ⚠️ Partial interview — ended early
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mb-6">
              {activeReport.domain && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(37,99,235,0.15)",
                    border: "1px solid rgba(37,99,235,0.3)",
                    color: "#60a5fa",
                  }}
                >
                  {activeReport.domain}
                </span>
              )}
              {resolvedDuration > 0 && (
                <span
                  className="px-3 py-1 rounded-full text-xs"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  ⏱ {Math.floor(resolvedDuration / 60)}m {Math.floor(resolvedDuration % 60)}s
                </span>
              )}
            </div>

            <div className="flex justify-center mb-6">
              <ScoreGauge
                score={activeReport.overall_score || 0}
                label="Overall Performance"
                size="lg"
                showGrade={true}
              />
            </div>

            {activeReport.hiring_recommendation && (
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4"
                style={{
                  background: hs.bg,
                  border: `1px solid ${hs.border || "rgba(245,158,11,0.2)"}`,
                  color: hs.color,
                }}
              >
                <span>
                  {activeReport.hiring_recommendation === "Yes" || activeReport.hiring_recommendation === "Strong Yes" ? "✓" : activeReport.hiring_recommendation === "No" ? "✗" : "◈"}
                </span>
                {activeReport.hiring_recommendation === "Yes" || activeReport.hiring_recommendation === "Strong Yes"
                  ? "Recommended for Hire"
                  : activeReport.hiring_recommendation === "No"
                    ? "Needs More Practice"
                    : "Mixed — Keep Practicing"}
              </div>
            )}

            {activeReport.summary && (
              <p className="max-w-xl mx-auto text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                {activeReport.summary}
              </p>
            )}
          </div>
        </div>

        {/* Skill Breakdown */}
        <div>
          <h2 className="font-geist text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            Skill Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectionOrder.map((key) => {
              const data = sections?.[key] || {};
              const s = typeof data.score === "number" ? data.score : 0;
              const label = {
                technical_knowledge: "Technical Knowledge",
                communication: "Communication",
                problem_solving: "Problem Solving",
                confidence: "Confidence",
              }[key];
              const icon = {
                technical_knowledge: "⚙️",
                communication: "💬",
                problem_solving: "🧠",
                confidence: "💪",
              }[key];

              return (
                <div
                  key={key}
                  className="rounded-2xl p-5"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span>{icon}</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {label}
                    </span>
                  </div>

                  <div className="flex justify-center mb-3">
                    <ScoreGauge
                      score={s}
                      size="sm"
                      showGrade={false}
                    />
                  </div>

                  <p className="text-xs leading-relaxed text-center" style={{ color: "var(--text-secondary)" }}>
                    {data.feedback || "No feedback available yet."}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "#22c55e" }}>
              <span>✦</span> Strengths
            </h3>
            <div className="space-y-2.5">
              {strengths.length > 0 ? (
                strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(34,197,94,0.1)" }}
                    >
                      <span style={{ fontSize: "9px", color: "#22c55e" }}>✓</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {s}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No strengths captured yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "#f59e0b" }}>
              <span>△</span> Areas to Improve
            </h3>
            <div className="space-y-2.5">
              {improvements.length > 0 ? (
                improvements.map((imp, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(245,158,11,0.1)" }}
                    >
                      <span style={{ fontSize: "9px", color: "#f59e0b" }}>→</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {imp}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No improvement areas captured yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Question by Question */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-geist text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Question by Question
            </h2>
            <span
              className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
            >
              {questionBreakdown.length} questions · click to expand
            </span>
          </div>

          {questionBreakdown.length === 0 ? (
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No question breakdown available yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questionBreakdown.map((item, i) => {
                const score = item?.score || 0;
                const scaled = score * 10;
                const sc = scaled >= 80 ? "#22c55e" : scaled >= 60 ? "#2563eb" : scaled >= 40 ? "#f59e0b" : "#94a3b8";
                const confidenceAnswer = confidenceAnswers[i];

                return (
                  <details
                    key={i}
                    className="rounded-2xl overflow-hidden transition-all duration-200"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                  >
                    <summary
                      className="w-full flex items-start justify-between gap-4 p-5 text-left transition-all hover:opacity-90 list-none"
                      style={{ cursor: "pointer" }}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                          style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                        >
                          {i + 1}
                        </div>
                        <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>
                          {item.question}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-baseline gap-0.5">
                          <span className="font-geist text-xl font-bold" style={{ color: sc }}>
                            {score}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            /10
                          </span>
                        </div>
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                          <div className="h-full rounded-full" style={{ width: `${score * 10}%`, background: sc }} />
                        </div>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>▼</span>
                      </div>
                    </summary>

                    <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      {item.answer_summary && (
                        <div className="pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                            Your Answer
                          </p>
                          <div
                            className="px-4 py-3 rounded-xl text-sm italic leading-relaxed"
                            style={{
                              background: "var(--bg-overlay)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-secondary)",
                              borderLeft: "3px solid var(--border-strong)",
                            }}
                          >
                            "{item.answer_summary}"
                          </div>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-3">
                        {item.what_was_good && (
                          <div
                            className="flex items-start gap-2.5 p-3 rounded-xl"
                            style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}
                          >
                            <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                            <div>
                              <p className="text-xs font-semibold mb-1" style={{ color: "#22c55e" }}>
                                What was good
                              </p>
                              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                {item.what_was_good}
                              </p>
                            </div>
                          </div>
                        )}

                        {item.what_was_missing && (
                          <div
                            className="flex items-start gap-2.5 p-3 rounded-xl"
                            style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}
                          >
                            <span className="text-yellow-500 flex-shrink-0 mt-0.5">△</span>
                            <div>
                              <p className="text-xs font-semibold mb-1" style={{ color: "#f59e0b" }}>
                                What was missing
                              </p>
                              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                {item.what_was_missing}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {item.ideal_answer_hint && (
                        <div
                          className="flex items-start gap-2.5 p-3 rounded-xl"
                          style={{ background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.15)" }}
                        >
                          <span className="flex-shrink-0 mt-0.5">💡</span>
                          <div>
                            <p className="text-xs font-semibold mb-1" style={{ color: "#60a5fa" }}>
                              Ideal answer includes
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              {item.ideal_answer_hint}
                            </p>
                          </div>
                        </div>
                      )}

                      {item.feedback && (
                        <div className="p-3 rounded-xl" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                            ARIA's Feedback
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            {item.feedback}
                          </p>
                        </div>
                      )}

                      {confidenceAnswer && (
                        <div className="flex items-center gap-4 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              Confidence:
                            </span>
                            <span
                              className="text-xs font-semibold"
                              style={{ color: (confidenceAnswer.score || confidenceAnswer.confidence_score || 0) >= 80 ? "#22c55e" : (confidenceAnswer.score || confidenceAnswer.confidence_score || 0) >= 60 ? "#2563eb" : (confidenceAnswer.score || confidenceAnswer.confidence_score || 0) >= 40 ? "#f59e0b" : "#94a3b8" }}
                            >
                              {(confidenceAnswer.score || confidenceAnswer.confidence_score || 0)}/100
                            </span>
                          </div>
                          {(confidenceAnswer.filler_words_found || confidenceAnswer.filler_words || []).length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                Fillers:
                              </span>
                              <div className="flex gap-1">
                                {(confidenceAnswer.filler_words_found || confidenceAnswer.filler_words || []).slice(0, 3).map((fw) => (
                                  <span
                                    key={fw}
                                    className="text-xs px-1.5 py-0.5 rounded"
                                    style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
                                  >
                                    {fw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {(confidenceAnswer.word_count || 0) > 0 && (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {confidenceAnswer.word_count} words
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </div>

        {/* Confidence Analysis */}
        {activeConfidence && (
          <div>
            <h2 className="font-geist text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Confidence Analysis
            </h2>
            <div
              className="rounded-2xl p-6"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex justify-center">
                  <ScoreGauge
                    score={activeConfidence.overallScore ?? activeConfidence.overall_score ?? activeConfidence.confidence_score ?? 0}
                    label="Confidence Score"
                    size="md"
                    showGrade={true}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="px-4 py-3 rounded-xl" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                    <div className="font-geist text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {activeConfidence.totalFillers ?? activeConfidence.total_fillers ?? activeConfidence.total_filler_words ?? 0}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Total Fillers
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-xl" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                    <div className="font-geist text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {confidenceAnswers.length || questionBreakdown.length || 0}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Answers
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: "var(--bg-elevated)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${activeConfidence.overallScore ?? activeConfidence.overall_score ?? activeConfidence.confidence_score ?? 0}%`,
                    background: `linear-gradient(90deg, ${
                      (activeConfidence.overallScore ?? activeConfidence.overall_score ?? activeConfidence.confidence_score ?? 0) >= 80
                        ? "#22c55e"
                        : (activeConfidence.overallScore ?? activeConfidence.overall_score ?? activeConfidence.confidence_score ?? 0) >= 60
                          ? "#2563eb"
                          : (activeConfidence.overallScore ?? activeConfidence.overall_score ?? activeConfidence.confidence_score ?? 0) >= 40
                            ? "#f59e0b"
                            : "#94a3b8"}, ${
                      (activeConfidence.overallScore ?? activeConfidence.overall_score ?? activeConfidence.confidence_score ?? 0) >= 80
                        ? "#22c55e"
                        : (activeConfidence.overallScore ?? activeConfidence.overall_score ?? activeConfidence.confidence_score ?? 0) >= 60
                          ? "#2563eb"
                          : (activeConfidence.overallScore ?? activeConfidence.overall_score ?? activeConfidence.confidence_score ?? 0) >= 40
                            ? "#f59e0b"
                            : "#94a3b8"}88)`
                  }}
                />
              </div>

              {(Object.keys(activeConfidence.filler_frequency || activeConfidence.most_used_fillers || {}).length > 0) && (
                <div className="mb-4">
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                    Filler Words Used
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(activeConfidence.filler_frequency || activeConfidence.most_used_fillers || {})
                      .sort((a, b) => b[1] - a[1])
                      .map(([word, count]) => (
                        <div
                          key={word}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}
                        >
                          <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>
                            "{word}"
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-bold"
                            style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
                          >
                            ×{count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {confidenceAnswers.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>
                    Confidence per Answer
                  </p>
                  <div className="space-y-2">
                    {confidenceAnswers.map((ans, i) => {
                      const s = ans.score || ans.confidence_score || 0;
                      const c = s >= 80 ? "#22c55e" : s >= 60 ? "#2563eb" : s >= 40 ? "#f59e0b" : "#94a3b8";
                      const fillers = ans.filler_words_found || ans.filler_words || [];
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-mono w-6 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                            Q{i + 1}
                          </span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                            <div className="h-full rounded-full" style={{ width: `${s}%`, background: c }} />
                          </div>
                          <span className="text-xs font-semibold w-8 text-right flex-shrink-0" style={{ color: c }}>
                            {s}
                          </span>
                          {fillers.length > 0 && (
                            <div className="flex gap-1 flex-shrink-0">
                              {fillers.slice(0, 2).map((fw) => (
                                <span
                                  key={fw}
                                  className="text-xs px-1 py-0.5 rounded"
                                  style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
                                >
                                  {fw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(activeConfidence.tips || activeConfidence.improvement_tips || []).length > 0 && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                    Communication Tips
                  </p>
                  <div className="space-y-2">
                    {(activeConfidence.tips || activeConfidence.improvement_tips || []).map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <span style={{ color: "#2563eb" }}>→</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interview Recording */}
        {audioUrl && (
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
              Interview Recording
            </h4>
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

        {/* Bottom Actions */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={onReset}
            className="flex-1 py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] font-geist"
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 0 30px rgba(37,99,235,0.3)",
              fontSize: "15px",
            }}
          >
            Start New Interview →
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-8 py-4 rounded-2xl font-semibold transition-all hover:opacity-80"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
