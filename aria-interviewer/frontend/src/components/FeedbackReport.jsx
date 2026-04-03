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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <div className="text-center animate-in fade-in duration-700">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-geist font-black text-white text-sm bg-[var(--accent-primary)] mx-auto mb-4 animate-pulse">AI</div>
          <p className="text-[var(--text-muted)] text-sm font-geist tracking-widest uppercase">Loading Report...</p>
        </div>
      </div>
    );
  }

  if (!activeReport) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <p className="text-[var(--text-muted)] font-geist">No report data available.</p>
      </div>
    );
  }

  const hiringStyles = {
    "Strong Yes": { color: "var(--success)", glow: "var(--success)44" },
    Yes: { color: "var(--success)", glow: "var(--success)44" },
    Maybe: { color: "var(--warning)", glow: "var(--warning)44" },
    No: { color: "var(--danger)", glow: "var(--danger)44" },
  };

  const hs = hiringStyles[activeReport.hiring_recommendation] || { color: "var(--text-muted)", glow: "transparent" };

  const sections = activeReport.sections || activeReport.section_scores || activeReport.sectionScores || {};
  const strengths = activeReport.strengths || activeReport.top_strengths || activeReport.topStrengths || [];
  const improvements = activeReport.improvement_areas || activeReport.improvementAreas || [];
  const questionBreakdown = activeReport.question_breakdown || activeReport.questionBreakdown || activeReport.questions || [];
  const confidenceAnswers = activeConfidence?.answers || activeConfidence?.per_answer_breakdown || activeConfidence?.perAnswerBreakdown || [];
  const sectionOrder = ["technical_knowledge", "communication", "problem_solving", "confidence"];

  const getScoreColor = (s) => {
    if (s >= 80) return "var(--success)";
    if (s >= 60) return "var(--accent-primary)";
    if (s >= 40) return "var(--warning)";
    return "var(--danger)";
  };

  // Section card component
  const SectionCard = ({ icon, label, score, feedback }) => {
    const color = getScoreColor(score);
    return (
      <div className="card-premium p-6 group transition-all duration-500 hover:-translate-y-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)]/10 transition-colors">
            {icon}
          </div>
          <span className="text-sm font-geist font-bold text-[var(--text-primary)] uppercase tracking-wider">{label}</span>
        </div>

        <div className="flex justify-center mb-6">
          <ScoreGauge score={score} size="sm" showGrade={false} />
        </div>

        <p className="text-xs leading-relaxed text-[var(--text-muted)] text-center italic opacity-80 group-hover:opacity-100 transition-opacity">
          {feedback || "Analysis pending for this domain."}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-inter pb-20 selection:bg-[var(--accent-primary)]/30">
      {/* ═══ NAVBAR ═══ */}
      <nav className="sticky top-0 z-50 bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="max-w-[1000px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-geist font-black text-white text-[10px] bg-[var(--accent-primary)] shadow-[0_0_20px_rgba(37,99,235,0.4)]">AI</div>
            <span className="font-geist font-black text-lg tracking-tighter italic">ARIA</span>
            <div className="w-[1px] h-4 bg-[var(--border-subtle)]" />
            <span className="text-xs font-geist text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-60">Performance Report</span>
          </div>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-4 py-2 rounded-lg text-xs font-geist font-bold bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-all flex items-center gap-2"
          >
            <span>←</span> DASHBOARD
          </button>
        </div>
      </nav>

      <main className="max-w-[1000px] mx-auto px-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* ═══ SCORE HERO ═══ */}
        <section className="relative rounded-[2rem] overflow-hidden mb-12 group border border-[var(--hero-border)] shadow-xl">
          {/* Immersive Background */}
          <div className="absolute inset-0 bg-[var(--hero-bg)] transition-colors duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-transparent opacity-50" />
          
          {/* Animated Glows */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[var(--accent-primary)] opacity-[0.03] blur-[120px] rounded-full group-hover:opacity-[0.07] transition-opacity duration-1000" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[var(--accent-primary)] opacity-[0.03] blur-[120px] rounded-full group-hover:opacity-[0.07] transition-opacity duration-1000" />

          {/* Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.02] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(var(--text-muted) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

          <div className="relative z-10 px-8 py-16 md:py-20 flex flex-col items-center">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              {activeReport.partial_interview && (
                <div className="px-4 py-1.5 rounded-full text-[10px] font-geist font-black bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] uppercase tracking-[0.1em]">
                  ⚠️ Partial Session
                </div>
              )}
              {activeReport.domain && (
                <div className="px-4 py-1.5 rounded-full text-[10px] font-geist font-black bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] uppercase tracking-[0.1em]">
                  {activeReport.domain}
                </div>
              )}
              {resolvedDuration > 0 && (
                <div className="px-4 py-1.5 rounded-full text-[10px] font-geist font-black bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-[0.1em]">
                  ⏱ {Math.floor(resolvedDuration / 60)}m {Math.floor(resolvedDuration % 60)}s
                </div>
              )}
            </div>

            {/* Main Score */}
            <div className="mb-12 scale-110 md:scale-125 transition-transform duration-700">
              <ScoreGauge
                score={activeReport.overall_score || 0}
                label="Overall Performance"
                size="lg"
                showGrade={true}
              />
            </div>

            {/* Recommendation */}
            <div className="flex flex-col items-center gap-6">
              {activeReport.hiring_recommendation && (
                <div 
                  className="px-8 py-3 rounded-2xl font-geist font-black text-sm tracking-widest uppercase italic transition-all duration-500 border"
                  style={{ 
                    borderColor: `${hs.color}33`, 
                    color: hs.color,
                    background: `${hs.color}08`,
                    boxShadow: `0 0 40px ${hs.glow}`
                  }}
                >
                  {activeReport.hiring_recommendation}
                </div>
              )}
              
              {activeReport.summary && (
                <p className="max-w-xl text-center text-sm md:text-base leading-relaxed text-[var(--text-muted)] opacity-70 font-inter px-4 italic">
                  "{activeReport.summary}"
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ═══ SKILL BREAKDOWN ═══ */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-geist font-black text-xl tracking-tighter lowercase italic">
              <span className="text-[var(--accent-primary)] opacity-50 mr-2 opacity-30 italic">01.</span>
              skill breakdown
            </h2>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--border-subtle)] to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sectionOrder.map((key) => {
              const data = sections?.[key] || {};
              const s = typeof data.score === "number" ? data.score : 0;
              const label = {
                technical_knowledge: "Technical",
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
        </section>

        {/* ═══ STRENGTHS & IMPROVEMENTS ═══ */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Strengths */}
          <div className="card-premium p-8 border-l-4 border-l-[var(--success)]">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-[var(--success)]/10 text-[var(--success)]">✦</div>
              <h3 className="font-geist font-black text-lg tracking-tight uppercase">Key Strengths</h3>
            </div>
            <div className="space-y-4">
              {strengths.map((s, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--success)] group-hover:scale-150 transition-transform flex-shrink-0" />
                  <p className="text-sm leading-relaxed text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div className="card-premium p-8 border-l-4 border-l-[var(--warning)]">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-[var(--warning)]/10 text-[var(--warning)]">△</div>
              <h3 className="font-geist font-black text-lg tracking-tight uppercase">Expansion Areas</h3>
            </div>
            <div className="space-y-4">
              {improvements.map((imp, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--warning)] group-hover:scale-150 transition-transform flex-shrink-0" />
                  <p className="text-sm leading-relaxed text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">{imp}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ QUESTION BREAKDOWN ═══ */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-geist font-black text-xl tracking-tighter lowercase italic">
              <span className="text-[var(--accent-primary)] opacity-50 mr-2 opacity-30 italic">02.</span>
              precision analysis
            </h2>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--border-subtle)] to-transparent" />
          </div>

          <div className="space-y-4">
            {questionBreakdown.map((item, i) => {
              const score = item?.score || 0;
              const scaled = score * 10;
              const sc = getScoreColor(scaled);
              const confidenceAnswer = confidenceAnswers[i];

              return (
                <details key={i} className="group card-glass overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/30 transition-all duration-300">
                  <summary className="list-none cursor-pointer p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-geist font-black text-xs bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-all">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <h4 className="flex-1 text-[15px] font-bold text-[var(--text-primary)] font-geist leading-snug group-hover:text-[var(--accent-primary)] transition-colors">
                          {item.question}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-6 self-end md:self-auto">
                        <div className="flex flex-col items-center">
                          <div className="flex items-baseline gap-1">
                            <span className="font-geist font-black text-3xl italic tracking-tighter" style={{ color: sc }}>{score}</span>
                            <span className="text-[10px] font-geist font-black opacity-30 text-[var(--text-muted)] tracking-widest uppercase">/10</span>
                          </div>
                          <div className="w-20 h-1 rounded-full bg-[var(--bg-surface-secondary)] mt-1 overflow-hidden">
                            <div className="h-full bg-current transition-all duration-1000 ease-out" 
                                 style={{ width: `${score * 10}%`, backgroundColor: sc }} />
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] group-open:rotate-180 transition-transform">
                          <span className="text-[10px]">▼</span>
                        </div>
                      </div>
                    </div>
                  </summary>

                  <div className="px-6 pb-8 border-t border-[var(--border-subtle)]/30 pt-8 animate-in fade-in slide-in-from-top-2 duration-300 space-y-8">
                    {/* Your Answer */}
                    {item.answer_summary && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-geist font-black uppercase tracking-[0.25em] text-[var(--accent-primary)] opacity-60">Session Output</label>
                        <div className="p-6 rounded-2xl bg-[var(--bg-surface-secondary)]/50 border border-[var(--border-subtle)] italic text-sm leading-relaxed text-[var(--text-muted)] font-inter">
                          "{item.answer_summary}"
                        </div>
                      </div>
                    )}

                    {/* Technical Feedback */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.what_was_good && (
                        <div className="p-5 rounded-2xl bg-[var(--success)]/5 border border-[var(--success)]/10 space-y-2">
                          <div className="flex items-center gap-2 text-[var(--success)] font-geist font-black text-[10px] tracking-widest uppercase">
                            <span>✓</span> Positive Vectors
                          </div>
                          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.what_was_good}</p>
                        </div>
                      )}
                      {item.what_was_missing && (
                        <div className="p-5 rounded-2xl bg-[var(--warning)]/5 border border-[var(--warning)]/10 space-y-2">
                          <div className="flex items-center gap-2 text-[var(--warning)] font-geist font-black text-[10px] tracking-widest uppercase">
                            <span>△</span> Deficit Points
                          </div>
                          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.what_was_missing}</p>
                        </div>
                      )}
                    </div>

                    {/* Ideal Hint */}
                    {item.ideal_answer_hint && (
                      <div className="p-5 rounded-2xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 space-y-2">
                        <div className="flex items-center gap-2 text-[var(--accent-primary)] font-geist font-black text-[10px] tracking-widest uppercase">
                          <span>💡</span> Optimized Pivot
                        </div>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed italic">{item.ideal_answer_hint}</p>
                      </div>
                    )}

                    {/* ARIA Final Feedback */}
                    {item.feedback && (
                      <div className="pt-4 border-t border-[var(--border-subtle)]/30">
                        <label className="text-[10px] font-geist font-black uppercase tracking-[0.25em] text-[var(--text-muted)] opacity-40 mb-3 block italic underline">ARIA Intelligence Debrief</label>
                        <p className="text-sm leading-relaxed text-[var(--text-primary)] opacity-80">{item.feedback}</p>
                      </div>
                    )}

                    {/* Confidence Sub-metrics */}
                    {confidenceAnswer && (
                      <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[var(--border-subtle)]/30">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-geist font-black uppercase tracking-[0.1em] text-[var(--text-muted)]">Voice Confidence</span>
                          <span className="font-geist font-black text-sm italic" style={{ color: getScoreColor(confidenceAnswer.score || 0) }}>
                            {(confidenceAnswer.score || 0)}/100
                          </span>
                        </div>
                        {(confidenceAnswer.filler_words || []).length > 0 && (
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-geist font-black uppercase tracking-[0.1em] text-[var(--text-muted)]">Filler Artifacts</span>
                            <div className="flex gap-2">
                              {(confidenceAnswer.filler_words || []).slice(0, 3).map((fw) => (
                                <span key={fw} className="px-2 py-0.5 rounded-md bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] text-[10px] font-geist font-black">
                                  #{fw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        {/* ═══ CONFIDENCE ANALYSIS ═══ */}
        {activeConfidence && (
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-geist font-black text-xl tracking-tighter lowercase italic">
                <span className="text-[var(--accent-primary)] opacity-50 mr-2 opacity-30 italic">03.</span>
                behavioral intelligence
              </h2>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--border-subtle)] to-transparent" />
            </div>

            <div className="card-premium p-10">
              <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20 mb-12">
                <ScoreGauge
                  score={activeConfidence.overall_score || 0}
                  label="Confidence Factor"
                  size="md"
                  showGrade={true}
                />
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="card-glass p-6 text-center border-b-2 border-b-[var(--warning)]/30">
                    <div className="font-geist font-black text-4xl italic tracking-tighter text-[var(--text-primary)] mb-1">
                      {activeConfidence.total_filler_words || 0}
                    </div>
                    <div className="text-[10px] font-geist font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50">
                      Verbal Fillers
                    </div>
                  </div>
                  <div className="card-glass p-6 text-center border-b-2 border-b-[var(--accent-primary)]/30">
                    <div className="font-geist font-black text-4xl italic tracking-tighter text-[var(--text-primary)] mb-1">
                      {confidenceAnswers.length || 0}
                    </div>
                    <div className="text-[10px] font-geist font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50">
                      Analyzed Blocks
                    </div>
                  </div>
                </div>
              </div>

              {/* Filler Breakdown */}
              {Object.keys(activeConfidence.filler_frequency || {}).length > 0 && (
                <div className="mb-12">
                  <p className="text-[10px] font-geist font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-40 mb-6 block">Filler Frequency Profile</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(activeConfidence.filler_frequency)
                      .sort((a, b) => b[1] - a[1])
                      .map(([word, count]) => (
                        <div key={word} className="flex items-center gap-2 group">
                          <div className="px-4 py-2 rounded-xl bg-black/40 border border-[var(--border-subtle)] group-hover:border-[var(--warning)]/50 transition-all">
                            <span className="text-xs font-geist font-bold text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">"{word}"</span>
                            <span className="ml-3 text-[10px] font-geist font-black text-[var(--warning)] opacity-60">×{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Comm Tips */}
              {(activeConfidence.improvement_tips || []).length > 0 && (
                <div className="pt-10 border-t border-[var(--border-subtle)]">
                  <p className="text-[10px] font-geist font-black uppercase tracking-[0.2em] text-[var(--accent-primary)] mb-6 block">Growth Vectors</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeConfidence.improvement_tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-[var(--bg-surface-secondary)]/30 border border-[var(--border-subtle)]">
                        <span className="text-[var(--accent-primary)] font-bold">→</span>
                        <p className="text-xs leading-relaxed text-[var(--text-muted)]">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ RECORDING ═══ */}
        {audioUrl && (
          <section className="mb-16">
            <div className="card-premium p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 w-full">
                <h4 className="text-[10px] font-geist font-black uppercase tracking-[0.25em] text-[var(--text-muted)] mb-6 opacity-40">Acoustic Session Record</h4>
                <audio controls src={audioUrl} className="w-full h-10 [filter:invert(0.9)_hue-rotate(180deg)]" />
              </div>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="w-full md:w-auto px-8 py-4 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] font-geist font-black text-xs tracking-widest uppercase hover:border-[var(--text-primary)] transition-all"
                >
                  Download Master .webm
                </button>
              )}
            </div>
          </section>
        )}

        {/* ═══ BOTTOM ACTIONS ═══ */}
        <div className="flex flex-col md:flex-row gap-4 mt-20 pt-10 border-t border-[var(--border-subtle)]">
          <button
            onClick={onReset}
            className="flex-[2] py-5 rounded-[1.5rem] font-geist font-black text-sm tracking-[0.2em] uppercase italic bg-[var(--accent-primary)] text-white shadow-[0_0_50px_rgba(37,99,235,0.3)] hover:shadow-[0_0_70px_rgba(37,99,235,0.5)] transition-all transform hover:-translate-y-1 active:scale-[0.98]"
          >
            initiate next trial →
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex-1 py-5 rounded-[1.5rem] font-geist font-black text-sm tracking-[0.1em] uppercase bg-[var(--bg-surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white hover:border-[var(--text-muted)] transition-all"
          >
            Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
