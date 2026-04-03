import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { parseResume } from "../api/interviewApi";
import { getProfile, saveResumeProfile } from "../api/profileApi";
import ResumeQualityScore from "./ResumeQualityScore";

export default function Resume() {
  const { user } = useAuth();
  const inputRef = useRef(null);

  // State
  const [profile, setProfile] = useState(null);
  const [hasResume, setHasResume] = useState(false);
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const displayName =
    profile?.name ||
    profile?.full_name ||
    profile?.extracted_profile?.name ||
    (profile?.email ? profile.email.split("@")[0] : "Candidate");

  const avatarLetter = (displayName || "C").charAt(0).toUpperCase();

  // Load profile on mount
  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getProfile(user.id);
      console.log("[Resume] Profile data loaded:", data);
      setProfile(data);
      // Use the has_resume flag directly from the API response
      setHasResume(!!data?.has_resume);
      console.log("[Resume] hasResumeUploaded:", data?.has_resume);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError("");
      setSuccess("");

      // Parse resume
      const parsedData = await parseResume(file);
      const resumeText = parsedData.resume_text || "";
      const extractedProfile = parsedData.extracted_profile || {};

      // Save to profile
      await saveResumeProfile(user.id, resumeText, extractedProfile, file.name);

      // Reload profile
      await loadProfile();

      setFile(null);
      setSuccess("Resume uploaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to upload resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading resume...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-5 md:px-6 lg:px-8">
      <div
        className="max-w-7xl mx-auto rounded-2xl p-4 md:p-6 bg-[var(--hero-bg)] border border-[var(--hero-border)] shadow-xl"
      >
        {/* Header */}
        <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight heading-font text-[var(--text-primary)] mb-1">
          Resume Manager
        </h1>
        <p className="text-sm md:text-base text-[var(--text-secondary)] mb-7">
          Upload, manage, and get AI-powered feedback on your resume.
        </p>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-3 rounded-xl border" style={{ background: "var(--success-subtle)", borderColor: "rgba(34,197,94,0.2)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--success)" }}>✓ {success}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded-xl border" style={{ background: "var(--danger-subtle)", borderColor: "rgba(239,68,68,0.2)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>✗ {error}</p>
          </div>
        )}

        <div className="grid gap-6">
          {!hasResume ? (
            /* ══ UPLOAD STATE ══ */
            <div
              className="rounded-2xl p-6 md:p-8 bg-[var(--bg-base)] border border-[var(--border-subtle)] shadow-lg"
            >
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Upload Your Resume
              </h2>

              {/* Drag & Drop Area */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/20 hover:border-white/35"
                }`}
              >
                <div className="text-4xl mb-3">📄</div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                  Drag and drop your resume here
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  or click the button below to select a file
                </p>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  className="hidden"
                />

                <button
                  onClick={() => inputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                >
                  Select PDF File
                </button>

                {file && (
                  <div className="mt-4 p-3 rounded-lg" style={{ background: "var(--accent-subtle)", border: "1px solid var(--accent-border)" }}>
                    <p className="text-sm" style={{ color: "var(--accent-light)" }}>
                      📎 {file.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              {file && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {isUploading ? "Uploading..." : "Upload Resume"}
                  </button>
                  <button
                    onClick={() => setFile(null)}
                    disabled={isUploading}
                    className="px-4 py-2.5 text-white/80 border border-white/20 hover:bg-white/5 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ══ RESUME UPLOADED STATE ══ */
            <>
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="space-y-4">
                  <div
                    className="rounded-2xl p-5 bg-[var(--bg-base)] border border-[var(--border-subtle)]"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold bg-[var(--accent-primary)] text-white shadow-lg"
                      >
                        {avatarLetter}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--text-primary)] truncate">{displayName}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{profile?.email || "No email available"}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {profile?.phone && <p className="text-sm text-[var(--text-secondary)]">📞 {profile.phone}</p>}
                      {profile?.location && <p className="text-sm text-[var(--text-secondary)]">📍 {profile.location}</p>}
                    </div>

                    <button
                      onClick={() => {
                        setFile(null);
                        setHasResume(false);
                      }}
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{
                        background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                        boxShadow: "var(--shadow-accent)",
                      }}
                    >
                      UPDATE RESUME
                    </button>
                  </div>

                  <div
                    className="rounded-2xl p-4 bg-[var(--bg-base)] border border-[var(--border-subtle)]"
                  >
                    <p className="text-xs tracking-[0.18em] uppercase text-[var(--text-muted)] mb-3">Quick Filters</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-[var(--accent-subtle)] border border-[var(--accent-border)]">
                        <span className="text-sm text-[var(--accent-primary)] font-medium">Resume Version 1.0</span>
                        <span className="text-xs text-[var(--accent-primary)] opacity-60">100%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                        <span className="text-sm text-[var(--text-secondary)]">Backend Focused</span>
                        <span className="text-xs text-[var(--text-muted)]">80%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                        <span className="text-sm text-[var(--text-secondary)]">Fullstack Draft</span>
                        <span className="text-xs text-[var(--text-muted)]">35%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <ResumeQualityScore userId={user?.id} hasResume={true} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
