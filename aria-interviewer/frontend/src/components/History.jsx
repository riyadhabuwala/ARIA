import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getHistory } from "../api/interviewApi";

export default function History() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user?.id]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getHistory(user.id);
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("[History] Failed to load history:", err);
      setError(err.message || "Failed to load interview history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradeColor = (grade) => {
    const g = grade?.toUpperCase();
    if (g === 'A' || g === 'EXCELLENT') return 'text-[var(--success)] bg-[var(--success-subtle)]';
    if (g === 'B' || g === 'GOOD') return 'text-[var(--accent-primary)] bg-[var(--accent-subtle)]';
    if (g === 'C' || g === 'AVERAGE') return 'text-[var(--warning)] bg-[var(--warning-subtle)]';
    if (g === 'D' || g === 'BELOW AVERAGE') return 'text-[var(--danger)] bg-[var(--danger-subtle)]';
    if (g === 'F' || g === 'NEEDS IMPROVEMENT') return 'text-[var(--danger)] bg-[var(--danger-subtle)]';
    return 'text-[var(--text-muted)] bg-[var(--bg-elevated)]';
  };

  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--accent-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto"></div>
          <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs">SYNCHRONIZING HISTORY</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
      {/* Header */}
      <section>
        <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] font-geist mb-2 italic uppercase">
          SESSION HISTORY
        </h1>
        <p className="text-[var(--text-secondary)] font-medium">
          Detailed log of your past performance and growth metrics.
        </p>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[var(--danger-subtle)] border border-[var(--danger)]/20 rounded-2xl">
          <p className="text-[var(--danger)] text-sm font-bold flex items-center gap-2">
            <span>⚠️</span> {error}
          </p>
        </div>
      )}

      {/* Table Container */}
      <div className="card-premium overflow-hidden">
        {sessions.length === 0 ? (
          <div className="text-center py-24 px-8 space-y-6">
            <div className="text-6xl grayscale opacity-30">📋</div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[var(--text-primary)] font-geist">NO DATA FOUND</h3>
              <p className="text-[var(--text-muted)] max-w-sm mx-auto">Complete your first interview session to begin tracking your professional evolution.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
                <tr>
                  {["Domain", "Timestamp", "Efficiency Score", "Confidence", "Grade", "Duration"].map(h => (
                    <th key={h} className="px-7 py-4 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-[var(--bg-hover)] transition-colors group">
                    <td className="px-7 py-5 font-bold text-[var(--text-primary)] tracking-tight">{session.domain}</td>
                    <td className="px-7 py-5 text-sm text-[var(--text-secondary)]">{formatDate(session.created_at)}</td>
                    <td className="px-7 py-5">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-[var(--text-primary)]">{session.overall_score || 0}%</span>
                        <div className="w-16 h-1 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--accent-primary)]" style={{ width: `${session.overall_score || 0}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-7 py-5 font-black text-[var(--text-primary)]">{Math.round(session.confidence_score || 0)}%</td>
                    <td className="px-7 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getGradeColor(session.grade)}`}>
                        {session.grade || 'N/A'}
                      </span>
                    </td>
                    <td className="px-7 py-5 text-sm font-medium text-[var(--text-muted)] uppercase tracking-tighter">
                      {session.duration_seconds ? `${Math.round(session.duration_seconds / 60)}m` : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {sessions.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-premium p-6 flex items-center justify-between group">
            <div>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">AGGREGATE SESSIONS</p>
              <p className="text-3xl font-black text-[var(--text-primary)] font-geist italic">{sessions.length}</p>
            </div>
            <div className="text-3xl opacity-20 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0">🎯</div>
          </div>

          <div className="card-premium p-6 flex items-center justify-between group">
            <div>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">CUMULATIVE AVG</p>
              <p className="text-3xl font-black text-[var(--accent-primary)] font-geist italic">
                {Math.round(sessions.reduce((a, s) => a + (s.overall_score || 0), 0) / sessions.length)}%
              </p>
            </div>
            <div className="text-3xl opacity-20 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0">📊</div>
          </div>

          <div className="card-premium p-6 flex items-center justify-between group">
            <div>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">PEAK PERFORMANCE</p>
              <p className="text-3xl font-black text-[var(--success)] font-geist italic">
                {Math.max(...sessions.map(s => s.overall_score || 0))}%
              </p>
            </div>
            <div className="text-3xl opacity-20 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0">⭐</div>
          </div>
        </section>
      )}
    </div>
  );
}
