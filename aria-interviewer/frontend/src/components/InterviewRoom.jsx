import { useState, useEffect, useCallback, useRef } from "react";
import { startInterview, sendMessage, generateReport } from "../api/interviewApi";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { useRecording } from "../hooks/useRecording";
import { useConfidenceTracker } from "../hooks/useConfidenceTracker";
import Transcript from "./Transcript";
import ARIAWaveform from "./ARIAWaveform";
import ConfidencePanel from "./ConfidencePanel";
import RecordingControls from "./RecordingControls";

export default function InterviewRoom({ name, domain, resumeText, onComplete }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [error, setError] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");

  const { transcript, isListening, startListening, stopListening, setTranscript } =
    useSpeechRecognition();
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();
  const { isRecording, audioUrl, permissionDenied, startRecording, stopRecording, downloadRecording } =
    useRecording();
  const { answers, addAnswer, analyzeAll } = useConfidenceTracker();

  const hasStarted = useRef(false);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  // Fill text input when speech recognition returns a transcript
  useEffect(() => {
    if (transcript) {
      setUserInput(transcript);
    }
  }, [transcript]);

  // Timer
  useEffect(() => {
    if (sessionId && !isDone) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, isDone]);

  // Start interview on mount
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const init = async () => {
      setIsLoading(true);
      try {
        const data = await startInterview(domain, name, resumeText);
        setSessionId(data.session_id);
        startTimeRef.current = Date.now();
        const aiMsg = data.message;
        setCurrentQuestion(aiMsg);
        setQuestionCount(1);
        setMessages([{ role: "ai", text: aiMsg, timestamp: new Date().toISOString() }]);
        speak(aiMsg);
      } catch (err) {
        setError("Failed to start interview. Is the backend running?");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [domain, name, resumeText, speak]);

  // Start recording once session is established
  useEffect(() => {
    if (sessionId) startRecording();
  }, [sessionId, startRecording]);

  // Handle generate report when interview is done
  const handleGenerateReport = useCallback(
    async (sid) => {
      setIsGeneratingReport(true);
      stopRecording();
      try {
        const [report, confidenceData] = await Promise.all([
          generateReport(sid),
          analyzeAll(),
        ]);
        const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        onComplete(report, confidenceData, durationSeconds, messages);
      } catch (err) {
        setError("Failed to generate report. Please try again.");
        setIsGeneratingReport(false);
      }
    },
    [onComplete, analyzeAll, stopRecording]
  );

  const handleSend = async () => {
    const text = userInput.trim();
    if (!text || !sessionId || isLoading || isSpeaking) return;

    setMessages((prev) => [...prev, { role: "user", text, timestamp: new Date().toISOString() }]);
    addAnswer(text);
    setUserInput("");
    setTranscript("");
    setIsLoading(true);
    setError("");

    try {
      const data = await sendMessage(sessionId, text);
      setMessages((prev) => [...prev, { role: "ai", text: data.message, timestamp: new Date().toISOString() }]);
      setCurrentQuestion(data.message);
      setQuestionCount((c) => c + 1);
      speak(data.message, () => {
        if (data.is_done) {
          setIsDone(true);
          handleGenerateReport(sessionId);
        }
      });
    } catch (err) {
      setError("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canInteract = !isLoading && !isSpeaking && !isDone && sessionId;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            ARIA
          </span>
          <span className="text-gray-500 text-sm">|</span>
          <span className="text-gray-400 text-sm">{domain} Interview</span>
          <span className="text-gray-500 text-sm">|</span>
          <span className="text-gray-400 text-sm">
            ⏱ {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, "0")}
          </span>
          {questionCount > 0 && (
            <>
              <span className="text-gray-500 text-sm">|</span>
              <span className="text-gray-400 text-sm">Q{questionCount}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RecordingControls
            isRecording={isRecording}
            audioUrl={audioUrl}
            onDownload={downloadRecording}
            permissionDenied={permissionDenied}
          />
          {isSpeaking && (
            <span className="flex items-center gap-2 text-purple-400 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
              </span>
              ARIA is speaking...
            </span>
          )}
          {isLoading && (
            <span className="flex items-center gap-2 text-blue-400 text-sm">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              ARIA is thinking...
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Waveform */}
        <div className="hidden md:flex w-1/3 border-r border-gray-800">
          <div className="flex flex-col h-full w-full">
            <ARIAWaveform
              isSpeaking={isSpeaking}
              isThinking={isLoading}
              currentQuestion={currentQuestion}
              questionNumber={questionCount}
              totalQuestions={7}
            />
          </div>
        </div>

        {/* Right Panel — Transcript */}
        <div className="flex-1 flex flex-col bg-gray-950">
          <div className="flex-1 overflow-hidden">
            <Transcript messages={messages} />
          </div>
        </div>
      </div>

      {/* Confidence Panel */}
      <ConfidencePanel answers={answers} isVisible={messages.length > 2} />

      {/* Error bar */}
      {error && (
        <div className="bg-red-500/10 border-t border-red-500/30 px-6 py-2">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Report loading overlay */}
      {isGeneratingReport && (
        <div className="bg-gray-900 border-t border-gray-800 px-6 py-4 flex items-center justify-center gap-3">
          <svg className="animate-spin h-5 w-5 text-purple-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-purple-300 font-medium">Generating your performance report...</span>
        </div>
      )}

      {/* Bottom controls */}
      {!isDone && !isGeneratingReport && (
        <div className="bg-gray-900 border-t border-gray-800 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            {/* Start Recording Button */}
            {!isListening && (
              <button
                onClick={() => canInteract && startListening()}
                disabled={!canInteract}
                className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 flex-shrink-0 ${
                  canInteract
                    ? "bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/30 text-white"
                    : "bg-gray-700 cursor-not-allowed opacity-50 text-gray-400"
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                <span className="text-sm font-medium">Start Rec</span>
              </button>
            )}

            {/* Stop Recording Button */}
            {isListening && (
              <button
                onClick={() => stopListening()}
                className="px-4 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 flex-shrink-0 bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/40 text-white animate-pulse"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                <span className="text-sm font-medium">Stop Rec</span>
              </button>
            )}

            {/* Text Input */}
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "Listening... click Stop Rec when done"
                  : canInteract
                  ? "Type your answer or click Start Rec..."
                  : "Wait for ARIA to finish..."
              }
              disabled={!canInteract}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50"
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!canInteract || !userInput.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-500 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
