import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAnalytics } from "../api/analyticsApi";
import { getProfile, getResumeQuality } from "../api/profileApi";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import ScoreGauge from "./ScoreGauge";

// Skeleton loader components
function ProfileHeaderSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
      <div className="flex items-center space-x-6">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
        <div className="flex-1 animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-10 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </div>
  );
}

// Badge definitions
const BADGES = [
  {
    id: "first-interview",
    name: "First Interview",
    description: "Completed your first practice interview",
    icon: "🏆",
    condition: (stats) => stats.totalInterviews >= 1
  },
  {
    id: "five-interviews",
    name: "5 Interviews",
    description: "Completed 5 practice interviews",
    icon: "🎯",
    condition: (stats) => stats.totalInterviews >= 5
  },
  {
    id: "score-90-plus",
    name: "Score 90+",
    description: "Achieved a score of 90 or higher",
    icon: "⭐",
    condition: (stats) => stats.bestScore >= 90
  },
  {
    id: "streak-7-days",
    name: "7 Day Streak",
    description: "Practiced for 7 consecutive days",
    icon: "🔥",
    condition: (stats) => stats.currentStreak >= 7
  }
];

export default function Profile() {
  const { user } = useAuth();

  // State for all profile data
  const [profileData, setProfileData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [resumeQuality, setResumeQuality] = useState(null);
  const [interviewStreak, setInterviewStreak] = useState({
    currentStreak: 0,
    weekData: Array(7).fill(false)
  });
  const [loading, setLoading] = useState(true);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;

      try {
        // Fetch profile data
        try {
          const profileData = await getProfile(user.id);
          setProfileData(profileData);
        } catch (error) {
          console.warn("Profile data not available:", error);
        }

        // Fetch analytics data
        try {
          const analyticsData = await getAnalytics(user.id);
          setAnalytics(analyticsData);

          // Calculate interview streak from analytics data
          if (analyticsData?.sessions) {
            calculateInterviewStreak(analyticsData.sessions);
          }
        } catch (error) {
          console.warn("Analytics not available:", error);
        }

        // Fetch resume quality
        try {
          const resumeData = await getResumeQuality(user.id);
          setResumeQuality(resumeData);
        } catch (error) {
          console.warn("Resume quality not available:", error);
        }

      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.id]);

  // Calculate interview streak
  const calculateInterviewStreak = (sessions) => {
    if (!sessions || sessions.length === 0) {
      setInterviewStreak({ currentStreak: 0, weekData: Array(7).fill(false) });
      return;
    }

    const today = new Date();
    const weekData = Array(7).fill(false);

    // Check last 7 days
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);

      const hasInterview = sessions.some(session => {
        const sessionDate = new Date(session.created_at);
        return sessionDate.toDateString() === checkDate.toDateString();
      });

      weekData[6 - i] = hasInterview;
    }

    // Calculate current streak
    let currentStreak = 0;
    for (let i = weekData.length - 1; i >= 0; i--) {
      if (weekData[i]) {
        currentStreak++;
      } else {
        break;
      }
    }

    setInterviewStreak({ currentStreak, weekData });
  };

  // Get user initials
  const getUserInitials = (user) => {
    const name = user?.user_metadata?.full_name || user?.email || "";
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format member since date
  const getMemberSinceDate = (user) => {
    if (!user?.created_at) return "Recently";
    return new Date(user.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Prepare radar chart data
  const getRadarData = () => {
    if (!analytics) return [];

    // Mock data structure - adjust based on actual analytics API response
    return [
      {
        skill: 'Technical',
        score: analytics.technical_score || 75,
        fullMark: 100
      },
      {
        skill: 'Communication',
        score: analytics.communication_score || 80,
        fullMark: 100
      },
      {
        skill: 'Confidence',
        score: analytics.confidence_score || 70,
        fullMark: 100
      },
      {
        skill: 'Behavioral',
        score: analytics.behavioral_score || 85,
        fullMark: 100
      },
      {
        skill: 'Problem Solving',
        score: analytics.problem_solving_score || 78,
        fullMark: 100
      }
    ];
  };

  // Get user statistics for badge calculation
  const getUserStats = () => {
    if (!analytics) return { totalInterviews: 0, bestScore: 0, currentStreak: 0 };

    return {
      totalInterviews: analytics.sessions?.length || 0,
      bestScore: Math.max(...(analytics.sessions?.map(s => s.overall_score || 0) || [0])),
      currentStreak: interviewStreak.currentStreak
    };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Your interview performance and progress</p>
      </div>

      <div className="space-y-8">
        {/* PROFILE HEADER */}
        {loading ? (
          <ProfileHeaderSkeleton />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Avatar */}
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {getUserInitials(user)}
                  </span>
                </div>

                {/* User Info */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                    {user?.email}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Member since {getMemberSinceDate(user)}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        )}

        {/* Grid Layout for Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PERFORMANCE OVERVIEW */}
          <div className="lg:col-span-2">
            {loading ? (
              <ChartSkeleton />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Performance Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={getRadarData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" className="fill-gray-500 dark:fill-gray-400" />
                    <PolarRadiusAxis
                      angle={0}
                      domain={[0, 100]}
                      className="fill-gray-500 dark:fill-gray-400"
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* INTERVIEW STREAK */}
          {loading ? (
            <CardSkeleton />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Interview Streak</h3>

              {/* Streak Counter */}
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {interviewStreak.currentStreak}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {interviewStreak.currentStreak === 1 ? 'day streak' : 'days streak'}
                </div>
              </div>

              {/* Week Grid */}
              <div className="flex justify-center space-x-2">
                {interviewStreak.weekData.map((hasInterview, index) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - index));

                  return (
                    <div key={index} className="text-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                        hasInterview
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RESUME CARD */}
          {loading ? (
            <CardSkeleton />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Resume</h3>

              {resumeQuality ? (
                <div className="space-y-4">
                  {/* File Info */}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {resumeQuality.filename || 'resume.pdf'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Uploaded {resumeQuality.uploaded_date ? new Date(resumeQuality.uploaded_date).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>

                  {/* Quality Score */}
                  <div className="flex justify-center mb-4">
                    <ScoreGauge
                      score={resumeQuality.overall_score || 0}
                      label="Quality Score"
                      size="sm"
                      showGrade={true}
                    />
                  </div>

                  {/* Top 3 Suggestions */}
                  {resumeQuality.suggestions && resumeQuality.suggestions.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white mb-2">Top Suggestions</p>
                      <ul className="space-y-1">
                        {resumeQuality.suggestions.slice(0, 3).map((suggestion, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Re-upload Resume
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No resume uploaded</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Upload Resume
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BADGES / ACHIEVEMENTS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Achievements</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {BADGES.map((badge) => {
              const isEarned = badge.condition(getUserStats());

              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    isEarned
                      ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <h4 className={`font-semibold mb-1 ${
                    isEarned ? 'text-yellow-800 dark:text-yellow-300' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {badge.name}
                  </h4>
                  <p className={`text-xs ${
                    isEarned ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}