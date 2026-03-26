import { useCallback, useRef, useState } from "react";
import { textToSpeech } from "../api/interviewApi";

export function useSpeechSynthesis() {
  const audioRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(async (text, onEnd) => {
    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsSpeaking(true);

    try {
      const audioBlob = await textToSpeech(text);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      await audio.play();
    } catch (error) {
      // Fallback to browser TTS if ElevenLabs fails
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
