import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const tooltipStyle = {
  backgroundColor: "var(--bg-elevated)",
  border: "1px solid var(--border-default)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
};

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
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!data || !data.has_data) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📊</div>
        <p style={{ color: "var(--text-muted)" }}>Complete more interviews to see analytics</p>
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

  const gradeStyles = {
    Excellent: "var(--success)",
    Good: "var(--info)",
    Average: "var(--warning)",
    "Needs Improvement": "var(--danger)",
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { val: data.total_interviews, label: "Interviews", color: "var(--text-primary)" },
          { val: data.average_score, label: "Avg Score", color: "var(--info)" },
          { val: data.best_score, label: "Best Score", color: "var(--success)" },
          { val: data.average_confidence ?? "—", label: "Avg Confidence", color: "var(--accent-primary)" },
        ].map((c, i) => (
          <div
            key={i}
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="text-3xl font-bold" style={{ color: c.color }}>{c.val}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Improvement Indicator */}
      {data.improvement != null && (
        <div className="text-center text-sm font-medium" style={{ color: data.improvement >= 0 ? "var(--success)" : "var(--danger)" }}>
          {data.improvement >= 0 ? "📈" : "📉"} {data.improvement >= 0 ? "+" : ""}{data.improvement} points improvement (last vs first)
        </div>
      )}

      {/* Score Trend Chart */}
      {scoreTrend.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>Score Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--accent-primary)"
                strokeWidth={2}
                dot={{ fill: "var(--accent-primary)", r: scoreTrend.length === 1 ? 6 : 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Domain Performance */}
      {domainStats.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>Domain Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={domainStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avgScore" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} name="Avg Score" />
              <Bar dataKey="count" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grade Distribution as Pill Badges */}
      {gradeData.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>Grade Distribution</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {gradeData.map((g, idx) => {
              const col = gradeStyles[g.name] || COLORS[idx % COLORS.length];
              return (
                <div
                  key={g.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                  style={{ background: `color-mix(in srgb, ${col} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${col} 30%, transparent)`, color: col }}
                >
                  <span>{g.name}</span>
                  <span className="font-bold">{g.value}</span>
                </div>
              );
            })}
          </div>
          <ResponsiveContainer width="100%" height={250} className="mt-4">
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
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", color: "var(--text-muted)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
