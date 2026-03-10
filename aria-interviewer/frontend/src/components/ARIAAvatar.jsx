import Lottie from "lottie-react";
import { useEffect, useState } from "react";

export default function ARIAAvatar({ isSpeaking, isThinking }) {
  const [idleAnimation, setIdleAnimation] = useState(null);
  const [talkingAnimation, setTalkingAnimation] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load Lottie JSON files dynamically
    Promise.all([
      fetch("/animations/aria-idle.json").then((r) => r.json()),
      fetch("/animations/aria-talking.json").then((r) => r.json()),
    ])
      .then(([idle, talking]) => {
        setIdleAnimation(idle);
        setTalkingAnimation(talking);
        setLoaded(true);
      })
      .catch(() => {
        // Lottie files not found — use CSS fallback
        setLoaded(false);
      });
  }, []);

  // CSS Fallback Avatar if Lottie not available
  const FallbackAvatar = () => (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Outer glow ring */}
      <div
        className={`relative flex items-center justify-center rounded-full
          ${isSpeaking
            ? "w-40 h-40 ring-4 ring-blue-400 ring-offset-4 ring-offset-gray-950"
            : "w-40 h-40 ring-2 ring-gray-600 ring-offset-4 ring-offset-gray-950"
          } transition-all duration-300`}
      >
        {/* Pulsing background when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping" />
        )}

        {/* Avatar circle */}
        <div
          className={`w-36 h-36 rounded-full flex items-center justify-center text-6xl
            ${isSpeaking
              ? "bg-gradient-to-br from-blue-600 to-purple-700"
              : "bg-gradient-to-br from-gray-700 to-gray-800"
            } transition-all duration-500 shadow-2xl`}
        >
          🤖
        </div>
      </div>

      {/* Sound wave bars when speaking */}
      {isSpeaking && (
        <div className="flex items-end gap-1 h-8">
          {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-blue-400 rounded-full animate-pulse"
              style={{
                height: `${h * 6}px`,
                animationDelay: `${i * 80}ms`,
                animationDuration: "600ms",
              }}
            />
          ))}
        </div>
      )}

      {/* Thinking dots */}
      {isThinking && !isSpeaking && (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Status label
  const StatusLabel = () => (
    <div className="mt-4 text-sm font-medium tracking-wide">
      {isThinking && !isSpeaking && (
        <span className="text-yellow-400">ARIA is thinking...</span>
      )}
      {isSpeaking && (
        <span className="text-blue-400 animate-pulse">ARIA is speaking...</span>
      )}
      {!isThinking && !isSpeaking && (
        <span className="text-gray-500">ARIA is listening</span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {loaded && idleAnimation && talkingAnimation ? (
        <div className="w-64 h-64">
          <Lottie
            animationData={isSpeaking ? talkingAnimation : idleAnimation}
            loop={true}
            autoplay={true}
          />
        </div>
      ) : (
        <FallbackAvatar />
      )}
      <StatusLabel />
    </div>
  );
}
