import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import JobCard from "../components/JobCard";
import { useAuth } from "../context/AuthContext";
import { scanJobMatches, getJobMatchResults } from "../api/jobsApi";

const SCAN_STEPS = [
  "Initializing deep portal scan...",
  "Crawling Top Portals (LinkedIn, Indeed, Adzuna)...",
  "Synthesizing job descriptions...",
  "Analyzing skill alignment...",
  "Calculating match probabilities...",
  "Finalizing personalized opportunities..."
];

export default function JobMatchPage({ onBack }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [hasResults, setHasResults] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    loadJobResults();
  }, [user?.id]);

  useEffect(() => {
    let interval;
    if (scanning) {
      setScanStep(0);
      interval = setInterval(() => {
        setScanStep(prev => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [scanning]);

  async function loadJobResults() {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError("");
      const results = await getJobMatchResults(user.id);

      if (results.has_results) {
        setJobs(results.jobs || []);
        setHasResults(true);
        setLastScanned(results.last_scanned_at);
        setTotalJobs(results.total_fetched || 0);
      } else {
        setHasResults(false);
        setJobs([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load job results");
      setHasResults(false);
    } finally {
      setLoading(false);
    }
  }

  async function scanForJobs() {
    if (!user?.id) return;

    try {
      setScanning(true);
      setError("");
      // We start the scan - typical long-running operation
      await scanJobMatches(user.id, [], "");
      // Reload results after scan
      await loadJobResults();
    } catch (err) {
      setError(err.message || "Failed to scan for jobs");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-500">
      {/* Premium Header */}
      <nav className="sticky top-0 z-50 px-8 py-5 flex items-center justify-between bg-[var(--bg-base)]/80 border-b border-[var(--border-subtle)] backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center font-bold text-white text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              AI
            </div>
            <div>
              <h2 className="font-geist font-black text-2xl tracking-tighter uppercase italic">
                Portal <span className="text-[var(--accent-primary)] not-italic">Match</span>
              </h2>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <div className="mb-16 space-y-4">
          <h1 className="text-5xl md:text-7xl font-black font-geist tracking-tighter italic uppercase leading-none">
            Precision <span className="text-[var(--accent-primary)] not-italic">Matching</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl font-medium leading-relaxed">
            Our AI analyzes your interview performance data against thousands of live positions to identify your highest-probability career moves.
          </p>
        </div>

        {/* Loading State */}
        {loading && !scanning && (
          <div className="flex flex-col justify-center items-center py-40 space-y-8 animate-fadeIn">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--accent-subtle)]" />
              <div className="absolute inset-0 rounded-full border-t-4 border-[var(--accent-primary)] animate-spin" />
            </div>
            <p className="text-[var(--text-muted)] font-geist font-black uppercase tracking-[0.3em] text-xs animate-pulse">
              Retrieving Results...
            </p>
          </div>
        )}

        {/* Scanning State */}
        {scanning && (
          <div className="card-premium p-12 md:p-20 text-center space-y-10 animate-fadeUp">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-3xl bg-[var(--accent-primary)] flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(37,99,235,0.3)] animate-pulse">
                🔍
              </div>
              <div className="absolute -inset-4 rounded-3xl border border-[var(--accent-primary)]/30 animate-ping opacity-20" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-black font-geist uppercase tracking-tight italic">AI Agent Active</h2>
              <p className="text-lg text-[var(--text-muted)] font-medium max-w-md mx-auto">
                {SCAN_STEPS[scanStep]}
              </p>
            </div>

            <div className="w-full max-w-md mx-auto h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
              <div 
                className="h-full bg-[var(--accent-primary)] transition-all duration-700 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                style={{ width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && !scanning && (
          <div className="card-premium p-8 border-[var(--danger)]/20 bg-[var(--danger-subtle)] text-[var(--danger)] mb-12 flex items-center gap-6 animate-shake">
            <span className="text-4xl">⚠️</span>
            <div>
              <p className="font-black font-geist uppercase text-xs tracking-widest mb-1">Retrieval Outage</p>
              <p className="text-sm font-medium opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* No Results - Show Scan Button */}
        {!loading && !hasResults && !error && !scanning && (
          <div className="card-premium p-16 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--accent-primary)]/5 blur-[120px] rounded-full group-hover:bg-[var(--accent-primary)]/10 transition-colors" />
            
            <div className="relative z-10 space-y-8">
              <div className="text-8xl opacity-10 filter grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">🎯</div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black font-geist uppercase tracking-tight italic">Find Your Next Step</h2>
                <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto leading-relaxed">
                  We haven't indexed matching positions for your profile yet. Initialize our AI crawler to scan top portals.
                </p>
              </div>
              <button
                onClick={scanForJobs}
                className="btn-primary px-16 py-5 text-sm uppercase tracking-[0.25em]"
              >
                Launch Deep Scan
              </button>
            </div>
          </div>
        )}

        {/* Results List */}
        {!loading && hasResults && !scanning && (
          <div className="space-y-10 animate-fadeUp">
            {/* Overview Card */}
            <div className="card-premium p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="w-3 h-3 rounded-full bg-[var(--accent-primary)] shadow-[0_0_15px_var(--accent-primary)]" />
                  <h2 className="text-5xl font-black font-geist tracking-tighter uppercase italic">{jobs.length} Matches</h2>
                </div>
                <div className="flex flex-wrap items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  <span className="flex items-center gap-2">
                    CRAWLED: <span className="text-[var(--text-primary)]">{totalJobs} POSITIONS</span>
                  </span>
                  <div className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
                  <span className="flex items-center gap-2">
                    TIMESTAMP: <span className="text-[var(--text-primary)]">{lastScanned ? new Date(lastScanned).toLocaleString() : "SYNCED"}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={scanForJobs}
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--text-primary)] transition-all hover:bg-[var(--accent-subtle)]"
              >
                <svg className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rescan Portals
              </button>
            </div>

            {/* Job Grid */}
            <div className="grid gap-8">
              {jobs.length === 0 ? (
                <div className="card-premium py-32 text-center border-dashed border-2 opacity-60">
                  <p className="text-xl font-bold font-geist uppercase text-[var(--text-muted)] tracking-widest">No Probable Matches Identified.</p>
                </div>
              ) : (
                jobs.map((job, index) => (
                  <JobCard key={job.id || index} job={job} rank={index + 1} />
                ))
              )}
            </div>

            {/* Footer Note */}
            <div className="text-center py-10 opacity-30">
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Proprietary AI Matching Engine v2.4 • Updated Real-time</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
