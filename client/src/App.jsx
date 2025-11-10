import { useCallback, useEffect, useState } from 'react';
import './styles/style.css';
import axios from 'axios';
import React from 'react';
import UploadPanel from './components/UploadPanel.jsx';
import AnalysisPanel from './components/AnalysisPanel.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import TimelinePanel from './components/TimelinePanel.jsx';


const App = () => {
  const [analysis, setAnalysis] = useState(null);
  const [scan, setScan] = useState(null);
  const [history, setHistory] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [refactorLoading, setRefactorLoading] = useState(false);
  const [refactorResult, setRefactorResult] = useState(null);

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
    } catch (err) {
      console.error('Refactor failed', err);
      setRefactorResult({ summary: 'Refactor failed to run. Check Gemini setup.' });
    } finally {
      setRefactorLoading(false);
    }
  };

  const latestRun = history?.[0]?.analyzedAt
    ? new Date(history[0].analyzedAt).toLocaleString()
    : 'Awaiting first analysis';

  return (
    <div className="app-container">

      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Refyne <span>2.0</span></h1>
          <p className="app-subtitle">AI-guided code intelligence & architectural insights</p>
        </div>
        <div className="status-badge">
          <span className="status-dot"></span>
          {latestRun}
        </div>
      </header>

      <main className="app-main">
        <div className="layout-grid">

          <div className="left-column">
            <UploadPanel
              onUpload={handleUpload}
              uploading={uploading}
              scan={scan}
              analysis={analysis}
              error={error}
            />

            <div className="card">
              <h2 className="card-title">✦ AI Refactor</h2>
              <p className="card-text">Generate architecture improvements based on analysis data.</p>

              <button
                onClick={handleRefactor}
                disabled={refactorLoading}
                className="primary-button"
              >
                {refactorLoading ? 'Refining…' : 'Run Refactor'}
              </button>

              {refactorLoading && <p className="loading-text">Working…</p>}
            </div>
          </div>

          <div className="center-column">
            <AnalysisPanel analysis={analysis} />
            <ResultsPanel result={refactorResult} />
          </div>

          <TimelinePanel history={history} />

        </div>
      </main>
    </div>
  );
};

export default App;
