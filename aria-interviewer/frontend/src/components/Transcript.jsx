import { useEffect, useRef } from "react";

export default function Transcript({ messages }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex flex-col ${
            msg.role === "ai" ? "items-start" : "items-end"
          }`}
        >
          <span
            className={`text-xs font-semibold mb-1 ${
              msg.role === "ai" ? "text-purple-400" : "text-blue-400"
            }`}
          >
            {msg.role === "ai" ? "ARIA" : "You"}
          </span>
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
