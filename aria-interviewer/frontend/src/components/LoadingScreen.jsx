import { useState, useEffect } from "react";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-6"
         style={{ background: "var(--bg-base)" }}>
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center
                        font-bold text-white text-xl heading-font"
             style={{
               background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
               boxShadow: "var(--shadow-accent)",
             }}>
          AI
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-2xl animate-ping opacity-20"
             style={{ background: "var(--accent-primary)" }} />
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold heading-font mb-1"
             style={{ color: "var(--text-primary)" }}>
          ARIA
        </div>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading your workspace...
        </div>
      </div>
      <div className="w-32 h-0.5 rounded-full overflow-hidden"
           style={{ background: "var(--bg-elevated)" }}>
        <div className="h-full w-1/2 rounded-full animate-pulse"
             style={{ background: "var(--accent-primary)" }} />
      </div>
    </div>
  );
}
