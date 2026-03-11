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
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-8">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Skills Radar</h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "0.5rem",
            }}
          />
          <Radar
            dataKey="value"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
