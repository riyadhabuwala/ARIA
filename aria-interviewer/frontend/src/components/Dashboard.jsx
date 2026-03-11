import { useEffect, useState, useMemo } from "react";
import { signOut } from "../api/authApi";
import { getHistory } from "../api/interviewApi";
import HistoryCard from "./HistoryCard";
import AnalyticsCharts from "./AnalyticsCharts";

export default function Dashboard({ user, onNewInterview, onViewSession }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("history");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory(user.id);
        setSessions(data.sessions || []);
      } catch (err) {
        setError("Failed to load interview history.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [user.id]);

  const stats = useMemo(() => {
    if (sessions.length === 0) return null;
    const total = sessions.length;
    const scores = sessions
      .map((s) => s.overall_score)
      .filter((s) => s != null);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const best = scores.length > 0 ? Math.max(...scores) : 0;

    // Most practiced domain
    const domainCount = {};
    sessions.forEach((s) => {
      domainCount[s.domain] = (domainCount[s.domain] || 0) + 1;
    });
    const topDomain = Object.entries(domainCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return { total, avg, best, topDomain };
  }, [sessions]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, <span className="text-purple-400">{user.email}</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Your ARIA interview dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onNewInterview}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl text-sm hover:from-purple-500 hover:to-blue-500 transition"
            >
              + New Interview
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
              <div className="text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400 mt-1">Total Interviews</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
              <div className="text-3xl font-bold text-blue-400">{stats.avg}</div>
              <div className="text-xs text-gray-400 mt-1">Average Score</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
              <div className="text-3xl font-bold text-green-400">{stats.best}</div>
              <div className="text-xs text-gray-400 mt-1">Best Score</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
              <div className="text-sm font-semibold text-purple-400 mt-1">{stats.topDomain}</div>
              <div className="text-xs text-gray-400 mt-1">Most Practiced</div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex mb-6 bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === "history"
                ? "bg-purple-600 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === "analytics"
                ? "bg-purple-600 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <AnalyticsCharts userId={user.id} />
        )}

        {/* Loading */}
        {activeTab === "history" && isLoading && (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-purple-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        )}

        {/* Error */}
        {activeTab === "history" && error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {/* Sessions Grid */}
        {activeTab === "history" && !isLoading && sessions.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-white mb-4">Recent Interviews</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <HistoryCard
                  key={session.id}
                  session={session}
                  onView={onViewSession}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {activeTab === "history" && !isLoading && sessions.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-2">No interviews yet</h3>
            <p className="text-gray-400 mb-6">Start your first mock interview to see results here.</p>
            <button
              onClick={onNewInterview}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-blue-500 transition"
            >
              Start First Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
