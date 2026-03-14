import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useChatbot } from "../hooks/useChatbot";

function renderContent(text) {
  if (!text) return "";
  return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} style={{ color: "var(--text-primary)" }}>
        {part}
      </strong>
    ) : (
      part
    )
  );
}

const ChatWidget = forwardRef(function ChatWidget(
  { user, forceOpen = false, onOpenChange = null },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { messages, isLoading, error, sendMessage, clearChat, triggerDebrief } = useChatbot(user?.id);

  useImperativeHandle(ref, () => ({
    triggerDebrief: (report, confidenceData, previousScore) => {
      triggerDebrief(report, confidenceData, previousScore);
    },
  }));

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      if (onOpenChange) onOpenChange(true);
    }
  }, [forceOpen, onOpenChange]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  function handleToggle() {
    const next = !isOpen;
    setIsOpen(next);
    if (onOpenChange) onOpenChange(next);
  }

  async function handleSend() {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");
    await sendMessage(msg);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const suggestions = [
    "What should I study next?",
    "How am I improving?",
    "What skills am I missing?",
    "Give me a study plan",
  ];

  if (!user) return null;

  return (
    <>
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          background: isOpen
            ? "var(--bg-elevated)"
            : "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
          boxShadow: isOpen ? "var(--shadow-md)" : "var(--shadow-accent), var(--shadow-lg)",
          border: isOpen ? "1px solid var(--border-default)" : "none",
        }}
        aria-label="Open career coach"
      >
        {isOpen ? (
          <span className="text-xl" style={{ color: "var(--text-secondary)" }}>
            x
          </span>
        ) : (
          <span className="text-2xl">🎓</span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl overflow-hidden animate-fadeUp max-w-[calc(100vw-2rem)]"
          style={{
            width: "380px",
            height: "520px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}
              >
                AI
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Career Coach
                </div>
                <div className="text-xs" style={{ color: "var(--success)" }}>
                  Live
                </div>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="text-xs px-2 py-1 rounded-lg transition-all hover:opacity-80"
              style={{
                color: "var(--text-muted)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
              title="Clear chat"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => {
              const isAI = msg.role === "assistant";
              return (
                <div key={i} className={`flex gap-2.5 ${!isAI ? "flex-row-reverse" : ""}`}>
                  {isAI && (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}
                    >
                      AI
                    </div>
                  )}

                  <div
                    className="max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={{
                      background: isAI
                        ? "var(--bg-overlay)"
                        : "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                      color: isAI ? "var(--text-primary)" : "white",
                      border: isAI ? "1px solid var(--border-subtle)" : "none",
                      borderTopLeftRadius: isAI ? "4px" : "16px",
                      borderTopRightRadius: isAI ? "16px" : "4px",
                    }}
                  >
                    {isAI ? renderContent(msg.content) : msg.content}

                    {isAI && isLoading && i === messages.length - 1 && msg.content && (
                      <span
                        className="inline-block w-1.5 h-4 ml-0.5 align-middle animate-pulse rounded-sm"
                        style={{ background: "var(--accent-primary)" }}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}
                >
                  AI
                </div>
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    background: "var(--bg-overlay)",
                    border: "1px solid var(--border-subtle)",
                    borderTopLeftRadius: "4px",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((j) => (
                      <div
                        key={j}
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{
                          background: "var(--accent-primary)",
                          animationDelay: `${j * 150}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                className="text-xs px-3 py-2 rounded-lg text-center"
                style={{ background: "var(--danger-subtle)", color: "var(--danger)" }}
              >
                {error}
              </div>
            )}

            {messages.length === 1 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Try asking:
                </p>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs transition-all hover:opacity-80 active:scale-[0.98]"
                    style={{
                      background: "var(--accent-subtle)",
                      border: "1px solid rgba(124,106,255,0.15)",
                      color: "var(--accent-primary)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your career coach..."
                disabled={isLoading}
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent-primary)";
                  e.target.style.boxShadow = "0 0 0 3px var(--accent-subtle)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-default)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                }}
              >
                {'>'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default ChatWidget;
