import { useEffect, useState } from "react";

export default function ScoreGauge({ score = 0, label = "", size = "md", showGrade = true }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const sizes = {
    sm: { diameter: 100, strokeWidth: 7, gradeSize: "22px", scoreSize: "14px", labelSize: "11px" },
    md: { diameter: 140, strokeWidth: 9, gradeSize: "30px", scoreSize: "18px", labelSize: "13px" },
    lg: { diameter: 180, strokeWidth: 11, gradeSize: "40px", scoreSize: "22px", labelSize: "14px" },
  };

  const config = sizes[size];
  const radius = (config.diameter - config.strokeWidth) / 2;
  const center = config.diameter / 2;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference * (1 - animatedScore / 100);

  const getColor = (s) => {
    if (s >= 85) return "#22c55e";
    if (s >= 70) return "#2563eb";
    if (s >= 50) return "#f59e0b";
    return "#ef4444";
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          position: "relative",
          width: config.diameter,
          height: config.diameter / 2 + config.strokeWidth / 2 + 10,
        }}
      >
        <svg
          width={config.diameter}
          height={config.diameter / 2 + config.strokeWidth / 2 + 10}
          style={{ overflow: "visible" }}
        >
          {/* Glow filter */}
          <defs>
            <filter id={`glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background arc */}
          <path
            d={pathD}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter={`url(#glow-${size})`}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>

        {/* Center grade */}
        {showGrade && (
          <div
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontFamily: "'Geist', 'Inter', sans-serif",
              fontWeight: "800",
              fontSize: config.gradeSize,
              color: color,
              letterSpacing: "-0.03em",
              textShadow: `0 0 20px ${color}44`,
            }}
          >
            {getGrade(score)}
          </div>
        )}
      </div>

      {/* Score + label */}
      <div style={{ textAlign: "center", marginTop: "4px" }}>
        <div style={{
          fontFamily: "'Geist', 'Inter', sans-serif",
          fontWeight: "700",
          fontSize: config.scoreSize,
          color: "#ffffff",
          letterSpacing: "-0.02em",
        }}>
          {score}<span style={{ color: "rgba(255,255,255,0.3)", fontWeight: "400" }}>/100</span>
        </div>
        {label && (
          <div style={{
            fontSize: config.labelSize,
            color: "rgba(255,255,255,0.4)",
            marginTop: "2px",
          }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}