import { useCallback, useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { saveSession, getHistory, getSession } from "./api/interviewApi";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import DomainSelector from "./components/DomainSelector";
import ResumeUpload from "./components/ResumeUpload";
import InterviewRoom from "./components/InterviewRoom";
import FeedbackReport from "./components/FeedbackReport";
import LoadingScreen from "./components/LoadingScreen";
import JobMatchPage from "./pages/JobMatchPage";
import CareerCoachPage from "./pages/CareerCoachPage";
import ChatWidget from "./components/ChatWidget";
import Layout from "./components/Layout";
import Analytics from "./components/Analytics";
import History from "./components/History";
import Resume from "./components/Resume";
import AICoach from "./components/AICoach";
import Profile from "./components/Profile";
import Settings from "./components/Settings";

// ── Auth guard ────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ── Main routed app content ───────────────────
function AppContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const chatWidgetRef = useRef(null);
  const [chatForceOpen, setChatForceOpen] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);
  const [interviewData, setInterviewData] = useState({
    name: "",
    domain: "",
    resumeText: "",
    report: null,
    confidenceData: null,
    sessionId: null,
    durationSeconds: 0,
    audioUrl: null,
    audioBlob: null,
  });

  // ── Load previous score for debrief ─────────
  const loadPreviousScore = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getHistory(user.id);
      const sessions = data.sessions || [];
      if (sessions.length > 0) {
        setPreviousScore(sessions[0].overall_score || 0);
      } else {
        setPreviousScore(0);
      }
    } catch {
      setPreviousScore(0);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadPreviousScore();
    }
  }, [user?.id, loadPreviousScore]);

  // ── Interview completion handler ─────────────
  const handleInterviewComplete = async (report, confidenceData, durationSeconds, messages) => {
    setInterviewData((prev) => ({ ...prev, report, confidenceData, durationSeconds: durationSeconds || 0 }));
    navigate("/report");

    // Save session to Supabase
    try {
      const saved = await saveSession({
        userId: user.id,
        domain: interviewData.domain,
        candidateName: interviewData.name,
        report,
        confidenceData: confidenceData || {},
        confidenceBreakdown: confidenceData || {},
        durationSeconds: durationSeconds || 0,
        messages: messages || [],
      });
      if (saved?.session_id) {
        setInterviewData((prev) => ({ ...prev, sessionId: saved.session_id }));
      }
    } catch (err) {
      console.error("Failed to save session:", err);
    }

    // Trigger debrief chat
    setTimeout(async () => {
      setChatForceOpen(true);
      await new Promise((r) => setTimeout(r, 300));
      if (chatWidgetRef.current?.triggerDebrief) {
        chatWidgetRef.current.triggerDebrief(report, confidenceData, previousScore);
      }
      setTimeout(() => setChatForceOpen(false), 1000);
      setPreviousScore(report?.overall_score || 0);
    }, 800);
  };

  // ── View past session report ─────────────────
  const handleViewSession = async (session) => {
    try {
      const full = await getSession(session.id);
      setInterviewData((prev) => ({
        ...prev,
        report: full.report_json,
        confidenceData: full.confidence_json,
        sessionId: full.id,
        durationSeconds: full.duration_seconds || 0,
      }));
      navigate("/report");
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  // ── Download recording ───────────────────────
  const handleDownloadRecording = () => {
    if (!interviewData.audioUrl) return;
    const a = document.createElement("a");
    a.href = interviewData.audioUrl;
    a.download = `aria-interview-${Date.now()}.webm`;
    a.click();
  };

  // ── Reset / navigation helpers ───────────────
  const handleReset = () => {
    setInterviewData({
      name: "",
      domain: "",
      resumeText: "",
      report: null,
      confidenceData: null,
      sessionId: null,
      durationSeconds: 0,
      audioUrl: null,
      audioBlob: null,
    });
    navigate("/dashboard");
  };

  const SessionReportRoute = () => {
    const { sessionId } = useParams();
    if (!sessionId) return <Navigate to="/dashboard" replace />;

    return (
      <ProtectedRoute>
        <FeedbackReport
          report={null}
          confidenceData={null}
          sessionId={sessionId}
          durationSeconds={0}
          audioUrl={null}
          onDownload={null}
          onReset={handleReset}
        />
      </ProtectedRoute>
    );
  };

  if (loading) return <LoadingScreen />;

  const hideChatWidget = ["/landing", "/interview", "/interview/resume", "/interview/room", "/coach"].some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />}
        />

        {/* Root route - Landing Page (always) */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard
                  user={user}
                  onNewInterview={() => navigate("/interview")}
                  onViewSession={handleViewSession}
                  onJobMatch={() => navigate("/job-match")}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <Layout>
                <History />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <Layout>
                <Resume />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <Layout>
                <JobMatchPage user={user} onBack={() => navigate("/dashboard")} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/coach"
          element={
            <ProtectedRoute>
              <Layout>
                <CareerCoachPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Interview flow routes */}
        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <Layout>
                <DomainSelector
                  onStart={(name, domain) => {
                    setInterviewData((prev) => ({ ...prev, name, domain }));
                    navigate("/interview/resume");
                  }}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <Layout>
                <DomainSelector
                  onStart={(name, domain) => {
                    setInterviewData((prev) => ({ ...prev, name, domain }));
                    navigate("/interview/resume");
                  }}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview/resume"
          element={
            <ProtectedRoute>
              <ResumeUpload
                onComplete={(resumeText) => {
                  setInterviewData((prev) => ({ ...prev, resumeText }));
                  navigate("/interview/room");
                }}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview/room"
          element={
            <ProtectedRoute>
              <InterviewRoom
                name={interviewData.name}
                domain={interviewData.domain}
                resumeText={interviewData.resumeText}
                onComplete={handleInterviewComplete}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/report"
          element={
            <ProtectedRoute>
              {interviewData.report ? (
                <FeedbackReport
                  report={interviewData.report}
                  confidenceData={interviewData.confidenceData}
                  sessionId={interviewData.sessionId}
                  durationSeconds={interviewData.durationSeconds}
                  audioUrl={interviewData.audioUrl}
                  onDownload={interviewData.audioUrl ? handleDownloadRecording : null}
                  onReset={handleReset}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )}
            </ProtectedRoute>
          }
        />

        <Route path="/report/:sessionId" element={<SessionReportRoute />} />

        <Route
          path="/job-match"
          element={
            <ProtectedRoute>
              <Layout>
                <JobMatchPage user={user} onBack={() => navigate("/dashboard")} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/landing" replace />
        } />
      </Routes>

      {/* Global chatbot — visible on all protected pages */}
      {user && !hideChatWidget && (
        <ChatWidget
          ref={chatWidgetRef}
          user={user}
          forceOpen={chatForceOpen}
          onOpenChange={(open) => {
            if (!open) setChatForceOpen(false);
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
