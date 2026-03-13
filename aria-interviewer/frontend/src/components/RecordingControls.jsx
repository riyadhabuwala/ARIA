export default function RecordingControls({
  isRecording, audioUrl, onDownload, permissionDenied
}) {
  if (permissionDenied) {
    return (
      <div className="text-xs" style={{ color: "var(--warning)" }}>
        ⚠ Mic access denied — recording unavailable
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--danger)" }} />
          <span className="text-xs" style={{ color: "var(--danger)" }}>Recording</span>
        </div>
      )}
      {audioUrl && !isRecording && (
        <div className="flex items-center gap-3">
          <audio controls src={audioUrl} className="h-8" />
          <button
            onClick={onDownload}
            className="px-3 py-1 text-xs rounded-lg transition-colors"
            style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
          >
            ⬇ Download
          </button>
        </div>
      )}
    </div>
  );
}
