import { useMemo, useState } from 'react';
import React from "react";
import "../styles/style.css";

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
    <form onSubmit={handleSubmit} className="upload-panel">
      <div className="upload-header">
        <div className="upload-title-section">
          <h2 className="upload-title">Upload & Analyze</h2>
          <p className="upload-subtitle">
            Drop in a compressed (.zip) version of your repository to trigger structure and architecture
            insights.
          </p>
        </div>
        <span className="project-label">
          {projectLabel}
        </span>
      </div>

      <div className="how-it-works">
        <p className="how-it-works-title">How it works</p>
        <ul className="how-it-works-list">
          <li>• Compress the project root (include source files and configs).</li>
          <li>• Upload below — we unpack securely in an isolated workspace.</li>
          <li>• Refyne computes structure, metrics, and readiness scores.</li>
        </ul>
      </div>

      <div className="upload-area">
        <input
          id="project-upload"
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          disabled={uploading}
          className="file-input"
        />
        <label htmlFor="project-upload" className="file-label">
          {file ? 'Change ZIP file' : 'Choose ZIP file'}
        </label>
        <p className="file-name">{selectedFileName}</p>
      </div>

      <div className="upload-actions">
        <button
          type="submit"
          disabled={uploading}
          className="upload-button"
        >
          {uploading ? (
            <>
              <span className="upload-spinner"></span>
              Analyzing…
            </>
          ) : (
            'Upload & Analyze'
          )}
        </button>
        {(localError || error) && (
          <p className="error-message">{localError || error}</p>
        )}
      </div>

      <div className="snapshot-section">
        <p className="snapshot-title">Project snapshot</p>
        {projectSnapshot ? (
          <div className="snapshot-grid">
            {projectSnapshot.map(({ label, value }) => (
              <div key={label} className="snapshot-item">
                <span className="snapshot-label">{label}</span>
                <span className="snapshot-value">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="snapshot-placeholder">
            Once a project is analyzed, quick stats will appear here for easy reference.
          </p>
        )}
      </div>
    </form>
  );
};

export default UploadPanel;