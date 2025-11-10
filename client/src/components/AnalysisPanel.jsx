import React from "react";

const StatCard = ({ label, value, helper }) => (
  <div className="stat-card">
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value}</span>
    {helper && <span className="stat-helper">{helper}</span>}
  </div>
);

const AnalysisPanel = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="placeholder-card">
        <div className="placeholder-icon">📊</div>
        <h3>Ready for Analysis</h3>
        <p>Upload a project to unlock architecture metrics, structure visuals, and guided recommendations.</p>
      </div>
    );
  }

  const { stats, summary, recommendations } = analysis;

  const metrics = [
    { label: "Files analyzed", value: stats.fileCount ?? "—", helper: "Source files included" },
    { label: "Total lines", value: stats.totalLines ?? "—", helper: "Across all parsed files" },
    { label: "Architecture score", value: stats.architectureScore ?? "—", helper: "0–100 health rating" },
    { label: "Modularity score", value: stats.modularityScore ?? "—", helper: "Higher = more cohesive modules" },
    { label: "Functions per file", value: stats.averageFunctionsPerFile ?? "—", helper: "Average density" },
    { label: "Dependency count", value: stats.dependencyCount ?? "—", helper: "Unique imports + includes" }
  ];

  return (
    <div className="analysis-container">
      <div className="panel-box snapshot-panel">
        <h2 className="panel-title">Architecture Snapshot</h2>
        <p className="panel-desc">{summary.headline}</p>

        <div className="highlight-list">
          {summary.highlights.map((item) => (
            <div key={item} className="highlight-item">
              <span className="highlight-dot" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="visual-grid">
        <div className="visual-placeholder">
          <div className="visual-icon">🔍</div>
          <span>Structure visualization coming soon</span>
        </div>
        <div className="visual-placeholder">
          <div className="visual-icon">📈</div>
          <span>Metric trends coming soon</span>
        </div>
      </div>

      <div className="panel-box recommendations-panel">
        <h3 className="panel-title">Next Recommendations</h3>
        <ul className="recommendation-list">
          {recommendations.map((item) => (
            <li key={item} className="recommendation-item">
              <span className="highlight-dot" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalysisPanel;