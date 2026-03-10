import { useState, useRef } from "react";
import { parseResume } from "../api/interviewApi";

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Upload Your Resume</h2>
          <p className="text-gray-400">Optional — helps ARIA tailor questions to your experience</p>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 mb-6 ${
            isDragOver
              ? "border-purple-400 bg-purple-500/10"
              : file
              ? "border-green-500 bg-green-500/5"
              : "border-gray-600 bg-gray-800/30 hover:border-gray-500"
          }`}
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
              <div className="text-4xl mb-3">📄</div>
              <p className="text-green-400 font-medium">{file.name}</p>
              <p className="text-gray-500 text-sm mt-1">Click to change file</p>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-3">📁</div>
              <p className="text-gray-300 font-medium">
                Drag & drop your PDF resume here
              </p>
              <p className="text-gray-500 text-sm mt-1">or click to browse</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => onComplete("")}
            className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 transition"
          >
            Skip
          </button>
          <button
            onClick={handleParse}
            disabled={!file || isLoading}
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl transition hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Parsing...
              </>
            ) : (
              "Parse Resume"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
