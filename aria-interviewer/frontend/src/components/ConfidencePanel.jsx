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
    <div className="fixed bottom-20 right-4 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
      <div className="px-4 py-2.5 bg-gray-800 border-b border-gray-700">
        <span className="text-xs font-semibold text-gray-300">🎯 Confidence Tracker</span>
      </div>
      <div className="p-3 space-y-3">
        {/* Score bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Confidence</span>
            <span className="font-bold text-white">{stats.score}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                stats.score >= 70 ? "bg-green-500" : stats.score >= 40 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${stats.score}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-white">{answers.length}</div>
            <div className="text-[10px] text-gray-400">Answers</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-red-400">{stats.totalFillers}</div>
            <div className="text-[10px] text-gray-400">Fillers</div>
          </div>
        </div>

        {/* Recent fillers */}
        {stats.fillerList.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {stats.fillerList.map((w) => (
              <span key={w} className="px-1.5 py-0.5 bg-red-900/40 text-red-300 border border-red-700/50 rounded text-[10px]">
                &ldquo;{w}&rdquo;
              </span>
            ))}
          </div>
        )}

        {/* Tip */}
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-2">
          <p className="text-[10px] text-blue-300">💡 {randomTip}</p>
        </div>
      </div>
    </div>
  );
}
