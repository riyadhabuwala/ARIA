export default function JobMatches() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold heading-font mb-6" style={{ color: "var(--text-primary)" }}>
          Job Matches
        </h1>

        <div className="rounded-lg shadow-sm border p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              Personalized Job Matches
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Find jobs tailored to your skills and interview performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}