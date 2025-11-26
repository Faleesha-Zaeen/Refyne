import React from 'react';

const Recommendations = ({ analysis, refactorResult }) => {
  if (!analysis && !refactorResult) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>AI Recommendations</h1>
          <p>Smart suggestions for code improvement and optimization</p>
        </div>
        <div className="placeholder-card">
          <div className="placeholder-icon"></div>
          <h3>No Analysis Data</h3>
          <p>Upload a project and run analysis to get AI-powered recommendations</p>
        </div>
      </div>
    );
  }

  const recommendations = [
    {
      category: 'Performance',
      title: 'Optimize Database Queries',
      description: 'Implement query caching and index optimization for better performance',
      priority: 'high',
      effort: 'medium',
      impact: 'high'
    },
    {
      category: 'Architecture',
      title: 'Implement CQRS Pattern',
      description: 'Separate read and write models for better scalability',
      priority: 'medium',
      effort: 'high',
      impact: 'high'
    },
    {
      category: 'Security',
      title: 'Add Input Validation',
      description: 'Implement comprehensive input validation across all endpoints',
      priority: 'high',
      effort: 'low',
      impact: 'high'
    },
    {
      category: 'Maintainability',
      title: 'Refactor Large Components',
      description: 'Break down components with 500+ lines into smaller, focused units',
      priority: 'medium',
      effort: 'medium',
      impact: 'medium'
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>AI Recommendations</h1>
        <p>Smart suggestions for code improvement and optimization</p>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((rec, index) => (
          <div key={index} className="recommendation-card">
            <div className="rec-header">
              <span className={`rec-priority ${rec.priority}`}>
                {rec.priority}
              </span>
              <span className="rec-category">{rec.category}</span>
            </div>
            <h3>{rec.title}</h3>
            <p>{rec.description}</p>
            <div className="rec-metrics">
              <div className="rec-metric">
                <span>Effort</span>
                <span className={`metric-tag ${rec.effort}`}>{rec.effort}</span>
              </div>
              <div className="rec-metric">
                <span>Impact</span>
                <span className={`metric-tag ${rec.impact}`}>{rec.impact}</span>
              </div>
            </div>
          
          </div>
        ))}
      </div>

      {refactorResult && (
        <div className="refactor-results">
          <h2>AI Refactor Results</h2>
          <div className="result-summary">
            <p>{refactorResult.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendations;