export default function EndInterviewModal({ onConfirm, onCancel, questionNumber }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 animate-fadeUp"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
          style={{ background: "var(--warning-subtle)" }}
        >
          ⚠️
        </div>

        <h3
          className="text-lg font-bold mb-2 heading-font"
          style={{ color: "var(--text-primary)" }}
        >
          End interview early?
        </h3>

        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: "var(--text-secondary)" }}
        >
          You've answered {questionNumber} question{questionNumber !== 1 ? "s" : ""} so far.
          You'll still receive a performance report based on your answers up to this point.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            Continue Interview
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
            }}
          >
            End & Get Report
          </button>
        </div>
      </div>
    </div>
  );
}
