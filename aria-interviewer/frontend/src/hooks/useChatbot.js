import { useCallback, useRef, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I'm your ARIA Career Coach. I can use your interview history, resume, and job matches. Ask me things like \"What should I study next?\" or \"How am I improving?\"",
};

export function useChatbot(userId) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const sendMessage = useCallback(
    async (userMessage) => {
      const text = (userMessage || "").trim();
      if (!text || isLoading || !userId) return;

      setError(null);
      setIsLoading(true);

      let historyForBackend = [];
      setMessages((prev) => {
        const next = [...prev, { role: "user", content: text }, { role: "assistant", content: "" }];
        historyForBackend = next
          .slice(0, -2)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content }));
        return next;
      });

      try {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const response = await fetch(`${BASE_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            message: text,
            conversation_history: historyForBackend.slice(-6),
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("Chat request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const event of events) {
            const line = event
              .split("\n")
              .find((l) => l.startsWith("data: "));
            if (!line) continue;

            const data = line.slice(6).trim();
            if (!data) continue;
            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: fullContent,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Ignore malformed SSE chunk data.
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Something went wrong. Please try again.");
          setMessages((prev) => {
            const updated = [...prev];
            if (updated[updated.length - 1]?.role === "assistant" && !updated[updated.length - 1]?.content) {
              updated.pop();
            }
            return updated;
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, userId]
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    setIsLoading(false);
  }, []);

  const triggerDebrief = useCallback(
    async (report, confidenceData, previousScore = 0) => {
      if (!report || !userId) return;

      try {
        setMessages([]);
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${BASE_URL}/api/chat/debrief`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            report,
            confidence_data: confidenceData || {},
            previous_score: previousScore,
          }),
        });

        if (!response.ok) {
          throw new Error("Debrief failed");
        }

        const data = await response.json();
        const debriefMessage = data.debrief || "Great interview! How can I help?";

        const words = debriefMessage.split(" ");
        let revealed = "";

        setMessages([{ role: "assistant", content: "" }]);
        setIsLoading(false);

        for (let i = 0; i < words.length; i += 1) {
          revealed += `${i === 0 ? "" : " "}${words[i]}`;
          const current = revealed;
          setMessages([{ role: "assistant", content: current }]);
          // Small delay to create a natural typing reveal.
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
      } catch (err) {
        console.error("Debrief error:", err);
        setIsLoading(false);
        const score = report?.overall_score || 0;
        const grade = report?.grade || "";
        setMessages([
          {
            role: "assistant",
            content:
              `You scored **${score}/100** (${grade}). ` +
              "Want me to break down your weakest areas or create a study plan?",
          },
        ]);
      }
    },
    [userId]
  );

  return { messages, isLoading, error, sendMessage, clearChat, triggerDebrief };
}
