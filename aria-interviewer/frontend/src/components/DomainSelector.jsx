import { useState } from "react";

const DOMAINS = [
  { id: "Software Engineering", icon: "⚙️", desc: "DSA, OOP, System Design" },
  { id: "Web Development", icon: "🌐", desc: "HTML, CSS, JS, React, APIs" },
  { id: "Data Science", icon: "📊", desc: "Stats, ML, Python, Data Cleaning" },
  { id: "Artificial Intelligence", icon: "🤖", desc: "ML/DL, Neural Networks, NLP" },
  { id: "HR / Behavioral", icon: "🤝", desc: "STAR Method, Leadership, Teamwork" },
];

export default function DomainSelector({ onStart }) {
  const [name, setName] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!selectedDomain) {
      setError("Please select a domain");
      return;
    }
    setError("");
    onStart(name.trim(), selectedDomain);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-3">
            ARIA
          </h1>
          <p className="text-gray-400 text-lg">AI Recruitment Interview Assistant</p>
        </div>

        {/* Name Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
        </div>

        {/* Domain Grid */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Select Interview Domain
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d.id)}
                className={`p-5 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] ${
                  selectedDomain === d.id
                    ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
              >
                <div className="text-3xl mb-2">{d.icon}</div>
                <div className="font-semibold text-white text-sm">{d.id}</div>
                <div className="text-gray-400 text-xs mt-1">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {/* Start Button */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !selectedDomain}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl text-lg transition-all duration-200 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-purple-600 disabled:hover:to-blue-600"
        >
          Start Interview
        </button>
      </div>
    </div>
  );
}
