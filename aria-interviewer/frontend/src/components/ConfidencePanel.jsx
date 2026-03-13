import { useMemo } from "react";

const FILLER_WORDS = [
  "um", "uh", "like", "you know", "basically", "literally",
  "kind of", "sort of", "i mean", "right", "actually",
  "so yeah", "hmm", "err", "well", "okay so"
];

export default function ConfidencePanel({ answers, isVisible }) {
  const stats = useMemo(() => {
    if (!answers || answers.length === 0) return null;

    let totalFillers = 0;
    let totalWords = 0;
    const fillerList = [];

    answers.forEach((ans) => {
      const lower = ans.toLowerCase();
      const words = lower.split(/\s+/).filter(Boolean);
      totalWords += words.length;

      FILLER_WORDS.forEach((filler) => {
        const regex = new RegExp(`\\b${filler.replace(/\s+/g, "\\s+")}\\b`, "gi");
        const matches = lower.match(regex);
        if (matches) {
          totalFillers += matches.length;
          if (!fillerList.includes(filler)) fillerList.push(filler);
        }
      });
    });

    const fillerPct = totalWords > 0 ? ((totalFillers / totalWords) * 100).toFixed(1) : 0;
    const avgWords = Math.round(totalWords / answers.length);
    let score = 100 - Math.min(totalFillers * 5, 30);
    if (avgWords < 20) score -= 20;
    score = Math.max(0, Math.min(100, score));

    return { totalFillers, avgWords, fillerPct, score, fillerList: fillerList.slice(0, 3) };
  }, [answers]);

  if (!isVisible || !stats) return null;

  const tips = [
    "Pause instead of saying 'um' or 'uh'.",
    "Start with 'In my experience...' for confidence.",
    "Aim for 3-4 sentences per answer.",
    "Take a breath before answering.",
    "Structure answers: context, action, result.",
  ];
  const randomTip = tips[answers.length % tips.length];

  return (
    <div
      className="fixed bottom-20 right-4 w-64 rounded-xl shadow-2xl overflow-hidden z-50"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
    >
      <div className="px-4 py-2.5" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>🎯 Confidence Tracker</span>
      </div>
      <div className="p-3 space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: "var(--text-muted)" }}>Confidence</span>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>{stats.score}%</span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: "var(--bg-surface)" }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${stats.score}%`,
                background: stats.score >= 70 ? "var(--success)" : stats.score >= 40 ? "var(--warning)" : "var(--danger)",
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2 text-center" style={{ background: "var(--bg-surface)" }}>
            <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{answers.length}</div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Answers</div>
          </div>
          <div className="rounded-lg p-2 text-center" style={{ background: "var(--bg-surface)" }}>
            <div className="text-lg font-bold" style={{ color: "var(--danger)" }}>{stats.totalFillers}</div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Fillers</div>
          </div>
        </div>

        {stats.fillerList.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {stats.fillerList.map((w) => (
              <span
                key={w}
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ color: "var(--danger)", background: "color-mix(in srgb, var(--danger) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}
              >
                &ldquo;{w}&rdquo;
              </span>
            ))}
          </div>
        )}

        <div className="rounded-lg p-2" style={{ background: "color-mix(in srgb, var(--info) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--info) 20%, transparent)" }}>
          <p className="text-[10px]" style={{ color: "var(--info)" }}>💡 {randomTip}</p>
        </div>
      </div>
    </div>
  );
}
