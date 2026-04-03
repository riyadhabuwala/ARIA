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
  const [showTranscript, setShowTranscript] = useState(false);

  const { transcript, isListening, startListening, stopListening, setTranscript } =
    useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();
  const { isRecording, startRecording, stopRecording } = useRecording();
  const { answers, addAnswer, analyzeAll } = useConfidenceTracker();
  const { videoRef, cameraActive, cameraError, startCamera, stopCamera } = useCamera();

  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const messagesRef = useRef([]);
  const transcriptEndRef = useRef(null);

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
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

  const statusColor = isListening
    ? "#ef4444"
    : isSpeaking
    ? "#2563eb"
    : isLoading
    ? "#f59e0b"
    : "#22c55e";

  const statusText = isListening
    ? "Recording your answer..."
    : isSpeaking
    ? "ARIA is speaking..."
    : isLoading
    ? "ARIA is thinking..."
    : micEnabled
    ? "Your turn — hold mic to answer"
    : "Waiting...";

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      background: "#000000",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* ═══ TOP BAR ═══ */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: "56px",
        flexShrink: 0,
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        zIndex: 20,
      }}>
        {/* Left: Logo + Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            color: "white",
            fontSize: "11px",
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            boxShadow: "0 0 16px rgba(37,99,235,0.35)",
          }}>AI</div>
          <div style={{ height: "20px", width: "1px", background: "rgba(255,255,255,0.1)" }} />
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff", letterSpacing: "-0.01em" }}>
              {domain} Interview
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "1px" }}>
              ARIA AI Interviewer
            </div>
          </div>
        </div>

        {/* Center: Timer + Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <span style={{ fontSize: "13px", fontFamily: "'Geist', monospace", fontWeight: "600", color: "#ffffff" }}>
              ⏱ {timerDisplay}
            </span>
          </div>

          {isRecording && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "999px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}>
              <div style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#ef4444",
                animation: "pulse-blue 1.5s ease-in-out infinite",
              }} />
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Rec
              </span>
            </div>
          )}

          {questionCount > 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "999px",
              background: "rgba(37,99,235,0.08)",
              border: "1px solid rgba(37,99,235,0.2)",
            }}>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#60a5fa" }}>
                Q{questionCount}/7
              </span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "600",
              background: showTranscript ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.04)",
              border: showTranscript ? "1px solid rgba(37,99,235,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color: showTranscript ? "#60a5fa" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            💬 Transcript
          </button>
          <button
            onClick={() => setShowEndModal(true)}
            disabled={questionCount < 1 || isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: "600",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              cursor: questionCount < 1 || isLoading ? "not-allowed" : "pointer",
              opacity: questionCount < 1 || isLoading ? 0.3 : 1,
              transition: "all 0.2s ease",
            }}
          >
            ⏹ End
          </button>
        </div>
      </div>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div style={{
        flex: 1,
        display: "flex",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* ── Video + AI Panel Area ── */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "16px",
          gap: "12px",
          overflow: "hidden",
        }}>
          {/* Video Grid */}
          <div style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            minHeight: 0,
          }}>
            {/* ── User Camera ── */}
            <div style={{
              position: "relative",
              borderRadius: "16px",
              overflow: "hidden",
              background: "#0a0a0a",
              border: isListening
                ? "2px solid #ef4444"
                : "1px solid rgba(255,255,255,0.06)",
              boxShadow: isListening
                ? "0 0 40px rgba(239,68,68,0.2), inset 0 0 20px rgba(239,68,68,0.05)"
                : "0 4px 24px rgba(0,0,0,0.5)",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                  display: cameraActive ? "block" : "none",
                }}
              />

              {!cameraActive && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  background: "linear-gradient(135deg, #0a0a0a, #111111)",
                }}>
                  <div style={{
                    width: "80px", height: "80px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "36px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}>👤</div>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", textAlign: "center", maxWidth: "200px" }}>
                    {cameraError || "Camera off"}
                  </p>
                </div>
              )}

              {/* Name Tag */}
              <div style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(8px)",
              }}>
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: isListening ? "#ef4444" : "#22c55e",
                  boxShadow: isListening ? "0 0 8px rgba(239,68,68,0.5)" : "0 0 8px rgba(34,197,94,0.3)",
                  transition: "all 0.3s ease",
                }} />
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#ffffff" }}>
                  {name}
                </span>
              </div>

              {/* Listening Indicator */}
              {isListening && (
                <div style={{
                  position: "absolute",
                  top: "12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 16px",
                  borderRadius: "999px",
                  background: "rgba(239,68,68,0.9)",
                  backdropFilter: "blur(8px)",
                  animation: "fadeUp 0.3s ease forwards",
                }}>
                  <div style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: "white",
                    animation: "pulse-blue 1s ease-in-out infinite",
                  }} />
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "white", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Listening
                  </span>
                </div>
              )}
            </div>

            {/* ── AI Interviewer Panel ── */}
            <div style={{
              position: "relative",
              borderRadius: "16px",
              overflow: "hidden",
              background: "linear-gradient(160deg, #0d1117, #0a0a0a)",
              border: isSpeaking
                ? "2px solid rgba(37,99,235,0.5)"
                : "1px solid rgba(255,255,255,0.06)",
              boxShadow: isSpeaking
                ? "0 0 40px rgba(37,99,235,0.15), inset 0 0 30px rgba(37,99,235,0.03)"
                : "0 4px 24px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            }}>
              {/* AI Avatar + Waveform */}
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                padding: "24px",
              }}>
                {/* AI Avatar */}
                <div style={{ position: "relative" }}>
                  {isSpeaking && (
                    <>
                      <div style={{
                        position: "absolute",
                        inset: "-12px",
                        borderRadius: "50%",
                        background: "rgba(37,99,235,0.1)",
                        animation: "pulse-ring 2s ease-out infinite",
                      }} />
                      <div style={{
                        position: "absolute",
                        inset: "-6px",
                        borderRadius: "50%",
                        background: "rgba(37,99,235,0.15)",
                        animation: "pulse-ring 2s ease-out infinite 0.5s",
                      }} />
                    </>
                  )}
                  <div style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "800",
                    color: "white",
                    fontSize: "22px",
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    boxShadow: isSpeaking
                      ? "0 0 30px rgba(37,99,235,0.4)"
                      : "0 4px 16px rgba(37,99,235,0.25)",
                    position: "relative",
                    zIndex: 1,
                    transition: "box-shadow 0.3s ease",
                  }}>AI</div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", letterSpacing: "-0.02em" }}>
                    ARIA
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                    Interview Assistant
                  </div>
                </div>

                {/* Waveform */}
                <div style={{ width: "100%", maxWidth: "320px" }}>
                  <ARIAWaveformStrip isSpeaking={isSpeaking} isThinking={isLoading} />
                </div>

                {/* Status */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 16px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: isSpeaking ? "#2563eb" : isLoading ? "#f59e0b" : "#22c55e",
                    animation: (isSpeaking || isLoading) ? "pulse-blue 1.5s ease-in-out infinite" : "none",
                    transition: "background 0.3s ease",
                  }} />
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {isSpeaking ? "Speaking" : isLoading ? "Thinking" : "Live"}
                  </span>
                </div>
              </div>

              {/* AI Name Tag */}
              <div style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(8px)",
              }}>
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: isSpeaking ? "#2563eb" : "#22c55e",
                  boxShadow: isSpeaking ? "0 0 8px rgba(37,99,235,0.5)" : "0 0 8px rgba(34,197,94,0.3)",
                }} />
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#ffffff" }}>
                  ARIA Interviewer
                </span>
              </div>
            </div>
          </div>

          {/* ── Question Strip ── */}
          {(currentQuestion || isLoading) && (
            <div style={{
              flexShrink: 0,
              borderRadius: "14px",
              overflow: "hidden",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}>
              {isLoading && !currentQuestion ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: "#2563eb",
                        animation: `pulse-blue 1.2s ease-in-out infinite ${i * 200}ms`,
                      }}
                    />
                  ))}
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                    ARIA is preparing your question...
                  </span>
                </div>
              ) : (
                <>
                  {/* Progress Dots */}
                  {questionCount > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#60a5fa",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>Q{questionCount}</span>
                      <div style={{ display: "flex", gap: "3px" }}>
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div
                            key={i}
                            style={{
                              width: i < questionCount ? "16px" : "8px",
                              height: "3px",
                              borderRadius: "999px",
                              background: i < questionCount ? "#2563eb" : "rgba(255,255,255,0.08)",
                              transition: "all 0.3s ease",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                  <p style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "rgba(255,255,255,0.8)",
                    lineHeight: "1.5",
                    margin: 0,
                  }}>
                    {currentQuestion}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Transcript Sidebar ── */}
        <div style={{
          width: showTranscript ? "340px" : "0px",
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 0.3s ease",
          borderLeft: showTranscript ? "1px solid rgba(255,255,255,0.06)" : "none",
          background: "rgba(10,10,10,0.95)",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
              Live Transcript
            </span>
            <button
              onClick={() => setShowTranscript(false)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.3)",
                cursor: "pointer",
                fontSize: "16px",
                padding: "4px",
              }}
            >✕</button>
          </div>

          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            {messages.length === 0 ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "8px",
              }}>
                <span style={{ fontSize: "24px" }}>💬</span>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>
                  Transcript will appear here...
                </p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isAI = msg.role === "ai";
                const time = msg.timestamp
                  ? new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                  : "";
                return (
                  <div key={i} style={{ animation: "fadeUp 0.3s ease forwards" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "4px",
                    }}>
                      <div style={{
                        width: "18px", height: "18px",
                        borderRadius: "5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "8px",
                        fontWeight: "800",
                        color: "white",
                        background: isAI
                          ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                          : "rgba(255,255,255,0.1)",
                      }}>{isAI ? "AI" : "Y"}</div>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: "rgba(255,255,255,0.4)" }}>
                        {isAI ? "ARIA" : name}
                      </span>
                      {time && (
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>
                          {time}
                        </span>
                      )}
                    </div>
                    <div style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      lineHeight: "1.6",
                      color: "rgba(255,255,255,0.75)",
                      background: isAI ? "rgba(37,99,235,0.06)" : "rgba(255,255,255,0.03)",
                      border: "1px solid " + (isAI ? "rgba(37,99,235,0.1)" : "rgba(255,255,255,0.04)"),
                    }}>
                      {msg.text.length > 200 ? msg.text.substring(0, 200) + "..." : msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM CONTROL BAR ═══ */}
      <div style={{
        flexShrink: 0,
        height: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        padding: "0 24px",
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        zIndex: 20,
      }}>
        {/* Confidence Meter */}
        {answers.length > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 16px",
            borderRadius: "12px",
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.12)",
          }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>💪 Confidence</span>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#22c55e" }}>
              {Math.max(60, 100 - answers.length * 2)}%
            </span>
          </div>
        )}

        {/* Mic Button */}
        <button
          onMouseDown={handleMicPress}
          onMouseUp={handleMicRelease}
          onTouchStart={handleMicPress}
          onTouchEnd={handleMicRelease}
          disabled={!micEnabled || isSpeaking || isLoading}
          style={{
            position: "relative",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: !micEnabled || isSpeaking || isLoading ? "not-allowed" : "pointer",
            opacity: !micEnabled || isSpeaking || isLoading ? 0.3 : 1,
            background: isListening
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : micEnabled && !isSpeaking && !isLoading
              ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
              : "rgba(255,255,255,0.05)",
            border: isListening
              ? "2px solid rgba(239,68,68,0.4)"
              : micEnabled && !isSpeaking && !isLoading
              ? "2px solid rgba(37,99,235,0.4)"
              : "1px solid rgba(255,255,255,0.1)",
            boxShadow: isListening
              ? "0 0 24px rgba(239,68,68,0.35)"
              : micEnabled && !isSpeaking && !isLoading
              ? "0 0 24px rgba(37,99,235,0.3)"
              : "none",
            transition: "all 0.2s ease",
            userSelect: "none",
          }}
        >
          {isListening && (
            <>
              <div style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.2)",
                animation: "pulse-ring 1.5s ease-out infinite",
              }} />
              <div style={{
                position: "absolute",
                inset: "-6px",
                borderRadius: "50%",
                background: "rgba(239,68,68,0.1)",
                animation: "pulse-ring 1.5s ease-out infinite 0.3s",
              }} />
            </>
          )}
          <span style={{ fontSize: "20px", position: "relative", zIndex: 1 }}>
            {isListening ? "🔴" : "🎤"}
          </span>
        </button>

        {/* Status Text */}
        <div style={{ textAlign: "center", minWidth: "160px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            justifyContent: "center",
          }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: statusColor,
              animation: isListening || isSpeaking || isLoading ? "pulse-blue 1.5s ease-in-out infinite" : "none",
            }} />
            <p style={{
              fontSize: "12px",
              fontWeight: "600",
              color: statusColor,
              margin: 0,
              transition: "color 0.3s ease",
            }}>
              {statusText}
            </p>
          </div>
          {transcript && !isListening && (
            <p style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.25)",
              marginTop: "4px",
              fontStyle: "italic",
              maxWidth: "220px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
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
