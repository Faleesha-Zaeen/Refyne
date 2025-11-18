import React from 'react';

const MetricsPage = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Code Metrics</h1>
          <p>Detailed code quality metrics and performance analysis</p>
        </div>
        <div className="placeholder-card">
          <div className="placeholder-icon"></div>
          <h3>No Project Analyzed</h3>
          <p>Upload a project to view comprehensive metrics</p>
        </div>
      </div>
    );
  }

  const { stats } = analysis;

  const metrics = [
    { 
      name: 'Lines of Code', 
      value: stats.totalLines, 
      trend: '+12%', 
      ideal: '10k-50k', 
      status: 'good',
      description: 'Total lines of code across all files'
    },
    { 
      name: 'Functions per File', 
      value: stats.averageFunctionsPerFile, 
      trend: '-5%', 
      ideal: '3-8', 
      status: 'warning',
      description: 'Average number of functions per file'
    },
    { 
      name: 'Cyclomatic Complexity', 
      value: '2.1', 
      trend: '0%', 
      ideal: '< 10', 
      status: 'good',
      description: 'Average code complexity score'
    },
    { 
      name: 'Code Duplication', 
      value: '2.3%', 
      trend: '-15%', 
      ideal: '< 5%', 
      status: 'good',
      description: 'Percentage of duplicated code'
    },
    { 
      name: 'Comment Density', 
      value: '15%', 
      trend: '+8%', 
      ideal: '10-20%', 
      status: 'good',
      description: 'Ratio of comments to code'
    },
    { 
      name: 'Test Coverage', 
      value: '78%', 
      trend: '+5%', 
      ideal: '> 80%', 
      status: 'warning',
      description: 'Percentage of code covered by tests'
    }
  ];

  const trends = [
    { period: 'Jan', complexity: 2.5, coverage: 70, duplication: 4.2 },
    { period: 'Feb', complexity: 2.3, coverage: 72, duplication: 3.8 },
    { period: 'Mar', complexity: 2.2, coverage: 75, duplication: 3.2 },
    { period: 'Apr', complexity: 2.1, coverage: 78, duplication: 2.3 },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Code Metrics</h1>
        <p>Detailed code quality metrics and performance analysis</p>
      </div>

      <div className="metrics-dashboard">
        <div className="metrics-overview">
          <div className="metrics-grid-large">
            {metrics.map((metric, index) => (
              <div key={index} className="metric-card-large">
                <div className="metric-header">
                  <h3>{metric.name}</h3>
                  <span className={`metric-trend ${metric.trend.includes('+') ? 'positive' : 'negative'}`}>
                    {metric.trend}
                  </span>
                </div>
                <div className="metric-value-large">{metric.value}</div>
                <div className="metric-description">{metric.description}</div>
                <div className="metric-footer">
                  <span className="metric-ideal">Ideal: {metric.ideal}</span>
                  <span className={`metric-status ${metric.status}`}>
                    {metric.status === 'good' ? '✓' : '⚠'}
                  </span>
                </div>
                <div className="metric-bar">
                  <div className={`metric-fill ${metric.status}`} style={{width: '75%'}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="metrics-trends">
          <div className="trends-card">
            <h3>Quality Trends</h3>
            <div className="trends-chart">
              <div className="chart-container">
                <div className="chart-grid">
                  <div className="chart-y-axis">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>
                  <div className="chart-bars">
                    {trends.map((trend, index) => (
                      <div key={index} className="chart-bar-group">
                        <div className="chart-bar complexity" style={{height: `${trend.complexity * 10}%`}}></div>
                        <div className="chart-bar coverage" style={{height: `${trend.coverage}%`}}></div>
                        <div className="chart-bar duplication" style={{height: `${trend.duplication * 10}%`}}></div>
                        <span className="chart-label">{trend.period}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-color complexity"></div>
                    <span>Complexity (x10)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color coverage"></div>
                    <span>Test Coverage %</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color duplication"></div>
                    <span>Duplication (x10)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="metrics-comparison">
            <div className="comparison-card">
              <h3>Benchmark Comparison</h3>
              <div className="comparison-list">
                <div className="comparison-item">
                  <span className="comparison-metric">Code Quality</span>
                  <div className="comparison-bar">
                    <div className="comparison-fill current" style={{width: '78%'}}></div>
                    <div className="comparison-fill industry" style={{width: '82%'}}></div>
                  </div>
                  <span className="comparison-value">78% vs 82%</span>
                </div>
                <div className="comparison-item">
                  <span className="comparison-metric">Maintainability</span>
                  <div className="comparison-bar">
                    <div className="comparison-fill current" style={{width: '85%'}}></div>
                    <div className="comparison-fill industry" style={{width: '88%'}}></div>
                  </div>
                  <span className="comparison-value">85% vs 88%</span>
                </div>
                <div className="comparison-item">
                  <span className="comparison-metric">Security</span>
                  <div className="comparison-bar">
                    <div className="comparison-fill current" style={{width: '92%'}}></div>
                    <div className="comparison-fill industry" style={{width: '90%'}}></div>
                  </div>
                  <span className="comparison-value">92% vs 90%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPage;