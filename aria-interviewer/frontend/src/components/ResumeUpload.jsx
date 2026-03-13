import { useState, useRef } from "react";
import { parseResume } from "../api/interviewApi";
import ThemeToggle from "./ThemeToggle";

export default function ResumeUpload({ onComplete }) {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") {
      setFile(f);
      setError("");
    } else {
      setError("Please upload a PDF file");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleParse = async () => {
    if (!file) return;
    setIsLoading(true);
    setError("");
    try {
      const data = await parseResume(file);
      onComplete(data.resume_text || "");
    } catch (err) {
      setError(err.message || "Failed to parse resume. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: "var(--bg-base)" }}>

      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between"
           style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center
                          font-bold text-white text-xs"
               style={{ background: "var(--accent-primary)" }}>
            AI
          </div>
          <span className="font-semibold heading-font"
                style={{ color: "var(--text-primary)" }}>
            ARIA
          </span>
        </div>
        <ThemeToggle />
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fadeUp">

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold heading-font mb-2"
                style={{ color: "var(--text-primary)" }}>
              Upload Your Resume
            </h2>
            <p className="text-sm"
               style={{ color: "var(--text-secondary)" }}>
              Optional — helps ARIA tailor questions to your experience
            </p>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl p-12 text-center cursor-pointer
                       transition-all duration-200 mb-6"
            style={{
              border: isDragOver
                ? "2px dashed var(--accent-primary)"
                : file
                ? "2px dashed var(--success)"
                : "2px dashed var(--border-strong)",
              background: isDragOver
                ? "var(--accent-subtle)"
                : file
                ? "var(--success-subtle)"
                : "var(--bg-surface)",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            {file ? (
              <div>
                <div className="text-5xl mb-3">📄</div>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-2"
                      style={{
                        background: "var(--success-subtle)",
                        color: "var(--success)",
                        border: "1px solid rgba(34,197,94,0.2)"
                      }}>
                  {file.name}
                </span>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Click to change file
                </p>
              </div>
            ) : (
              <div>
                <div className="text-5xl mb-3">📁</div>
                <p className="text-sm font-medium mb-1"
                   style={{ color: "var(--text-primary)" }}>
                  Drag & drop your PDF resume here
                </p>
                <p className="text-xs"
                   style={{ color: "var(--text-muted)" }}>
                  or click to browse
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm text-center"
                 style={{
                   background: "var(--danger-subtle)",
                   border: "1px solid rgba(239,68,68,0.2)",
                   color: "var(--danger)"
                 }}>
              {error}
            </div>
          )}

          {/* Parse button */}
          <button
            onClick={handleParse}
            disabled={!file || isLoading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm
                       text-white transition-all duration-200
                       hover:opacity-90 active:scale-[0.98]
                       disabled:opacity-30 disabled:cursor-not-allowed mb-4"
            style={{
              background: file
                ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
                : "var(--bg-elevated)",
              boxShadow: file ? "var(--shadow-accent)" : "none",
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
                Parsing...
              </span>
            ) : (
              "Parse Resume"
            )}
          </button>

          {/* Skip */}
          <button
            onClick={() => onComplete("")}
            className="w-full text-center text-sm font-medium
                       transition-all hover:opacity-80"
            style={{ color: "var(--text-muted)" }}
          >
            Skip this step →
          </button>
        </div>
      </div>
    </div>
  );
}
