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
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
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

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ── GREETING ── */}
        <div className="mb-8 animate-fadeUp">
          <h1
            className="font-geist text-3xl font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Welcome back 👋
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {user.email}
          </p>
        </div>

        {/* ── STATS STRIP ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
              className={`rounded-2xl p-5 transition-all duration-200 animate-fadeUp stagger-${i + 1}`}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
              }}
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
                <div className="text-xs mt-1" style={{ color: "var(--success)" }}>
                  {stat.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── TAB BAR ── */}
        <div
          className="flex gap-1 p-1 rounded-xl w-fit mb-6"
          style={{
            background: "var(--bg-overlay)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {["history", "analytics"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200"
              style={{
                background: tab === t ? "var(--bg-surface)" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: tab === t ? "var(--shadow-sm)" : "none",
              }}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((s, i) => (
                  <HistoryCard key={s.id} session={s} onView={() => onViewSession(s)} index={i} />
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
