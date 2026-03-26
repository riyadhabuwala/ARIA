import { useState, useCallback } from "react";
import { analyzeConfidence } from "../api/interviewApi";

export function useConfidenceTracker() {
  const [answers, setAnswers] = useState([]);
  const [confidenceData, setConfidenceData] = useState(null);

  const addAnswer = useCallback((answerText) => {
    setAnswers((prev) => [...prev, answerText]);
  }, []);

  const analyzeAll = useCallback(async () => {
    if (answers.length === 0) return null;
    try {
      const data = await analyzeConfidence(answers);
      setConfidenceData(data);
      return data;
    } catch {
      return null;
    }
  }, [answers]);

  const reset = useCallback(() => {
    setAnswers([]);
    setConfidenceData(null);
  }, []);

  return { answers, confidenceData, addAnswer, analyzeAll, reset };
}
