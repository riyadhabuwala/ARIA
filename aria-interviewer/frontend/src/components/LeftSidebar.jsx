import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Navigation menu structure
const navigationSections = [
  {
    title: "MAIN",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: "📊" },
      { name: "Start Interview", path: "/interview", icon: "🎯", badge: "New" },
      { name: "Analytics", path: "/analytics", icon: "📈" },
      { name: "History", path: "/history", icon: "📋" }
    ]
  },
  {
    title: "CAREER",
    items: [
      { name: "Resume", path: "/resume", icon: "📄" },
      { name: "Job Matches", path: "/job-match", icon: "💼" },
      { name: "AI Coach", path: "/coach", icon: "🤖" }
    ]
  },
  {
    title: "ACCOUNT",
    items: [
      { name: "Profile", path: "/profile", icon: "👤" },
      { name: "Settings", path: "/settings", icon: "⚙️" }
    ]
  }
];

export default function LeftSidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Get user initials from name or email
  const getUserInitials = (user) => {
    const name = user?.user_metadata?.full_name || user?.email || "";
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get display name
  const getDisplayName = (user) => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  };

  // Check if route is active
  const isActiveRoute = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-[220px] bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        flex flex-col
      `}>

        {/* Logo Section */}
        <div className="flex items-center px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              ARIA
            </h1>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-4">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? "mt-6" : ""}>
              {/* Section Title */}
              <div className="px-6 pb-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>

              {/* Section Items */}
              <nav className="space-y-1 px-3">
                {section.items.map((item) => {
                  const isActive = isActiveRoute(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        // Close mobile sidebar on navigation
                        if (window.innerWidth < 1024) {
                          onToggle();
                        }
                      }}
                      className={`
                        group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
                        transition-all duration-200 ease-in-out
                        ${isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }
                      `}
                    >
                      {/* Icon */}
                      <span className="mr-3 text-lg flex-shrink-0">
                        {item.icon}
                      </span>

                      {/* Label */}
                      <span className="flex-1">{item.name}</span>

                      {/* Badge */}
                      {item.badge && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div
            className="relative"
            onMouseEnter={() => setShowUserDropdown(true)}
            onMouseLeave={() => setShowUserDropdown(false)}
          >
            <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
              {/* Avatar */}
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">
                  {getUserInitials(user)}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {getDisplayName(user)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Free Plan
                </p>
              </div>

              {/* Chevron */}
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User Dropdown */}
            {showUserDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  View Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Settings
                </Link>
                <hr className="my-1 border-gray-200 dark:border-gray-600" />
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}