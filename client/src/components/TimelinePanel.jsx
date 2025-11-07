const TimelinePanel = ({ history = [] }) => {
  const hasHistory = Array.isArray(history) && history.length > 0;

  return (
  <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 max-h-[18rem] overflow-hidden">
      <h2 className="text-lg font-semibold text-gray-800">Analysis timeline</h2>
      <p className="mt-1 text-xs text-slate-600">
        Track how architecture health evolves across project iterations.
      </p>

      {hasHistory ? (
  <ul className="mt-3 space-y-2.5 max-h-48 overflow-y-auto pr-1">
          {history.slice(0, 4).map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-sm font-medium text-slate-700 line-clamp-2">{item.summary?.headline ?? 'Recent analysis'}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(item.analyzedAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
              {item.stats?.architectureScore !== undefined && (
                <p className="mt-1 text-xs font-semibold text-accent">
                  Architecture score: {item.stats.architectureScore}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 flex flex-col items-start gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
          <p>Analysis history coming soon.</p>
          <p className="text-[11px] text-slate-400">Once you run scans, a timeline of highlights will appear here.</p>
        </div>
      )}
    </section>
  );
};

export default TimelinePanel;
