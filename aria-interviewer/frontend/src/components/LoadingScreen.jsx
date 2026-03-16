export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="relative">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-xl font-geist"
          style={{
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            boxShadow: "0 0 40px rgba(37,99,235,0.4)",
          }}
        >
          AI
        </div>
        <div
          className="absolute inset-0 rounded-2xl animate-ping opacity-20"
          style={{ background: "#2563eb" }}
        />
      </div>
      <div className="text-center">
        <div
          className="text-2xl font-bold font-geist mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          ARIA
        </div>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading your workspace...
        </div>
      </div>
      <div
        className="w-32 h-0.5 rounded-full overflow-hidden"
        style={{ background: "var(--bg-elevated)" }}
      >
        <div
          className="h-full rounded-full animate-pulse w-2/3"
          style={{
            background: "linear-gradient(90deg, #2563eb, #60a5fa)",
          }}
        />
      </div>
    </div>
  );
}
