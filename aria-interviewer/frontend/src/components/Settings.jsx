import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../api/authApi";

// Toast notification component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center space-x-2">
        <span>{type === 'success' ? '✓' : '✗'}</span>
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">×</button>
      </div>
    </div>
  );
}

// Confirmation modal component
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Domain options
const DOMAIN_OPTIONS = [
  { value: "software-engineering", label: "Software Engineering" },
  { value: "web-development", label: "Web Development" },
  { value: "data-science", label: "Data Science" },
  { value: "ai-ml", label: "AI/ML" },
  { value: "hr-behavioral", label: "HR/Behavioral" }
];

// Load preferences from localStorage
const loadPreferences = () => {
  try {
    const saved = localStorage.getItem("aria_prefs");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Save preferences to localStorage
const savePreferences = (prefs) => {
  localStorage.setItem("aria_prefs", JSON.stringify(prefs));
};

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // State for form data
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Preferences state
  const [preferences, setPreferences] = useState(() => {
    const defaultPrefs = {
      defaultDomain: "software-engineering",
      voiceMode: true,
      cameraMode: false,
      autoSaveSessions: true,
      emailAfterInterview: true,
      weeklyProgressReport: true
    };
    return { ...defaultPrefs, ...loadPreferences() };
  });

  // UI state
  const [toast, setToast] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState({});

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Update display name
  const handleUpdateDisplayName = async () => {
    setLoading(prev => ({ ...prev, displayName: true }));
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName }
      });

      if (error) throw error;
      showToast("Display name updated successfully");
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, displayName: false }));
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast("New passwords don't match", 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", 'error');
      return;
    }

    setLoading(prev => ({ ...prev, password: true }));
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully");
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setLoading(prev => ({ ...prev, delete: true }));
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
      showToast("Account deleted successfully");
      // User will be automatically signed out
    } catch (error) {
      showToast("Failed to delete account: " + error.message, 'error');
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
      setIsDeleteModalOpen(false);
    }
  };

  // Update preferences
  const updatePreference = (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
    showToast("Preference updated");
  };

  // Handle theme change
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* ACCOUNT Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Account</h2>

          {/* Display Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Name
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your display name"
              />
              <button
                onClick={handleUpdateDisplayName}
                disabled={loading.displayName || displayName === user?.user_metadata?.full_name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.displayName ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
            />
          </div>

          {/* Change Password */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Change Password</h3>
            <div className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleChangePassword}
                disabled={loading.password || !newPassword || !confirmPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.password ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* INTERVIEW PREFERENCES Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Interview Preferences</h2>

          {/* Default Domain */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Domain
            </label>
            <select
              value={preferences.defaultDomain}
              onChange={(e) => updatePreference('defaultDomain', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {DOMAIN_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Voice Mode</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enable text-to-speech for AI responses</p>
              </div>
              <button
                onClick={() => updatePreference('voiceMode', !preferences.voiceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  preferences.voiceMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  preferences.voiceMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Camera Mode</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enable camera during interviews</p>
              </div>
              <button
                onClick={() => updatePreference('cameraMode', !preferences.cameraMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  preferences.cameraMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  preferences.cameraMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Auto-save Sessions</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Automatically save interview sessions</p>
              </div>
              <button
                onClick={() => updatePreference('autoSaveSessions', !preferences.autoSaveSessions)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  preferences.autoSaveSessions ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  preferences.autoSaveSessions ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Notifications</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Email After Each Interview</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive performance summary via email</p>
              </div>
              <button
                onClick={() => updatePreference('emailAfterInterview', !preferences.emailAfterInterview)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  preferences.emailAfterInterview ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  preferences.emailAfterInterview ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Weekly Progress Report</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get weekly insights on your improvement</p>
              </div>
              <button
                onClick={() => updatePreference('weeklyProgressReport', !preferences.weeklyProgressReport)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  preferences.weeklyProgressReport ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  preferences.weeklyProgressReport ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* APPEARANCE Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Appearance</h2>

          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Theme</h4>
            <div className="space-y-2">
              {[
                { value: 'system', label: 'System', description: 'Use system preference' },
                { value: 'light', label: 'Light', description: 'Light mode' },
                { value: 'dark', label: 'Dark', description: 'Dark mode' }
              ].map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value={option.value}
                    checked={theme === option.value || (option.value === 'system' && !['light', 'dark'].includes(theme))}
                    onChange={() => handleThemeChange(option.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data."
        confirmText="Delete Account"
        isDanger={true}
      />
    </div>
  );
}