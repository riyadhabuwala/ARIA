import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAnalytics } from "../api/analyticsApi";

export default function Analytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.id) {
      loadAnalytics();
    }
  }, [user?.id]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAnalytics(user.id);
      setAnalytics(data);
    } catch (err) {
      console.error("[Analytics] Failed to load:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--accent-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto"></div>
          <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs">CALCULATING METRICS</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "TOTAL SESSIONS", value: analytics?.total_interviews || 0, icon: "🎯", color: "blue" },
    { label: "AGGREGATE SCORE", value: `${Math.round(analytics?.average_score || 0)}%`, icon: "📊", color: "purple" },
    { label: "PEAK EFFICIENCY", value: `${analytics?.best_score || 0}%`, icon: "⭐", color: "green" },
    { label: "CONFIDENCE AVG", value: `${Math.round(analytics?.average_confidence || 0)}%`, icon: "💪", color: "orange" }
  ];

  const domainStats = (analytics?.domain_stats || []).reduce((acc, stat) => {
    acc[stat.domain] = { average_score: stat.avg_score, total_interviews: stat.count };
    return acc;
  }, {});
  const allDomains = Object.keys(domainStats).sort();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
      {/* Header */}
      <section>
        <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] font-geist mb-2 italic uppercase">
          PERFORMANCE ANALYTICS
        </h1>
        <p className="text-[var(--text-secondary)] font-medium">
          Comprehensive breakdown of your session efficiency and area-specific growth.
        </p>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[var(--danger-subtle)] border border-[var(--danger)]/20 rounded-2xl">
          <p className="text-[var(--danger)] text-sm font-bold flex items-center gap-2">
            <span>⚠️</span> {error}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="card-premium p-6 flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest group-hover:text-[var(--text-primary)] transition-colors">{stat.label}</span>
              <span className="text-2xl grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100">{stat.icon}</span>
            </div>
            <p className="text-3xl font-black text-[var(--text-primary)] font-geist italic">{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Domain Performance */}
      {allDomains.length > 0 ? (
        <section className="card-premium p-8">
          <h3 className="text-lg font-bold text-[var(--text-primary)] font-geist mb-8 uppercase tracking-widest italic">
            DOMAIN-SPECIFIC EFFICIENCY
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {allDomains.map((domain) => {
              const domainData = domainStats[domain];
              const avgScore = Math.round(domainData.average_score || 0);
              const interviews = domainData.total_interviews || 0;

              return (
                <div key={domain} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                      {domain}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                      {avgScore}% • {interviews} SES.
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-hover)] transition-all duration-1000"
                      style={{ width: `${avgScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="card-premium p-12 text-center space-y-6">
          <div className="text-6xl opacity-20 grayscale">📈</div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-[var(--text-primary)] font-geist uppercase tracking-widest">INITIALIZING DATASETS</h3>
            <p className="text-[var(--text-muted)] max-w-sm mx-auto">Session metrics will populate here once you've completed your baseline evaluations.</p>
          </div>
        </section>
      )}

      {/* Insights Section */}
      {(analytics?.total_interviews || 0) > 0 && (
        <section className="card-premium border-l-4 border-l-[var(--accent-primary)] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-8xl opacity-5 pointer-events-none grayscale">💡</div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] font-geist mb-6 uppercase tracking-widest italic flex items-center gap-3">
             SMART INSIGHTS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] mb-1">AGGREGATE VOLUME</p>
              <p className="text-[13px] text-[var(--text-secondary)] font-medium leading-relaxed">
                You've logged <span className="text-[var(--text-primary)] font-bold">{analytics?.total_interviews} sessions</span> with a consistent efficiency baseline of <span className="text-[var(--accent-primary)] font-bold">{Math.round(analytics?.average_score || 0)}%</span>.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] mb-1">STRONGEST SECTOR</p>
              <p className="text-[13px] text-[var(--text-secondary)] font-medium leading-relaxed">
                Your performance peaks within the <span className="text-[var(--success)] font-bold uppercase underline decoration-2 underline-offset-4">{
                  allDomains.reduce((best, domain) =>
                    (domainStats[domain].average_score || 0) >
                    (domainStats[best]?.average_score || 0)
                      ? domain
                      : best
                  )
                }</span> sector, showing superior role-alignment.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] mb-1">PSYCHOMETRIC SYNC</p>
              <p className="text-[13px] text-[var(--text-secondary)] font-medium leading-relaxed">
                Current evaluation indicates an average confidence index of <span className="text-[var(--warning)] font-bold">{Math.round(analytics?.average_confidence || 0)}%</span> across all tested domains.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
