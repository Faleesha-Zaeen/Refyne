import React, { useState, useEffect } from 'react';

const RecommendationsPage = ({ analysis, refactorResult, onGenerateRecommendations }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGenerateButton, setShowGenerateButton] = useState(true);

  // Auto-generate recommendations when we have analysis but no refactor result
  useEffect(() => {
    if (analysis && !refactorResult && showGenerateButton) {
      // Don't auto-generate, wait for button click
      setRecommendations([]);
      setSummary(null);
    } else if (refactorResult) {
      // Auto-generate from refactor results
      generateFromRefactor();
    }
  }, [analysis, refactorResult]);

  const handleGenerateRecommendations = async () => {
    if (!analysis) {
      setError('No analysis data available. Please analyze a project first.');
      return;
    }

    setLoading(true);
    setError(null);
    setShowGenerateButton(false);

    try {
      const result = await onGenerateRecommendations();
      
      if (result.success) {
        setRecommendations(result.data.recommendations || []);
        setSummary(result.data.summary);
      } else {
        setError(result.error || 'Failed to generate recommendations');
        setShowGenerateButton(true); // Show button again on error
      }
    } catch (err) {
      setError(err.message || 'Failed to call recommendations API');
      setShowGenerateButton(true); // Show button again on error
    } finally {
      setLoading(false);
    }
  };

  const generateFromRefactor = () => {
    if (!refactorResult) return;

    // Generate recommendations from refactor results (your existing logic)
    const refactorBasedRecs = [];
    
    if (refactorResult.issues && refactorResult.issues.length > 0) {
      refactorResult.issues.forEach((issue, index) => {
        refactorBasedRecs.push({
          category: getCategoryFromIssue(issue),
          title: `Fix: ${extractKeyPoint(issue)}`,
          description: issue,
          priority: 'high',
          effort: estimateEffort(issue),
          impact: 'high',
          files: extractFilesFromIssue(issue),
          estimatedTime: estimateTime(issue),
          confidence: 0.95,
          source: 'ai-refactor'
        });
      });
    }

    // ... rest of your refactor-based generation logic

    setRecommendations(refactorBasedRecs);
    setSummary({
      totalRecommendations: refactorBasedRecs.length,
      highPriority: refactorBasedRecs.filter(r => r.priority === 'high').length,
      estimatedTotalEffort: calculateTotalEffort(refactorBasedRecs),
      potentialImpact: 'High - Based on AI refactoring analysis',
      source: 'ai-refactor'
    });
  };

  // Your existing helper functions remain the same...
  const getCategoryFromIssue = (issue) => {
    const lowerIssue = issue.toLowerCase();
    if (lowerIssue.includes('security') || lowerIssue.includes('vulnerability')) return 'Security';
    if (lowerIssue.includes('performance') || lowerIssue.includes('slow')) return 'Performance';
    if (lowerIssue.includes('architecture') || lowerIssue.includes('structure')) return 'Architecture';
    if (lowerIssue.includes('maintain') || lowerIssue.includes('complex')) return 'Maintainability';
    return 'Code Quality';
  };

  const extractKeyPoint = (text) => {
    const sentences = text.split('.');
    return sentences[0].substring(0, 60) + (sentences[0].length > 60 ? '...' : '');
  };

  const extractFilesFromIssue = (issue) => {
    if (issue.includes('component')) return ['React components'];
    if (issue.includes('api') || issue.includes('endpoint')) return ['API routes', 'Controllers'];
    if (issue.includes('database') || issue.includes('query')) return ['Database layer', 'Models'];
    return ['Multiple files'];
  };

  const estimateEffort = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('major') || lowerText.includes('rewrite') || lowerText.includes('architecture')) return 'high';
    if (lowerText.includes('simple') || lowerText.includes('quick') || lowerText.includes('minor')) return 'low';
    return 'medium';
  };

  const estimateTime = (text) => {
    const effort = estimateEffort(text);
    switch (effort) {
      case 'low': return '1-2 hours';
      case 'high': return '2-4 days';
      default: return '4-8 hours';
    }
  };

  const calculateTotalEffort = (recs) => {
    const effortMap = { low: 2, medium: 8, high: 24 };
    const totalHours = recs.reduce((sum, rec) => {
      return sum + (effortMap[rec.effort] || 4);
    }, 0);
    
    if (totalHours <= 8) return `${totalHours} hours`;
    if (totalHours <= 40) return `${Math.ceil(totalHours / 8)} days`;
    return `${Math.ceil(totalHours / 40)} weeks`;
  };

  const handleApplySuggestion = async (recommendation) => {
    try {
      console.log('Applying recommendation:', recommendation);
      alert(`Applying: ${recommendation.title}`);
    } catch (err) {
      alert('Failed to apply suggestion');
    }
  };

  const handleViewDiff = (recommendation) => {
    if (recommendation.codeExample) {
      alert(`Showing diff for ${recommendation.files[0]}`);
    } else {
      alert(`AI Suggestion: ${recommendation.description}`);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>AI Recommendations</h1>
          <p>Generating smart suggestions with AI...</p>
        </div>
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>AI is analyzing your codebase for recommendations</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>AI Recommendations</h1>
          <p>Smart suggestions for code improvement and optimization</p>
        </div>
        <div className="placeholder-card">
          <div className="placeholder-icon"></div>
          <h3>No Project Analyzed</h3>
          <p>Upload a project to get AI-powered recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>AI Recommendations</h1>
        <p>
          {refactorResult 
            ? 'Smart suggestions generated from AI refactoring analysis' 
            : 'Get AI-powered recommendations for your codebase'
          }
        </p>
        
        {/* Generate Recommendations Button */}
        {showGenerateButton && !refactorResult && (
          <div className="generate-recommendations-section">
            
            
          </div>
        )}

        {refactorResult && (
          <div className="source-badge">
             Generated from AI Refactoring Results
          </div>
        )}
      </div>

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={handleGenerateRecommendations}
          >
            Try Again
          </button>
        </div>
      )}

      <div className="recommendations-dashboard">
        {summary && (
          <div className="recommendations-summary">
            <div className="summary-card">
              <h3>
                {refactorResult ? 'AI Refactoring Insights' : 'AI Recommendations Summary'}
                {summary.source === 'ai-refactor' && ' '}
              </h3>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-value">{summary.totalRecommendations}</span>
                  <span className="stat-label">Total Suggestions</span>
                </div>
                <br></br>
                <div className="stat-item">
                  <span className="stat-value">{summary.highPriority}</span>
                  <span className="stat-label">High Priority</span>
                </div>
                <br></br>
                <div className="stat-item">
                  <span className="stat-value">{summary.estimatedTotalEffort}</span>
                  <span className="stat-label">Estimated Effort</span>
                </div>
              </div>
              {summary.potentialImpact && (
                <div className="impact-note">
                  <strong>Potential Impact:</strong> {summary.potentialImpact}
                </div>
              )}
            </div>
          </div>
        )}

        {recommendations.length > 0 ? (
          <div className="recommendations-grid-detailed">
            {recommendations.map((rec, index) => (
              <div key={index} className="recommendation-card-detailed">
                <div className="rec-header-detailed">
                  <span className={`rec-priority-badge ${rec.priority}`}>
                    {rec.priority.toUpperCase()}
                  </span>
                  <span className="rec-category">{rec.category}</span>
                  {rec.source === 'ai-refactor' && (
                    <span className="ai-source-badge">AI Refactor</span>
                  )}
                </div>
                
                <h3>{rec.title}</h3>
                <p className="rec-description">{rec.description}</p>

                {rec.confidence && (
                  <div className="confidence-indicator">
                    <strong>AI Confidence:</strong> {Math.round(rec.confidence * 100)}%
                  </div>
                )}

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

                
              </div>
            ))}
          </div>
        ) : (
          !loading && !error && !refactorResult && (
            <div className="placeholder-card">
              <div className="placeholder-icon"></div>
              <h3>Ready for AI Analysis</h3>
              <p>Get personalized suggestions for your codebase</p>
            </div>
          )
        )}

        {refactorResult && refactorResult.summary && (
          <div className="ai-refactor-context">
            <h3>AI Refactoring Context</h3>
            <div className="context-card">
              <p>{refactorResult.summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;