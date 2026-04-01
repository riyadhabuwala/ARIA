import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { parseResume } from "../api/interviewApi";
import { getProfile, saveResumeProfile, getResumeQuality } from "../api/profileApi";
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
            <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500 animate-spin mx-auto mb-4"></div>
            <p style={{ color: "var(--text-muted)" }}>Loading resume...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold heading-font mb-2" style={{ color: "var(--text-primary)" }}>
          Resume Manager
        </h1>
        <p style={{ color: "var(--text-secondary)" }} className="mb-8">
          Upload, manage, and get AI-powered feedback on your resume.
        </p>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 rounded-lg border" style={{ background: "var(--success-subtle)", borderColor: "rgba(34,197,94,0.2)" }}>
            <p style={{ color: "var(--success)" }} className="text-sm font-medium">✓ {success}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border" style={{ background: "var(--danger-subtle)", borderColor: "rgba(239,68,68,0.2)" }}>
            <p style={{ color: "var(--danger)" }} className="text-sm font-medium">✗ {error}</p>
          </div>
        )}

        <div className="grid gap-6">
          {!hasResume ? (
            /* ══ UPLOAD STATE ══ */
            <div className="rounded-lg shadow-sm border p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
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
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors`}
                style={{
                  borderColor: isDragOver ? "var(--accent-primary)" : "var(--border-default)",
                  background: isDragOver ? "var(--accent-subtle)" : "transparent"
                }}
              >
                <div className="text-4xl mb-3">📄</div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  Drag and drop your resume here
                </h3>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
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
                  className="px-4 py-2 text-white rounded-lg font-medium transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                  }}
                >
                  Select PDF File
                </button>

                {file && (
                  <div className="mt-4 p-3 rounded-lg" style={{ background: "var(--accent-subtle)" }}>
                    <p className="text-sm" style={{ color: "var(--accent-primary)" }}>
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
                    className="flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                    }}
                  >
                    {isUploading ? "Uploading..." : "Upload Resume"}
                  </button>
                  <button
                    onClick={() => setFile(null)}
                    disabled={isUploading}
                    className="px-4 py-2.5 rounded-lg font-medium transition-all hover:opacity-80"
                    style={{
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-overlay)"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ══ RESUME UPLOADED STATE ══ */
            <>
              {/* Profile Information */}
              <div className="rounded-lg shadow-sm border p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                    Profile Information
                  </h2>
                  <button
                    onClick={() => {
                      setFile(null);
                      setHasResume(false);
                    }}
                    className="px-3 py-1.5 text-sm rounded-lg transition-all hover:opacity-80"
                    style={{
                      color: "var(--accent-primary)",
                      background: "var(--accent-subtle)"
                    }}
                  >
                    Update Resume
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div className="p-4 rounded-lg border" style={{ background: "var(--bg-overlay)", borderColor: "var(--border-subtle)" }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                      📋 Contact Information
                    </h3>
                    <div className="space-y-2">
                      {profile.email && (
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          📧 <span className="font-medium" style={{ color: "var(--text-primary)" }}>{profile.email}</span>
                        </p>
                      )}
                      {profile.phone && (
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          📱 <span className="font-medium" style={{ color: "var(--text-primary)" }}>{profile.phone}</span>
                        </p>
                      )}
                      {profile.location && (
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          📍 <span className="font-medium" style={{ color: "var(--text-primary)" }}>{profile.location}</span>
                        </p>
                      )}
                      {!profile.email && !profile.phone && !profile.location && (
                        <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                          No contact information extracted
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="p-4 rounded-lg border" style={{ background: "var(--accent-subtle)", borderColor: "rgba(37,99,235,0.2)" }}>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--accent-primary)" }}>
                        🎯 Key Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.slice(0, 8).map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 text-xs rounded-full font-medium"
                            style={{
                              background: "var(--accent-primary)",
                              color: "white"
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                        {profile.skills.length > 8 && (
                          <span className="px-3 py-1 text-xs rounded-full font-medium" style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)" }}>
                            +{profile.skills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Experience Summary */}
                {profile.experience && profile.experience.length > 0 && (
                  <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <h3 className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>
                      💼 Experience Summary
                    </h3>
                    <div className="space-y-3">
                      {profile.experience.slice(0, 3).map((exp, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                            {exp.title || "Position"} at {exp.company || "Company"}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {exp.duration || "Duration not specified"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI-Powered Feedback - Resume Quality Score */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  AI-Powered Resume Feedback
                </h2>
                <ResumeQualityScore userId={user?.id} hasResume={true} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
