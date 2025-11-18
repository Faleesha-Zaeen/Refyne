import React from 'react';
import ResultsPanel from '../ResultsPanel.jsx';

const OutputPage = ({ refactorResult }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Refactor Output</h1>
        <p>AI-generated code improvements and refactoring results</p>
      </div>
      <div className="page-content-full">
        <ResultsPanel result={refactorResult} />
      </div>
    </div>
  );
};

export default OutputPage;