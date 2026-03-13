import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-7 rounded-full transition-all
                  duration-300 focus:outline-none focus:ring-2
                  focus:ring-offset-2 ${className}`}
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
      }}
      aria-label="Toggle theme"
    >
      {/* Track icons */}
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs">
        🌙
      </span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs">
        ☀️
      </span>

      {/* Sliding knob */}
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full shadow-md
                   transition-all duration-300 flex items-center
                   justify-center text-xs"
        style={{
          left: theme === "dark" ? "2px" : "calc(100% - 26px)",
          background: "var(--accent-primary)",
        }}
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
