import { useEffect, useRef } from "react";

export default function ARIAWaveformStrip({ isSpeaking, isThinking }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const BAR_COUNT = 60;
    const GAP = 2;
    const BAR_W = (W - GAP * (BAR_COUNT - 1)) / BAR_COUNT;

    function getCSSVar(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    function ease(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      timeRef.current += 0.035;
      const t = timeRef.current;

      const accentColor = getCSSVar("--accent-primary") || "#7c6aff";
      const warningColor = getCSSVar("--warning") || "#f59e0b";
      const mutedColor = getCSSVar("--text-muted") || "#55556a";

      for (let i = 0; i < BAR_COUNT; i++) {
        let h;

        if (isSpeaking) {
          const w1 = Math.sin(t * 3.5 + i * 0.4) * 0.5 + 0.5;
          const w2 = Math.sin(t * 5.0 + i * 0.7 + 1) * 0.35 + 0.35;
          const w3 = Math.sin(t * 2.0 + i * 0.2 + 2) * 0.15 + 0.15;
          h = ease((w1 + w2 + w3) / 1.0) * (H * 0.85);
          h = Math.max(h, 4);

          const grad = ctx.createLinearGradient(0, H / 2 - h / 2, 0, H / 2 + h / 2);
          grad.addColorStop(0, `${accentColor}99`);
          grad.addColorStop(0.5, accentColor);
          grad.addColorStop(1, `${accentColor}99`);
          ctx.fillStyle = grad;
        } else if (isThinking) {
          const w = Math.sin(t * 1.2 + i * 0.5) * 0.5 + 0.5;
          h = ease(w) * (H * 0.4);
          h = Math.max(h, 3);
          ctx.fillStyle = `${warningColor}66`;
        } else {
          const w = Math.sin(t * 0.7 + i * 0.3) * 0.5 + 0.5;
          h = ease(w) * (H * 0.2);
          h = Math.max(h, 2);
          ctx.fillStyle = `${mutedColor}44`;
        }

        const x = i * (BAR_W + GAP);
        const y = (H - h) / 2;
        const r = Math.min(BAR_W / 2, 2);

        ctx.beginPath();
        ctx.roundRect(x, y, BAR_W, h, r);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isSpeaking, isThinking]);

  return (
    <div className="px-4 py-3">
      <canvas ref={canvasRef} width={580} height={48} className="w-full" />
    </div>
  );
}
