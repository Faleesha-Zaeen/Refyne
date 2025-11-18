import React from 'react';

const AIRefactorPage = ({ onRefactor, refactorLoading, analysis }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>AI Refactor</h1>
        <p>Let AI analyze and suggest improvements for your codebase</p>
      </div>

      <div className="refactor-dashboard">
        <div className="refactor-main">
          <div className="refactor-card">
            <h2>AI-Powered Code Refactoring</h2>
            <p className="refactor-description">
              Our AI will analyze your codebase and provide intelligent refactoring suggestions 
              to improve code quality, performance, and maintainability.
            </p>

            <div className="refactor-features">
              <div className="feature-item">
                <span className="feature-icon"></span>
                <div className="feature-content">
                  <h4>Deep Code Analysis</h4>
                  <p>Comprehensive analysis of code patterns and anti-patterns</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon"></span>
                <div className="feature-content">
                  <h4>Smart Suggestions</h4>
                  <p>Context-aware refactoring recommendations</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon"></span>
                <div className="feature-content">
                  <h4>Performance Optimization</h4>
                  <p>Identify and fix performance bottlenecks</p>
                </div>
              </div>
            </div>

            <button
              onClick={onRefactor}
              disabled={refactorLoading || !analysis}
              className="refactor-button"
            >
              {refactorLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Analyzing Codebase...
                </>
              ) : !analysis ? (
                'Upload a Project First'
              ) : (
                'Start AI Refactor'
              )}
            </button>

            {!analysis && (
              <div className="refactor-warning">
                <span className="warning-icon">⚠️</span>
                Please upload a project first to enable AI refactoring
              </div>
            )}
          </div>
        </div>

        <div className="refactor-sidebar">
          <div className="refactor-card">
            <h3>What to Expect</h3>
            <ul className="expectation-list">
              <li>Architecture improvements</li>
              <li>Code smell detection</li>
              <li>Performance optimizations</li>
              <li>Security enhancements</li>
              <li>Best practices implementation</li>
            </ul>
          </div>

          <div className="refactor-card">
            <h3>Estimated Impact</h3>
            <div className="impact-metrics">
              <div className="impact-item">
                <span className="impact-label">Code Quality</span>
                <span className="impact-value">+35%</span>
              </div>
              <div className="impact-item">
                <span className="impact-label">Performance</span>
                <span className="impact-value">+22%</span>
              </div>
              <div className="impact-item">
                <span className="impact-label">Maintainability</span>
                <span className="impact-value">+40%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRefactorPage;