import React from 'react';

const RecommendationsPage = ({ analysis, refactorResult }) => {
  const recommendations = [
    {
      category: 'Performance',
      title: 'Optimize Database Queries',
      description: 'Implement query caching and index optimization for better performance. Current queries show N+1 problem in user data retrieval.',
      priority: 'high',
      effort: 'medium',
      impact: 'high',
      files: ['src/database/queries.js', 'src/models/User.js'],
      estimatedTime: '2-4 hours'
    },
    {
      category: 'Architecture',
      title: 'Implement CQRS Pattern',
      description: 'Separate read and write models for better scalability and maintainability.',
      priority: 'medium',
      effort: 'high',
      impact: 'high',
      files: ['src/controllers/', 'src/services/'],
      estimatedTime: '1-2 days'
    },
    {
      category: 'Security',
      title: 'Add Input Validation',
      description: 'Implement comprehensive input validation across all API endpoints to prevent injection attacks.',
      priority: 'high',
      effort: 'low',
      impact: 'high',
      files: ['src/middleware/validation.js', 'src/routes/api.js'],
      estimatedTime: '1-2 hours'
    },
    {
      category: 'Maintainability',
      title: 'Refactor Large Components',
      description: 'Break down components with 500+ lines into smaller, focused units following single responsibility principle.',
      priority: 'medium',
      effort: 'medium',
      impact: 'medium',
      files: ['src/components/Dashboard.jsx', 'src/components/UserProfile.jsx'],
      estimatedTime: '3-5 hours'
    },
    {
      category: 'Code Quality',
      title: 'Add Error Boundaries',
      description: 'Implement React error boundaries to prevent entire app crashes from component errors.',
      priority: 'medium',
      effort: 'low',
      impact: 'medium',
      files: ['src/components/ErrorBoundary.jsx', 'src/App.jsx'],
      estimatedTime: '1 hour'
    },
    {
      category: 'Performance',
      title: 'Implement Code Splitting',
      description: 'Use React.lazy and Suspense for route-based code splitting to reduce initial bundle size.',
      priority: 'medium',
      effort: 'medium',
      impact: 'medium',
      files: ['src/App.jsx', 'src/routes/'],
      estimatedTime: '2-3 hours'
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>AI Recommendations</h1>
        <p>Smart suggestions for code improvement and optimization</p>
      </div>

      <div className="recommendations-dashboard">
        <div className="recommendations-summary">
          <div className="summary-card">
            <h3>Recommendations Summary</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value">{recommendations.length}</span>
                <span className="stat-label">Total Suggestions</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">3</span>
                <span className="stat-label">High Priority</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">8-16 hours</span>
                <span className="stat-label">Estimated Effort</span>
              </div>
            </div>
          </div>
        </div>

        <div className="recommendations-grid-detailed">
          {recommendations.map((rec, index) => (
            <div key={index} className="recommendation-card-detailed">
              <div className="rec-header-detailed">
                <span className={`rec-priority-badge ${rec.priority}`}>
                  {rec.priority.toUpperCase()}
                </span>
                <span className="rec-category">{rec.category}</span>
              </div>
              
              <h3>{rec.title}</h3>
              <p className="rec-description">{rec.description}</p>

              <div className="rec-files">
                <strong>Affected Files:</strong>
                <div className="file-list">
                  {rec.files.map((file, fileIndex) => (
                    <span key={fileIndex} className="file-tag">{file}</span>
                  ))}
                </div>
              </div>

              <div className="rec-metrics-detailed">
                <div className="metric-group">
                  <span className="metric-label">Effort</span>
                  <span className={`metric-value ${rec.effort}`}>{rec.effort}</span>
                </div>
                <div className="metric-group">
                  <span className="metric-label">Impact</span>
                  <span className={`metric-value ${rec.impact}`}>{rec.impact}</span>
                </div>
                <div className="metric-group">
                  <span className="metric-label">Time</span>
                  <span className="metric-value time">{rec.estimatedTime}</span>
                </div>
              </div>

              <div className="rec-actions-detailed">
                <button className="action-btn primary">Apply This Change</button>
                <button className="action-btn secondary">View Code Diff</button>
                <button className="action-btn tertiary">Schedule for Later</button>
              </div>
            </div>
          ))}
        </div>

        {refactorResult && (
          <div className="ai-refactor-results">
            <h2>AI Refactor Results</h2>
            <div className="result-summary-card">
              <p>{refactorResult.summary || 'Refactoring completed successfully with multiple improvements applied.'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;