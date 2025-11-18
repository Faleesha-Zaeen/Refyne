import React from 'react';
import AnalysisPanel from '../AnalysisPanel.jsx';

const AnalysisPage = ({ analysis }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Code Analysis</h1>
        <p>Comprehensive analysis of your codebase structure and quality metrics</p>
      </div>
      <div className="page-content-full">
        <AnalysisPanel analysis={analysis} />
      </div>
    </div>
  );
};

export default AnalysisPage;