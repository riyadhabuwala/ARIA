import { useState } from "react";

const DOMAINS = [
  {
    id: "software-engineering",
    name: "Software Engineering",
    description: "Algorithms, data structures, system design",
    icon: "⚙️",
    duration: "20 min",
    difficulty: "Advanced",
    color: "blue"
  },
  {
    id: "web-development",
    name: "Web Development",
    description: "Frontend, backend, APIs, frameworks",
    icon: "🌐",
    duration: "15 min",
    difficulty: "Intermediate",
    color: "green"
  },
  {
    id: "data-science",
    name: "Data Science",
    description: "Statistics, ML, data analysis",
    icon: "📊",
    duration: "20 min",
    difficulty: "Intermediate",
    color: "purple"
  },
  {
    id: "ai-ml",
    name: "AI / ML",
    description: "Neural networks, model design, ethics",
    icon: "🤖",
    duration: "20 min",
    difficulty: "Advanced",
    color: "red"
  },
  {
    id: "hr-behavioral",
    name: "HR / Behavioural",
    description: "Soft skills, leadership, communication",
    icon: "🤝",
    duration: "15 min",
    difficulty: "Beginner",
    color: "orange"
  }
];

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case "Beginner": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    case "Intermediate": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "Advanced": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
  }
};

const getCardColors = (color, selected) => {
  const baseColors = {
    blue: selected
      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-blue-200/50 dark:shadow-blue-900/50"
      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600",
    green: selected
      ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-green-200/50 dark:shadow-green-900/50"
      : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600",
    purple: selected
      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-purple-200/50 dark:shadow-purple-900/50"
      : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600",
    red: selected
      ? "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-red-200/50 dark:shadow-red-900/50"
      : "border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600",
    orange: selected
      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-orange-200/50 dark:shadow-orange-900/50"
      : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600"
  };
  return baseColors[color] || baseColors.blue;
};

export default function DomainSelector({ onStart }) {
  const [selectedDomain, setSelectedDomain] = useState(null);

  const handleDomainSelect = (domain) => {
    setSelectedDomain(domain);
  };

  const handleContinue = () => {
    if (selectedDomain && onStart) {
      // Pass both name and domain for compatibility with existing interface
      onStart("User", selectedDomain.name);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Interview Domain
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select the area you'd like to practice. Each domain is tailored to test specific skills
            and knowledge relevant to your career path.
          </p>
        </div>

        {/* Domain Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {DOMAINS.map((domain) => {
            const isSelected = selectedDomain?.id === domain.id;

            return (
              <div
                key={domain.id}
                onClick={() => handleDomainSelect(domain)}
                className={`
                  relative cursor-pointer rounded-xl border-2 p-6
                  bg-white dark:bg-gray-800 shadow-lg
                  transition-all duration-300 ease-in-out
                  hover:scale-105 hover:shadow-xl
                  ${getCardColors(domain.color, isSelected)}
                  ${isSelected ? 'scale-105 shadow-xl' : ''}
                `}
              >
                {/* Selection Checkmark */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Domain Icon */}
                <div className="text-4xl mb-4">{domain.icon}</div>

                {/* Domain Name */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {domain.name}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
                  {domain.description}
                </p>

                {/* Duration and Difficulty */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {domain.duration}
                  </div>

                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(domain.difficulty)}`}>
                    {domain.difficulty}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        {selectedDomain && (
          <div className="text-center animate-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={handleContinue}
              className="
                inline-flex items-center px-8 py-4
                bg-blue-600 hover:bg-blue-700
                text-white font-semibold rounded-xl
                transition-all duration-200
                hover:scale-105 hover:shadow-lg
                focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800
              "
            >
              Continue with {selectedDomain.name}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Estimated duration: {selectedDomain.duration} • {selectedDomain.difficulty} level
            </p>
          </div>
        )}

        {/* Helper Text */}
        {!selectedDomain && (
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Select a domain above to continue with your interview preparation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}