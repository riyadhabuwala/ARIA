import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory, parseResume } from "../api/interviewApi";
import { getAnalytics } from "../api/analyticsApi";
import { getJobMatchResults } from "../api/jobsApi";
import { getResumeQuality, saveResumeProfile } from "../api/profileApi";
import { useChatbot } from "../hooks/useChatbot";
import ScoreGauge from "./ScoreGauge";

// Interview domains for the picker
const INTERVIEW_DOMAINS = [
  { id: "software-engineering", name: "SWE", fullName: "Software Engineering", color: "bg-blue-500" },
  { id: "web-development", name: "Web Dev", fullName: "Web Development", color: "bg-green-500" },
  { id: "data-science", name: "Data Sci", fullName: "Data Science", color: "bg-purple-500" },
  { id: "ai-ml", name: "AI/ML", fullName: "AI & Machine Learning", color: "bg-red-500" },
  { id: "hr", name: "HR", fullName: "Human Resources", color: "bg-orange-500" }
];

// Skeleton loader component
function StatSkeleton() {
  return (
    <div className="card-premium p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-[var(--bg-elevated)] rounded-xl w-16 mb-2"></div>
        <div className="h-4 bg-[var(--bg-elevated)] rounded-lg w-24"></div>
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-[var(--border-subtle)]">
      <td className="px-6 py-4">
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-12"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-8"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-8 bg-[var(--bg-elevated)] rounded w-20"></div>
      </td>
    </tr>
  );
}

export default function Dashboard({ user, onNewInterview, onViewSession, onJobMatch }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [jobMatches, setJobMatches] = useState([]);
  const [resumeQuality, setResumeQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const { messages, isLoading: chatLoading, sendMessage } = useChatbot(user.id);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          historyRes,
          analyticsRes,
          jobRes,
          resumeRes
        ] = await Promise.allSettled([
          getHistory(user.id),
          getAnalytics(user.id),
          getJobMatchResults(user.id),
          getResumeQuality(user.id)
        ]);

        if (historyRes.status === "fulfilled") {
          setSessions(historyRes.value.sessions || []);
        }

        if (analyticsRes.status === "fulfilled") {
          setAnalytics(analyticsRes.value);
        } else {
          console.warn("Analytics not available:", analyticsRes.reason);
        }

        if (jobRes.status === "fulfilled") {
          setJobMatches(jobRes.value.jobs || []);
        } else {
          console.warn("Job matches not available:", jobRes.reason);
        }

        if (resumeRes.status === "fulfilled") {
          setResumeQuality(resumeRes.value);
        } else {
          console.warn("Resume quality not available:", resumeRes.reason);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.id]);

  const totalInterviews = sessions.length;
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.overall_score || 0), 0) / sessions.length)
    : 0;
  const avgConfidence = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.confidence_score || 0), 0) / sessions.length)
    : 0;
  const jobMatchCount = jobMatches.length;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-[var(--success)] bg-[var(--success-subtle)]';
      case 'B': return 'text-[var(--accent-primary)] bg-[var(--accent-subtle)]';
      case 'C': return 'text-[var(--warning)] bg-[var(--warning-subtle)]';
      case 'D': return 'text-[var(--danger)] bg-[var(--danger-subtle)]';
      case 'F': return 'text-[var(--danger)] bg-[var(--danger-subtle)]';
      default: return 'text-[var(--text-muted)] bg-[var(--bg-elevated)]';
    }
  };

  const handleStartInterview = () => {
    if (selectedDomain) {
      onNewInterview();
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() && !chatLoading) {
      sendMessage(chatInput);
      setChatInput("");
    }
  };

  const handleResumeUpload = async (file) => {
    if (!file || !user?.id) return;

    setUploadLoading(true);
    try {
      const parseData = await parseResume(file);
      if (!parseData.resume_text) throw new Error("Text extraction failed");

      await saveResumeProfile(user.id, parseData.resume_text, parseData.extracted_profile || {}, file.name);

      const resumeData = await getResumeQuality(user.id, true);
      setResumeQuality(resumeData);
      setShowUploadModal(false);
    } catch (error) {
      console.error("Resume upload failed:", error);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] font-geist mb-1 italic">
            DASHBOARD
          </h1>
          <p className="text-[var(--text-secondary)] font-medium">
            Welcome back, <span className="text-[var(--text-primary)]">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>. Here's your status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={uploadLoading}
            className="flex items-center gap-2 px-6 py-3 border border-[var(--border-default)] rounded-xl text-[var(--text-primary)] font-semibold bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {uploadLoading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </div>
      </section>

      {/* Top Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <div className="card-premium p-6 flex items-center gap-5">
              <div className="w-12 h-12 bg-[var(--accent-subtle)] border border-[var(--accent-border)] rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                📈
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Sessions</p>
                <p className="text-2xl font-black text-[var(--text-primary)] font-geist">{totalInterviews}</p>
              </div>
            </div>

            <div className="card-premium p-6 flex items-center justify-center">
              <ScoreGauge score={avgScore} label="Avg Score" size="sm" showGrade={false} />
            </div>

            <div className="card-premium p-6 flex items-center justify-center">
              <ScoreGauge score={avgConfidence} label="Confidence" size="sm" showGrade={false} />
            </div>

            <div className="card-premium p-6 flex items-center gap-5">
              <div className="w-12 h-12 bg-[var(--success-subtle)] border border-[var(--success)]/20 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                💼
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Job Matches</p>
                <p className="text-2xl font-black text-[var(--text-primary)] font-geist">{jobMatchCount}</p>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent & Picker */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Interviews */}
          <div className="card-premium overflow-hidden">
            <div className="px-7 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-geist uppercase tracking-widest italic">
                RECENT SESSION REPORTS
              </h3>
              <button onClick={() => navigate("/history")} className="text-xs font-bold text-[var(--accent-primary)] hover:underline uppercase tracking-tighter">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-surface)]">
                  <tr>
                    {["Domain", "Date", "Score", "Grade", "Action"].map(h => (
                      <th key={h} className="px-7 py-4 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-7 py-16 text-center">
                        <div className="max-w-xs mx-auto space-y-4">
                          <p className="text-4xl opacity-50 grayscale">🎯</p>
                          <p className="text-[var(--text-secondary)] font-medium">No sessions logged yet.</p>
                          <button onClick={onNewInterview} className="btn-primary w-full py-3 text-xs">START INITIAL INTERVIEW</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sessions.slice(0, 5).map((session) => (
                      <tr key={session.id} className="hover:bg-[var(--bg-hover)] transition-colors group">
                        <td className="px-7 py-5 font-bold text-[var(--text-primary)] tracking-tight">{session.domain}</td>
                        <td className="px-7 py-5 text-sm text-[var(--text-secondary)]">{formatDate(session.created_at)}</td>
                        <td className="px-7 py-5 font-black text-[var(--text-primary)]">{session.overall_score || 0}%</td>
                        <td className="px-7 py-5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getGradeColor(session.grade)}`}>
                            {session.grade || 'N/A'}
                          </span>
                        </td>
                        <td className="px-7 py-5">
                          <button
                            onClick={() => onViewSession(session)}
                            className="text-[var(--accent-primary)] hover:text-[var(--accent-hover)] font-bold text-xs uppercase tracking-tighter transition-colors"
                          >
                            Report →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Interview Picker */}
          <div className="card-premium p-8">
            <h3 className="text-lg font-bold text-[var(--text-primary)] font-geist mb-6 uppercase tracking-widest italic">
              START NEW SESSION
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
              {INTERVIEW_DOMAINS.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain)}
                  className={`
                    group p-5 rounded-2xl border-2 transition-all duration-300 text-center
                    ${selectedDomain?.id === domain.id
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)] shadow-[0_0_20px_rgba(37,99,235,0.15)] scale-105'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-default)] hover:scale-[1.02]'
                    }
                  `}
                >
                  <div className={`w-10 h-10 ${domain.color} rounded-xl mx-auto mb-3 shadow-lg group-hover:rotate-6 transition-transform opacity-80 group-hover:opacity-100`}></div>
                  <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tighter mb-1">{domain.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-tight">{domain.fullName}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleStartInterview}
              disabled={!selectedDomain}
              className={`
                w-full py-4 px-6 rounded-2xl font-black uppercase tracking-[0.1em] transition-all duration-300
                ${selectedDomain
                  ? 'btn-primary text-sm'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)] cursor-not-allowed text-xs'
                }
              `}
            >
              {selectedDomain ? `LAUNCH ${selectedDomain.fullName} SESSION` : 'SELECT A DOMAIN TO START'}
            </button>
          </div>
        </div>

        {/* Right Column: AI & Stats */}
        <div className="space-y-8">
          {/* AI Coach */}
          <div className="card-premium h-[420px] flex flex-col">
            <div className="px-7 py-5 border-b border-[var(--border-subtle)] flex items-center gap-3">
              <span className="text-xl">🤖</span>
              <h3 className="text-sm font-black text-[var(--text-primary)] font-geist uppercase tracking-widest italic">
                AI COACH
              </h3>
            </div>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {messages.slice(-4).map((msg, idx) => (
                <div key={idx} className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm
                  ${msg.role === 'user'
                    ? 'bg-[var(--accent-primary)] text-white ml-auto rounded-tr-none'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] mr-auto rounded-tl-none'
                  }
                `}>
                  {msg.content}
                </div>
              ))}
              {chatLoading && (
                <div className="bg-[var(--bg-elevated)] p-4 rounded-2xl rounded-tl-none border border-[var(--border-subtle)] w-16">
                  <div className="flex gap-1 justify-center">
                    <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleChatSubmit} className="p-5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for feedback..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs focus:ring-1 focus:ring-[var(--accent-primary)] outline-none placeholder-[var(--text-muted)]"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-2.5 bg-[var(--accent-primary)] text-white rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all font-bold text-[10px] uppercase shadow-lg"
                >
                  GO
                </button>
              </div>
            </form>
          </div>

          {/* Resume Quality */}
          <div className="card-premium p-7 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[var(--text-primary)] font-geist uppercase tracking-widest italic">RESUME QUALITY</h4>
              <span className="text-xl grayscale opacity-50">📄</span>
            </div>
            
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-[var(--bg-elevated)] rounded-2xl mx-auto w-20"></div>
                <div className="h-4 bg-[var(--bg-elevated)] rounded-lg w-full"></div>
              </div>
            ) : resumeQuality && resumeQuality.overall_score > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <ScoreGauge score={resumeQuality.overall_score} label="Score" size="sm" showGrade={true} />
                </div>
                {resumeQuality.suggestions?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">Top Fixes:</p>
                    <ul className="space-y-1.5">
                      {resumeQuality.suggestions.slice(0, 2).map((s, i) => (
                        <li key={i} className="text-[11px] text-[var(--text-secondary)] flex items-start gap-2">
                          <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                          <span className="leading-tight font-medium">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button onClick={() => setShowUploadModal(true)} className="w-full py-2.5 text-[10px] font-black uppercase text-[var(--accent-primary)] border border-[var(--accent-border)] rounded-xl hover:bg-[var(--accent-subtle)] transition-all">
                  RE-UPLOAD
                </button>
              </div>
            ) : (
              <div className="text-center space-y-5 py-4">
                <div className="p-6 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface)]">
                  <p className="text-2xl mb-2 opacity-30">📂</p>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">No Resume Found</p>
                </div>
                <button onClick={() => setShowUploadModal(true)} className="btn-primary w-full py-3 text-[10px]">UPLOAD PDF</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-fadeIn">
          <div className="card-premium max-w-md w-full bg-[var(--bg-surface)] p-0 overflow-hidden border-[var(--border-strong)]">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-[var(--text-primary)] font-geist italic uppercase tracking-widest">UPLOAD DOCUMENT</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <ResumeUploadInline
                onComplete={handleResumeUpload}
                onCancel={() => setShowUploadModal(false)}
                loading={uploadLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Upload Component Refactored
function ResumeUploadInline({ onComplete, onCancel, loading = false }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") {
      setFile(f);
      setError("");
    } else {
      setError("UPLOAD PDF ONLY");
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`
          aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300
          ${isDragOver 
            ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)]' 
            : file 
              ? 'border-[var(--success)] bg-[var(--success-subtle)]' 
              : 'border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:border-[var(--text-muted)]'
          }
        `}
      >
        <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} disabled={loading} />
        <span className="text-4xl mb-4 opacity-50">{file ? '📄' : '📤'}</span>
        <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">{file ? file.name : 'DRAG PDF HERE'}</p>
        <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-tighter">{file ? 'Click to change' : 'or click to browse'}</p>
      </div>

      {error && <p className="text-center text-[10px] font-black text-[var(--danger)] uppercase tracking-wider">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onCancel} disabled={loading} className="flex-1 py-4 text-[10px] font-black border border-[var(--border-default)] rounded-2xl text-[var(--text-muted)] hover:text-white transition-colors">CANCEL</button>
        <button onClick={() => onComplete(file)} disabled={!file || loading} className="flex-1 py-4 text-[10px] font-black btn-primary rounded-2xl disabled:opacity-30">CONFIRM</button>
      </div>
    </div>
  );
}