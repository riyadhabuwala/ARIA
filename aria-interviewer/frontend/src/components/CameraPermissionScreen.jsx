import { useState } from "react";

export default function CameraPermissionScreen({ onReady, candidateName, domain }) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);

  async function requestPermissions() {
    setChecking(true);
    setError("");

    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      camStream.getTracks().forEach((t) => t.stop());
      setCameraGranted(true);
    } catch {
      setCameraGranted(false);
    }

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      micStream.getTracks().forEach((t) => t.stop());
      setMicGranted(true);
    } catch {
      setMicGranted(false);
      setError("Microphone access is required for voice answers.");
      setChecking(false);
      return;
    }

    setChecking(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-md animate-fadeUp">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-xl mx-auto mb-4"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            AI
          </div>
          <h1 className="text-2xl font-bold heading-font mb-2" style={{ color: "var(--text-primary)" }}>
            Ready to start, {candidateName}?
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {domain} Interview · ~10–15 minutes
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {[
            {
              icon: "🎤",
              title: "Microphone",
              desc: "Required — you'll answer questions by speaking",
              granted: micGranted,
              required: true,
            },
            {
              icon: "📷",
              title: "Camera",
              desc: "Optional — see yourself during the interview",
              granted: cameraGranted,
              required: false,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{
                background: "var(--bg-surface)",
                border: item.granted
                  ? "1px solid rgba(34,197,94,0.3)"
                  : "1px solid var(--border-subtle)",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                style={{
                  background: item.granted ? "var(--success-subtle)" : "var(--bg-elevated)",
                }}
              >
                {item.granted ? "✅" : item.icon}
              </div>
              <div className="flex-1">
                <div
                  className="text-sm font-semibold flex items-center gap-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.title}
                  {item.required && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "var(--danger-subtle)", color: "var(--danger)" }}
                    >
                      Required
                    </span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {item.granted ? "Permission granted ✓" : item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "var(--danger-subtle)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        <div
          className="mb-6 p-4 rounded-xl"
          style={{ background: "var(--accent-subtle)", border: "1px solid rgba(124,106,255,0.15)" }}
        >
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            💡 <strong>How it works:</strong> ARIA will ask questions out loud. Press and hold the
            microphone button to record your answer, then release to send. Speak clearly and take
            your time.
          </p>
        </div>

        {!micGranted ? (
          <button
            onClick={requestPermissions}
            disabled={checking}
            className="w-full py-4 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            {checking ? "Requesting permissions..." : "Allow Camera & Microphone →"}
          </button>
        ) : (
          <button
            onClick={onReady}
            className="w-full py-4 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            🚀 Start Interview
          </button>
        )}

        <p className="text-center text-xs mt-4" style={{ color: "var(--text-muted)" }}>
          Camera is optional. You can proceed with microphone only.
        </p>
      </div>
    </div>
  );
}
