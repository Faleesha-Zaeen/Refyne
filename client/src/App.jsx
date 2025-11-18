import { useCallback, useEffect, useState } from 'react';
import './styles/style.css';
import axios from 'axios';
import React from 'react';
import UploadPage from './components/pages/UploadPage.jsx';
import AnalysisPage from './components/pages/AnalysisPage.jsx';
import TimelinePage from './components/pages/TimelinePage.jsx';
import OutputPage from './components/pages/OutputPage.jsx';
import AIRefactorPage from './components/pages/AIRefactorPage.jsx';
import ArchitecturePage from './components/pages/ArchitecturePage.jsx';
import MetricsPage from './components/pages/MetricsPage.jsx';
import RecommendationsPage from './components/pages/RecommendationsPage.jsx';

const App = () => {
  const [analysis, setAnalysis] = useState(null);
  const [scan, setScan] = useState(null);
  const [history, setHistory] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [refactorLoading, setRefactorLoading] = useState(false);
  const [refactorResult, setRefactorResult] = useState(null);
  const [currentPage, setCurrentPage] = useState('upload');

  const loadHistory = useCallback(async () => {
    try {
      const response = await axios.get('/api/history');
      setHistory(response.data.history || []);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleUpload = async (file) => {
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append("project", file);

      const uploadResponse = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      const { projectId, scan: initialScan } = uploadResponse.data;
      setScan(initialScan);

      const analyzeResponse = await axios.post('/api/analyze', { projectId });
      setAnalysis(analyzeResponse.data.analysis);
      setScan(analyzeResponse.data.scan);

      await loadHistory();
      setCurrentPage('analysis'); // Auto-navigate to analysis after upload
    } catch (err) {
      console.error('Upload & analyze failed', err);
      setError('Unable to analyze project. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRefactor = async () => {
    try {
      setRefactorLoading(true);
      const res = await axios.post('/api/refactor');
      setRefactorResult(res.data?.data ?? null);
      setCurrentPage('output'); // Auto-navigate to output after refactor
    } catch (err) {
      console.error('Refactor failed', err);
      setRefactorResult({ summary: 'Refactor failed to run. Check Gemini setup.' });
    } finally {
      setRefactorLoading(false);
    }
  };

  const renderCurrentPage = () => {
    const pageProps = {
      analysis,
      scan,
      history,
      uploading,
      error,
      refactorLoading,
      refactorResult,
      onUpload: handleUpload,
      onRefactor: handleRefactor
    };

    switch (currentPage) {
      case 'upload':
        return <UploadPage {...pageProps} />;
      case 'analysis':
        return <AnalysisPage {...pageProps} />;
      case 'timeline':
        return <TimelinePage {...pageProps} />;
      case 'output':
        return <OutputPage {...pageProps} />;
      case 'ai-refactor':
        return <AIRefactorPage {...pageProps} />;
      case 'architecture':
        return <ArchitecturePage {...pageProps} />;
      case 'metrics':
        return <MetricsPage {...pageProps} />;
      case 'recommendations':
        return <RecommendationsPage {...pageProps} />;
      default:
        return <UploadPage {...pageProps} />;
    }
  };

  const latestRun = history?.[0]?.analyzedAt
    ? new Date(history[0].analyzedAt).toLocaleString()
    : 'Awaiting first analysis';

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Refyne </h1>
          <p className="app-subtitle">AI-guided code intelligence & architectural insights</p>
        </div>
        <div className="status-badge">
          <span className="status-dot"></span>
          {latestRun}
        </div>
      </header>

      <div className="app-layout">
        <nav className="sidebar">
          <div className="sidebar-header">
            <h3>Navigation</h3>
          </div>
          <ul className="sidebar-menu">
            <li>
              <button 
                className={`nav-item ${currentPage === 'upload' ? 'active' : ''}`}
                onClick={() => setCurrentPage('upload')}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Upload</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentPage === 'analysis' ? 'active' : ''}`}
                onClick={() => setCurrentPage('analysis')}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Analysis</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentPage === 'architecture' ? 'active' : ''}`}
                onClick={() => setCurrentPage('architecture')}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Architecture</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentPage === 'metrics' ? 'active' : ''}`}
                onClick={() => setCurrentPage('metrics')}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Metrics</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentPage === 'ai-refactor' ? 'active' : ''}`}
                onClick={() => setCurrentPage('ai-refactor')}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">AI Refactor</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentPage === 'output' ? 'active' : ''}`}
                onClick={() => setCurrentPage('output')}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Output</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentPage === 'recommendations' ? 'active' : ''}`}
                onClick={() => setCurrentPage('recommendations')}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Recommendations</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${currentPage === 'timeline' ? 'active' : ''}`}
                onClick={() => setCurrentPage('timeline')}
              >
                <span className="nav-icon"></span>
                <span className="nav-text">Timeline</span>
              </button>
            </li>
          </ul>
        </nav>

        <main className="main-content">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default App;