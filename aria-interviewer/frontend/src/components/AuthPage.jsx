import { useState } from "react";
import { signIn, signUp } from "../api/authApi";
import ThemeToggle from "./ThemeToggle";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
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
    { icon: "🎤", title: "Voice-Powered", desc: "Natural conversation interviews" },
    { icon: "🧠", title: "AI-Adaptive", desc: "Questions tailored to your answers" },
    { icon: "📊", title: "Instant Feedback", desc: "Detailed performance reports" },
  ];

  return (
    <div className="min-h-screen flex"
         style={{ background: "var(--bg-base)" }}>

      {/* ── LEFT BRANDING PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12
                      relative overflow-hidden"
           style={{
             background: "linear-gradient(135deg, #1a1040 0%, #0f0a2e 50%, #0a0a1e 100%)",
             borderRight: "1px solid var(--border-subtle)"
           }}>

        {/* Ambient glow orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full
                        opacity-20 blur-3xl pointer-events-none"
             style={{ background: "var(--accent-primary)" }} />
        <div className="absolute bottom-32 right-10 w-56 h-56 rounded-full
                        opacity-10 blur-3xl pointer-events-none"
             style={{ background: "#3b82f6" }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center
                            justify-center font-bold text-white text-sm"
                 style={{ background: "var(--accent-primary)" }}>
              AI
            </div>
            <span className="text-white font-semibold text-xl">ARIA</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-5xl font-bold text-white leading-tight
                           heading-font mb-4">
              Ace your next<br />
              <span style={{ color: "var(--accent-hover)" }}>
                interview
              </span>
            </h1>
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.5)" }}>
              Practice with an AI interviewer that adapts to you
              and gives real feedback.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4 animate-fadeUp"
                   style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-10 h-10 rounded-lg flex items-center
                                justify-center text-lg flex-shrink-0"
                     style={{
                       background: "rgba(124,106,255,0.15)",
                       border: "1px solid rgba(124,106,255,0.2)"
                     }}>
                  {f.icon}
                </div>
                <div>
                  <div className="text-white font-medium text-sm">
                    {f.title}
                  </div>
                  <div className="text-xs"
                       style={{ color: "rgba(255,255,255,0.4)" }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-xs"
             style={{ color: "rgba(255,255,255,0.25)" }}>
          Trusted by students and job seekers worldwide
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col">

        {/* Top bar */}
        <div className="flex justify-end items-center p-6">
          <ThemeToggle />
        </div>

        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-sm animate-fadeUp">

            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 rounded-lg flex items-center
                              justify-center text-white text-xs font-bold"
                   style={{ background: "var(--accent-primary)" }}>
                AI
              </div>
              <span className="font-semibold"
                    style={{ color: "var(--text-primary)" }}>
                ARIA
              </span>
            </div>

            <h2 className="text-2xl font-bold mb-1 heading-font"
                style={{ color: "var(--text-primary)" }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm mb-8"
               style={{ color: "var(--text-secondary)" }}>
              {mode === "login"
                ? "Sign in to continue your interview practice"
                : "Start practicing interviews with AI today"}
            </p>

            {/* Mode tabs */}
            <div className="flex rounded-lg p-1 mb-6"
                 style={{
                   background: "var(--bg-overlay)",
                   border: "1px solid var(--border-subtle)"
                 }}>
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  className="flex-1 py-2 text-sm font-medium rounded-md
                             transition-all duration-200"
                  style={{
                    background: mode === m
                      ? "var(--bg-surface)" : "transparent",
                    color: mode === m
                      ? "var(--text-primary)" : "var(--text-muted)",
                    boxShadow: mode === m ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              {["Email", "Password"].map((label) => (
                <div key={label}>
                  <label className="block text-xs font-medium mb-1.5"
                         style={{ color: "var(--text-secondary)" }}>
                    {label}
                  </label>
                  <input
                    type={label === "Password" ? "password" : "email"}
                    value={label === "Email" ? email : password}
                    onChange={(e) =>
                      label === "Email"
                        ? setEmail(e.target.value)
                        : setPassword(e.target.value)
                    }
                    placeholder={
                      label === "Email"
                        ? "you@example.com"
                        : "••••••••"
                    }
                    className="w-full px-4 py-3 rounded-lg text-sm
                               outline-none transition-all duration-200"
                    style={{
                      background: "var(--bg-overlay)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-primary)",
                      caretColor: "var(--accent-primary)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--accent-primary)";
                      e.target.style.boxShadow =
                        "0 0 0 3px var(--accent-subtle)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border-default)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              ))}

              {/* Error / Success */}
              {error && (
                <div className="px-4 py-3 rounded-lg text-sm"
                     style={{
                       background: "var(--danger-subtle)",
                       border: "1px solid rgba(239,68,68,0.2)",
                       color: "var(--danger)"
                     }}>
                  {error}
                </div>
              )}
              {success && (
                <div className="px-4 py-3 rounded-lg text-sm"
                     style={{
                       background: "var(--success-subtle)",
                       border: "1px solid rgba(34,197,94,0.2)",
                       color: "var(--success)"
                     }}>
                  {success}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3 rounded-lg font-semibold text-sm
                           text-white transition-all duration-200
                           disabled:opacity-40 disabled:cursor-not-allowed
                           hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: loading
                    ? "var(--accent-secondary)"
                    : "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                  boxShadow: "var(--shadow-accent)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"
                         fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                              stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                    {mode === "login" ? "Signing in..." : "Creating..."}
                  </span>
                ) : (
                  mode === "login" ? "Sign In" : "Create Account"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
