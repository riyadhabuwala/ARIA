import { useEffect, useRef } from "react";

function parseARIAMessage(text) {
  if (!text) return { question: text };

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  if (sentences.length <= 1) {
    return { question: text };
  }

  const lastSentence = sentences[sentences.length - 1].trim();
  const isQuestion = lastSentence.endsWith("?");

  if (isQuestion && sentences.length >= 2) {
    return { question: lastSentence };
  }

  return { question: text };
}

export default function Transcript({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
             style={{ background: "var(--bg-elevated)" }}>
          💬
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Interview starting...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg, i) => {
        const isAI = msg.role === "ai";
        const time = msg.timestamp
          ? new Date(msg.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit", minute: "2-digit"
            })
          : "";

        if (isAI) {
          const { question } = parseARIAMessage(msg.text);

          return (
            <div key={i} className="flex gap-3 animate-fadeUp">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}
              >
                AI
              </div>

              <div className="max-w-[85%] flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    ARIA
                  </span>
                  {time && (
                    <span className="text-xs" style={{ color: "var(--text-disabled)" }}>
                      {time}
                    </span>
                  )}
                </div>

                <div
                  className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    borderTopLeftRadius: "4px",
                  }}
                >
                  {question || msg.text}
                </div>
              </div>
            </div>
          );
        }

        // User message
        return (
          <div key={i} className="flex gap-3 animate-fadeUp flex-row-reverse">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
              }}
            >
              Y
            </div>

            <div className="max-w-[80%] flex flex-col gap-1 items-end">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  You
                </span>
                {time && (
                  <span className="text-xs" style={{ color: "var(--text-disabled)" }}>
                    {time}
                  </span>
                )}
              </div>
              <div
                className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={{
                  background: "var(--accent-subtle)",
                  border: "1px solid rgba(124,106,255,0.2)",
                  color: "var(--text-primary)",
                  borderTopRightRadius: "4px",
                }}
              >
                {msg.text}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
