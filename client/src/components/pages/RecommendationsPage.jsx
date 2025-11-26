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
        // Clean up the recommendations data by removing ** formatting
        const cleanedRecommendations = (result.data.recommendations || []).map(rec => ({
          ...rec,
          title: cleanText(rec.title),
          description: cleanText(rec.description)
        }));
        
        setRecommendations(cleanedRecommendations);
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

  // Function to clean ** formatting from text
  const cleanText = (text) => {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '$1').trim();
  };

  const generateFromRefactor = () => {
    if (!refactorResult) return;

    // Generate recommendations from refactor results
    const refactorBasedRecs = [];
    
    if (refactorResult.issues && refactorResult.issues.length > 0) {
      refactorResult.issues.forEach((issue, index) => {
        refactorBasedRecs.push({
          category: getCategoryFromIssue(issue),
          title: `Fix: ${extractKeyPoint(cleanText(issue))}`,
          description: cleanText(issue),
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

    // Add more recommendations based on refactor result analysis
    if (refactorResult.improvements) {
      refactorResult.improvements.forEach((improvement, index) => {
        refactorBasedRecs.push({
          category: 'Optimization',
          title: `Optimize: ${extractKeyPoint(cleanText(improvement))}`,
          description: cleanText(improvement),
          priority: 'medium',
          effort: 'medium',
          impact: 'medium',
          files: ['Multiple files'],
          estimatedTime: '4-8 hours',
          confidence: 0.85,
          source: 'ai-refactor'
        });
      });
    }

    setRecommendations(refactorBasedRecs);
    setSummary({
      totalRecommendations: refactorBasedRecs.length,
      highPriority: refactorBasedRecs.filter(r => r.priority === 'high').length,
      estimatedTotalEffort: calculateTotalEffort(refactorBasedRecs),
      potentialImpact: 'High - Based on AI refactoring analysis',
      source: 'ai-refactor'
    });
  };

  // Your existing helper functions with clean text applied
  const getCategoryFromIssue = (issue) => {
    const cleanIssue = cleanText(issue).toLowerCase();
    if (cleanIssue.includes('security') || cleanIssue.includes('vulnerability')) return 'Security';
    if (cleanIssue.includes('performance') || cleanIssue.includes('slow')) return 'Performance';
    if (cleanIssue.includes('architecture') || cleanIssue.includes('structure')) return 'Architecture';
    if (cleanIssue.includes('maintain') || cleanIssue.includes('complex')) return 'Maintainability';
    return 'Code Quality';
  };

  const extractKeyPoint = (text) => {
    const cleanText = text.replace(/\*\*/g, '');
    const sentences = cleanText.split('.');
    return sentences[0].substring(0, 60) + (sentences[0].length > 60 ? '...' : '');
  };

  const extractFilesFromIssue = (issue) => {
    const cleanIssue = cleanText(issue).toLowerCase();
    if (cleanIssue.includes('component')) return ['React components'];
    if (cleanIssue.includes('api') || cleanIssue.includes('endpoint')) return ['API routes', 'Controllers'];
    if (cleanIssue.includes('database') || cleanIssue.includes('query')) return ['Database layer', 'Models'];
    return ['Multiple files'];
  };

  const estimateEffort = (text) => {
    const cleanText = text.replace(/\*\*/g, '').toLowerCase();
    if (cleanText.includes('major') || cleanText.includes('rewrite') || cleanText.includes('architecture')) return 'high';
    if (cleanText.includes('simple') || cleanText.includes('quick') || cleanText.includes('minor')) return 'low';
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
              </h3>
              <div className="summary-stats" style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                <div className="stat-item" style={{ flex: '1', minWidth: '100px', textAlign: 'center' }}>
                  <span className="stat-value" style={{ display: 'block', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    {summary.totalRecommendations}
                  </span>
                  <span className="stat-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Total Suggestions
                  </span>
                </div>
                <div className="stat-item" style={{ flex: '1', minWidth: '100px', textAlign: 'center' }}>
                  <span className="stat-value" style={{ display: 'block', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    {summary.highPriority}
                  </span>
                  <span className="stat-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    High Priority
                  </span>
                </div>
                
              </div>
              {summary.potentialImpact && (
                <div className="impact-note" style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0, 102, 255, 0.1)', borderRadius: '8px', border: '1px solid rgba(0, 102, 255, 0.3)' }}>
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
                <div className="rec-header-detailed" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`rec-priority-badge ${rec.priority}`} style={{ 
                      padding: '0.4rem 0.8rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.7rem', 
                      fontWeight: '600',
                      background: rec.priority === 'high' ? 'rgba(255, 42, 109, 0.2)' : 
                                 rec.priority === 'medium' ? 'rgba(255, 165, 2, 0.2)' : 'rgba(0, 255, 136, 0.2)',
                      color: rec.priority === 'high' ? 'var(--neon-pink)' : 
                            rec.priority === 'medium' ? 'var(--warning)' : 'var(--accent)',
                      border: rec.priority === 'high' ? '1px solid rgba(255, 42, 109, 0.4)' : 
                             rec.priority === 'medium' ? '1px solid rgba(255, 165, 2, 0.4)' : '1px solid rgba(0, 255, 136, 0.4)'
                    }}>
                      {rec.priority.toUpperCase()}
                    </span>
                    <span className="rec-category" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {rec.category}
                    </span>
                  </div>
                  {rec.source === 'ai-refactor' && (
                    <span className="ai-source-badge" style={{ 
                      fontSize: '0.7rem', 
                      padding: '0.3rem 0.6rem', 
                      background: 'rgba(0, 243, 255, 0.2)', 
                      color: 'var(--neon-blue)', 
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(0, 243, 255, 0.4)'
                    }}>
                      AI Refactor
                    </span>
                  )}
                </div>
                
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>{rec.title}</h3>
                <p className="rec-description" style={{ 
                  lineHeight: '1.6', 
                  marginBottom: '1rem',
                  color: 'var(--text-secondary)'
                }}>
                  {rec.description}
                </p>

                {rec.confidence && (
                  <div className="confidence-indicator" style={{ 
                    marginBottom: '1rem', 
                    padding: '0.5rem',
                    background: 'rgba(0, 102, 255, 0.1)',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem'
                  }}>
                    <strong>AI Confidence:</strong> {Math.round(rec.confidence * 100)}%
                  </div>
                )}

                <div className="rec-files" style={{ marginBottom: '1rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Affected Files:</strong>
                  <div className="file-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {rec.files.map((file, fileIndex) => (
                      <span key={fileIndex} className="file-tag" style={{ 
                        padding: '0.3rem 0.6rem', 
                        background: 'rgba(0, 102, 255, 0.2)', 
                        color: 'var(--neon-blue)', 
                        borderRadius: '0.5rem',
                        fontSize: '0.7rem',
                        border: '1px solid rgba(0, 102, 255, 0.4)'
                      }}>
                        {file}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rec-metrics-detailed" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: '0.75rem', 
                  margin: '1rem 0'
                }}>
                  <div className="metric-group" style={{ textAlign: 'center' }}>
                    <span className="metric-label" style={{ 
                      display: 'block', 
                      fontSize: '0.7rem', 
                      color: 'var(--text-secondary)', 
                      marginBottom: '0.25rem' 
                    }}>
                      Effort
                    </span>
                    <span className={`metric-value ${rec.effort}`} style={{ 
                      display: 'block',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      background: rec.effort === 'high' ? 'rgba(255, 42, 109, 0.2)' : 
                                 rec.effort === 'medium' ? 'rgba(255, 165, 2, 0.2)' : 'rgba(0, 255, 136, 0.2)',
                      color: rec.effort === 'high' ? 'var(--neon-pink)' : 
                            rec.effort === 'medium' ? 'var(--warning)' : 'var(--accent)'
                    }}>
                      {rec.effort}
                    </span>
                  </div>
                  <div className="metric-group" style={{ textAlign: 'center' }}>
                    <span className="metric-label" style={{ 
                      display: 'block', 
                      fontSize: '0.7rem', 
                      color: 'var(--text-secondary)', 
                      marginBottom: '0.25rem' 
                    }}>
                      Impact
                    </span>
                    <span className={`metric-value ${rec.impact}`} style={{ 
                      display: 'block',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      background: rec.impact === 'high' ? 'rgba(255, 42, 109, 0.2)' : 
                                 rec.impact === 'medium' ? 'rgba(255, 165, 2, 0.2)' : 'rgba(0, 255, 136, 0.2)',
                      color: rec.impact === 'high' ? 'var(--neon-pink)' : 
                            rec.impact === 'medium' ? 'var(--warning)' : 'var(--accent)'
                    }}>
                      {rec.impact}
                    </span>
                  </div>
                  <div className="metric-group" style={{ textAlign: 'center' }}>
                    <span className="metric-label" style={{ 
                      display: 'block', 
                      fontSize: '0.7rem', 
                      color: 'var(--text-secondary)', 
                      marginBottom: '0.25rem' 
                    }}>
                      Time
                    </span>
                    <span className="metric-value time" style={{ 
                      display: 'block',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      background: 'rgba(0, 102, 255, 0.2)',
                      color: 'var(--neon-blue)'
                    }}>
                      {rec.estimatedTime}
                    </span>
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
          <div className="ai-refactor-context" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>AI Refactoring Context</h3>
            <div className="context-card" style={{ 
              padding: '1.5rem', 
              background: 'rgba(0, 102, 255, 0.1)', 
              borderRadius: '12px',
              border: '1px solid rgba(0, 102, 255, 0.3)'
            }}>
              <p style={{ lineHeight: '1.6', margin: 0 }}>{cleanText(refactorResult.summary)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;