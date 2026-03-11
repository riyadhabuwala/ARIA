import { useState, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function useConfidenceTracker() {
  const [answers, setAnswers] = useState([]);
  const [confidenceData, setConfidenceData] = useState(null);

  const addAnswer = useCallback((answerText) => {
    setAnswers((prev) => [...prev, answerText]);
  }, []);

  const analyzeAll = useCallback(async () => {
    if (answers.length === 0) return null;
    try {
      const res = await fetch(`${BASE_URL}/api/analyze-confidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
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
