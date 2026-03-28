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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading resume...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Resume Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Upload, manage, and get AI-powered feedback on your resume.
        </p>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 text-sm font-medium">✓ {success}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm font-medium">✗ {error}</p>
          </div>
        )}

        <div className="grid gap-6">
          {!hasResume ? (
            /* ══ UPLOAD STATE ══ */
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <div className="text-4xl mb-3">📄</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Drag and drop your resume here
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Select PDF File
                </button>

                {file && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
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
                    className="px-4 py-2.5 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Profile Information
                  </h2>
                  <button
                    onClick={() => {
                      setFile(null);
                      setHasResume(false);
                    }}
                    className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    Update Resume
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Information
                    </h3>
                    <div className="space-y-2">
                      {profile.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          📧 <span className="font-medium">{profile.email}</span>
                        </p>
                      )}
                      {profile.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          📱 <span className="font-medium">{profile.phone}</span>
                        </p>
                      )}
                      {profile.location && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          📍 <span className="font-medium">{profile.location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Key Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.slice(0, 8).map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {profile.skills.length > 8 && (
                          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full font-medium">
                            +{profile.skills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Experience Summary */}
                {profile.experience && profile.experience.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Experience Summary
                    </h3>
                    <div className="space-y-3">
                      {profile.experience.slice(0, 3).map((exp, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {exp.title || "Position"} at {exp.company || "Company"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
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
