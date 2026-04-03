import { useState } from "react";

const DOMAINS = [
  {
    id: "software-engineering",
    name: "Software Engineering",
    description: "Algorithms, system design, and large-scale architecture.",
    icon: "⚙️",
    duration: "20m",
    difficulty: "Advanced",
    color: "#2563eb"
  },
  {
    id: "web-development",
    name: "Web Development",
    description: "Modern frameworks, API design, and performance.",
    icon: "🌐",
    duration: "15m",
    difficulty: "Intermediate",
    color: "#1d4ed8"
  },
  {
    id: "data-science",
    name: "Data Science",
    description: "ML models, statistical analysis, and pipeline design.",
    icon: "📊",
    duration: "20m",
    difficulty: "Advanced",
    color: "#3b82f6"
  },
  {
    id: "ai-ml",
    name: "AI / ML",
    description: "Neural networks, prompt engineering, and LLM fine-tuning.",
    icon: "🤖",
    duration: "20m",
    difficulty: "Advanced",
    color: "#2563eb"
  },
  {
    id: "hr-behavioral",
    name: "HR / Behavioural",
    description: "Leadership, communication strategies, and soft skills.",
    icon: "🤝",
    duration: "15m",
    difficulty: "Beginner",
    color: "#60a5fa"
  }
];

export default function DomainSelector({ onStart }) {
  const [selectedDomain, setSelectedDomain] = useState(null);

  const handleContinue = () => {
    if (selectedDomain && onStart) {
      onStart("User", selectedDomain.name);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-500 overflow-hidden relative">
      {/* Background Decorative Flare */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--accent-primary)]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-8 py-20 relative z-10">
        {/* Header Section */}
        <div className="mb-16 space-y-4">
          <h1 className="text-5xl md:text-7xl font-black font-geist tracking-tighter italic uppercase leading-none">
            SELECT <span className="text-[var(--accent-primary)] not-italic">DOMAIN</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl font-medium leading-relaxed">
            Choose your specialization portal. Our AI agent will tailor the experience to simulate real-world technical deep-dives and behavioral pressure.
          </p>
        </div>

        {/* Domain Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {DOMAINS.map((domain) => {
            const isSelected = selectedDomain?.id === domain.id;

            return (
              <div
                key={domain.id}
                onClick={() => setSelectedDomain(domain)}
                className={`
                  card-premium relative cursor-pointer p-8 flex flex-col justify-between group overflow-hidden
                  ${isSelected ? 'border-[var(--accent-primary)] shadow-[0_0_30px_rgba(37,99,235,0.15)] bg-[var(--accent-subtle)]' : ''}
                `}
              >
                {/* Active Glow */}
                {isSelected && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent-primary)]/20 to-transparent blur-2xl -z-10" />
                )}

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-4xl group-hover:scale-110 transition-transform duration-500">
                      {domain.icon}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[var(--border-subtle)]
                      ${domain.difficulty === 'Advanced' ? 'text-red-500' : domain.difficulty === 'Intermediate' ? 'text-blue-500' : 'text-green-500'}
                    `}>
                      {domain.difficulty}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-black font-geist uppercase tracking-tight italic group-hover:text-[var(--accent-primary)] transition-colors">
                      {domain.name}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                      {domain.description}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-[var(--border-subtle)] pt-6">
                  <div className="flex items-center gap-2 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                    <span className="text-lg opacity-50">⏱</span>
                    <span className="text-xs font-bold uppercase tracking-widest">{domain.duration} Session</span>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center animate-fadeIn">
                       <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer/Action Section */}
        <div className="flex flex-col items-center space-y-6">
          <button
            onClick={handleContinue}
            disabled={!selectedDomain}
            className={`
              btn-primary px-16 py-5 text-sm tracking-[0.25em] uppercase font-black transition-all
              ${!selectedDomain ? 'opacity-20 grayscale cursor-not-allowed pointer-events-none' : 'animate-fadeUp'}
            `}
          >
            {selectedDomain ? `LAUNCH ${selectedDomain.name}` : 'SELECT A DOMAIN TO INITIALIZE'}
          </button>
          
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] animate-pulse">
            System Ready for Neural Interface Initialization
          </p>
        </div>
      </div>
    </div>
  );
}