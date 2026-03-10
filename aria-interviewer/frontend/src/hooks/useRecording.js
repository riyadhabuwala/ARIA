import { useRef, useState, useCallback } from "react";

export function useRecording() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        // Stop all tracks to release mic
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(1000); // collect data every 1 second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setPermissionDenied(true);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const downloadRecording = useCallback(() => {
    if (!audioBlob) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `aria-interview-${Date.now()}.webm`;
    a.click();
  }, [audioBlob, audioUrl]);

  const resetRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    chunksRef.current = [];
  }, [audioUrl]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    permissionDenied,
    startRecording,
    stopRecording,
    downloadRecording,
    resetRecording,
  };
}
