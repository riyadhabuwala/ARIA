import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../api/authApi";

// Toast notification component - Glassmorphism refactor
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-8 right-8 px-6 py-4 rounded-2xl shadow-2xl z-[200] border backdrop-blur-xl animate-fadeIn
      ${type === 'success' 
        ? 'bg-[var(--success-subtle)] border-[var(--success)]/30 text-[var(--success)]' 
        : 'bg-[var(--danger-subtle)] border-[var(--danger)]/30 text-[var(--danger)]'
      }`}>
      <div className="flex items-center gap-3">
        <span className="text-lg font-black">{type === 'success' ? '✓' : '⚠'}</span>
        <span className="text-xs font-black uppercase tracking-widest leading-none">{message}</span>
        <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">×</button>
      </div>
    </div>
  );
}

// Confirmation modal component - Premium refactor
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "CONFIRM", isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[150] p-6 animate-fadeIn">
      <div className="card-premium max-w-md w-full bg-[var(--bg-surface)] p-8 space-y-8 border-[var(--border-strong)]">
        <div className="space-y-2">
          <h3 className="text-xl font-black text-[var(--text-primary)] font-geist italic uppercase tracking-widest">{title}</h3>
          <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[var(--bg-elevated)] text-[var(--text-muted)] font-black text-[10px] rounded-xl uppercase tracking-widest hover:text-white transition-colors border border-[var(--border-subtle)]"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg
              ${isDanger
                ? 'bg-[var(--danger)] text-white hover:bg-red-700'
                : 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]'
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const DOMAIN_OPTIONS = [
  { value: "software-engineering", label: "Software Engineering" },
  { value: "web-development", label: "Web Development" },
  { value: "data-science", label: "Data Science" },
  { value: "ai-ml", label: "AI/ML" },
  { value: "hr-behavioral", label: "HR/Behavioral" }
];

const loadPreferences = () => {
  try {
    const saved = localStorage.getItem("aria_prefs");
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
};

const savePreferences = (prefs) => localStorage.setItem("aria_prefs", JSON.stringify(prefs));

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const [toast, setToast] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState({});
  const [modelInfo, setModelInfo] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/model-info`);
        if (response.ok) {
          const data = await response.json();
          setModelInfo(data);
        }
      } catch (error) {
        console.error("Failed to fetch model info:", error);
      }
    };
    fetchModelInfo();
  }, []);

  const handleUpdateDisplayName = async () => {
    setLoading(prev => ({ ...prev, displayName: true }));
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
      if (error) throw error;
      showToast("Identity parameters synchronized");
    } catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(prev => ({ ...prev, displayName: false })); }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { showToast("Security tokens mismatch", 'error'); return; }
    if (newPassword.length < 6) { showToast("Signal strength too low", 'error'); return; }
    setLoading(prev => ({ ...prev, password: true }));
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showToast("Access key updated");
    } catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(prev => ({ ...prev, password: false })); }
  };

  const handleDeleteAccount = async () => {
    setLoading(prev => ({ ...prev, delete: true }));
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
      showToast("Identity terminated");
    } catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(prev => ({ ...prev, delete: false })); setIsDeleteModalOpen(false); }
  };

  const updatePreference = (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
    showToast("Logic core updated");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10 min-h-screen">
      {/* Header */}
      <section>
        <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] font-geist mb-2 italic uppercase">
          SYSTEM SETTINGS
        </h1>
        <p className="text-[var(--text-secondary)] font-medium">
          Configure operational parameters and security protocols.
        </p>
      </section>

      <div className="space-y-8">
        {/* IDENTITY & SECURITY Section */}
        <section className="card-premium p-8 space-y-10">
          <div className="border-l-4 border-l-[var(--accent-primary)] pl-4">
            <h2 className="text-sm font-black text-[var(--text-primary)] font-geist uppercase tracking-widest italic">IDENTITY & SECURITY</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Display Name */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">DISPLAY NAME</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-sm focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all"
                  placeholder="ID ENTITY"
                />
                <button
                  onClick={handleUpdateDisplayName}
                  disabled={loading.displayName || displayName === user?.user_metadata?.full_name}
                  className="px-6 py-3 bg-[var(--accent-primary)] text-white font-black text-[10px] rounded-xl uppercase tracking-widest hover:bg-[var(--accent-hover)] disabled:opacity-30 transition-all shadow-lg"
                >
                  {loading.displayName ? "SYNC" : "SAVE"}
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">REGISTERED SIGNAL</label>
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] font-bold text-sm cursor-not-allowed opacity-60"
              />
            </div>
          </div>

          {/* Password Reset */}
          <div className="space-y-6 pt-6 border-t border-[var(--border-subtle)]">
             <h3 className="text-xs font-black text-[var(--text-primary)] font-geist uppercase tracking-widest italic">ACCESS KEY RECOVERY</h3>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="CURRENT KEY"
                  className="px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-sm focus:ring-1 focus:ring-[var(--accent-primary)] outline-none"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="NEW KEY"
                  className="px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-sm focus:ring-1 focus:ring-[var(--accent-primary)] outline-none"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="VALIDATE KEY"
                  className="px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-sm focus:ring-1 focus:ring-[var(--accent-primary)] outline-none"
                />
             </div>
             <button
                onClick={handleChangePassword}
                disabled={loading.password || !newPassword || !confirmPassword}
                className="px-8 py-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-black text-[10px] rounded-xl uppercase tracking-widest hover:bg-[var(--bg-hover)] transition-all"
              >
                {loading.password ? "RE-ROUTING..." : "RE-ENCRYPT ACCESS"}
              </button>
          </div>
        </section>

        {/* OPERATION PREFERENCES Section */}
        <section className="card-premium p-8 space-y-10">
          <div className="border-l-4 border-l-[var(--warning)] pl-4">
            <h2 className="text-sm font-black text-[var(--text-primary)] font-geist uppercase tracking-widest italic">OPERATIONAL PREFERENCES</h2>
          </div>

          <div className="space-y-8">
            {/* Domain */}
            <div className="space-y-4 max-w-md">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">DEFAULT EXPERTISE SECTOR</label>
              <select
                value={preferences.defaultDomain}
                onChange={(e) => updatePreference('defaultDomain', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold text-sm focus:ring-2 focus:ring-[var(--accent-primary)] outline-none transition-all appearance-none cursor-pointer"
              >
                {DOMAIN_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* AI Model Info */}
            {modelInfo && (
              <div className="space-y-4 max-w-md">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">CURRENT AI MODEL</label>
                <div className="px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">MODEL:</span>
                      <span className="text-sm font-bold text-[var(--text-primary)]">{modelInfo.model}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">PROVIDER:</span>
                      <span className="text-sm font-bold text-[var(--text-primary)]">{modelInfo.provider}</span>
                    </div>
                    <div className="pt-2 border-t border-[var(--border-subtle)]">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{modelInfo.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {[
                { key: 'voiceMode', label: 'NEURAL AUDIO SYNC', desc: 'Synthesize AI vocal feedback' },
                { key: 'cameraMode', label: 'VISUAL DATA FEED', desc: 'Analyze facial kinetics' },
                { key: 'autoSaveSessions', label: 'ARCHIVE AUTOMATION', desc: 'Persistent session logging' },
                { key: 'emailAfterInterview', label: 'SUMMARY RELAY', desc: 'Sync report to external signal' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between group">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider group-hover:text-[var(--accent-primary)] transition-colors">{item.label}</h4>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => updatePreference(item.key, !preferences[item.key])}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 shadow-inner
                      ${preferences[item.key] ? 'bg-[var(--accent-primary)] shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]'}
                    `}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300
                      ${preferences[item.key] ? 'translate-x-7' : 'translate-x-1'}
                    `} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* APPEARANCE & TERMINATION Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card-premium p-8 md:col-span-2 space-y-8">
            <h3 className="text-xs font-black text-[var(--text-primary)] font-geist uppercase tracking-widest italic border-l-4 border-l-[var(--success)] pl-4">VISUAL INTERFACE</h3>
             <div className="flex gap-4">
                {['DARK', 'LIGHT', 'SYSTEM'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode.toLowerCase())}
                    className={`flex-1 py-4 px-2 rounded-2xl border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all
                      ${theme === mode.toLowerCase() 
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)] text-[var(--accent-primary)] shadow-lg' 
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--border-default)]'
                      }
                    `}
                  >
                    {mode}
                  </button>
                ))}
             </div>
          </div>

          <div className="card-premium p-8 flex flex-col justify-between border-[var(--danger)]/20 bg-[var(--danger-subtle)]/5 group">
             <div className="space-y-4">
                <h3 className="text-xs font-black text-[var(--danger)] font-geist uppercase tracking-widest italic border-l-4 border-l-[var(--danger)] pl-4">TERMINATION</h3>
                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase leading-relaxed tracking-wider">Permanent identity deletion. Archive data will be purged.</p>
             </div>
             <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full py-4 bg-[var(--danger)] text-white font-black text-[10px] rounded-2xl uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-[0_5px_20px_rgba(220,38,38,0.2)] mt-6"
              >
                TERMINATE ACCOUNT
              </button>
          </div>
        </section>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="IDENTITY TERMINATION"
        message="This action will permanently purge all operational sessions and baseline metrics. This signal cannot be restored."
        confirmText="INITIATE PURGE"
        isDanger={true}
      />
    </div>
  );
}