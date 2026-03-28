import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import JobCard from "../components/JobCard";
import { useAuth } from "../context/AuthContext";
import { scanJobMatches, getJobMatchResults } from "../api/jobsApi";

export default function JobMatchPage({ onBack }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [hasResults, setHasResults] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadJobResults();
  }, [user?.id]);

  async function loadJobResults() {
    console.log(`[JobMatchPage] loadJobResults called, user?.id:`, user?.id);
    if (!user?.id) {
      console.log(`[JobMatchPage] No user ID, returning early`);
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log(`[JobMatchPage] Starting fetch for user: ${user.id}`);
      const results = await getJobMatchResults(user.id);
      console.log(`[JobMatchPage] ===== FETCH COMPLETE =====`);
      console.log(`[JobMatchPage] Full results object:`, JSON.stringify(results, null, 2));
      console.log(`[JobMatchPage] has_results:`, results.has_results);
      console.log(`[JobMatchPage] jobs array:`, results.jobs);
      console.log(`[JobMatchPage] jobs length:`, results.jobs?.length);

      if (results.has_results) {
        console.log(`[JobMatchPage] has_results is TRUE - Setting ${results.jobs?.length || 0} jobs`);
        setJobs(results.jobs || []);
        setHasResults(true);
        setLastScanned(results.last_scanned_at);
        setTotalJobs(results.total_fetched || 0);
        console.log(`[JobMatchPage] State updated with jobs`);
      } else {
        console.log(`[JobMatchPage] has_results is FALSE - Showing scan button`);
        setHasResults(false);
        setJobs([]);
      }
    } catch (err) {
      console.error(`[JobMatchPage] CAUGHT ERROR:`, err);
      console.error(`[JobMatchPage] Error message:`, err.message);
      console.error(`[JobMatchPage] Error stack:`, err.stack);
      setError(err.message || "Failed to load job results");
      setHasResults(false);
    } finally {
      console.log(`[JobMatchPage] Finally block - setting loading to false`);
      setLoading(false);
    }
  }

  async function scanForJobs() {
    if (!user?.id) return;

    try {
      setScanning(true);
      setError("");
      await scanJobMatches(user.id, [], "");
      // Re-fetch results after scanning
      await loadJobResults();
    } catch (err) {
      setError(err.message || "Failed to scan for jobs");
    } finally {
      setScanning(false);
    }
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

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--border-default)", borderTopColor: "var(--accent-primary)" }}
            />
            <span className="ml-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              Loading job matches...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            className="p-4 rounded-xl text-sm"
            style={{
              background: "var(--danger-subtle)",
              color: "var(--danger)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            {error}
          </div>
        )}

        {/* No Results - Show Scan Button */}
        {!loading && !hasResults && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🔍</div>
            <h1 className="text-2xl font-bold heading-font mb-3" style={{ color: "var(--text-primary)" }}>
              Find your best job matches
            </h1>
            <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
              Scan job portals to find positions that match your profile
            </p>
            <button
              onClick={scanForJobs}
              disabled={scanning}
              className="px-8 py-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              }}
            >
              {scanning ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Scanning Jobs...
                </div>
              ) : (
                "Scan for Jobs"
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && hasResults && (
          <div className="animate-fadeUp">
            {/* Header with job count and last scanned time */}
            <div className="bg-surface rounded-2xl p-6 mb-8" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold heading-font mb-2" style={{ color: "var(--text-primary)" }}>
                    {jobs.length} Job Matches Found
                  </h1>
                  <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span>Total jobs scanned: {totalJobs}</span>
                    {lastScanned && (
                      <span>Last scanned: {new Date(lastScanned).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={scanForJobs}
                  disabled={scanning}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
                  style={{
                    background: "var(--accent-primary)",
                    color: "white",
                  }}
                >
                  {scanning ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Scanning...
                    </div>
                  ) : (
                    "Rescan Jobs"
                  )}
                </button>
              </div>
            </div>

            {/* Job Cards */}
            {jobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-lg font-semibold heading-font mb-2" style={{ color: "var(--text-primary)" }}>
                  No matches found
                </p>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  Try scanning again or update your profile
                </p>
                <button
                  onClick={scanForJobs}
                  disabled={scanning}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                  }}
                >
                  {scanning ? "Scanning..." : "Scan Again"}
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {jobs.map((job, index) => (
                  <JobCard key={job.id || index} job={job} rank={index + 1} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
