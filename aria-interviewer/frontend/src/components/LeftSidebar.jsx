import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const navigationSections = [
  {
    title: "DASHBOARD",
    items: [
      { name: "Overview", path: "/dashboard", icon: "🏠" },
      { name: "Interview History", path: "/history", icon: "📋" },
      { name: "Performance", path: "/analytics", icon: "📈" }
    ]
  },
  {
    title: "PREPARATION",
    items: [
      { name: "Resume Manager", path: "/resume", icon: "📄" },
      { name: "Job Matches", path: "/jobs", icon: "🎯", badge: "NEW" },
      { name: "Career Coach", path: "/coach", icon: "🤖" },
      { name: "Practice Drills", path: "/practice", icon: "⚡" }
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

  const getUserInitials = (user) => {
    const name = user?.user_metadata?.full_name || user?.email || "";
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = (user) => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  };

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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar container */}
      <div className={`
        fixed left-0 top-0 h-full w-[240px] z-50
        bg-[var(--bg-base)] border-r border-[var(--border-subtle)]
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        flex flex-col
      `}>

        {/* Logo Section */}
        <div className="flex items-center justify-between px-7 py-8 border-b border-[var(--border-subtle)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h1 className="text-2xl font-black italic tracking-tighter text-[var(--text-primary)] font-geist uppercase">
              ARIA
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-9">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.title}>
              {/* Section Title */}
              <div className="px-3 pb-4">
                <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.25em] font-geist">
                  {section.title}
                </h3>
              </div>

              {/* Section Items */}
              <nav className="space-y-1.5">
                {section.items.map((item) => {
                  const isActive = isActiveRoute(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) {
                          onToggle();
                        }
                      }}
                      className={`
                        group flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl
                        transition-all duration-200 relative overflow-hidden
                        ${isActive
                          ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] shadow-[0_0_15px_rgba(37,99,235,0.1)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                        }
                      `}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-[var(--accent-primary)] rounded-full" />
                      )}

                      {/* Icon */}
                      <span className={`mr-3 text-xl transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : 'opacity-70'}`}>
                        {item.icon}
                      </span>

                      {/* Label */}
                      <span className="flex-1 tracking-tight">{item.name}</span>

                      {/* Badge */}
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--accent-primary)] text-white uppercase tracking-widest">
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
        <div className="border-t border-[var(--border-subtle)] p-6">
          <div
            className="relative"
            onMouseEnter={() => setShowUserDropdown(true)}
            onMouseLeave={() => setShowUserDropdown(false)}
          >
            <button className="w-full flex items-center space-x-3 px-3 py-3.5 rounded-2xl hover:bg-[var(--bg-hover)] transition-all group">
              {/* Avatar */}
              <div className="w-10 h-10 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg group-hover:border-[var(--accent-primary)] transition-all">
                <span className="text-[var(--text-primary)] text-xs font-bold font-geist">
                  {getUserInitials(user)}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate tracking-tight">
                  {getDisplayName(user)}
                </p>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  Personal Account
                </p>
              </div>

              {/* Chevron */}
              <svg
                className={`w-4 h-4 text-[var(--text-muted)] transition-all duration-300 ${showUserDropdown ? 'rotate-180 text-[var(--text-primary)]' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User Dropdown */}
            {showUserDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-4 bg-[var(--bg-overlay)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] py-2.5 backdrop-blur-xl transition-all">
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <span className="mr-3 opacity-60">👤</span> View Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <span className="mr-3 opacity-60">⚙️</span> Settings
                </Link>
                <div className="my-2.5 h-[1px] bg-[var(--border-subtle)] mx-4" />
                <button
                  onClick={handleSignOut}
                  className="group w-full flex items-center justify-between px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-[var(--error)] bg-[var(--bg-elevated)] border border-[var(--error)]/30 rounded-xl hover:bg-[var(--error)] hover:text-white transition-all"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-sm opacity-70 group-hover:opacity-100">🚪</span>
                    Sign Out
                  </span>
                  <span className="text-[10px] opacity-60 group-hover:opacity-100">Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
