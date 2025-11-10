import React from "react";

const TimelinePanel = ({ history = [] }) => {
  const hasHistory = Array.isArray(history) && history.length > 0;

  return (
    <section className="timeline-container">
      <h2 className="timeline-title">Analysis timeline</h2>
      <p className="timeline-description">
        Track how architecture health evolves across project iterations.
      </p>

      {hasHistory ? (
        <ul className="timeline-list">
          {history.slice(0, 4).map((item) => (
            <li key={item.id} className="timeline-item">
              <p className="timeline-item-title">
                {item.summary?.headline ?? "Recent analysis"}
              </p>
              <p className="timeline-item-date">
                {new Date(item.analyzedAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              {item.stats?.architectureScore !== undefined && (
                <p className="timeline-score">
                  Architecture score: {item.stats.architectureScore}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="timeline-empty">
          <p>Analysis history coming soon.</p>
          <p className="timeline-empty-note">
            Once you run scans, a timeline of highlights will appear here.
          </p>
        </div>
      )}
    </section>
  );
};

export default TimelinePanel;
