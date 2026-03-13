import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

export default function ScoreRadarChart({ sections }) {
  if (!sections) return null;

  const data = [
    { subject: "Technical", value: sections.technical_knowledge?.score ?? 0 },
    { subject: "Communication", value: sections.communication?.score ?? 0 },
    { subject: "Problem Solving", value: sections.problem_solving?.score ?? 0 },
    { subject: "Confidence", value: sections.confidence?.score ?? 0 },
  ].filter((d) => d.value > 0);

  if (data.length < 3) return null;

  return (
    <div
      className="rounded-xl p-5 mb-8"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>Skills Radar</h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border-default)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: "0.5rem",
              color: "var(--text-primary)",
            }}
          />
          <Radar
            dataKey="value"
            stroke="var(--accent-primary)"
            fill="var(--accent-primary)"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
