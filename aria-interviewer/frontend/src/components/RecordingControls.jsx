export default function RecordingControls({
  isRecording, audioUrl, onDownload, permissionDenied
}) {
  if (permissionDenied) {
    return (
      <div className="text-xs text-yellow-500">
        ⚠ Mic access denied — recording unavailable
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-400">Recording</span>
        </div>
      )}
      {audioUrl && !isRecording && (
        <div className="flex items-center gap-3">
          <audio controls src={audioUrl} className="h-8" />
          <button
            onClick={onDownload}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            ⬇ Download
          </button>
        </div>
      )}
    </div>
  );
}
