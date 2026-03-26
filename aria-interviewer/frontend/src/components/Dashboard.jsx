import { useEffect, useState, useRef } from "react";
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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-8"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
      </td>
    </tr>
  );
}

export default function Dashboard({ user, onNewInterview, onViewSession, onJobMatch }) {
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
      try {
        // Fetch interview history
        const historyData = await getHistory(user.id);
        setSessions(historyData.sessions || []);

        // Fetch analytics
        try {
          const analyticsData = await getAnalytics(user.id);
          setAnalytics(analyticsData);
        } catch (error) {
          console.warn("Analytics not available:", error);
        }

        // Fetch job matches
        try {
          const jobData = await getJobMatchResults(user.id);
          setJobMatches(jobData.jobs || []);
        } catch (error) {
          console.warn("Job matches not available:", error);
        }

        // Fetch resume quality
        try {
          const resumeData = await getResumeQuality(user.id);
          setResumeQuality(resumeData);
        } catch (error) {
          console.warn("Resume quality not available:", error);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.id]);

  // Calculate stats
  const totalInterviews = sessions.length;
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.overall_score || 0), 0) / sessions.length)
    : 0;
  const avgConfidence = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.confidence_score || 0), 0) / sessions.length)
    : 0;
  const jobMatchCount = jobMatches.length;

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get grade color
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'B': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'C': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'D': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
      case 'F': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
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
    console.log("🔄 Starting resume upload...", file);
    if (!file) {
      console.error("❌ No file provided");
      return;
    }

    if (!user?.id) {
      console.error("❌ No user ID available");
      return;
    }

    setUploadLoading(true);
    try {
      console.log("📄 Parsing resume...");
      // Parse resume
      const parseData = await parseResume(file);
      console.log("✅ Parse result:", parseData);

      if (!parseData.resume_text) {
        throw new Error("Could not extract text from resume");
      }

      console.log("💾 Saving to profile...");
      // Save to profile
      await saveResumeProfile(
        user.id,
        parseData.resume_text,
        parseData.extracted_profile || {},
        file.name
      );
      console.log("✅ Resume saved successfully");

      // Refresh resume quality data
      try {
        console.log("📊 Getting updated resume quality...");
        const resumeData = await getResumeQuality(user.id, true); // Force refresh
        setResumeQuality(resumeData);
        console.log("✅ Resume quality updated:", resumeData);
      } catch (error) {
        console.warn("Failed to get updated resume quality:", error);
      }

      setShowUploadModal(false);
      console.log("✅ Upload completed successfully");
    } catch (error) {
      console.error("❌ Resume upload failed:", error);
      // Show error to user - we'll add this
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's your interview progress dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                console.log("📂 Opening upload modal...");
                setShowUploadModal(true);
              }}
              disabled={uploadLoading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {uploadLoading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </div>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <span className="text-blue-600 dark:text-blue-400 text-xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Interviews</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalInterviews}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-center">
                <ScoreGauge
                  score={avgScore}
                  label="Average Score"
                  size="sm"
                  showGrade={false}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-center">
                <ScoreGauge
                  score={avgConfidence}
                  label="Confidence"
                  size="sm"
                  showGrade={false}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <span className="text-orange-600 dark:text-orange-400 text-xl">💼</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Job Matches</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{jobMatchCount}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Wider */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Interviews Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Interviews</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="text-gray-500 dark:text-gray-400">
                          <p className="text-4xl mb-2">🎯</p>
                          <p className="font-medium">No interviews yet</p>
                          <p className="text-sm mb-4">Start your first interview to see your progress here</p>
                          <button
                            onClick={onNewInterview}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
                          >
                            Start your first interview →
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sessions.slice(0, 5).map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {session.domain}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(session.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {session.overall_score || 0}/100
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(session.grade)}`}>
                            {session.grade || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => onViewSession(session)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm font-medium"
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Start New Interview Domain Picker */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Start New Interview</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Choose your interview domain</p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {INTERVIEW_DOMAINS.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedDomain?.id === domain.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`w-8 h-8 ${domain.color} rounded-lg mx-auto mb-2`}></div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{domain.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{domain.fullName}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleStartInterview}
              disabled={!selectedDomain}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                selectedDomain
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {selectedDomain ? `Start ${selectedDomain.fullName} Interview` : 'Select a Domain First'}
            </button>
          </div>
        </div>

        {/* Right Column - Narrower */}
        <div className="space-y-8">
          {/* AI Coach Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">🤖</span>
                AI Coach
              </h3>
            </div>

            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {messages.slice(-3).map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-100 dark:bg-blue-900/30 ml-4'
                      : 'bg-gray-100 dark:bg-gray-700 mr-4'
                  }`}
                >
                  <p className="text-sm text-gray-800 dark:text-gray-200">{message.content}</p>
                </div>
              ))}
              {chatLoading && (
                <div className="bg-gray-100 dark:bg-gray-700 mr-4 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask your AI coach..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </form>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            {/* Resume Quality Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 min-h-[180px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Resume Quality</h4>
                <span className="text-2xl">📄</span>
              </div>
              {loading ? (
                <div className="animate-pulse flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2 mx-auto"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mx-auto"></div>
                  </div>
                </div>
              ) : resumeQuality && resumeQuality.overall_score > 0 ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {resumeQuality.filename && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 truncate">
                        {resumeQuality.filename}
                      </p>
                    )}
                    <div className="flex justify-center mb-4">
                      <ScoreGauge
                        score={resumeQuality.overall_score || 0}
                        label="Quality Score"
                        size="sm"
                        showGrade={true}
                      />
                    </div>
                    {resumeQuality.suggestions && resumeQuality.suggestions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Top Suggestions:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          {resumeQuality.suggestions.slice(0, 2).map((suggestion, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-1">•</span>
                              <span className="line-clamp-2">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-center"
                  >
                    Re-upload Resume
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 w-full mb-4">
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      No resume uploaded
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Upload your PDF to get AI quality analysis
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    disabled={uploadLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadLoading ? 'Uploading...' : 'Upload Resume →'}
                  </button>
                </div>
              )}
            </div>

            {/* Job Matches Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">Job Matches</h4>
                <span className="text-2xl">💼</span>
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-12 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {jobMatchCount}
                  </div>
                  <button
                    onClick={onJobMatch}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                  >
                    View all matches →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Resume</h3>
                <button
                  onClick={() => {
                    console.log("🚪 Closing modal via X button");
                    setShowUploadModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ResumeUploadInline
                onComplete={(file) => {
                  console.log("⚡ onComplete callback triggered with file:", file);
                  handleResumeUpload(file);
                }}
                onCancel={() => {
                  console.log("🚪 Closing modal via Cancel button");
                  setShowUploadModal(false);
                }}
                loading={uploadLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Resume Upload Component (simplified version for modal use)
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

  const handleUpload = () => {
    console.log("🔘 Upload button clicked!");
    console.log("📁 File selected:", file);
    console.log("🔄 onComplete function:", typeof onComplete);

    if (file) {
      console.log("✅ File exists, calling onComplete...");
      onComplete(file);
    } else {
      console.log("❌ No file selected");
    }
  };

  return (
    <div>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`rounded-lg p-8 text-center cursor-pointer transition-all duration-200 mb-4 border-2 border-dashed ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : file
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
          disabled={loading}
        />

        {file ? (
          <div>
            <div className="text-4xl mb-3">📄</div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {file.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click to change file
            </p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-3">📁</div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Drag & drop your PDF resume here
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              or click to browse
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </div>
    </div>
  );
}