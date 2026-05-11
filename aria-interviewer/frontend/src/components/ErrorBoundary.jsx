import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Could be wired to an error-reporting service in production
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "var(--bg-base, #000)",
            color: "var(--text-primary, #fff)",
            fontFamily: "'Inter', sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.25)",
              marginBottom: "24px",
            }}
          >
            ⚠️
          </div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-muted, rgba(255,255,255,0.45))",
              maxWidth: "400px",
              lineHeight: 1.6,
              marginBottom: "24px",
            }}
          >
            ARIA encountered an unexpected error. Refreshing the page usually
            fixes this.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 28px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 700,
              color: "#fff",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(37,99,235,0.25)",
            }}
          >
            Reload ARIA
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
