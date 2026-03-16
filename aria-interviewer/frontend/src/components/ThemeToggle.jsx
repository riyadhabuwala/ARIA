import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center w-12 h-6 rounded-full
                  transition-all duration-300 focus:outline-none
                  ${className}`}
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
      }}
      aria-label="Toggle theme"
    >
      {/* Knob */}
      <span
        className="absolute flex items-center justify-center
                   w-5 h-5 rounded-full transition-all duration-300
                   shadow-sm"
        style={{
          left: isDark ? "2px" : "calc(100% - 22px)",
          background: isDark
            ? "linear-gradient(135deg, #1e40af, #2563eb)"
            : "linear-gradient(135deg, #f59e0b, #fbbf24)",
        }}
      >
        <span style={{ fontSize: "10px" }}>
          {isDark ? "🌙" : "☀️"}
        </span>
      </span>
    </button>
  );
}
