import { useEffect, useRef } from "react";

export default function Transcript({ messages }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex flex-col animate-fade-in ${
            msg.role === "ai" ? "items-start" : "items-end"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-semibold ${
                msg.role === "ai" ? "text-purple-400" : "text-blue-400"
              }`}
            >
              {msg.role === "ai" ? "ARIA" : "You"}
            </span>
            {msg.timestamp && (
              <span className="text-[10px] text-gray-600">{formatTime(msg.timestamp)}</span>
            )}
          </div>
          <div
            className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === "ai"
                ? "bg-gray-800 text-gray-200 rounded-tl-md"
                : "bg-blue-600/20 text-blue-100 rounded-tr-md"
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
