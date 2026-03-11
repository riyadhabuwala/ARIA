import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import ScoreRadarChart from "./ScoreRadarChart";

export default function FeedbackReport({ report, confidenceData, onReset, audioUrl, onDownload }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score counter
  useEffect(() => {
    if (!report?.overall_score) return;
    const target = report.overall_score;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setAnimatedScore(current);
      if (current >= target) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [report?.overall_score]);

  // Fire confetti for high scores
  useEffect(() => {
    if (report?.overall_score >= 70) {
      setTimeout(() => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }, 800);
    }
  }, [report?.overall_score]);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">No report data available.</p>
      </div>
    );
  }

  const gradeColor = {
    Excellent: "text-green-400 bg-green-400/10 border-green-400/30",
    Good: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    Average: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    "Needs Improvement": "text-red-400 bg-red-400/10 border-red-400/30",
  };

  const hiringColor = {
    "Strong Yes": "text-green-400 bg-green-400/10",
    Yes: "text-blue-400 bg-blue-400/10",
    Maybe: "text-yellow-400 bg-yellow-400/10",
    No: "text-red-400 bg-red-400/10",
  };

  const ScoreCard = ({ title, score, feedback }) => (
    <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-300">{title}</h4>
        <span className="text-2xl font-bold text-white">{score}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
        <div
          className="h-2 rounded-full transition-all duration-700 bg-gradient-to-r from-purple-500 to-blue-500"
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-gray-400 text-xs leading-relaxed">{feedback}</p>
    </div>
  );

  const sections = report.sections || {};

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Performance Report</h1>
          <p className="text-gray-400">Your ARIA interview results</p>
        </div>

        {/* Overall Score */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-8 text-center">
          <div className="text-7xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">
            {animatedScore}
          </div>
          <div className="text-gray-400 text-sm mb-4">out of 100</div>
          <span
            className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${
              gradeColor[report.grade] || "text-gray-400 bg-gray-800 border-gray-700"
            }`}
          >
            {report.grade}
          </span>
          {report.summary && (
            <p className="text-gray-300 text-sm mt-5 max-w-xl mx-auto leading-relaxed">
              {report.summary}
            </p>
          )}
        </div>

        {/* Score Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {sections.technical_knowledge && (
            <ScoreCard
              title="Technical Knowledge"
              score={sections.technical_knowledge.score}
              feedback={sections.technical_knowledge.feedback}
            />
          )}
          {sections.communication && (
            <ScoreCard
              title="Communication"
              score={sections.communication.score}
              feedback={sections.communication.feedback}
            />
          )}
          {sections.problem_solving && (
            <ScoreCard
              title="Problem Solving"
              score={sections.problem_solving.score}
              feedback={sections.problem_solving.feedback}
            />
          )}
          {sections.confidence && (
            <ScoreCard
              title="Confidence"
              score={sections.confidence.score}
              feedback={sections.confidence.feedback}
            />
          )}
        </div>

        {/* Skills Radar Chart */}
        <ScoreRadarChart sections={sections} />

        {/* Confidence Analysis */}
        {confidenceData && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 mb-8 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Confidence Analysis</h3>
            </div>
            <div className="p-5 space-y-5">
              {/* Confidence Score */}
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-purple-400">
                  {confidenceData.confidence_score ?? "—"}
                </div>
                <div>
                  <p className="text-sm text-gray-300 font-medium">Confidence Score</p>
                  <p className="text-xs text-gray-500">Based on language patterns & delivery</p>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-700"
                  style={{ width: `${confidenceData.confidence_score ?? 0}%` }}
                />
              </div>

              {/* Filler Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-white">{confidenceData.total_fillers ?? 0}</p>
                  <p className="text-xs text-gray-400">Total Fillers</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-white">{confidenceData.filler_rate ?? "0.0"}%</p>
                  <p className="text-xs text-gray-400">Filler Rate</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-white">{confidenceData.strong_openers ?? 0}</p>
                  <p className="text-xs text-gray-400">Strong Openers</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-white">{confidenceData.weak_openers ?? 0}</p>
                  <p className="text-xs text-gray-400">Weak Openers</p>
                </div>
              </div>

              {/* Most Used Fillers */}
              {confidenceData.most_used_fillers && Object.keys(confidenceData.most_used_fillers).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Most Used Fillers</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(confidenceData.most_used_fillers).map(([word, count]) => (
                      <span
                        key={word}
                        className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded-full border border-red-500/20"
                      >
                        "{word}" × {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Trend */}
              {confidenceData.trend && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Trend:</span>
                  <span
                    className={`text-sm font-medium ${
                      confidenceData.trend === "improving"
                        ? "text-green-400"
                        : confidenceData.trend === "declining"
                        ? "text-red-400"
                        : "text-gray-300"
                    }`}
                  >
                    {confidenceData.trend === "improving"
                      ? "📈 Improving"
                      : confidenceData.trend === "declining"
                      ? "📉 Declining"
                      : "➡️ Steady"}
                  </span>
                </div>
              )}

              {/* Tips */}
              {confidenceData.tips?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Improvement Tips</p>
                  <ul className="space-y-1">
                    {confidenceData.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-blue-400 mt-0.5">💡</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical Strong/Weak Points */}
        {sections.technical_knowledge && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {sections.technical_knowledge.strong_points?.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h4 className="text-sm font-semibold text-green-400 mb-3">Strong Points</h4>
                <ul className="space-y-2">
                  {sections.technical_knowledge.strong_points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {sections.technical_knowledge.weak_points?.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h4 className="text-sm font-semibold text-orange-400 mb-3">Areas to Work On</h4>
                <ul className="space-y-2">
                  {sections.technical_knowledge.weak_points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <span className="text-orange-400 mt-0.5">→</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Question Breakdown */}
        {report.question_breakdown?.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 mb-8 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Question Breakdown</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {report.question_breakdown.map((q, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="text-sm text-gray-200 font-medium">
                      Q{i + 1}: {q.question}
                    </p>
                    <span className="text-lg font-bold text-purple-400 flex-shrink-0">
                      {q.score}/10
                    </span>
                  </div>
                  {q.answer_summary && (
                    <p className="text-xs text-gray-500 mb-1">
                      <span className="text-gray-600">Answer:</span> {q.answer_summary}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{q.feedback}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths, Improvements, Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {report.top_strengths?.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h4 className="text-sm font-semibold text-green-400 mb-3">Top Strengths</h4>
              <ul className="space-y-2">
                {report.top_strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-green-400">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.improvement_areas?.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h4 className="text-sm font-semibold text-orange-400 mb-3">Improvement Areas</h4>
              <ul className="space-y-2">
                {report.improvement_areas.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-orange-400">→</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.recommended_resources?.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h4 className="text-sm font-semibold text-blue-400 mb-3">Recommended Resources</h4>
              <ul className="space-y-2">
                {report.recommended_resources.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-blue-400">📘</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Hiring Recommendation */}
        {report.hiring_recommendation && (
          <div className="text-center mb-8">
            <span className="text-gray-500 text-sm block mb-2">Hiring Recommendation</span>
            <span
              className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${
                hiringColor[report.hiring_recommendation] || "text-gray-400 bg-gray-800"
              }`}
            >
              {report.hiring_recommendation}
            </span>
          </div>
        )}

        {/* Interview Recording */}
        {audioUrl && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 mb-8 p-5">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Interview Recording</h4>
            <audio controls src={audioUrl} className="w-full mb-3" />
            {onDownload && (
              <button
                onClick={onDownload}
                className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 transition border border-gray-700"
              >
                ⬇ Download Recording
              </button>
            )}
          </div>
        )}

        {/* Reset */}
        <div className="text-center pb-8">
          <button
            onClick={onReset}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-blue-500 transition"
          >
            Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}
