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
      console.log("[Analytics] Loaded data:", data);
    } catch (err) {
      console.error("[Analytics] Failed to load:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500 animate-spin mx-auto mb-4"></div>
            <p style={{ color: "var(--text-muted)" }}>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold heading-font mb-6" style={{ color: "var(--text-primary)" }}>Analytics</h1>
          <div className="p-4 rounded-lg" style={{ background: "var(--danger-subtle)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p style={{ color: "var(--danger)" }} className="text-sm font-medium">✗ {error}</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Interviews",
      value: analytics?.total_interviews || 0,
      icon: "🎯",
      color: "blue"
    },
    {
      label: "Average Score",
      value: `${Math.round(analytics?.average_score || 0)}/100`,
      icon: "📊",
      color: "purple"
    },
    {
      label: "Best Score",
      value: `${analytics?.best_score || 0}/100`,
      icon: "⭐",
      color: "green"
    },
    {
      label: "Avg Confidence",
      value: `${Math.round(analytics?.average_confidence || 0)}%`,
      icon: "💪",
      color: "orange"
    }
  ];

  // Convert domain_stats array to object format for easier processing
  const domainStats = (analytics?.domain_stats || []).reduce((acc, stat) => {
    acc[stat.domain] = {
      average_score: stat.avg_score,
      total_interviews: stat.count
    };
    return acc;
  }, {});
  const allDomains = Object.keys(domainStats).sort();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold heading-font mb-2" style={{ color: "var(--text-primary)" }}>
            Performance Analytics
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Track your interview performance over time and identify areas for improvement
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => {
            const colorClasses = {
              blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
              purple: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
              green: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
              orange: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30"
            };

            return (
              <div
                key={idx}
                className="rounded-lg shadow-sm border p-6"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`text-4xl p-3 rounded-lg ${
                      colorClasses[stat.color]
                    }`}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance by Domain */}
        {allDomains.length > 0 && (
          <div className="rounded-lg shadow-sm border p-6 mb-8" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              Performance by Domain
            </h2>

            <div className="space-y-6">
              {allDomains.map((domain) => {
                const domainData = domainStats[domain];
                const avgScore = Math.round(domainData.average_score || 0);
                const interviews = domainData.total_interviews || 0;

                return (
                  <div key={domain}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {domain}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
                        {avgScore}/100 • {interviews} interview{interviews !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-overlay)" }}>
                      <div
                        className="h-full bg-gradient-to-r transition-all duration-500"
                        style={{ background: "linear-gradient(to right, var(--accent-primary), var(--accent-secondary))", width: `${avgScore}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Data State */}
        {allDomains.length === 0 && (
          <div className="rounded-lg p-6 text-center border" style={{ background: "var(--accent-subtle)", borderColor: "rgba(37,99,235,0.2)" }}>
            <div className="text-4xl mb-3">📈</div>
            <h3 className="font-semibold mb-2" style={{ color: "var(--accent-primary)" }}>
              No interview data yet
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Start your first interview to see detailed analytics and performance tracking
            </p>
          </div>
        )}

        {/* Insights Section */}
        {(analytics?.total_interviews || 0) > 0 && (
          <div className="mt-8 rounded-lg shadow-sm border p-6" style={{ background: "var(--accent-subtle)", borderColor: "rgba(37,99,235,0.2)" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Key Insights 💡
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl mt-0.5">✓</span>
                <p style={{ color: "var(--text-secondary)" }}>
                  <span className="font-medium">Total Progress:</span> You've completed{" "}
                  <span className="font-bold">{analytics?.total_interviews} interview{analytics?.total_interviews !== 1 ? "s" : ""}</span> with an
                  average score of{" "}
                  <span className="font-bold">{Math.round(analytics?.average_score || 0)}/100</span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl mt-0.5">✓</span>
                <p style={{ color: "var(--text-secondary)" }}>
                  <span className="font-medium">Strongest Area:</span>{" "}
                  <span className="font-bold">
                    {
                      allDomains.reduce((best, domain) =>
                        (domainStats[domain].average_score || 0) >
                        (domainStats[best]?.average_score || 0)
                          ? domain
                          : best
                      )
                    }
                  </span>{" "}
                  domain
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl mt-0.5">✓</span>
                <p style={{ color: "var(--text-secondary)" }}>
                  <span className="font-medium">Confidence Level:</span> You're performing at{" "}
                  <span className="font-bold">{Math.round(analytics?.average_confidence || 0)}%</span> confidence on average
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
