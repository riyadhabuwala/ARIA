import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import DomainSelector from "./components/DomainSelector";
import ResumeUpload from "./components/ResumeUpload";
import InterviewRoom from "./components/InterviewRoom";
import FeedbackReport from "./components/FeedbackReport";

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
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
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

  const handleInterviewComplete = async (report, confidenceData, durationSeconds) => {
    setInterviewData((prev) => ({ ...prev, report, confidenceData }));
    setStep("report");

    // Save session to Supabase
    try {
      await fetch("http://localhost:8000/api/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          domain: interviewData.domain,
          overall_score: report.overall_score,
          grade: report.grade,
          hiring_recommendation: report.hiring_recommendation,
          duration_seconds: durationSeconds || 0,
          confidence_score: confidenceData?.confidence_score || null,
          report_json: report,
        }),
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

  const handleDownloadRecording = () => {
    if (!interviewData.audioUrl) return;
    const a = document.createElement("a");
    a.href = interviewData.audioUrl;
    a.download = `aria-interview-${Date.now()}.webm`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {step === "dashboard" && (
        <Dashboard user={user} onNewInterview={handleStartNew} />
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
