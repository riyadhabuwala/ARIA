import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signUp } from "../api/authApi";
import ThemeToggle from "./ThemeToggle";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "login") {
        const data = await signIn(email, password);
        if (onAuth) onAuth(data.user);
      } else {
        await signUp(email, password);
        setSuccess("Account created! Check your email to confirm.");
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    { icon: "🎤", title: "Voice Interviews", desc: "Speak naturally, no typing" },
    { icon: "🧠", title: "AI-Adaptive", desc: "Questions tailored to you" },
    { icon: "📊", title: "Real Feedback", desc: "Detailed performance reports" },
    { icon: "💼", title: "Job Matching", desc: "Find roles on Indian portals" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #020817 0%, #0a1628 60%, #0f1f3d 100%)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(rgba(37,99,235,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(37,99,235,0.08) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glow orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(37,99,235,0.12)" }}
        />
        <div
          className="absolute bottom-1/4 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(96,165,250,0.06)" }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm font-geist"
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 0 24px rgba(37,99,235,0.5)",
            }}
          >
            AI
          </div>
          <span className="font-bold text-xl font-geist text-white">ARIA</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="font-geist text-4xl font-bold text-white leading-tight mb-3">
              Ace your next
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #60a5fa, #2563eb)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                interview
              </span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "15px" }}>
              AI-powered practice with real feedback, voice interviews, and job matching.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3.5 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    background: "rgba(37,99,235,0.15)",
                    border: "1px solid rgba(37,99,235,0.25)",
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{f.title}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          Built for students and job seekers in India
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col" style={{ background: "var(--bg-base)" }}>
        {/* Top bar */}
        <div className="flex justify-between items-center p-6">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
              style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
            >
              AI
            </div>
            <span className="font-bold font-geist" style={{ color: "var(--text-primary)" }}>
              ARIA
            </span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate("/")}
              className="text-sm transition-all hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-sm">
            <h2
              className="font-geist text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
              {mode === "login"
                ? "Sign in to continue your practice"
                : "Start practicing interviews for free"}
            </p>

            {/* Mode tabs */}
            <div
              className="flex p-1 rounded-xl mb-6"
              style={{
                background: "var(--bg-overlay)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError("");
                    setSuccess("");
                  }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={{
                    background: mode === m ? "var(--bg-surface)" : "transparent",
                    color: mode === m ? "var(--text-primary)" : "var(--text-muted)",
                    boxShadow: mode === m ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-5">
              {[
                {
                  label: "Email",
                  type: "email",
                  value: email,
                  set: setEmail,
                  placeholder: "you@example.com",
                },
                {
                  label: "Password",
                  type: "password",
                  value: password,
                  set: setPassword,
                  placeholder: "••••••••",
                },
              ].map((field) => (
                <div key={field.label}>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      background: "var(--bg-overlay)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                      e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border-default)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              ))}

              {/* Messages */}
              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "var(--danger-subtle)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "var(--danger)",
                  }}
                >
                  {error}
                </div>
              )}
              {success && (
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "var(--success-subtle)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    color: "var(--success)",
                  }}
                >
                  {success}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  boxShadow: "0 0 24px rgba(37,99,235,0.3)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                      />
                    </svg>
                    {mode === "login" ? "Signing in..." : "Creating..."}
                  </span>
                ) : mode === "login" ? (
                  "Sign In →"
                ) : (
                  "Create Account →"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
