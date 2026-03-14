import { useEffect, useState } from "react";

const STEPS = [
  { id: 1, label: "Reading your resume", icon: "📄", duration: 3000 },
  { id: 2, label: "Building search queries", icon: "🧠", duration: 2000 },
  { id: 3, label: "Searching job portals", icon: "🔍", duration: 5000 },
  { id: 4, label: "AI ranking matches", icon: "⚡", duration: 4000 },
  { id: 5, label: "Preparing your results", icon: "✨", duration: 1000 },
];

export default function ScanProgress({ isScanning }) {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    if (!isScanning) {
      setActiveStep(0);
      setCompletedSteps([]);
      return;
    }

    let stepIndex = 0;
    let timeout;

    function advanceStep() {
      if (stepIndex < STEPS.length) {
        const currentId = stepIndex + 1;
        setActiveStep(currentId);
        const step = STEPS[stepIndex];
        stepIndex += 1;
        timeout = setTimeout(() => {
          setCompletedSteps((prev) => [...prev, currentId]);
          advanceStep();
        }, step.duration);
      }
    }

    advanceStep();
    return () => clearTimeout(timeout);
  }, [isScanning]);

  if (!isScanning) return null;

  return (
    <div className="w-full max-w-md mx-auto animate-fadeUp">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🤖</div>
        <h3 className="text-xl font-bold heading-font mb-1" style={{ color: "var(--text-primary)" }}>
          Finding your matches
        </h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Scanning Indian job portals...
        </p>
      </div>

      <div className="space-y-3">
        {STEPS.map((step) => {
          const isComplete = completedSteps.includes(step.id);
          const isActive = activeStep === step.id;
          const isPending = activeStep < step.id;

          return (
            <div
              key={step.id}
              className="flex items-center gap-4 p-4 rounded-xl transition-all duration-500"
              style={{
                background: isActive
                  ? "var(--accent-subtle)"
                  : isComplete
                  ? "var(--success-subtle)"
                  : "var(--bg-surface)",
                border: isActive
                  ? "1px solid rgba(124,106,255,0.3)"
                  : isComplete
                  ? "1px solid rgba(34,197,94,0.2)"
                  : "1px solid var(--border-subtle)",
                opacity: isPending ? 0.4 : 1,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{
                  background: isActive
                    ? "var(--accent-subtle)"
                    : isComplete
                    ? "var(--success-subtle)"
                    : "var(--bg-elevated)",
                }}
              >
                {isComplete ? "✅" : isActive ? <span className="animate-spin text-sm">⚙️</span> : step.icon}
              </div>

              <span
                className="text-sm font-medium flex-1"
                style={{
                  color: isActive
                    ? "var(--accent-primary)"
                    : isComplete
                    ? "var(--success)"
                    : "var(--text-muted)",
                }}
              >
                {step.label}
              </span>

              {isActive && (
                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                  <div className="h-full rounded-full animate-pulse w-2/3" style={{ background: "var(--accent-primary)" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
