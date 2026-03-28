import { useEffect, useState } from "react";

export default function ScoreGauge({ score = 0, label = "", size = "md", showGrade = true }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Size configurations
  const sizes = {
    sm: {
      diameter: 80,
      strokeWidth: 6,
      fontSize: {
        grade: "text-lg",
        score: "text-sm",
        label: "text-xs"
      }
    },
    md: {
      diameter: 120,
      strokeWidth: 8,
      fontSize: {
        grade: "text-2xl",
        score: "text-lg",
        label: "text-sm"
      }
    },
    lg: {
      diameter: 160,
      strokeWidth: 10,
      fontSize: {
        grade: "text-3xl",
        score: "text-xl",
        label: "text-base"
      }
    }
  };

  const config = sizes[size];
  const radius = (config.diameter - config.strokeWidth) / 2;
  const center = config.diameter / 2;

  // Calculate semicircle arc (180°)
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference * (1 - animatedScore / 100);

  // Color based on score ranges
  const getColor = (score) => {
    if (score >= 85) return "#639922"; // green
    if (score >= 70) return "#378ADD"; // blue
    if (score >= 50) return "#EF9F27"; // amber
    return "#E24B4A"; // red
  };

  // Grade based on score ranges
  const getGrade = (score) => {
    if (score >= 85) return "A";
    if (score >= 70) return "B";
    if (score >= 50) return "C";
    return score >= 40 ? "D" : "F";
  };

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  // SVG path for semicircle (180° arc from left to right)
  const startX = config.strokeWidth / 2;
  const startY = center;
  const endX = config.diameter - config.strokeWidth / 2;
  const endY = center;

  const pathD = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

  return (
    <div className="flex flex-col items-center">
      {/* SVG Gauge Container */}
      <div
        className="relative"
        style={{
          width: config.diameter,
          height: config.diameter / 2 + config.strokeWidth / 2 + 10
        }}
      >
        <svg
          width={config.diameter}
          height={config.diameter / 2 + config.strokeWidth / 2 + 10}
          className="overflow-visible"
        >
          {/* Background arc */}
          <path
            d={pathD}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress arc with animation */}
          <path
            d={pathD}
            fill="none"
            stroke={getColor(score)}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 800ms ease-out",
            }}
          />
        </svg>

        {/* Center grade display */}
        {showGrade && (
          <div
            className="absolute flex items-center justify-center"
            style={{
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)"
            }}
          >
            <div
              className={`font-bold ${config.fontSize.grade}`}
              style={{ color: getColor(score) }}
            >
              {getGrade(score)}
            </div>
          </div>
        )}
      </div>

      {/* Score and label below gauge */}
      <div className="text-center mt-2">
        <div className={`font-semibold text-gray-900 dark:text-white ${config.fontSize.score}`}>
          {score}/100
        </div>
        {label && (
          <div className={`text-gray-600 dark:text-gray-400 mt-1 ${config.fontSize.label}`}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}