import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAnalytics } from "../api/analyticsApi";
import { getProfile, getResumeQuality } from "../api/profileApi";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import ScoreGauge from "./ScoreGauge";

// Skeleton loader components
const ProfileHeaderSkeleton = () => (
  <div className="card-premium p-8 animate-pulse">
    <div className="flex items-center space-x-6">
      <div className="w-20 h-20 bg-[var(--bg-elevated)] rounded-full"></div>
      <div className="flex-1 space-y-3">
        <div className="h-6 bg-[var(--bg-elevated)] rounded w-48"></div>
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-64"></div>
      </div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="card-premium p-6 animate-pulse">
    <div className="h-6 bg-[var(--bg-elevated)] rounded w-48 mb-6"></div>
    <div className="h-64 bg-[var(--bg-elevated)] rounded"></div>
  </div>
);

// Badge definitions
const BADGES = [
  { id: "first-interview", name: "INITIATE", description: "First session completed", icon: "🏆", condition: (stats) => stats.totalInterviews >= 1 },
  { id: "five-interviews", name: "VETERAN", description: "5 sessions completed", icon: "🎯", condition: (stats) => stats.totalInterviews >= 5 },
  { id: "score-90-plus", name: "ELITE", description: "Score 90+ achieved", icon: "⭐", condition: (stats) => stats.bestScore >= 90 },
  { id: "streak-7-days", name: "RELENTLESS", description: "7 day active streak", icon: "🔥", condition: (stats) => stats.currentStreak >= 7 }
];

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [resumeQuality, setResumeQuality] = useState(null);
  const [interviewStreak, setInterviewStreak] = useState({ currentStreak: 0, weekData: Array(7).fill(false) });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;
      try {
        const [pData, aData, rData] = await Promise.allSettled([
          getProfile(user.id),
          getAnalytics(user.id),
          getResumeQuality(user.id)
        ]);

        if (pData.status === 'fulfilled') setProfileData(pData.value);
        if (aData.status === 'fulfilled') {
          setAnalytics(aData.value);
          if (aData.value?.sessions) calculateInterviewStreak(aData.value.sessions);
        }
        if (rData.status === 'fulfilled') setResumeQuality(rData.value);
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user?.id]);

  const calculateInterviewStreak = (sessions) => {
    if (!sessions?.length) return;
    const today = new Date();
    const weekData = Array(7).fill(false);
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      weekData[6 - i] = sessions.some(s => new Date(s.created_at).toDateString() === checkDate.toDateString());
    }
    let currentStreak = 0;
    for (let i = weekData.length - 1; i >= 0; i--) {
      if (weekData[i]) currentStreak++; else break;
    }
    setInterviewStreak({ currentStreak, weekData });
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || "U";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRadarData = () => [
    { skill: 'TECHNICAL', score: analytics?.technical_score || 75 },
    { skill: 'COMMUNICATION', score: analytics?.communication_score || 80 },
    { skill: 'CONFIDENCE', score: analytics?.confidence_score || 70 },
    { skill: 'BEHAVIORAL', score: analytics?.behavioral_score || 85 },
    { skill: 'PROBLEM SOLVING', score: analytics?.problem_solving_score || 78 }
  ];

  const getUserStats = () => ({
    totalInterviews: analytics?.sessions?.length || 0,
    bestScore: Math.max(...(analytics?.sessions?.map(s => s.overall_score || 0) || [0])),
    currentStreak: interviewStreak.currentStreak
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
      {/* Header */}
      <section>
        <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] font-geist mb-2 italic uppercase">
          OPERATOR PROFILE
        </h1>
        <p className="text-[var(--text-secondary)] font-medium">
          Personal performance identity and verified professional achievements.
        </p>
      </section>

      {/* Profile Identity Card */}
      {loading ? <ProfileHeaderSkeleton /> : (
        <section className="card-premium p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)] opacity-5 blur-3xl -mr-16 -mt-16 group-hover:opacity-10 transition-opacity"></div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="w-24 h-24 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)] rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.2)] rotate-3 hover:rotate-0 transition-transform duration-500">
                <span className="text-white text-3xl font-black font-geist italic">{getUserInitials()}</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-[var(--text-primary)] font-geist uppercase italic tracking-tight">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </h2>
                <p className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-[0.2em]">{user?.email}</p>
                <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                  <span className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[10px] font-black text-[var(--text-secondary)] rounded-full uppercase tracking-widest leading-none">
                    MEMBER SINCE {new Date(user?.created_at).getFullYear()}
                  </span>
                </div>
              </div>
            </div>
            <button className="px-8 py-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-black text-[10px] rounded-xl uppercase tracking-widest hover:bg-[var(--bg-hover)] transition-all">
              EDIT PARAMETERS
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Psychometric Radar */}
        <div className="lg:col-span-2">
          {loading ? <ChartSkeleton /> : (
            <section className="card-premium p-8 h-full">
              <h3 className="text-sm font-black text-[var(--text-primary)] font-geist mb-8 uppercase tracking-widest italic border-l-4 border-l-[var(--accent-primary)] pl-4">
                PSYCHOMETRIC EVALUATION
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={getRadarData()}>
                    <PolarGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                    <PolarAngleAxis 
                      dataKey="skill" 
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }} 
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={false} 
                      axisLine={false} 
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="var(--accent-primary)"
                      fill="var(--accent-primary)"
                      fillOpacity={0.15}
                      strokeWidth={3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>

        {/* Status Stack */}
        <div className="space-y-8">
          {/* Streak Tracker */}
          <section className="card-premium p-8">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xs font-black text-[var(--text-primary)] font-geist uppercase tracking-widest italic">ACTIVE STREAK</h3>
               <span className="text-xl animate-pulse">🔥</span>
             </div>
             <div className="text-center space-y-6">
                <div>
                  <p className="text-5xl font-black text-[var(--text-primary)] font-geist italic">{interviewStreak.currentStreak}</p>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">CONSECUTIVE CYCLES</p>
                </div>
                <div className="flex justify-between gap-1 pt-4">
                  {interviewStreak.weekData.map((active, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className={`w-full aspect-square rounded-lg transition-all duration-500 flex items-center justify-center text-[10px] font-black
                        ${active 
                          ? 'bg-[var(--accent-primary)] text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                          : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)] opacity-40'
                        }
                      `}>
                        {active ? '✓' : ''}
                      </div>
                      <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                        {['S','M','T','W','T','F','S'][new Date(new Date().setDate(new Date().getDate() - (6-i))).getDay()]}
                      </span>
                    </div>
                  ))}
                </div>
             </div>
          </section>

          {/* Resume Analytics */}
          <section className="card-premium p-8">
            <h3 className="text-xs font-black text-[var(--text-primary)] font-geist mb-6 uppercase tracking-widest italic">DOCUMENT STATUS</h3>
            {resumeQuality ? (
              <div className="space-y-6 text-center">
                <p className="text-xs font-black text-[var(--text-primary)] truncate border-b border-[var(--border-subtle)] pb-4 italic tracking-tight">{resumeQuality.filename || 'IDENTIFIED_RESUME.PDF'}</p>
                <div className="py-4">
                  <ScoreGauge score={resumeQuality.overall_score || 0} size="sm" showGrade={true} />
                </div>
                <button className="w-full py-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--accent-primary)] font-black text-[10px] rounded-xl uppercase tracking-widest hover:bg-[var(--accent-subtle)] transition-all">
                  UPDATE SIGNAL
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 py-4">
                <p className="text-4xl grayscale opacity-20">📂</p>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">NO DATA DETECTED</p>
                <button className="w-full py-3 btn-primary text-[10px]">UPLOAD SOURCE</button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Military Grade Achievements */}
      <section className="card-premium p-8">
        <h3 className="text-sm font-black text-[var(--text-primary)] font-geist mb-10 uppercase tracking-widest italic border-l-4 border-l-[var(--success)] pl-4">
          OPERATIONAL ACHIEVEMENTS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BADGES.map((badge) => {
            const isEarned = badge.condition(getUserStats());
            return (
              <div key={badge.id} className={`p-6 rounded-2xl border-2 transition-all group relative overflow-hidden
                ${isEarned 
                  ? 'border-[var(--success)]/30 bg-[var(--success-subtle)]' 
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] opacity-40 grayscale'
                }
              `}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{badge.icon}</div>
                <h4 className="text-xs font-black text-[var(--text-primary)] font-geist uppercase tracking-widest mb-1 italic">{badge.name}</h4>
                <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-tight uppercase tracking-tighter">{badge.description}</p>
                {isEarned && <div className="absolute top-2 right-2 w-2 h-2 bg-[var(--success)] rounded-full animate-ping"></div>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}