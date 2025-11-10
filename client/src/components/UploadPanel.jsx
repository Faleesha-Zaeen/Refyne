import { useMemo, useState } from 'react';
import React from "react";

const UploadPanel = ({ onUpload, uploading, scan, analysis, error }) => {
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState('');

  const projectSnapshot = useMemo(() => {
    if (!analysis || !analysis.stats) {
      return null;
    }
    const { stats } = analysis;
    return [
      { label: 'Files parsed', value: stats.fileCount?.toLocaleString() ?? '—' },
      { label: 'Total lines', value: stats.totalLines?.toLocaleString() ?? '—' },
      { label: 'Architecture score', value: `${stats.architectureScore ?? '—'}` }
    ];
  }, [analysis]);

  const projectLabel = useMemo(() => {
    if (!scan || !scan.root) {
      return 'Select a project archive to begin.';
    }
    const segments = scan.root.split(/[/\\]/);
    const directory = segments[segments.length - 1] || 'Uploaded project';
    return `Last analyzed: ${directory}`;
  }, [scan]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0] || null);
    setLocalError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!file) {
      setLocalError('Please choose a ZIP archive before analyzing.');
      return;
    }
    onUpload(file);
  };

  const selectedFileName = file ? file.name : 'No file selected yet';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 transition-all duration-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Upload & Analyze</h2>
          <p className="mt-1 text-sm text-slate-500">
            Drop in a compressed (.zip) version of your repository to trigger structure and architecture
            insights.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-1">
          {projectLabel}
        </span>
      </div>

      <div className="mt-6 grid gap-2 text-sm text-slate-600">
        <p className="font-medium text-slate-700">How it works</p>
        <ul className="space-y-1">
          <li>• Compress the project root (include source files and configs).</li>
          <li>• Upload below — we unpack securely in an isolated workspace.</li>
          <li>• Refyne computes structure, metrics, and readiness scores.</li>
        </ul>
      </div>

      <div className="mt-6 border border-dashed border-slate-200 rounded-xl p-5 bg-slate-50">
        <input
          id="project-upload"
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        <label
          htmlFor="project-upload"
          className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:text-slate-900 hover:shadow-md cursor-pointer"
        >
          {file ? 'Change ZIP file' : 'Choose ZIP file'}
        </label>
        <p className="mt-3 text-xs text-slate-500">{selectedFileName}</p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="submit"
          disabled={uploading}
          className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:shadow-lg hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? 'Analyzing…' : 'Upload & Analyze'}
        </button>
        {(localError || error) && (
          <p className="text-sm text-red-600">{localError || error}</p>
        )}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">Project snapshot</p>
        {projectSnapshot ? (
          <div className="mt-3 grid gap-3">
            {projectSnapshot.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Once a project is analyzed, quick stats will appear here for easy reference.
          </p>
        )}
      </div>
    </form>
  );
};

export default UploadPanel;
