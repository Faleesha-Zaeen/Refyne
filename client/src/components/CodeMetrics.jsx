import React from 'react';

const CodeMetrics = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Code Metrics</h1>
          <p>Detailed code quality metrics and analysis</p>
        </div>
        <div className="placeholder-card">
          <div className="placeholder-icon"></div>
          <h3>No Project Analyzed</h3>
          <p>Upload a project to view comprehensive code metrics</p>
        </div>
      </div>
    );
  }

  const { stats } = analysis;

  const metrics = [
    { name: 'Lines of Code', value: stats.totalLines, ideal: '10k-50k', status: 'good' },
    { name: 'Functions per File', value: stats.averageFunctionsPerFile, ideal: '3-8', status: 'warning' },
    { name: 'File Size (avg)', value: '45 lines', ideal: '< 200', status: 'good' },
    { name: 'Cyclomatic Complexity', value: '2.1', ideal: '< 10', status: 'good' },
    { name: 'Code Duplication', value: '2.3%', ideal: '< 5%', status: 'good' },
    { name: 'Comment Density', value: '15%', ideal: '10-20%', status: 'good' }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Code Metrics</h1>
        <p>Comprehensive analysis of code quality and maintainability</p>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-header">
              <h3>{metric.name}</h3>
              <span className={`metric-status ${metric.status}`}>
                {metric.status === 'good' ? '✓' : metric.status === 'warning' ? '⚠' : '✗'}
              </span>
            </div>
            <div className="metric-value-large">{metric.value}</div>
            <div className="metric-ideal">Ideal: {metric.ideal}</div>
            <div className="metric-bar">
              <div className={`metric-fill ${metric.status}`} style={{width: '75%'}}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Complexity Distribution</h3>
          <div className="chart-placeholder">
            <div className="visual-icon"></div>
            <span>Complexity trends across files</span>
          </div>
        </div>
        <div className="chart-card">
          <h3>Code Quality Evolution</h3>
          <div className="chart-placeholder">
            <div className="visual-icon"></div>
            <span>Quality metrics over time</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeMetrics;