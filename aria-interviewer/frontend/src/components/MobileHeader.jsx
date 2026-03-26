import { useAuth } from "../context/AuthContext";

export default function MobileHeader({ onMenuToggle }) {
  const { user } = useAuth();

  return (
    <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      {/* Left: Hamburger Menu */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-gray-600 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Center: ARIA Logo */}
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          ARIA
        </h1>
      </div>

      {/* Right: User Avatar */}
      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <span className="text-white text-sm font-semibold">
          {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
           user?.email?.charAt(0)?.toUpperCase() || "U"}
        </span>
      </div>
    </div>
  );
}