import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
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
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
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
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", color: "white", fontSize: "14px",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            margin: "0 auto 16px",
            animation: "pulse-blue 2s ease-in-out infinite",
          }}>AI</div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Loading your report...</p>
        </div>
      </div>
    );
  }

  if (!activeReport) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        fontFamily: "'Inter', sans-serif",
      }}>
        <p style={{ color: "rgba(255,255,255,0.35)" }}>No report data available.</p>
      </div>
    );
  }

  const hiringStyles = {
    "Strong Yes": { color: "#22c55e", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.15)" },
    Yes: { color: "#22c55e", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.15)" },
    Maybe: { color: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.15)" },
    No: { color: "#ef4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.15)" },
  };

  const hs = hiringStyles[activeReport.hiring_recommendation] || { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" };

  const sections = activeReport.sections || activeReport.section_scores || activeReport.sectionScores || {};
  const strengths = activeReport.strengths || activeReport.top_strengths || activeReport.topStrengths || [];
  const improvements = activeReport.improvement_areas || activeReport.improvementAreas || [];
  const questionBreakdown = activeReport.question_breakdown || activeReport.questionBreakdown || activeReport.questions || [];
  const confidenceAnswers = activeConfidence?.answers || activeConfidence?.per_answer_breakdown || activeConfidence?.perAnswerBreakdown || [];
  const sectionOrder = ["technical_knowledge", "communication", "problem_solving", "confidence"];

  const getScoreColor = (s) => {
    if (s >= 80) return "#22c55e";
    if (s >= 60) return "#2563eb";
    if (s >= 40) return "#f59e0b";
    return "#ef4444";
  };

  // Section card component
  const SectionCard = ({ icon, label, score, feedback }) => {
    const color = getScoreColor(score);
    return (
      <div style={{
        borderRadius: "16px",
        padding: "24px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "border-color 0.2s ease, transform 0.2s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px",
            background: `${color}10`,
            border: `1px solid ${color}20`,
          }}>{icon}</div>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>{label}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <ScoreGauge score={score} size="sm" showGrade={false} />
        </div>

        <p style={{
          fontSize: "12px",
          lineHeight: "1.7",
          color: "rgba(255,255,255,0.5)",
          textAlign: "center",
        }}>
          {feedback || "No feedback available yet."}
        </p>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000000",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 24px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "9px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "800", color: "white", fontSize: "10px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 0 14px rgba(37,99,235,0.3)",
            }}>AI</div>
            <span style={{
              fontWeight: "700",
              color: "#ffffff",
              fontFamily: "'Geist', 'Inter', sans-serif",
              letterSpacing: "-0.03em",
              fontSize: "15px",
            }}>ARIA</span>
            <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
              Performance Report
            </span>
          </div>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            style={{
              padding: "7px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px 48px" }}>
        {/* ═══ SCORE HERO ═══ */}
        <div style={{
          borderRadius: "24px",
          overflow: "hidden",
          position: "relative",
          marginBottom: "24px",
          background: "linear-gradient(160deg, #020817 0%, #0a1628 40%, #0f1f3d 100%)",
          border: "1px solid rgba(37,99,235,0.15)",
        }}>
          {/* Background radial glow */}
          <div style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(37,99,235,0.18), transparent 65%)",
          }} />

          {/* Grid pattern */}
          <div style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(circle at 50% 30%, black 0%, transparent 70%)",
          }} />

          <div style={{
            position: "relative",
            zIndex: 1,
            padding: "48px 32px 40px",
            textAlign: "center",
          }}>
            {/* Partial Interview Warning */}
            {activeReport.partial_interview && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "600",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
                color: "#f59e0b",
                marginBottom: "24px",
              }}>
                ⚠️ Partial interview — ended early
              </div>
            )}

            {/* Domain + Duration */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "28px",
            }}>
              {activeReport.domain && (
                <span style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: "600",
                  background: "rgba(37,99,235,0.1)",
                  border: "1px solid rgba(37,99,235,0.25)",
                  color: "#60a5fa",
                }}>
                  {activeReport.domain}
                </span>
              )}
              {resolvedDuration > 0 && (
                <span style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.35)",
                }}>
                  ⏱ {Math.floor(resolvedDuration / 60)}m {Math.floor(resolvedDuration % 60)}s
                </span>
              )}
              {questionBreakdown.length > 0 && (
                <span style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.35)",
                }}>
                  {questionBreakdown.length} questions
                </span>
              )}
            </div>

            {/* Score Gauge */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
              <ScoreGauge
                score={activeReport.overall_score || 0}
                label="Overall Performance"
                size="lg"
                showGrade={true}
              />
            </div>

            {/* Hiring Recommendation */}
            {activeReport.hiring_recommendation && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 22px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: "700",
                background: hs.bg,
                border: `1px solid ${hs.border}`,
                color: hs.color,
                marginBottom: "20px",
              }}>
                <span style={{ fontSize: "14px" }}>
                  {activeReport.hiring_recommendation === "Yes" || activeReport.hiring_recommendation === "Strong Yes" ? "✓" : activeReport.hiring_recommendation === "No" ? "✗" : "◈"}
                </span>
                {activeReport.hiring_recommendation === "Yes" || activeReport.hiring_recommendation === "Strong Yes"
                  ? "Recommended for Hire"
                  : activeReport.hiring_recommendation === "No"
                    ? "Needs More Practice"
                    : "Mixed — Keep Practicing"}
              </div>
            )}

            {/* Summary */}
            {activeReport.summary && (
              <p style={{
                maxWidth: "520px",
                margin: "0 auto",
                fontSize: "13px",
                lineHeight: "1.7",
                color: "rgba(255,255,255,0.4)",
              }}>
                {activeReport.summary}
              </p>
            )}

            {/* Note for partial */}
            {activeReport.partial_interview && (
              <p style={{
                marginTop: "16px",
                fontSize: "12px",
                color: "rgba(255,255,255,0.25)",
                fontStyle: "italic",
              }}>
                Note: This is based on {questionBreakdown.length || 0} questions answered before the interview was ended early.
              </p>
            )}
          </div>
        </div>

        {/* ═══ SKILL BREAKDOWN ═══ */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "16px",
          }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "13px",
              background: "rgba(37,99,235,0.08)",
              border: "1px solid rgba(37,99,235,0.15)",
            }}>📊</div>
            <h2 style={{
              fontSize: "17px",
              fontWeight: "700",
              color: "#ffffff",
              fontFamily: "'Geist', 'Inter', sans-serif",
              letterSpacing: "-0.02em",
              margin: 0,
            }}>Skill Breakdown</h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}>
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
                <SectionCard
                  key={key}
                  icon={icon}
                  label={label}
                  score={s}
                  feedback={data.feedback}
                />
              );
            })}
          </div>
        </div>

        {/* ═══ STRENGTHS & IMPROVEMENTS ═══ */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "24px",
        }}>
          {/* Strengths */}
          <div style={{
            borderRadius: "16px",
            padding: "24px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.15)",
              }}>✦</div>
              <h3 style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "#22c55e",
                margin: 0,
              }}>Strengths</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {strengths.length > 0 ? (
                strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{
                      width: "20px", height: "20px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: "1px",
                      background: "rgba(34,197,94,0.08)",
                      fontSize: "10px", color: "#22c55e",
                    }}>✓</div>
                    <p style={{ fontSize: "13px", lineHeight: "1.6", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                      {s}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)" }}>
                  No strengths captured yet.
                </p>
              )}
            </div>
          </div>

          {/* Improvements */}
          <div style={{
            borderRadius: "16px",
            padding: "24px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.15)",
              }}>△</div>
              <h3 style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "#f59e0b",
                margin: 0,
              }}>Areas to Improve</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {improvements.length > 0 ? (
                improvements.map((imp, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{
                      width: "20px", height: "20px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: "1px",
                      background: "rgba(245,158,11,0.08)",
                      fontSize: "10px", color: "#f59e0b",
                    }}>→</div>
                    <p style={{ fontSize: "13px", lineHeight: "1.6", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                      {imp}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)" }}>
                  No improvement areas captured yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ QUESTION BY QUESTION ═══ */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px",
                background: "rgba(37,99,235,0.08)",
                border: "1px solid rgba(37,99,235,0.15)",
              }}>📋</div>
              <h2 style={{
                fontSize: "17px",
                fontWeight: "700",
                color: "#ffffff",
                fontFamily: "'Geist', 'Inter', sans-serif",
                letterSpacing: "-0.02em",
                margin: 0,
              }}>Question by Question</h2>
            </div>
            {questionBreakdown.length > 0 && (
              <span style={{
                fontSize: "11px",
                padding: "5px 12px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                {questionBreakdown.length} questions · click to expand
              </span>
            )}
          </div>

          {questionBreakdown.length === 0 ? (
            <div style={{
              borderRadius: "16px",
              padding: "32px",
              textAlign: "center",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)" }}>
                No question breakdown available yet.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {questionBreakdown.map((item, i) => {
                const score = item?.score || 0;
                const scaled = score * 10;
                const sc = getScoreColor(scaled);
                const confidenceAnswer = confidenceAnswers[i];

                return (
                  <details
                    key={i}
                    style={{
                      borderRadius: "14px",
                      overflow: "hidden",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    <summary
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        padding: "18px 20px",
                        textAlign: "left",
                        cursor: "pointer",
                        listStyle: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: "800", color: "white",
                          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                          flexShrink: 0,
                        }}>{i + 1}</div>
                        <p style={{
                          fontSize: "13px",
                          fontWeight: "500",
                          lineHeight: "1.5",
                          color: "rgba(255,255,255,0.8)",
                          margin: 0,
                        }}>{item.question}</p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                          <span style={{
                            fontFamily: "'Geist', 'Inter', sans-serif",
                            fontSize: "20px",
                            fontWeight: "800",
                            color: sc,
                            letterSpacing: "-0.02em",
                          }}>{score}</span>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>/10</span>
                        </div>
                        <div style={{
                          width: "56px", height: "5px", borderRadius: "999px",
                          overflow: "hidden",
                          background: "rgba(255,255,255,0.06)",
                        }}>
                          <div style={{
                            height: "100%",
                            borderRadius: "999px",
                            background: sc,
                            width: `${score * 10}%`,
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>▼</span>
                      </div>
                    </summary>

                    <div style={{
                      padding: "0 20px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      {/* Answer Summary */}
                      {item.answer_summary && (
                        <div style={{ paddingTop: "16px" }}>
                          <p style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: "rgba(255,255,255,0.25)",
                            marginBottom: "8px",
                          }}>Your Answer</p>
                          <div style={{
                            padding: "12px 16px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontStyle: "italic",
                            lineHeight: "1.7",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.04)",
                            borderLeft: "3px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.5)",
                          }}>
                            "{item.answer_summary}"
                          </div>
                        </div>
                      )}

                      {/* Good / Missing */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: item.what_was_good && item.what_was_missing ? "1fr 1fr" : "1fr",
                        gap: "10px",
                      }}>
                        {item.what_was_good && (
                          <div style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            padding: "12px 14px",
                            borderRadius: "10px",
                            background: "rgba(34,197,94,0.04)",
                            border: "1px solid rgba(34,197,94,0.1)",
                          }}>
                            <span style={{ color: "#22c55e", flexShrink: 0, marginTop: "2px", fontSize: "12px" }}>✓</span>
                            <div>
                              <p style={{ fontSize: "11px", fontWeight: "700", color: "#22c55e", marginBottom: "4px" }}>
                                What was good
                              </p>
                              <p style={{ fontSize: "12px", lineHeight: "1.6", color: "rgba(255,255,255,0.55)", margin: 0 }}>
                                {item.what_was_good}
                              </p>
                            </div>
                          </div>
                        )}

                        {item.what_was_missing && (
                          <div style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            padding: "12px 14px",
                            borderRadius: "10px",
                            background: "rgba(245,158,11,0.04)",
                            border: "1px solid rgba(245,158,11,0.1)",
                          }}>
                            <span style={{ color: "#f59e0b", flexShrink: 0, marginTop: "2px", fontSize: "12px" }}>△</span>
                            <div>
                              <p style={{ fontSize: "11px", fontWeight: "700", color: "#f59e0b", marginBottom: "4px" }}>
                                What was missing
                              </p>
                              <p style={{ fontSize: "12px", lineHeight: "1.6", color: "rgba(255,255,255,0.55)", margin: 0 }}>
                                {item.what_was_missing}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Ideal answer */}
                      {item.ideal_answer_hint && (
                        <div style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          background: "rgba(37,99,235,0.04)",
                          border: "1px solid rgba(37,99,235,0.1)",
                        }}>
                          <span style={{ flexShrink: 0, marginTop: "2px", fontSize: "14px" }}>💡</span>
                          <div>
                            <p style={{ fontSize: "11px", fontWeight: "700", color: "#60a5fa", marginBottom: "4px" }}>
                              Ideal answer includes
                            </p>
                            <p style={{ fontSize: "12px", lineHeight: "1.6", color: "rgba(255,255,255,0.55)", margin: 0 }}>
                              {item.ideal_answer_hint}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      {item.feedback && (
                        <div style={{
                          padding: "12px 14px",
                          borderRadius: "10px",
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.04)",
                        }}>
                          <p style={{
                            fontSize: "11px", fontWeight: "700",
                            color: "rgba(255,255,255,0.25)",
                            marginBottom: "6px",
                          }}>ARIA's Feedback</p>
                          <p style={{
                            fontSize: "13px", lineHeight: "1.7",
                            color: "rgba(255,255,255,0.6)", margin: 0,
                          }}>{item.feedback}</p>
                        </div>
                      )}

                      {/* Confidence metrics */}
                      {confidenceAnswer && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          paddingTop: "4px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>Confidence:</span>
                            <span style={{
                              fontSize: "12px", fontWeight: "700",
                              color: getScoreColor(confidenceAnswer.score || confidenceAnswer.confidence_score || 0),
                            }}>
                              {(confidenceAnswer.score || confidenceAnswer.confidence_score || 0)}/100
                            </span>
                          </div>
                          {(confidenceAnswer.filler_words_found || confidenceAnswer.filler_words || []).length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>Fillers:</span>
                              <div style={{ display: "flex", gap: "4px" }}>
                                {(confidenceAnswer.filler_words_found || confidenceAnswer.filler_words || []).slice(0, 3).map((fw) => (
                                  <span key={fw} style={{
                                    fontSize: "10px",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    background: "rgba(245,158,11,0.08)",
                                    color: "#f59e0b",
                                  }}>{fw}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {(confidenceAnswer.word_count || 0) > 0 && (
                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>
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

        {/* ═══ CONFIDENCE ANALYSIS ═══ */}
        {activeConfidence && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px",
                background: "rgba(37,99,235,0.08)",
                border: "1px solid rgba(37,99,235,0.15)",
              }}>🎯</div>
              <h2 style={{
                fontSize: "17px",
                fontWeight: "700",
                color: "#ffffff",
                fontFamily: "'Geist', 'Inter', sans-serif",
                letterSpacing: "-0.02em",
                margin: 0,
              }}>Confidence Analysis</h2>
            </div>

            <div style={{
              borderRadius: "16px",
              padding: "28px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              {/* Top row: Gauge + Stats */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                gap: "24px",
              }}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <ScoreGauge
                    score={activeConfidence.overallScore ?? activeConfidence.overall_score ?? activeConfidence.confidence_score ?? 0}
                    label="Confidence Score"
                    size="md"
                    showGrade={true}
                  />
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}>
                  <div style={{
                    padding: "16px 20px",
                    borderRadius: "12px",
                    textAlign: "center",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{
                      fontFamily: "'Geist', 'Inter', sans-serif",
                      fontSize: "22px", fontWeight: "800", color: "#ffffff",
                      letterSpacing: "-0.02em",
                    }}>
                      {activeConfidence.totalFillers ?? activeConfidence.total_fillers ?? activeConfidence.total_filler_words ?? 0}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                      Total Fillers
                    </div>
                  </div>
                  <div style={{
                    padding: "16px 20px",
                    borderRadius: "12px",
                    textAlign: "center",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{
                      fontFamily: "'Geist', 'Inter', sans-serif",
                      fontSize: "22px", fontWeight: "800", color: "#ffffff",
                      letterSpacing: "-0.02em",
                    }}>
                      {confidenceAnswers.length || questionBreakdown.length || 0}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                      Answers
                    </div>
                  </div>
                </div>
              </div>

              {/* Confidence progress bar */}
              {(() => {
                const confScore = activeConfidence.overallScore ?? activeConfidence.overall_score ?? activeConfidence.confidence_score ?? 0;
                const confColor = getScoreColor(confScore);
                return (
                  <div style={{
                    height: "6px",
                    borderRadius: "999px",
                    overflow: "hidden",
                    marginBottom: "20px",
                    background: "rgba(255,255,255,0.04)",
                  }}>
                    <div style={{
                      height: "100%",
                      borderRadius: "999px",
                      width: `${confScore}%`,
                      background: `linear-gradient(90deg, ${confColor}, ${confColor}88)`,
                      transition: "width 0.7s ease",
                    }} />
                  </div>
                );
              })()}

              {/* Filler Words */}
              {(Object.keys(activeConfidence.filler_frequency || activeConfidence.most_used_fillers || {}).length > 0) && (
                <div style={{ marginBottom: "20px" }}>
                  <p style={{
                    fontSize: "11px", fontWeight: "700",
                    textTransform: "uppercase", letterSpacing: "0.5px",
                    color: "rgba(255,255,255,0.25)",
                    marginBottom: "10px",
                  }}>Filler Words Used</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {Object.entries(activeConfidence.filler_frequency || activeConfidence.most_used_fillers || {})
                      .sort((a, b) => b[1] - a[1])
                      .map(([word, count]) => (
                        <div key={word} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          background: "rgba(245,158,11,0.06)",
                          border: "1px solid rgba(245,158,11,0.1)",
                        }}>
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "#f59e0b" }}>"{word}"</span>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: "800",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: "rgba(245,158,11,0.1)",
                            color: "#f59e0b",
                          }}>×{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Per-answer confidence bars */}
              {confidenceAnswers.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <p style={{
                    fontSize: "11px", fontWeight: "700",
                    textTransform: "uppercase", letterSpacing: "0.5px",
                    color: "rgba(255,255,255,0.25)",
                    marginBottom: "12px",
                  }}>Confidence per Answer</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {confidenceAnswers.map((ans, i) => {
                      const s = ans.score || ans.confidence_score || 0;
                      const c = getScoreColor(s);
                      const fillers = ans.filler_words_found || ans.filler_words || [];
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{
                            fontSize: "11px",
                            fontFamily: "'Geist', monospace",
                            width: "24px",
                            flexShrink: 0,
                            color: "rgba(255,255,255,0.25)",
                          }}>Q{i + 1}</span>
                          <div style={{
                            flex: 1,
                            height: "6px",
                            borderRadius: "999px",
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.04)",
                          }}>
                            <div style={{
                              height: "100%",
                              borderRadius: "999px",
                              background: c,
                              width: `${s}%`,
                              transition: "width 0.5s ease",
                            }} />
                          </div>
                          <span style={{
                            fontSize: "12px",
                            fontWeight: "700",
                            width: "32px",
                            textAlign: "right",
                            flexShrink: 0,
                            color: c,
                          }}>{s}</span>
                          {fillers.length > 0 && (
                            <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                              {fillers.slice(0, 2).map((fw) => (
                                <span key={fw} style={{
                                  fontSize: "10px",
                                  padding: "1px 5px",
                                  borderRadius: "3px",
                                  background: "rgba(245,158,11,0.06)",
                                  color: "#f59e0b",
                                }}>{fw}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Communication tips */}
              {(activeConfidence.tips || activeConfidence.improvement_tips || []).length > 0 && (
                <div style={{
                  paddingTop: "16px",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <p style={{
                    fontSize: "11px", fontWeight: "700",
                    textTransform: "uppercase", letterSpacing: "0.5px",
                    color: "rgba(255,255,255,0.25)",
                    marginBottom: "10px",
                  }}>Communication Tips</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(activeConfidence.tips || activeConfidence.improvement_tips || []).map((tip, i) => (
                      <div key={i} style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        fontSize: "12px",
                        lineHeight: "1.6",
                        color: "rgba(255,255,255,0.55)",
                      }}>
                        <span style={{ color: "#2563eb", flexShrink: 0 }}>→</span>
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ RECORDING ═══ */}
        {audioUrl && (
          <div style={{
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <h4 style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.6)",
              marginBottom: "14px",
            }}>Interview Recording</h4>
            <audio controls src={audioUrl} style={{ width: "100%", marginBottom: "12px" }} />
            {onDownload && (
              <button
                onClick={onDownload}
                style={{
                  padding: "8px 18px",
                  fontSize: "13px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                ⬇ Download Recording
              </button>
            )}
          </div>
        )}

        {/* ═══ BOTTOM ACTIONS ═══ */}
        <div style={{
          display: "flex",
          gap: "12px",
          paddingBottom: "32px",
        }}>
          <button
            onClick={onReset}
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: "14px",
              fontWeight: "700",
              color: "white",
              fontSize: "14px",
              fontFamily: "'Geist', 'Inter', sans-serif",
              letterSpacing: "-0.01em",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 0 30px rgba(37,99,235,0.25)",
              transition: "all 0.2s ease",
            }}
          >
            Start New Interview →
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            style={{
              padding: "16px 32px",
              borderRadius: "14px",
              fontWeight: "600",
              fontSize: "14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
