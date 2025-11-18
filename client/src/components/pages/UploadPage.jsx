import React from 'react';
import UploadPanel from '../UploadPanel.jsx';

const UploadPage = ({ onUpload, uploading, scan, analysis, error }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Project Upload</h1>
        <p>Upload your codebase for comprehensive AI analysis and insights</p>
      </div>
      <div className="page-content-centered">
        <UploadPanel 
          onUpload={onUpload}
          uploading={uploading}
          scan={scan}
          analysis={analysis}
          error={error}
        />
      </div>
    </div>
  );
};

export default UploadPage;