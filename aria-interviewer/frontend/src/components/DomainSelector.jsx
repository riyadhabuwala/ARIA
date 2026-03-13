import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const DOMAINS = [
  { name: "Software Engineering", desc: "DSA, OOP, System Design",     icon: "⚙️",  color: "#3b82f6" },
  { name: "Web Development",      desc: "HTML, CSS, React, APIs",       icon: "🌐",  color: "#10b981" },
  { name: "Data Science",         desc: "Stats, ML, Python, Pandas",    icon: "📊",  color: "#f59e0b" },
  { name: "Artificial Intelligence", desc: "ML/DL, NLP, Neural Nets",   icon: "🤖",  color: "#8b5cf6" },
  { name: "HR / Behavioral",      desc: "STAR Method, Leadership",      icon: "🤝",  color: "#ec4899" },
];

export default function DomainSelector({ onStart }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  const canStart = name.trim().length > 0 && domain !== "";

  return (
    <div className="min-h-screen flex flex-col"
         style={{ background: "var(--bg-base)" }}>

      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between"
           style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center
                          font-bold text-white text-xs"
               style={{ background: "var(--accent-primary)" }}>
            AI
          </div>
          <span className="font-semibold heading-font"
                style={{ color: "var(--text-primary)" }}>
            ARIA
          </span>
        </div>
        <ThemeToggle />
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="text-center mb-10 animate-fadeUp">
            <h1 className="text-4xl font-bold heading-font mb-3"
                style={{ color: "var(--text-primary)" }}>
              Set up your interview
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Tell us about yourself and choose what to practice
            </p>
          </div>

          {/* Name input */}
          <div className="mb-8 animate-fadeUp stagger-1">
            <label className="block text-sm font-medium mb-2"
                   style={{ color: "var(--text-secondary)" }}>
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3.5 rounded-xl text-sm outline-none
                         transition-all duration-200"
              style={{
                background: "var(--bg-surface)",
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
          </div>

          {/* Domain grid */}
          <div className="mb-8 animate-fadeUp stagger-2">
            <label className="block text-sm font-medium mb-3"
                   style={{ color: "var(--text-secondary)" }}>
              Interview Domain
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {DOMAINS.map((d) => {
                const selected = domain === d.name;
                return (
                  <button
                    key={d.name}
                    onClick={() => setDomain(d.name)}
                    className="text-left p-4 rounded-xl transition-all
                               duration-200 hover:-translate-y-0.5
                               active:scale-[0.98]"
                    style={{
                      background: selected
                        ? `${d.color}15`
                        : "var(--bg-surface)",
                      border: selected
                        ? `2px solid ${d.color}60`
                        : "1px solid var(--border-subtle)",
                      boxShadow: selected
                        ? `0 0 0 1px ${d.color}30, var(--shadow-sm)`
                        : "var(--shadow-sm)",
                    }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{d.icon}</span>
                      {selected && (
                        <span className="ml-auto text-xs px-2 py-0.5
                                         rounded-full font-medium"
                              style={{
                                background: `${d.color}20`,
                                color: d.color
                              }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold mb-0.5"
                         style={{
                           color: selected ? d.color : "var(--text-primary)"
                         }}>
                      {d.name}
                    </div>
                    <div className="text-xs"
                         style={{ color: "var(--text-muted)" }}>
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
            className="w-full py-4 rounded-xl font-semibold text-white
                       transition-all duration-200 hover:opacity-90
                       active:scale-[0.99] disabled:opacity-30
                       disabled:cursor-not-allowed animate-fadeUp stagger-3"
            style={{
              background: canStart
                ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
                : "var(--bg-elevated)",
              boxShadow: canStart ? "var(--shadow-accent)" : "none",
            }}>
            {canStart
              ? `Start ${domain} Interview →`
              : "Enter your name and select a domain"}
          </button>
        </div>
      </div>
    </div>
  );
}
