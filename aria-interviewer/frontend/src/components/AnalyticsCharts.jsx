import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export default function AnalyticsCharts({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/analytics/${encodeURIComponent(userId)}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [userId, BASE_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.has_data) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-400">Complete more interviews to see analytics</p>
      </div>
    );
  }

  const scoreTrend = (data.score_trend || []).map((item, i) => ({
    name: `#${i + 1}`,
    score: item.score,
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  const domainStats = Object.entries(data.domain_stats || {}).map(([name, stats]) => ({
    name: name.length > 12 ? name.slice(0, 12) + "…" : name,
    fullName: name,
    count: stats.count,
    avgScore: Math.round(stats.avg_score),
  }));

  const gradeData = Object.entries(data.grade_distribution || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
          <div className="text-3xl font-bold text-white">{data.total_interviews}</div>
          <div className="text-xs text-gray-400 mt-1">Interviews</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
          <div className="text-3xl font-bold text-blue-400">{data.average_score}</div>
          <div className="text-xs text-gray-400 mt-1">Avg Score</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
          <div className="text-3xl font-bold text-green-400">{data.best_score}</div>
          <div className="text-xs text-gray-400 mt-1">Best Score</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 text-center">
          <div className="text-3xl font-bold text-purple-400">{data.average_confidence ?? "—"}</div>
          <div className="text-xs text-gray-400 mt-1">Avg Confidence</div>
        </div>
      </div>

      {/* Improvement Indicator */}
      {data.improvement != null && (
        <div className={`text-center text-sm font-medium ${data.improvement >= 0 ? "text-green-400" : "text-red-400"}`}>
          {data.improvement >= 0 ? "📈" : "📉"} {data.improvement >= 0 ? "+" : ""}{data.improvement} points improvement (last vs first)
        </div>
      )}

      {/* Score Trend Chart */}
      {scoreTrend.length > 1 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Score Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "0.5rem" }}
                labelStyle={{ color: "#9ca3af" }}
                itemStyle={{ color: "#a78bfa" }}
              />
              <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Domain Performance */}
      {domainStats.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Domain Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={domainStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "0.5rem" }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Score" />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grade Distribution */}
      {gradeData.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={gradeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {gradeData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "0.5rem" }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
