import { useEffect, useRef } from "react";

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

      for (let i = 0; i < BAR_COUNT; i++) {
        let height;

        if (isSpeaking) {
          // Energetic animated bars — 3 sine waves layered
          const wave1 = Math.sin(t * 3.0 + i * 0.40) * 0.5 + 0.5;
          const wave2 = Math.sin(t * 5.0 + i * 0.70 + 1.0) * 0.3 + 0.3;
          const wave3 = Math.sin(t * 2.0 + i * 0.20 + 2.0) * 0.2 + 0.2;
          height = easeInOut((wave1 + wave2 + wave3) / 1.0) * (H * 0.85);
          height = Math.max(height, 6);

          // Blue → purple gradient per bar
          const grad = ctx.createLinearGradient(
            0, H / 2 - height / 2,
            0, H / 2 + height / 2
          );
          grad.addColorStop(0, `rgba(139,92,246,${0.6 + wave1 * 0.4})`);
          grad.addColorStop(0.5, `rgba(59,130,246,${0.8 + wave2 * 0.2})`);
          grad.addColorStop(1, `rgba(139,92,246,${0.6 + wave3 * 0.4})`);
          ctx.fillStyle = grad;

        } else if (isThinking) {
          // Slow calm wave, yellow tint
          const wave = Math.sin(t * 1.2 + i * 0.5) * 0.5 + 0.5;
          height = easeInOut(wave) * (H * 0.35);
          height = Math.max(height, 4);
          ctx.fillStyle = `rgba(251,191,36,${0.3 + wave * 0.3})`;

        } else {
          // Idle — very gentle breathing wave
          const wave = Math.sin(t * 0.8 + i * 0.3) * 0.5 + 0.5;
          height = easeInOut(wave) * (H * 0.18);
          height = Math.max(height, 3);
          ctx.fillStyle = `rgba(100,116,139,${0.25 + wave * 0.2})`;
        }

        const x = i * (BAR_WIDTH + BAR_GAP);
        const y = (H - height) / 2;
        const r = BAR_WIDTH / 2;

        // Rounded rectangle bar
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + BAR_WIDTH - r, y);
        ctx.quadraticCurveTo(x + BAR_WIDTH, y, x + BAR_WIDTH, y + r);
        ctx.lineTo(x + BAR_WIDTH, y + height - r);
        ctx.quadraticCurveTo(x + BAR_WIDTH, y + height,
                              x + BAR_WIDTH - r, y + height);
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

  const statusColor = isThinking && !isSpeaking
    ? "text-yellow-400"
    : isSpeaking
    ? "text-blue-400"
    : "text-gray-500";

  const dotColor = isSpeaking
    ? "bg-blue-400 animate-pulse"
    : isThinking
    ? "bg-yellow-400 animate-pulse"
    : "bg-green-400";

  return (
    <div className="flex flex-col h-full w-full rounded-2xl
                    bg-gradient-to-b from-gray-900 to-gray-950
                    border border-gray-800 shadow-2xl overflow-hidden">

      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between
                      px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center
                          justify-center shadow-lg shadow-blue-900/40
                          bg-gradient-to-br from-blue-600 to-purple-700">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-none">
              ARIA
            </div>
            <div className="text-gray-500 text-xs mt-0.5">
              Interview Assistant
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5
                        bg-gray-800 rounded-full border border-gray-700">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-xs text-gray-400">LIVE</span>
        </div>
      </div>

      {/* ── WAVEFORM CANVAS ── */}
      <div className="flex-1 flex items-center
                      justify-center px-6 py-6">
        <canvas
          ref={canvasRef}
          width={380}
          height={120}
          className="w-full max-w-md"
        />
      </div>

      {/* ── CURRENT QUESTION ── */}
      <div className="px-6 pb-4 min-h-[90px] flex items-start">
        {currentQuestion ? (
          <div className="w-full">
            {questionNumber > 0 && (
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-gray-600
                                 uppercase tracking-wider">
                  Question {questionNumber} of {totalQuestions}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalQuestions }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300
                        ${i < questionNumber
                          ? "bg-blue-500 w-4"
                          : "bg-gray-700 w-2"
                        }`}
                    />
                  ))}
                </div>
              </div>
            )}
            <p className="text-gray-200 text-sm leading-relaxed
                          border-l-2 border-blue-600 pl-3">
              {currentQuestion}
            </p>
          </div>
        ) : (
          <p className="text-gray-600 text-sm italic">
            Preparing your interview...
          </p>
        )}
      </div>

      {/* ── STATUS BAR ── */}
      <div className="px-6 py-3 border-t border-gray-800
                      flex items-center justify-between">
        <span className={`text-xs font-medium transition-colors
                          duration-300 ${statusColor}`}>
          {statusText}
        </span>
        {isSpeaking && (
          <div className="flex items-end gap-0.5 h-4">
            {[3,5,4,6,3,5,4].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-blue-500 rounded-full animate-pulse"
                style={{
                  height: `${h * 2}px`,
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
