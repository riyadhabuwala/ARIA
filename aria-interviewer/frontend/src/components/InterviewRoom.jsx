import { useState, useEffect, useRef } from "react";
import { startInterview, sendMessage, generateReport } from "../api/interviewApi";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { useRecording } from "../hooks/useRecording";
import { useConfidenceTracker } from "../hooks/useConfidenceTracker";
import { useCamera } from "../hooks/useCamera";
import ARIAWaveformStrip from "./ARIAWaveformStrip";
import EndInterviewModal from "./EndInterviewModal";
import CameraPermissionScreen from "./CameraPermissionScreen";
import ThemeToggle from "./ThemeToggle";

export default function InterviewRoom({ name, domain, resumeText, onComplete }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentFeedback, setCurrentFeedback] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewTimer, setInterviewTimer] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [isPermissionScreen, setIsPermissionScreen] = useState(true);

  const { transcript, isListening, startListening, stopListening, setTranscript } =
    useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();
  const { isRecording, startRecording, stopRecording } = useRecording();
  const { answers, addAnswer, analyzeAll } = useConfidenceTracker();
  const { videoRef, cameraActive, cameraError, startCamera, stopCamera } = useCamera();

  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);

  const setAllMessages = (next) => {
    messagesRef.current = next;
    setMessages(next);
  };

  const appendMessage = (message) => {
    setMessages((prev) => {
      const next = [...prev, message];
      messagesRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    if (sessionId && !isPermissionScreen && !isDone) {
      timerRef.current = setInterval(() => setInterviewTimer((t) => t + 1), 1000);
      startTimeRef.current = Date.now();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, isPermissionScreen, isDone]);

  async function handleReady() {
    setIsPermissionScreen(false);
    setIsLoading(true);
    setIsDone(false);
    setInterviewTimer(0);
    setQuestionCount(0);
    setAllMessages([]);
    startCamera();
    startRecording();

    try {
      const data = await startInterview(domain, name, resumeText);
      setSessionId(data.session_id);
      const aiMsg = data.message;
      appendMessage({ role: "ai", text: aiMsg, timestamp: new Date().toISOString() });
      processAIResponse(aiMsg);
    } catch (err) {
      setIsLoading(false);
    }
  }

  function processAIResponse(text) {
    const normalized = (text || "").trim();
    const nextTagMatch = normalized.match(/\[\s*NEXT\s*\]\s*:?\s*(.*)$/i);
    const questionFromTag = nextTagMatch?.[1]?.trim();
    const sentences = normalized.match(/[^.!?]+[.!?]+/g) || [normalized];
    const lastSentence = sentences[sentences.length - 1]?.trim() || "";
    const looksLikeQuestion = lastSentence.endsWith("?");
    const fallbackQuestion = looksLikeQuestion ? lastSentence : normalized.replace(/^\[\s*FEEDBACK\s*\]\s*:?/i, "").trim();

    setMicEnabled(false);
    setCurrentFeedback("");
    setCurrentQuestion(questionFromTag || fallbackQuestion);

    setIsLoading(false);
    setQuestionCount((prev) => prev + 1);
    speak(text, () => setMicEnabled(true));
  }

  async function handleSendAnswer(answerText) {
    if (!answerText.trim() || isLoading || isSpeaking || !sessionId) return;

    setMicEnabled(false);
    setCurrentFeedback("");
    addAnswer(answerText);
    appendMessage({ role: "user", text: answerText, timestamp: new Date().toISOString() });
    setIsLoading(true);
    setTranscript("");

    try {
      const data = await sendMessage(sessionId, answerText);
      if (data?.message) {
        appendMessage({ role: "ai", text: data.message, timestamp: new Date().toISOString() });
      }
      if (data?.is_done) {
        await handleInterviewComplete();
        return;
      }
      if (data?.message) {
        processAIResponse(data.message);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
    }
  }

  function handleMicPress() {
    if (!micEnabled || isSpeaking || isLoading || isDone) return;
    startListening();
  }

  function handleMicRelease() {
    stopListening();
    setTimeout(() => {
      if (transcript.trim()) {
        handleSendAnswer(transcript.trim());
      }
    }, 500);
  }

  async function handleInterviewComplete() {
    if (timerRef.current) clearInterval(timerRef.current);
    stopListening();
    stopRecording();
    stopCamera();
    setIsDone(true);
    setIsLoading(true);

    try {
      const [report, confidenceData] = await Promise.all([
        generateReport(sessionId),
        analyzeAll(),
      ]);
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      onComplete(report, confidenceData, durationSeconds, messagesRef.current);
    } catch (err) {
      setIsLoading(false);
    }
  }

  async function handleTerminate() {
    setShowEndModal(false);
    if (timerRef.current) clearInterval(timerRef.current);
    stopListening();
    stopRecording();
    stopCamera();
    stopSpeaking();
    setIsDone(true);
    setIsLoading(true);

    try {
      const [report, confidenceData] = await Promise.all([
        generateReport(sessionId),
        analyzeAll(),
      ]);
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      onComplete(report, confidenceData, durationSeconds, messagesRef.current);
    } catch (err) {
      setIsLoading(false);
    }
  }

  const timerDisplay =
    `${String(Math.floor(interviewTimer / 60)).padStart(2, "0")}:` +
    `${String(interviewTimer % 60).padStart(2, "0")}`;

  if (isPermissionScreen) {
    return (
      <CameraPermissionScreen
        onReady={handleReady}
        candidateName={name}
        domain={domain}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <div
        className="flex items-center justify-between px-6 py-3 flex-shrink-0 z-10"
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              boxShadow: "0 0 12px rgba(37,99,235,0.3)"
            }}
          >
            AI
          </div>
          <div className="h-4 w-px" style={{ background: "var(--border-default)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {domain} Interview
          </span>
          <div className="h-4 w-px" style={{ background: "var(--border-default)" }} />
          <span className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>
            ⏱ {timerDisplay}
          </span>
          {questionCount > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: "var(--accent-subtle)",
                color: "var(--accent-primary)",
                border: "1px solid rgba(37,99,235,0.2)",
              }}
            >
              Q{questionCount} / 7
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Recording
              </span>
            </div>
          )}
          <ThemeToggle />
          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            ← Dashboard
          </a>
          <button
            onClick={() => setShowEndModal(true)}
            disabled={questionCount < 1 || isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: "var(--danger-subtle)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "var(--danger)",
            }}
          >
            ⏹ End Interview
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-6 overflow-hidden">
        <div
          className="relative rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl"
          style={{
            width: "min(480px, 100%)",
            aspectRatio: "16/10",
            background: "var(--bg-elevated)",
            border: isListening
              ? "3px solid var(--danger)"
              : isSpeaking
              ? "3px solid var(--accent-primary)"
              : "2px solid var(--border-default)",
            boxShadow: isListening
              ? "0 0 30px rgba(239,68,68,0.25)"
              : isSpeaking
              ? "0 0 30px rgba(37,99,235,0.2)"
              : "var(--shadow-lg)",
            transition: "border-color 0.3s, box-shadow 0.3s",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />

          {!cameraActive && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: "var(--bg-elevated)" }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{ background: "var(--bg-overlay)" }}
              >
                👤
              </div>
              <p className="text-xs text-center max-w-[200px]" style={{ color: "var(--text-muted)" }}>
                {cameraError || "Camera not available"}
              </p>
            </div>
          )}

          {isListening && (
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: "rgba(239,68,68,0.9)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-semibold">Listening...</span>
            </div>
          )}

          <div
            className="absolute bottom-3 left-3 px-3 py-1 rounded-lg text-xs font-medium text-white"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          >
            {name}
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-4" style={{ maxWidth: "600px" }}>
          <div
            className="w-full rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: "var(--accent-primary)" }}
                >
                  AI
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  ARIA
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Interview Assistant
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isSpeaking
                      ? "bg-blue-400 animate-pulse"
                      : isLoading
                      ? "bg-yellow-400 animate-pulse"
                      : "bg-green-400"
                  }`}
                />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {isSpeaking ? "Speaking" : isLoading ? "Thinking" : "Live"}
                </span>
              </div>
            </div>

            <ARIAWaveformStrip isSpeaking={isSpeaking} isThinking={isLoading} />
          </div>

          {(currentQuestion || isLoading) && (
            <div
              className="w-full rounded-2xl p-5"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        background: "var(--accent-primary)",
                        animationDelay: `${i * 150}ms`,
                      }}
                    />
                  ))}
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    ARIA is thinking...
                  </span>
                </div>
              ) : (
                <div>
                  {questionCount > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Question {questionCount} of 7
                      </span>
                      <div className="flex gap-1 flex-1">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all"
                            style={{
                              background: i < questionCount ? "var(--accent-primary)" : "var(--bg-elevated)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-base font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>
                    {currentQuestion}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className="flex-shrink-0 px-6 py-4 flex items-center justify-center gap-6"
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border-subtle)"
        }}
      >
        {answers.length > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              💪 Confidence
            </span>
            <span className="text-sm font-bold" style={{ color: "var(--success)" }}>
              {Math.max(60, 100 - answers.length * 2)}%
            </span>
          </div>
        )}

        <button
          onMouseDown={handleMicPress}
          onMouseUp={handleMicRelease}
          onTouchStart={handleMicPress}
          onTouchEnd={handleMicRelease}
          disabled={!micEnabled || isSpeaking || isLoading}
          className="relative flex flex-col items-center justify-center rounded-full transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 select-none"
          style={{
            width: "80px",
            height: "80px",
            background: isListening
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : micEnabled && !isSpeaking && !isLoading
              ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
              : "var(--bg-elevated)",
            border: isListening ? "3px solid rgba(239,68,68,0.4)" : "2px solid var(--border-default)",
            boxShadow: isListening
              ? "0 0 30px rgba(239,68,68,0.4), 0 0 60px rgba(239,68,68,0.2)"
              : micEnabled && !isSpeaking && !isLoading
              ? "var(--shadow-accent)"
              : "none",
          }}
        >
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(239,68,68,0.2)" }} />
              <div
                className="absolute inset-[-8px] rounded-full animate-ping"
                style={{ background: "rgba(239,68,68,0.1)", animationDelay: "0.3s" }}
              />
            </>
          )}

          <span className="text-2xl relative z-10">{isListening ? "🔴" : "🎤"}</span>
          <span
            className="text-xs font-semibold relative z-10 mt-1"
            style={{
              color: isListening || (micEnabled && !isSpeaking) ? "white" : "var(--text-muted)",
            }}
          >
            {isListening ? "Release" : isSpeaking ? "Wait..." : isLoading ? "..." : "Hold"}
          </span>
        </button>

        <div className="text-center">
          <p
            className="text-xs font-medium"
            style={{
              color: isListening
                ? "var(--danger)"
                : isSpeaking
                ? "var(--accent-primary)"
                : isLoading
                ? "var(--warning)"
                : micEnabled
                ? "var(--success)"
                : "var(--text-muted)",
            }}
          >
            {isListening
              ? "Recording your answer..."
              : isSpeaking
              ? "ARIA is speaking..."
              : isLoading
              ? "ARIA is thinking..."
              : micEnabled
              ? "Hold mic to answer"
              : "Waiting..."}
          </p>
          {transcript && !isListening && (
            <p className="text-xs mt-1 italic max-w-xs truncate" style={{ color: "var(--text-muted)" }}>
              Heard: "{transcript}"
            </p>
          )}
        </div>
      </div>

      {showEndModal && (
        <EndInterviewModal
          onConfirm={handleTerminate}
          onCancel={() => setShowEndModal(false)}
          questionNumber={questionCount}
        />
      )}
    </div>
  );
}
