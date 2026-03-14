import { useEffect, useState, useMemo } from "react";
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

  const stats = [
    { label: "Total Sessions", value: totalInterviews, color: "var(--text-primary)" },
    { label: "Average Score", value: avgScore ? `${avgScore}` : "—", color: "var(--accent-primary)" },
    { label: "Best Score", value: bestScore ? `${bestScore}` : "—", color: "var(--success)" },
    { label: "Top Domain", value: mostPracticed || "—", color: "var(--warning)", small: true },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>

      {/* ── TOP NAV ── */}
      <nav className="sticky top-0 z-50 px-6 py-4 flex items-center
                      justify-between"
           style={{
             background: "var(--bg-surface)",
             borderBottom: "1px solid var(--border-subtle)",
             backdropFilter: "blur(12px)",
           }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center
                          font-bold text-white text-xs"
               style={{ background: "var(--accent-primary)" }}>
            AI
          </div>
          <span className="font-semibold text-lg heading-font"
                style={{ color: "var(--text-primary)" }}>
            ARIA
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={onJobMatch}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            Job Match
          </button>
          <button
            onClick={onNewInterview}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
                       text-sm font-semibold text-white transition-all
                       hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "var(--shadow-accent)",
            }}>
            <span>+</span> New Interview
          </button>
          <button
            onClick={signOut}
            className="px-4 py-2 rounded-lg text-sm font-medium
                       transition-all hover:opacity-80"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── GREETING ── */}
        <div className="mb-8 animate-fadeUp">
          <h1 className="text-3xl font-bold heading-font mb-1"
              style={{ color: "var(--text-primary)" }}>
            Welcome back 👋
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {user.email}
          </p>
        </div>

        {/* ── STATS STRIP ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`rounded-xl p-5 animate-fadeUp stagger-${i + 1}`}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}>
              <div className={`text-3xl font-bold mb-1 heading-font ${s.small ? "text-xl" : ""}`}
                   style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-xs font-medium"
                   style={{ color: "var(--text-muted)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── TAB BAR ── */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
             style={{
               background: "var(--bg-overlay)",
               border: "1px solid var(--border-subtle)",
             }}>
          {["history", "analytics"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold
                         capitalize transition-all duration-200"
              style={{
                background: tab === t ? "var(--bg-surface)" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: tab === t ? "var(--shadow-sm)" : "none",
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-40 rounded-xl animate-pulse"
                       style={{ background: "var(--bg-surface)" }} />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-24 animate-fadeIn">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-bold mb-2 heading-font"
                    style={{ color: "var(--text-primary)" }}>
                  No interviews yet
                </h3>
                <p className="text-sm mb-6"
                   style={{ color: "var(--text-secondary)" }}>
                  Start your first practice interview to see your history here.
                </p>
                <button
                  onClick={onNewInterview}
                  className="px-6 py-3 rounded-xl text-sm font-semibold
                             text-white transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                  }}>
                  Start First Interview
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((s, i) => (
                  <HistoryCard
                    key={s.id}
                    session={s}
                    onView={() => onViewSession(s)}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === "analytics" && (
          <AnalyticsCharts userId={user.id} />
        )}
      </div>
    </div>
  );
}
