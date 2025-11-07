const StatCard = ({ label, value, helper }) => (
  <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition-all duration-300 hover:border-accent/40 hover:shadow-md">
    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
    <span className="text-2xl font-semibold text-slate-900">{value}</span>
    {helper && <span className="text-xs text-slate-500">{helper}</span>}
  </div>
);

const placeholderCard = (
  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 text-sm text-slate-500">
    Upload a project to unlock architecture metrics, structure visuals, and guided recommendations.
  </div>
);

const AnalysisPanel = ({ analysis }) => {
  if (!analysis) {
    return placeholderCard;
  }

  const { stats, summary, recommendations } = analysis;

  const metrics = [
    {
      label: 'Files analyzed',
      value: stats.fileCount?.toLocaleString() ?? '—',
      helper: 'Source files included in this scan'
    },
    {
      label: 'Total lines',
      value: stats.totalLines?.toLocaleString() ?? '—',
      helper: 'Across all parsed files'
    },
    {
      label: 'Architecture score',
      value: `${stats.architectureScore ?? '—'}`,
      helper: '0–100 estimated health'
    },
    {
      label: 'Modularity score',
      value: `${stats.modularityScore ?? '—'}`,
      helper: 'Higher reflects cohesive modules'
    },
    {
      label: 'Functions per file',
      value: `${stats.averageFunctionsPerFile ?? '—'}`,
      helper: 'Average density snapshot'
    },
    {
      label: 'Dependency count',
      value: stats.dependencyCount?.toLocaleString() ?? '—',
      helper: 'Unique imports & includes'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
        <h2 className="text-xl font-semibold text-gray-800">Architecture snapshot</h2>
        <p className="mt-2 text-sm text-slate-600">{summary.headline}</p>
        <div className="mt-4 space-y-2">
          {summary.highlights.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="mt-[6px] inline-block h-1.5 w-1.5 flex-none rounded-full bg-accent" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-400">
          Structure visualization coming soon
        </div>
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-400">
          Metric trends coming soon
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
        <h3 className="text-lg font-semibold text-gray-800">Next recommendations</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {recommendations.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-[6px] inline-block h-1.5 w-1.5 flex-none rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnalysisPanel;
