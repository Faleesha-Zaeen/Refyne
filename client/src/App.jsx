import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
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
      formData.append('project', file);

      const uploadResponse = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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
      const res = await axios.post('http://localhost:5000/api/refactor');
      setRefactorResult(res.data?.data ?? null);
    } catch (err) {
      console.error('Refactor failed', err);
      setRefactorResult({ summary: 'Refactor failed to run. Check Gemini setup.' });
    } finally {
      setRefactorLoading(false);
    }
  };

  const latestRun = history?.[0]?.analyzedAt
    ? new Date(history[0].analyzedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : 'Awaiting first analysis';

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Refyne 2.0 – The Evolving AI Engineer
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Inspect entire repositories, surface architectural signals, and prepare your next refactor sprint.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {latestRun}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 xl:grid-cols-[23rem_minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <UploadPanel
              onUpload={handleUpload}
              uploading={uploading}
              scan={scan}
              analysis={analysis}
              error={error}
            />
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800">AI refactor</h2>
              <p className="mt-1 text-sm text-slate-600">
                Generate Gemini-guided improvements based on the latest analysis snapshot.
              </p>
              <button
                type="button"
                onClick={handleRefactor}
                disabled={refactorLoading}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:shadow-lg hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refactorLoading ? 'Refining architecture…' : 'Run Refactor'}
              </button>
              {refactorLoading && (
                <p className="mt-3 text-xs text-slate-500">Refining architecture… hang tight.</p>
              )}
            </div>
          </div>
          <div className="space-y-6">
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
