import React, { useState } from "react";
import "../styles/style.css";

const ResultsPanel = ({ result }) => {
  const [expandedFiles, setExpandedFiles] = useState({});

  // Function to clean ** formatting from text
  const cleanText = (text) => {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '$1').trim();
  };

  // Function to format text with proper styling for cleaned bold sections
  const formatTextWithBold = (text) => {
    if (!text) return '';
    
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const cleanPart = part.replace(/\*\*/g, '');
        return (
          <strong key={index} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
            {cleanPart}
          </strong>
        );
      }
      return part;
    });
  };

  if (!result) {
    return (
      <div className="results-empty-state">
        <div className="empty-icon"></div>
        <h3>Awaiting Analysis</h3>
        <p>Run a refactor to unlock AI-powered insights and code transformations</p>
        <div className="empty-features">
          <div className="feature">
            <span className="feature-icon"></span>
            <span>Deep code analysis</span>
          </div>
          <div className="feature">
            <span className="feature-icon"></span>
            <span>Smart recommendations</span>
          </div>
          <div className="feature">
            <span className="feature-icon"></span>
            <span>Instant refactoring</span>
          </div>
        </div>
      </div>
    );
  }

  const { summary = "", issues = [], suggestions = [], refactoredFiles = [] } = result;

  const toggleFileExpansion = (index) => {
    setExpandedFiles(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="results-container">
      {/* Summary Section */}
      <section className="results-section summary-section">
        <div className="section-header">
          <div className="section-icon"></div>
          <h3 className="section-title">AI Analysis Summary</h3>
        </div>
        <div className="summary-card">
          <div className="summary-content">
            <p className="summary-text">{cleanText(summary) || "No summary available."}</p>
          </div>
          <div className="summary-metrics">
            <div className="metric-badge">
              <span className="metric-value">{issues.length}</span>
              <span className="metric-label">Issues Found</span>
            </div>
            <div className="metric-badge">
              <span className="metric-value">{suggestions.length}</span>
              <span className="metric-label">Suggestions</span>
            </div>
            <div className="metric-badge">
              <span className="metric-value">{refactoredFiles.length}</span>
              <span className="metric-label">Files Improved</span>
            </div>
          </div>
        </div>
      </section>

      <div className="results-grid">
        {/* Issues Section */}
        <section className="results-section issues-section">
          <div className="section-header">
            <div className="section-icon"></div>
            <h3 className="section-title">Issues Detected</h3>
            {issues.length > 0 && (
              <span className="issue-count">{issues.length} found</span>
            )}
          </div>
          {issues.length ? (
            <div className="issues-list">
              {issues.map((issue, index) => (
                <div key={index} className="issue-item">
                  <div className="issue-severity"></div>
                  <div className="issue-content">
                    <span className="issue-text">
                      {formatTextWithBold(issue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <p>No critical issues found</p>
              <span className="empty-subtitle">Your code looks clean!</span>
            </div>
          )}
        </section>

        {/* Suggestions Section */}
        <section className="results-section suggestions-section">
          <div className="section-header">
            <div className="section-icon"></div>
            <h3 className="section-title">Smart Recommendations</h3>
          </div>
          {suggestions.length ? (
            <div className="suggestions-grid">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-card">
                  <div className="suggestion-content">
                    <p className="suggestion-text">
                      {formatTextWithBold(suggestion)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"></div>
              <p>No recommendations</p>
              <span className="empty-subtitle">Code follows best practices</span>
            </div>
          )}
        </section>
      </div>

      {/* Refactored Files Section */}
      <section className="results-section files-section">
        <div className="section-header">
          <div className="section-icon">📄</div>
          <h3 className="section-title">Refactored Files</h3>
          {refactoredFiles.length > 0 && (
            <span className="files-count">{refactoredFiles.length} files improved</span>
          )}
        </div>
        {refactoredFiles.length ? (
          <div className="files-grid">
            {refactoredFiles.map((file, index) => (
              <div key={index} className="file-card">
                <div 
                  className="file-header"
                  onClick={() => toggleFileExpansion(index)}
                >
                  <div className="file-info">
                    <strong className="file-name">{file.filename}</strong>
                    <span className="file-stats">
                      {file.before && `${file.before.split('\n').length} → ${file.after.split('\n').length} lines`}
                    </span>
                  </div>
                  <button className="expand-btn">
                    {expandedFiles[index] ? '▼' : '▶'}
                  </button>
                </div>
                
                {expandedFiles[index] && (
                  <div className="file-comparison">
                    <div className="code-column">
                      <div className="code-header">
                        <h4 className="code-label before">Original</h4>
                        <span className="code-badge warning">Before</span>
                      </div>
                      <pre className="code-box before">
                        <code>{file.before}</code>
                      </pre>
                    </div>
                    <div className="code-column">
                      <div className="code-header">
                        <h4 className="code-label after">Improved</h4>
                        <span className="code-badge success">After</span>
                      </div>
                      <pre className="code-box after">
                        <code>{file.after}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <p>No refactored files supplied</p>
            <span className="empty-subtitle">Run refactor to see improvements</span>
          </div>
        )}
      </section>
    </div>
  );
};

export default ResultsPanel;