import { useEffect, useRef } from "react";

function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export default function ARIAWaveform({
  isSpeaking = false,
  isThinking = false,
  currentQuestion = "",
  questionNumber = 0,
  totalQuestions = 7,
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const BAR_COUNT = 48;
    const BAR_GAP = 3;
    const BAR_WIDTH = (W - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      timeRef.current += 0.03;
      const t = timeRef.current;

      const accentPrimary = hexToRgb(getCSSVar("--accent-primary"));
      const accentSecondary = hexToRgb(getCSSVar("--accent-secondary"));
      const warningColor = hexToRgb(getCSSVar("--warning"));
      const mutedColor = hexToRgb(getCSSVar("--text-muted"));

      for (let i = 0; i < BAR_COUNT; i++) {
        let height;

        if (isSpeaking) {
          const wave1 = Math.sin(t * 3.0 + i * 0.40) * 0.5 + 0.5;
          const wave2 = Math.sin(t * 5.0 + i * 0.70 + 1.0) * 0.3 + 0.3;
          const wave3 = Math.sin(t * 2.0 + i * 0.20 + 2.0) * 0.2 + 0.2;
          height = easeInOut((wave1 + wave2 + wave3) / 1.0) * (H * 0.85);
          height = Math.max(height, 6);

          const grad = ctx.createLinearGradient(0, H / 2 - height / 2, 0, H / 2 + height / 2);
          grad.addColorStop(0, `rgba(${accentPrimary.r},${accentPrimary.g},${accentPrimary.b},${0.6 + wave1 * 0.4})`);
          grad.addColorStop(0.5, `rgba(${accentSecondary.r},${accentSecondary.g},${accentSecondary.b},${0.8 + wave2 * 0.2})`);
          grad.addColorStop(1, `rgba(${accentPrimary.r},${accentPrimary.g},${accentPrimary.b},${0.6 + wave3 * 0.4})`);
          ctx.fillStyle = grad;

        } else if (isThinking) {
          const wave = Math.sin(t * 1.2 + i * 0.5) * 0.5 + 0.5;
          height = easeInOut(wave) * (H * 0.35);
          height = Math.max(height, 4);
          ctx.fillStyle = `rgba(${warningColor.r},${warningColor.g},${warningColor.b},${0.3 + wave * 0.3})`;

        } else {
          const wave = Math.sin(t * 0.8 + i * 0.3) * 0.5 + 0.5;
          height = easeInOut(wave) * (H * 0.18);
          height = Math.max(height, 3);
          ctx.fillStyle = `rgba(${mutedColor.r},${mutedColor.g},${mutedColor.b},${0.25 + wave * 0.2})`;
        }

        const x = i * (BAR_WIDTH + BAR_GAP);
        const y = (H - height) / 2;
        const r = BAR_WIDTH / 2;

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + BAR_WIDTH - r, y);
        ctx.quadraticCurveTo(x + BAR_WIDTH, y, x + BAR_WIDTH, y + r);
        ctx.lineTo(x + BAR_WIDTH, y + height - r);
        ctx.quadraticCurveTo(x + BAR_WIDTH, y + height, x + BAR_WIDTH - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isSpeaking, isThinking]);

  const statusText = isThinking && !isSpeaking
    ? "ARIA is thinking..."
    : isSpeaking
    ? "ARIA is speaking..."
    : "Listening for your answer";

  return (
    <div
      className="flex flex-col h-full w-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--bg-elevated), var(--bg-base))",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {/* TOP BAR */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-primary) 30%, transparent)",
            }}
          >
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <div>
            <div className="font-bold text-lg leading-none" style={{ color: "var(--text-primary)" }}>
              ARIA
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Interview Assistant
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div
            className={`w-2 h-2 rounded-full ${isSpeaking || isThinking ? "animate-pulse" : ""}`}
            style={{
              background: isSpeaking
                ? "var(--accent-primary)"
                : isThinking
                ? "var(--warning)"
                : "var(--success)",
            }}
          />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>LIVE</span>
        </div>
      </div>

      {/* WAVEFORM CANVAS */}
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <canvas ref={canvasRef} width={380} height={120} className="w-full max-w-md" />
      </div>

      {/* CURRENT QUESTION */}
      <div className="px-6 pb-4 min-h-[90px] flex items-start">
        {currentQuestion ? (
          <div className="w-full">
            {questionNumber > 0 && (
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Question {questionNumber} of {totalQuestions}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalQuestions }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1 rounded-full transition-all duration-300"
                      style={{
                        width: i < questionNumber ? "16px" : "8px",
                        background: i < questionNumber ? "var(--accent-primary)" : "var(--bg-surface)",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <p
              className="text-sm leading-relaxed pl-3"
              style={{ color: "var(--text-secondary)", borderLeft: "2px solid var(--accent-primary)" }}
            >
              {currentQuestion}
            </p>
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
            Preparing your interview...
          </p>
        )}
      </div>

      {/* STATUS BAR */}
      <div
        className="px-6 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <span
          className="text-xs font-medium transition-colors duration-300"
          style={{
            color: isThinking && !isSpeaking
              ? "var(--warning)"
              : isSpeaking
              ? "var(--accent-primary)"
              : "var(--text-muted)",
          }}
        >
          {statusText}
        </span>
        {isSpeaking && (
          <div className="flex items-end gap-0.5 h-4">
            {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full animate-pulse"
                style={{
                  height: `${h * 2}px`,
                  background: "var(--accent-primary)",
                  animationDelay: `${i * 100}ms`,
                  animationDuration: "600ms",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
