import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { saveSession, getSession } from "./api/interviewApi";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import DomainSelector from "./components/DomainSelector";
import ResumeUpload from "./components/ResumeUpload";
import InterviewRoom from "./components/InterviewRoom";
import FeedbackReport from "./components/FeedbackReport";
import LoadingScreen from "./components/LoadingScreen";
import JobMatchPage from "./pages/JobMatchPage";

function AppContent() {
  const { user, loading } = useAuth();
  const [step, setStep] = useState("dashboard");
  const [interviewData, setInterviewData] = useState({
    name: "",
    domain: "",
    resumeText: "",
    report: null,
    confidenceData: null,
    audioUrl: null,
    audioBlob: null,
  });

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleStartNew = () => setStep("setup");

  const handleStart = (name, domain) => {
    setInterviewData((prev) => ({ ...prev, name, domain }));
    setStep("resume");
  };

  const handleResumeComplete = (resumeText) => {
    setInterviewData((prev) => ({ ...prev, resumeText }));
    setStep("interview");
  };

  const handleInterviewComplete = async (report, confidenceData, durationSeconds, messages) => {
    setInterviewData((prev) => ({ ...prev, report, confidenceData }));
    setStep("report");

    // Save session to Supabase
    try {
      await saveSession({
        userId: user.id,
        domain: interviewData.domain,
        candidateName: interviewData.name,
        report,
        confidenceData: confidenceData || {},
        confidenceBreakdown: confidenceData || {},
        durationSeconds: durationSeconds || 0,
        messages: messages || [],
      });
    } catch (err) {
      console.error("Failed to save session:", err);
    }
  };

  const handleReset = () => {
    setInterviewData({
      name: "",
      domain: "",
      resumeText: "",
      report: null,
      confidenceData: null,
      audioUrl: null,
      audioBlob: null,
    });
    setStep("dashboard");
  };

  const handleViewSession = async (session) => {
    try {
      const full = await getSession(session.id);
      setInterviewData((prev) => ({
        ...prev,
        report: full.report_json,
        confidenceData: full.confidence_json,
      }));
      setStep("report");
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  const handleDownloadRecording = () => {
    if (!interviewData.audioUrl) return;
    const a = document.createElement("a");
    a.href = interviewData.audioUrl;
    a.download = `aria-interview-${Date.now()}.webm`;
    a.click();
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      {step === "dashboard" && (
        <Dashboard
          user={user}
          onNewInterview={handleStartNew}
          onViewSession={handleViewSession}
          onJobMatch={() => setStep("jobmatch")}
        />
      )}
      {step === "jobmatch" && (
        <JobMatchPage user={user} onBack={() => setStep("dashboard")} />
      )}
      {step === "setup" && <DomainSelector onStart={handleStart} />}
      {step === "resume" && <ResumeUpload onComplete={handleResumeComplete} />}
      {step === "interview" && (
        <InterviewRoom
          name={interviewData.name}
          domain={interviewData.domain}
          resumeText={interviewData.resumeText}
          onComplete={handleInterviewComplete}
        />
      )}
      {step === "report" && (
        <FeedbackReport
          report={interviewData.report}
          confidenceData={interviewData.confidenceData}
          audioUrl={interviewData.audioUrl}
          onDownload={interviewData.audioUrl ? handleDownloadRecording : null}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
