import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const DOMAINS = [
  { name: "Software Engineering", desc: "DSA, OOP, System Design", icon: "⚙️", color: "#2563eb" },
  { name: "Web Development", desc: "HTML, CSS, React, APIs", icon: "🌐", color: "#10b981" },
  { name: "Data Science", desc: "Stats, ML, Python, Pandas", icon: "📊", color: "#f59e0b" },
  {
    name: "Artificial Intelligence",
    desc: "ML/DL, NLP, LLMs",
    icon: "🤖",
    color: "#8b5cf6",
  },
  { name: "HR / Behavioral", desc: "STAR Method, Leadership", icon: "🤝", color: "#ec4899" },
];

export default function DomainSelector({ onStart }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const navigate = useNavigate();
  const canStart = name.trim().length > 0 && domain !== "";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      {/* Nav */}
      <nav
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
          >
            AI
          </div>
          <span className="font-bold font-geist" style={{ color: "var(--text-primary)" }}>
            ARIA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm transition-all hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-10 animate-fadeUp">
            <h1
              className="font-geist text-4xl font-bold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Set up your interview
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Tell us your name and choose what you want to practice
            </p>
          </div>

          {/* Name input */}
          <div className="mb-8 animate-fadeUp stagger-1">
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563eb";
                e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-default)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Domain grid */}
          <div className="mb-8 animate-fadeUp stagger-2">
            <label
              className="block text-sm font-medium mb-3"
              style={{ color: "var(--text-secondary)" }}
            >
              Interview Domain
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {DOMAINS.map((d) => {
                const selected = domain === d.name;
                return (
                  <button
                    key={d.name}
                    onClick={() => setDomain(d.name)}
                    className="text-left p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{
                      background: selected ? `${d.color}10` : "var(--bg-surface)",
                      border: selected
                        ? `2px solid ${d.color}50`
                        : "1px solid var(--border-subtle)",
                      boxShadow: selected ? `0 0 24px ${d.color}20` : "none",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{d.icon}</span>
                      {selected && (
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                          style={{
                            background: `${d.color}20`,
                            color: d.color,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <div
                      className="text-sm font-semibold mb-0.5"
                      style={{
                        color: selected ? d.color : "var(--text-primary)",
                      }}
                    >
                      {d.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {d.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => canStart && onStart(name.trim(), domain)}
            disabled={!canStart}
            className="w-full py-4 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-25 disabled:cursor-not-allowed font-geist animate-fadeUp stagger-3"
            style={{
              background: canStart
                ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                : "var(--bg-elevated)",
              boxShadow: canStart ? "0 0 30px rgba(37,99,235,0.3)" : "none",
              fontSize: "15px",
            }}
          >
            {canStart
              ? `Start ${domain} Interview →`
              : "Enter your name and select a domain to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
