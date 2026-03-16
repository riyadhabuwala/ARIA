import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ThemeToggle from "../components/ThemeToggle";

// ── NAVBAR ───────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(0,0,0,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 0 20px rgba(37,99,235,0.4)",
            }}
          >
            AI
          </div>
          <span
            className="font-bold text-lg font-geist"
            style={{ color: "var(--text-primary)" }}
          >
            ARIA
          </span>
        </div>

        {/* Nav links — desktop only */}
        <div className="hidden md:flex items-center gap-8">
          {["Features", "How it works", "For Students"].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm transition-colors hover:text-white"
              style={{ color: "var(--text-muted)" }}
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 0 20px rgba(37,99,235,0.3)",
            }}
          >
            Get Started →
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── ANIMATED WAVEFORM (for hero) ─────────────────────────────
function HeroWaveform() {
  return (
    <div className="flex items-end justify-center gap-1 h-12">
      {Array.from({ length: 32 }).map((_, i) => {
        const heights = [
          20, 35, 55, 45, 60, 50, 70, 40, 55, 65, 45, 30, 50, 60, 40, 55, 70,
          45, 60, 50, 35, 55, 45, 65, 40, 55, 70, 45, 35, 55, 45, 30,
        ];
        return (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: "3px",
              height: `${heights[i]}%`,
              background: `rgba(37,99,235,${0.4 + (i % 3) * 0.2})`,
              animation: `wave-bar ${0.8 + (i % 4) * 0.2}s ease-in-out ${i * 0.05}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

// ── DASHBOARD MOCKUP ─────────────────────────────────────────
function DashboardMockup() {
  const mockSessions = [
    { domain: "Software Engineering", score: 85, grade: "Good", color: "#2563eb" },
    { domain: "Web Development", score: 72, grade: "Good", color: "#10b981" },
    { domain: "Data Science", score: 90, grade: "Excellent", color: "#f59e0b" },
  ];

  return (
    <div className="relative animate-float" style={{ width: "100%", maxWidth: "520px" }}>
      {/* Glow behind card */}
      <div
        className="absolute inset-0 rounded-2xl blur-3xl"
        style={{
          background: "radial-gradient(ellipse at center, rgba(37,99,235,0.2), transparent 70%)",
          transform: "scale(1.1)",
        }}
      />

      {/* Main card */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Window chrome */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-70" />
          <div className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
          <div
            className="ml-4 flex-1 h-6 rounded-md"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div className="flex items-center justify-center h-full">
              <span
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.25)",
                  fontFamily: "monospace",
                }}
              >
                aria-interviewer.vercel.app/dashboard
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  fontFamily: "Geist, Inter, sans-serif",
                }}
              >
                Welcome back 👋
              </h3>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                riya@example.com
              </p>
            </div>
            <div
              style={{
                padding: "6px 14px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 600,
                color: "white",
                boxShadow: "0 0 16px rgba(37,99,235,0.4)",
              }}
            >
              + New Interview
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Sessions", value: "12", color: "#fff" },
              { label: "Avg Score", value: "78", color: "#2563eb" },
              { label: "Best", value: "92", color: "#22c55e" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: stat.color,
                    fontFamily: "Geist, Inter, sans-serif",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Session cards */}
          <div className="space-y-2">
            {mockSessions.map((s, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: s.color,
                    }}
                  />
                  <span
                    style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.8)" }}
                  >
                    {s.domain}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      color: s.color,
                      fontFamily: "Geist, Inter, sans-serif",
                    }}
                  >
                    {s.score}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: s.color,
                      background: `${s.color}15`,
                      padding: "2px 8px",
                      borderRadius: "99px",
                    }}
                  >
                    {s.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Waveform strip */}
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "rgba(37,99,235,0.05)",
              border: "1px solid rgba(37,99,235,0.12)",
              borderRadius: "10px",
            }}
          >
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginBottom: "8px" }}>
              ARIA Interview Assistant · Speaking...
            </div>
            <HeroWaveform />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FEATURE CARD ─────────────────────────────────────────────
function FeatureCard({ icon, title, description, gradient, delay }) {
  return (
    <div
      className="card-shine rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 animate-fadeUp"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        animationDelay: delay,
        opacity: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent-border)";
        e.currentTarget.style.boxShadow = "var(--shadow-accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
        style={{ background: gradient }}
      >
        {icon}
      </div>
      <h3
        className="font-semibold text-base mb-2 font-geist"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
    </div>
  );
}

// ── STEP CARD ────────────────────────────────────────────────
function StepCard({ number, title, description, delay }) {
  return (
    <div className="relative animate-fadeUp" style={{ animationDelay: delay, opacity: 0 }}>
      {/* Connector line */}
      {number < 3 && (
        <div
          className="hidden md:block absolute top-8 left-[calc(100%+0px)] w-full h-px z-0"
          style={{
            background: "linear-gradient(90deg, var(--border-default), transparent)",
          }}
        />
      )}
      <div className="relative z-10 flex flex-col items-center text-center md:items-start md:text-left">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl mb-4 font-geist"
          style={{
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "white",
            boxShadow: "0 0 24px rgba(37,99,235,0.4)",
          }}
        >
          {number}
        </div>
        <h3
          className="font-semibold text-base mb-2 font-geist"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ── MAIN LANDING PAGE ────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "🎤",
      title: "Voice-Powered Interviews",
      description:
        "Answer questions naturally by speaking. ARIA listens, understands, and responds just like a real interviewer — no typing needed.",
      gradient: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))",
      delay: "0.1s",
    },
    {
      icon: "🧠",
      title: "Adaptive AI Questioning",
      description:
        "Strong answer? ARIA goes deeper. Weak answer? It follows up with a clarifying question. Every interview is uniquely tailored to you.",
      gradient: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
      delay: "0.15s",
    },
    {
      icon: "📊",
      title: "Detailed Performance Reports",
      description:
        "Get scored on Technical Knowledge, Communication, Problem Solving, and Confidence — with specific feedback on every answer.",
      gradient: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
      delay: "0.2s",
    },
    {
      icon: "💼",
      title: "AI Job Matching",
      description:
        "Upload your resume and our agent scans Indian job portals — LinkedIn, Indeed, Naukri — returning the top 10 matches ranked by fit.",
      gradient: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))",
      delay: "0.25s",
    },
    {
      icon: "🎓",
      title: "Personal Career Coach",
      description:
        "An AI coach that knows your full history — scores, weak areas, job gaps. Ask it anything: study plans, resume advice, career strategy.",
      gradient: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))",
      delay: "0.3s",
    },
    {
      icon: "📋",
      title: "Resume Quality Score",
      description:
        "AI analyses your resume for ATS compatibility, missing sections, and keyword gaps — then connects it to your actual job match results.",
      gradient: "linear-gradient(135deg, rgba(20,184,166,0.15), rgba(20,184,166,0.05))",
      delay: "0.35s",
    },
  ];

  const steps = [
    {
      number: 1,
      title: "Upload Your Resume",
      description:
        "Upload your PDF resume. ARIA extracts your skills, experience, and profile to personalise everything.",
      delay: "0.1s",
    },
    {
      number: 2,
      title: "Practice Interviews",
      description:
        "Choose a domain, speak your answers, get per-answer feedback in real time from an adaptive AI interviewer.",
      delay: "0.2s",
    },
    {
      number: 3,
      title: "Get Hired Faster",
      description:
        "Track your scores over time, fix your weak areas, match with real jobs — all from one platform.",
      delay: "0.3s",
    },
  ];

  const stats = [
    { value: "6", label: "Interview Domains" },
    { value: "10+", label: "Feedback Categories" },
    { value: "AI", label: "Powered by Groq" },
    { value: "∞", label: "Practice Sessions" },
  ];

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      <Navbar />

      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section className="hero-grid noise relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Blue radial glow */}
        <div className="hero-radial absolute inset-0 pointer-events-none" />

        {/* Side glows */}
        <div
          className="absolute top-1/3 left-0 w-72 h-72 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(37,99,235,0.08)" }}
        />
        <div
          className="absolute top-1/2 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(37,99,235,0.05)" }}
        />

        <div className="max-w-6xl mx-auto px-6 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div>
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 animate-fadeUp"
                style={{
                  background: "rgba(37,99,235,0.08)",
                  border: "1px solid rgba(37,99,235,0.2)",
                  color: "#60a5fa",
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                AI-Powered Interview Practice
              </div>

              {/* Headline */}
              <h1 className="font-geist text-5xl lg:text-7xl font-bold leading-none tracking-tight mb-6 animate-fadeUp stagger-1">
                <span style={{ color: "var(--text-primary)" }}>Ace your next</span>
                <br />
                <span className="gradient-text">interview</span>
              </h1>

              {/* Subtext */}
              <p
                className="text-lg leading-relaxed mb-8 animate-fadeUp stagger-2 max-w-lg"
                style={{ color: "var(--text-secondary)" }}
              >
                Practice with an AI interviewer that adapts to your answers, gives real feedback,
                and helps you land the job — all in your voice.
              </p>

              {/* CTAs */}
              <div className="flex items-center gap-4 animate-fadeUp stagger-3">
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    boxShadow:
                      "0 0 30px rgba(37,99,235,0.4), 0 4px 16px rgba(0,0,0,0.4)",
                  }}
                >
                  Start Practicing Free →
                </button>
                <a
                  href="#how-it-works"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold transition-all hover:opacity-80"
                  style={{
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  See how it works
                </a>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-6 mt-8 animate-fadeUp stagger-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {["🧑‍💻", "👩‍🎓", "👨‍💼", "👩‍💻"].map((emoji, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2"
                        style={{
                          background: "var(--bg-elevated)",
                          borderColor: "var(--bg-base)",
                        }}
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Built for students & job seekers
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {"★★★★★".split("").map((s, i) => (
                    <span key={i} className="text-yellow-400 text-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Dashboard mockup */}
            <div className="hidden lg:flex justify-end animate-slideInRight">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <section
        style={{
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-geist text-3xl font-bold mb-1 gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES SECTION
      ══════════════════════════════════════════ */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{
                background: "var(--accent-subtle)",
                border: "1px solid var(--accent-border)",
                color: "var(--accent-light)",
              }}
            >
              Everything you need
            </div>
            <h2
              className="font-geist text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Built for serious candidates
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Not just mock questions. A complete interview preparation system with AI at every
              step.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="py-24"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{
                background: "var(--accent-subtle)",
                border: "1px solid var(--accent-border)",
                color: "var(--accent-light)",
              }}
            >
              Simple process
            </div>
            <h2
              className="font-geist text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              How it works
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              From zero to interview-ready in three steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {steps.map((step, i) => (
              <StepCard key={i} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOR STUDENTS SECTION
      ══════════════════════════════════════════ */}
      <section
        id="for-students"
        className="py-24"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div
            className="rounded-3xl overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, #0a1628 0%, #0f1f3d 100%)",
              border: "1px solid rgba(37,99,235,0.2)",
            }}
          >
            {/* Background glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 50%, rgba(37,99,235,0.15), transparent 60%)",
              }}
            />

            <div className="relative z-10 p-12 md:p-16">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
                    style={{
                      background: "rgba(37,99,235,0.15)",
                      border: "1px solid rgba(37,99,235,0.3)",
                      color: "#60a5fa",
                    }}
                  >
                    🎓 For Students & Freshers
                  </div>
                  <h2 className="font-geist text-4xl font-bold mb-4" style={{ color: "#ffffff" }}>
                    Practice makes
                    <span className="gradient-text"> perfect</span>
                  </h2>
                  <p
                    className="text-lg leading-relaxed mb-8"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    Whether you're a fresher or have years of experience, ARIA adapts to your
                    level and helps you get confident for real interviews.
                  </p>
                  <button
                    onClick={() => navigate("/login")}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                      boxShadow: "0 0 30px rgba(37,99,235,0.5)",
                    }}
                  >
                    Start for free →
                  </button>
                </div>

                {/* Checklist */}
                <div className="space-y-4">
                  {[
                    "Practice unlimited interviews across 6 domains",
                    "Get real feedback on every single answer",
                    "Track your improvement with analytics charts",
                    "Find matching jobs from Indian portals",
                    "Get your resume scored and improved by AI",
                    "Personal career coach available 24/7",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(37,99,235,0.2)" }}
                      >
                        <span style={{ fontSize: "10px", color: "#60a5fa" }}>✓</span>
                      </div>
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════════ */}
      <section className="py-24" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2
            className="font-geist text-5xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Ready to start?
          </h2>
          <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
            Join thousands of students practicing smarter. Free to use, no credit card required.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-4 rounded-xl font-bold text-lg text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow:
                "0 0 40px rgba(37,99,235,0.4), 0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            Get Started for Free →
          </button>
          <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
            No credit card · No setup · Start in 30 seconds
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
              >
                AI
              </div>
              <span className="font-bold font-geist" style={{ color: "var(--text-primary)" }}>
                ARIA
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                AI Recruitment Interview Assistant
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              {["Features", "How it works", "Sign In"].map((link) => (
                <a
                  key={link}
                  href={
                    link === "Sign In"
                      ? "/login"
                      : `#${link.toLowerCase().replace(/\s+/g, "-")}`
                  }
                  className="text-xs transition-colors hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                  onClick={(e) => {
                    if (link === "Sign In") {
                      e.preventDefault();
                      navigate("/login");
                    }
                  }}
                >
                  {link}
                </a>
              ))}
            </div>

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Built with ❤️ for students in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
