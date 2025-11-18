import React from 'react';

const ArchitectureDashboard = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Architecture Overview</h1>
          <p>Upload a project to view architectural insights and structure analysis</p>
        </div>
        <div className="placeholder-card">
          <div className="placeholder-icon"></div>
          <h3>No Project Analyzed</h3>
          <p>Upload a project to unlock detailed architecture analysis</p>
        </div>
      </div>
    );
  }

  const { stats, summary, recommendations } = analysis;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Architecture Overview</h1>
        <p>Detailed analysis of your project's architectural patterns and structure</p>
      </div>

      <div className="architecture-grid">
        <div className="architecture-card main-card">
          <h2>Architecture Health</h2>
          <div className="health-score">
            <div className="score-circle">
              <span className="score-value">{stats.architectureScore || 0}</span>
              <span className="score-label">/ 100</span>
            </div>
            <div className="score-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-label">Modularity</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill" 
                    style={{width: `${stats.modularityScore || 0}%`}}
                  ></div>
                </div>
                <span className="breakdown-value">{stats.modularityScore || 0}%</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Complexity</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill complexity" 
                    style={{width: `${100 - (stats.complexityScore || 0)}%`}}
                  ></div>
                </div>
                <span className="breakdown-value">{stats.complexityScore || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="architecture-card">
          <h3>Structural Patterns</h3>
          <div className="pattern-list">
            <div className="pattern-item">
              <span className="pattern-name">Layered Architecture</span>
              <span className="pattern-score high">High</span>
            </div>
            <div className="pattern-item">
              <span className="pattern-name">Modular Design</span>
              <span className="pattern-score medium">Medium</span>
            </div>
            <div className="pattern-item">
              <span className="pattern-name">Separation of Concerns</span>
              <span className="pattern-score high">High</span>
            </div>
          </div>
        </div>

        <div className="architecture-card">
          <h3>Dependency Graph</h3>
          <div className="dependency-visual">
            <div className="visual-placeholder">
              <div className="visual-icon">🕸️</div>
              <span>Dependency visualization</span>
              <p>Module relationships and dependencies</p>
            </div>
          </div>
        </div>

        <div className="architecture-card">
          <h3>Key Metrics</h3>
          <div className="metrics-list">
            <div className="metric-row">
              <span>Files Analyzed</span>
              <span className="metric-value">{stats.fileCount}</span>
            </div>
            <div className="metric-row">
              <span>Total Dependencies</span>
              <span className="metric-value">{stats.dependencyCount}</span>
            </div>
            <div className="metric-row">
              <span>Average Functions/File</span>
              <span className="metric-value">{stats.averageFunctionsPerFile}</span>
            </div>
            <div className="metric-row">
              <span>Code Duplication</span>
              <span className="metric-value low">2.3%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureDashboard;