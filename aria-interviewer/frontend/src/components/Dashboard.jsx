import { useEffect, useState } from "react";
import { signOut } from "../api/authApi";
import { getHistory } from "../api/interviewApi";
import HistoryCard from "./HistoryCard";
import AnalyticsCharts from "./AnalyticsCharts";
import ThemeToggle from "./ThemeToggle";

export default function Dashboard({ user, onNewInterview, onViewSession, onJobMatch }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("history");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory(user.id);
        setSessions(data.sessions || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.id]);

  const totalInterviews = sessions.length;
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.overall_score || 0), 0) / sessions.length)
    : 0;
  const bestScore = sessions.length
    ? Math.max(...sessions.map((s) => s.overall_score || 0))
    : 0;
  const mostPracticed = sessions.length
    ? Object.entries(
        sessions.reduce((acc, s) => {
          acc[s.domain] = (acc[s.domain] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  return (
    <div className="min-h-screen dashboard-shell">
      <div className="dashboard-bg" aria-hidden="true">
        <div className="dash-orb orb-a" />
        <div className="dash-orb orb-b" />
        <div className="dash-orb orb-c" />
        <div className="dash-grid" />
      </div>
      {/* ── NAVBAR ── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs font-geist"
              style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                boxShadow: "0 0 16px rgba(37,99,235,0.4)",
              }}
            >
              AI
            </div>
            <span className="font-bold font-geist" style={{ color: "var(--text-primary)" }}>
              ARIA
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={onJobMatch}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              Job Match
            </button>
            <button
              onClick={onNewInterview}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                boxShadow: "0 0 20px rgba(37,99,235,0.3)",
              }}
            >
              + New Interview
            </button>
            <button
              onClick={signOut}
              className="px-4 py-2 rounded-lg text-sm transition-all hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 dashboard-content">
        {/* ── GREETING ── */}
        <div className="mb-10 dash-hero">
          <div className="dash-hero-left">
            <h1 className="font-geist text-4xl font-bold mb-2 dash-title" style={{ color: "var(--text-primary)" }}>
              Welcome back
              <span className="dash-wave" aria-hidden="true"> 👋</span>
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {user.email}
            </p>
          </div>
          <div className="dash-hero-right">
            <div className="dash-chip">Performance Hub</div>
            <div className="dash-subtitle">Your interview progress at a glance</div>
          </div>
        </div>

        {/* ── STATS STRIP ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "Total Sessions",
              value: totalInterviews,
              color: "var(--text-primary)",
              sub: null,
            },
            {
              label: "Average Score",
              value: avgScore ? `${avgScore}` : "—",
              color: "#2563eb",
              sub: avgScore >= 70 ? "On track" : avgScore > 0 ? "Keep going" : null,
            },
            {
              label: "Best Score",
              value: bestScore ? `${bestScore}` : "—",
              color: "var(--success)",
              sub: null,
            },
            {
              label: "Top Domain",
              value: mostPracticed || "—",
              color: "var(--text-primary)",
              sub: mostPracticed ? "Most practiced" : null,
              small: true,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`dash-stat-card animate-fadeUp stagger-${i + 1}`}
            >
              <div
                className={`font-geist font-bold mb-1 ${stat.small ? "text-lg" : "text-3xl"}`}
                style={{ color: stat.color, letterSpacing: "-0.03em" }}
              >
                {stat.value}
              </div>
              <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </div>
              {stat.sub && (
                <div className="text-xs mt-1 dash-stat-sub">
                  {stat.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── TAB BAR ── */}
        <div className="dash-tabs mb-6">
          {["history", "analytics"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`dash-tab ${tab === t ? "is-active" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-2xl animate-pulse"
                    style={{ background: "var(--bg-surface)" }}
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-24 animate-fadeIn">
                <div className="text-5xl mb-4">🎯</div>
                <h3
                  className="font-geist text-xl font-bold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  No interviews yet
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  Start your first practice interview to track your progress.
                </p>
                <button
                  onClick={onNewInterview}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    boxShadow: "0 0 20px rgba(37,99,235,0.3)",
                  }}
                >
                  Start First Interview →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sessions.map((s, i) => (
                  <div key={s.id} className="dash-history-card">
                    <HistoryCard session={s} onView={() => onViewSession(s)} index={i} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === "analytics" && <AnalyticsCharts userId={user.id} />}
      </div>
    </div>
  );
}
