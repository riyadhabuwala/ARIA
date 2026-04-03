import { useEffect, useState } from "react";

export default function ScoreGauge({ score = 0, label = "", size = "md", showGrade = true }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const sizes = {
    sm: { diameter: 80, strokeWidth: 4, gradeSize: "20px", scoreSize: "13px", labelSize: "10px" },
    md: { diameter: 140, strokeWidth: 6, gradeSize: "36px", scoreSize: "18px", labelSize: "12px" },
    lg: { diameter: 220, strokeWidth: 8, gradeSize: "64px", scoreSize: "28px", labelSize: "14px" },
  };

  const config = sizes[size];
  const radius = (config.diameter - config.strokeWidth) / 2;
  const center = config.diameter / 2;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference * (1 - animatedScore / 100);

  const getColor = (s) => {
    if (s >= 80) return "var(--success)";
    if (s >= 65) return "var(--accent-primary)";
    if (s >= 45) return "var(--warning)";
    return "var(--danger)";
  };

  const getGrade = (s) => {
    if (s >= 85) return "A";
    if (s >= 70) return "B";
    if (s >= 50) return "C";
    return s >= 40 ? "D" : "F";
  };

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const startX = config.strokeWidth / 2;
  const startY = center;
  const endX = config.diameter - config.strokeWidth / 2;
  const endY = center;
  const pathD = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center relative group">
      {/* Glow Effect Background */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 group-hover:opacity-20 transition-opacity blur-[40px] pointer-events-none"
        style={{ background: color }}
      />

      <div
        style={{
          position: "relative",
          width: config.diameter,
          height: config.diameter / 2 + config.strokeWidth + 5,
        }}
      >
        <svg
          width={config.diameter}
          height={config.diameter / 2 + config.strokeWidth + 5}
          style={{ overflow: "visible" }}
        >
          {/* Background arc */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            className="opacity-20"
          />

          {/* Progress arc */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth + 1}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ 
              transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(0 0 12px ${color}88)`
            }}
          />
        </svg>

        {/* Center grade */}
        {showGrade && (
          <div
            className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 font-geist font-black italic tracking-tighter"
            style={{
              fontSize: config.gradeSize,
              color: color,
              textShadow: `0 0 20px ${color}44`,
            }}
          >
            {getGrade(score)}
          </div>
        )}
      </div>

      {/* Score + label */}
      <div className="text-center mt-2 space-y-1">
        <div className="font-geist font-black text-[var(--text-primary)] leading-none italic" style={{ fontSize: config.scoreSize }}>
          {score}<span className="text-[var(--text-muted)] font-medium not-italic opacity-40 ml-1">/100</span>
        </div>
        {label && (
          <div className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] font-geist leading-tight" style={{ fontSize: config.labelSize }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}