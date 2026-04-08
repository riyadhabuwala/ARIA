import { useState, useRef, useEffect } from "react";

export default function CameraPermissionScreen({ onReady, candidateName, domain }) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [previewStream, setPreviewStream] = useState(null);
  const previewRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [previewStream]);

  useEffect(() => {
    if (previewRef.current && previewStream) {
      previewRef.current.srcObject = previewStream;
      previewRef.current.play().catch(() => {});
    }
  }, [previewStream]);

  async function requestPermissions() {
    setChecking(true);
    setError("");

    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraGranted(true);
      setPreviewStream(camStream);
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

  function handleStart() {
    if (previewStream) {
      previewStream.getTracks().forEach((t) => t.stop());
      setPreviewStream(null);
    }
    onReady();
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "var(--bg-base)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Background effects */}
      <div style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}>
        <div style={{
          position: "absolute",
          top: "-20%",
          right: "10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.12), transparent 60%)",
          filter: "blur(60px)",
          animation: "drift 18s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-10%",
          left: "5%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.08), transparent 60%)",
          filter: "blur(60px)",
          animation: "drift 18s ease-in-out infinite 3s",
        }} />
      </div>

      <div className="animate-fadeUp" style={{
        width: "100%",
        maxWidth: "560px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            color: "white",
            fontSize: "18px",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            boxShadow: "0 0 30px rgba(37,99,235,0.3)",
            margin: "0 auto 16px",
          }}>AI</div>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "800",
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            fontFamily: "'Geist', 'Inter', sans-serif",
            marginBottom: "8px",
          }}>
            Ready to start, {candidateName}?
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            {domain} Interview · ~10–15 minutes
          </p>
        </div>

        {/* Camera Preview */}
        <div style={{
          borderRadius: "16px",
          overflow: "hidden",
          marginBottom: "24px",
          aspectRatio: "16/9",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          position: "relative",
        }}>
          {previewStream ? (
            <video
              ref={previewRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}>
              <div style={{
                width: "64px", height: "64px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}>📷</div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Camera preview will appear here
              </p>
            </div>
          )}

          {/* Preview Label */}
          {previewStream && (
            <div style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderRadius: "8px",
              background: "var(--bg-overlay)",
              backdropFilter: "blur(8px)",
            }}>
              <div style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px rgba(34,197,94,0.3)",
              }} />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-primary)" }}>
                Camera Preview
              </span>
            </div>
          )}
        </div>

        {/* Permission Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 16px",
                borderRadius: "12px",
                background: "var(--bg-surface)",
                border: item.granted
                  ? "1px solid rgba(34,197,94,0.2)"
                  : "1px solid var(--border-subtle)",
                transition: "border-color 0.3s ease",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                  background: item.granted ? "rgba(34,197,94,0.08)" : "var(--bg-elevated)",
                  border: "1px solid " + (item.granted ? "rgba(34,197,94,0.15)" : "var(--border-subtle)"),
                }}
              >
                {item.granted ? "✅" : item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  {item.title}
                  {item.required && (
                    <span style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      background: "rgba(239,68,68,0.08)",
                      color: "#ef4444",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}>Required</span>
                  )}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {item.granted ? "Permission granted ✓" : item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "12px",
            fontSize: "13px",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.15)",
            color: "#ef4444",
          }}>
            {error}
          </div>
        )}

        {/* Tip */}
        <div style={{
          marginBottom: "20px",
          padding: "14px 16px",
          borderRadius: "12px",
          background: "rgba(37,99,235,0.06)",
          border: "1px solid rgba(37,99,235,0.15)",
        }}>
          <p style={{ fontSize: "12px", lineHeight: "1.6", color: "var(--text-muted)", margin: 0 }}>
            💡 <strong style={{ color: "var(--text-primary)" }}>How it works:</strong> ARIA will ask questions out loud. Press and hold the
            microphone button to record your answer, then release to send. Speak clearly and take your time.
          </p>
        </div>

        {/* Action Button */}
        {!micGranted ? (
          <button
            onClick={requestPermissions}
            disabled={checking}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              fontWeight: "700",
              color: "white",
              fontSize: "14px",
              border: "none",
              cursor: checking ? "wait" : "pointer",
              opacity: checking ? 0.7 : 1,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 0 30px rgba(37,99,235,0.25)",
              transition: "all 0.2s ease",
            }}
          >
            {checking ? "Requesting permissions..." : "Allow Camera & Microphone →"}
          </button>
        ) : (
          <button
            onClick={handleStart}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "14px",
              fontWeight: "700",
              color: "white",
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 0 30px rgba(37,99,235,0.25)",
              transition: "all 0.2s ease",
            }}
          >
            🚀 Start Interview
          </button>
        )}

        <p style={{
          textAlign: "center",
          fontSize: "11px",
          marginTop: "14px",
          color: "var(--text-muted)",
        }}>
          Camera is optional. You can proceed with microphone only.
        </p>
      </div>
    </div>
  );
}
