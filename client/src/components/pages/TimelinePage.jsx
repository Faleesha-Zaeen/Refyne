import React from 'react';
import TimelinePanel from '../TimelinePanel.jsx';

const TimelinePage = ({ history }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Analysis Timeline</h1>
        <p>Track your codebase evolution and improvement history</p>
      </div>
      <div className="page-content-full">
        <TimelinePanel history={history} />
      </div>
    </div>
  );
};

export default TimelinePage;