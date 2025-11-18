import React from 'react';

const ArchitecturePage = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Architecture Analysis</h1>
          <p>Deep architectural insights and structural patterns</p>
        </div>
        <div className="placeholder-card">
          <div className="placeholder-icon"></div>
          <h3>No Project Analyzed</h3>
          <p>Upload a project to view architectural insights</p>
        </div>
      </div>
    );
  }

  const { stats } = analysis;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Architecture Analysis</h1>
        <p>Deep architectural insights and structural patterns</p>
      </div>

      <div className="architecture-dashboard">
        <div className="architecture-main">
          <div className="architecture-card main-card">
            <h2>Architecture Health Score</h2>
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
                  <span className="breakdown-label">Dependency Health</span>
                  <div className="breakdown-bar">
                    <div 
                      className="breakdown-fill" 
                      style={{width: `${85}%`}}
                    ></div>
                  </div>
                  <span className="breakdown-value">85%</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Code Organization</span>
                  <div className="breakdown-bar">
                    <div 
                      className="breakdown-fill" 
                      style={{width: `${78}%`}}
                    ></div>
                  </div>
                  <span className="breakdown-value">78%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="architecture-visualization">
            <h3>Architecture Visualization</h3>
            <div className="visualization-container">
              <div className="architecture-graph">
                <div className="graph-node main">Core</div>
                <div className="graph-node layer-1">API Layer</div>
                <div className="graph-node layer-1">Service Layer</div>
                <div className="graph-node layer-1">Data Layer</div>
                <div className="graph-node layer-2">Auth Service</div>
                <div className="graph-node layer-2">User Service</div>
                <div className="graph-node layer-2">Database</div>
              </div>
            </div>
          </div>
        </div>

        <div className="architecture-sidebar">
          <div className="architecture-card">
            <h3>Architectural Patterns</h3>
            <div className="pattern-list">
              <div className="pattern-item">
                <span className="pattern-icon">🏛️</span>
                <div className="pattern-info">
                  <span className="pattern-name">Layered Architecture</span>
                  <span className="pattern-status detected">Detected</span>
                </div>
              </div>
              <div className="pattern-item">
                <span className="pattern-icon">🔀</span>
                <div className="pattern-info">
                  <span className="pattern-name">Microservices</span>
                  <span className="pattern-status partial">Partial</span>
                </div>
              </div>
              <div className="pattern-item">
                <span className="pattern-icon">⚡</span>
                <div className="pattern-info">
                  <span className="pattern-name">Event-Driven</span>
                  <span className="pattern-status missing">Not Detected</span>
                </div>
              </div>
            </div>
          </div>

          <div className="architecture-card">
            <h3>Key Metrics</h3>
            <div className="metrics-grid-small">
              <div className="metric-small">
                <span className="metric-label">Files</span>
                <span className="metric-value">{stats.fileCount}</span>
              </div>
              <div className="metric-small">
                <span className="metric-label">Dependencies</span>
                <span className="metric-value">{stats.dependencyCount}</span>
              </div>
              <div className="metric-small">
                <span className="metric-label">Avg Complexity</span>
                <span className="metric-value">2.1</span>
              </div>
              <div className="metric-small">
                <span className="metric-label">Code Duplication</span>
                <span className="metric-value">2.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitecturePage;