import { useEffect, useRef, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import ScanProgress from "../components/ScanProgress";
import JobCard from "../components/JobCard";
import ProfileSummary from "../components/ProfileSummary";
import ResumeQualityScore from "../components/ResumeQualityScore";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function JobMatchPage({ user, onBack }) {
  const [step, setStep] = useState("loading");
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [lastScanned, setLastScanned] = useState(null);
  const [totalFetched, setTotalFetched] = useState(0);
  const [queriesUsed, setQueriesUsed] = useState([]);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    checkExistingData();
  }, []);

  async function checkExistingData() {
    try {
      const profRes = await fetch(`${BASE_URL}/api/profile/${user.id}`);
      const profData = await profRes.json();

      const resRes = await fetch(`${BASE_URL}/api/job-match/results/${user.id}`);
      const resData = await resRes.json();

      if (resData.has_results) {
        setProfile(profData.extracted_profile || null);
        setJobs(resData.jobs || []);
        setLastScanned(resData.last_scanned_at);
        setTotalFetched(resData.total_fetched || 0);
        setQueriesUsed(resData.queries_used || []);
        setStep("results");
      } else if (profData.has_resume) {
        setProfile(profData.extracted_profile || null);
        setStep("upload");
      } else {
        setStep("upload");
      }
    } catch {
      setStep("upload");
    }
  }

  async function handleFileUpload(file) {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setStep("scanning");
      setError("");

      const parseRes = await fetch(`${BASE_URL}/api/parse-resume`, {
        method: "POST",
        body: formData,
      });
      const parseData = await parseRes.json();

      if (!parseRes.ok || !parseData.resume_text) {
        throw new Error(parseData.detail || "Could not extract text from PDF");
      }

      const saveRes = await fetch(`${BASE_URL}/api/profile/save-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          resume_text: parseData.resume_text,
          filename: file.name,
        }),
      });
      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.detail || "Failed to save resume");
      }

      await runScan();
    } catch (err) {
      setError(err.message || "Failed to process resume");
      setStep("upload");
    }
  }

  async function runScan() {
    setStep("scanning");
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/job-match/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Scan failed");
      }

      const data = await res.json();
      setProfile(data.profile);
      setJobs(data.jobs || []);
      setLastScanned(new Date().toISOString());
      setTotalFetched(data.total_fetched || 0);
      setQueriesUsed(data.queries_used || []);
      setStep("results");
    } catch (err) {
      setError(err.message || "Scan failed. Please try again.");
      setStep(jobs.length > 0 ? "results" : "upload");
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-sm transition-all hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            Back to Dashboard
          </button>
          <div className="h-4 w-px" style={{ background: "var(--border-default)" }} />
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
              style={{ background: "var(--accent-primary)" }}
            >
              AI
            </div>
            <span className="font-semibold heading-font" style={{ color: "var(--text-primary)" }}>
              Job Match
            </span>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: "var(--accent-subtle)",
              color: "var(--accent-primary)",
              border: "1px solid rgba(124,106,255,0.2)",
            }}
          >
            Beta
          </span>
        </div>
        <ThemeToggle />
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {step === "loading" && (
          <div className="flex justify-center py-20">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--border-default)", borderTopColor: "var(--accent-primary)" }}
            />
          </div>
        )}

        {step === "upload" && (
          <div className="animate-fadeUp">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold heading-font mb-3" style={{ color: "var(--text-primary)" }}>
                Find your best job matches
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Upload your resume and our AI scans Indian job portals to return top matches.
              </p>
            </div>

            <div className="flex justify-center gap-3 mb-8 flex-wrap">
              {["Naukri", "LinkedIn", "Indeed", "Internshala", "Wellfound"].map((p) => (
                <span
                  key={p}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {p}
                </span>
              ))}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-2xl p-12 text-center transition-all duration-200"
              style={{
                background: dragging ? "var(--accent-subtle)" : "var(--bg-surface)",
                border: dragging
                  ? "2px dashed var(--accent-primary)"
                  : "2px dashed var(--border-default)",
                boxShadow: dragging ? "var(--shadow-accent)" : "none",
              }}
            >
              <div className="text-5xl mb-4">📄</div>
              <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Drop your resume here
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                or click to browse
              </p>
              <span
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "var(--accent-subtle)",
                  color: "var(--accent-primary)",
                  border: "1px solid rgba(124,106,255,0.2)",
                }}
              >
                PDF only · Max 5MB
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files[0])}
              />
            </div>

            {error && (
              <div
                className="mt-4 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "var(--danger-subtle)",
                  color: "var(--danger)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                {error}
              </div>
            )}

            {profile && (
              <div className="mt-6 text-center">
                <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                  Or use your saved resume
                </p>
                <button
                  onClick={runScan}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                  }}
                >
                  Run scan with saved resume -&gt;
                </button>
              </div>
            )}

            {profile && (
              <div className="mt-8">
                <ResumeQualityScore userId={user.id} hasResume={true} />
              </div>
            )}
          </div>
        )}

        {step === "scanning" && (
          <div className="flex flex-col items-center py-10">
            <ScanProgress isScanning={true} />
          </div>
        )}

        {step === "results" && (
          <div className="animate-fadeUp">
            {profile && <ProfileSummary profile={profile} lastScanned={lastScanned} onRescan={runScan} />}

            <ResumeQualityScore userId={user.id} hasResume={true} />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold heading-font" style={{ color: "var(--text-primary)" }}>
                  Top {jobs.length} matches found
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Scanned {totalFetched} jobs across portals
                  {queriesUsed.length > 0 && ` · ${queriesUsed.length} search queries`}
                </p>
              </div>
              <button
                onClick={() => setStep("upload")}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                Upload new resume
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg font-semibold heading-font mb-2" style={{ color: "var(--text-primary)" }}>
                  No matches found
                </p>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  Try uploading a more detailed resume or retry later.
                </p>
                <button
                  onClick={runScan}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job, i) => (
                  <JobCard key={job.id || i} job={job} rank={i + 1} />
                ))}
              </div>
            )}

            {queriesUsed.length > 0 && (
              <div
                className="mt-8 p-4 rounded-xl"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                  Search queries used by AI agent:
                </p>
                <div className="flex flex-wrap gap-2">
                  {queriesUsed.map((q, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      "{q}"
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
