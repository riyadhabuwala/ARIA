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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h1>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm font-medium">✗ {error}</p>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Performance Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
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
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
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
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {domain}
                      </span>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {avgScore}/100 • {interviews} interview{interviews !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${avgScore}%` }}
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
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              No interview data yet
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Start your first interview to see detailed analytics and performance tracking
            </p>
          </div>
        )}

        {/* Insights Section */}
        {(analytics?.total_interviews || 0) > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Key Insights 💡
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl mt-0.5">✓</span>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Total Progress:</span> You've completed{" "}
                  <span className="font-bold">{analytics?.total_interviews} interview{analytics?.total_interviews !== 1 ? "s" : ""}</span> with an
                  average score of{" "}
                  <span className="font-bold">{Math.round(analytics?.average_score || 0)}/100</span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl mt-0.5">✓</span>
                <p className="text-gray-700 dark:text-gray-300">
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
                <p className="text-gray-700 dark:text-gray-300">
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
