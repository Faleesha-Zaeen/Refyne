const CODE_BLOCK_REGEX = /```(?:json)?\s*([\s\S]*?)```/i;

const stripCodeFences = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/```[\s\S]*?```/g, '').trim();
};

const tryExtractJson = (input) => {
  if (typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  const codeBlockMatch = trimmed.match(CODE_BLOCK_REGEX);
  const candidate = codeBlockMatch && codeBlockMatch[1] ? codeBlockMatch[1].trim() : trimmed;

  if (candidate.startsWith('{') || candidate.startsWith('[')) {
    try {
      return JSON.parse(candidate);
    } catch (err) {
      console.warn('[Refyne] Failed to parse Gemini JSON candidate:', err);
    }
  }

  return null;
};

const normalizeResultPayload = (payload) => {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'string') {
    return tryExtractJson(payload) ?? payload;
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return [];
    }
    const first = normalizeResultPayload(payload[0]);
    return first ?? payload[0];
  }

  return payload;
};

const looksLikeRefactorObject = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  return (
    Object.prototype.hasOwnProperty.call(payload, 'summary') ||
    Object.prototype.hasOwnProperty.call(payload, 'issues') ||
    Object.prototype.hasOwnProperty.call(payload, 'suggestions') ||
    Object.prototype.hasOwnProperty.call(payload, 'refactoredFiles')
  );
};

const extractJsonFragment = (payload) => {
  if (typeof payload !== 'string') {
    return null;
  }

  const searchTargets = ['{', '['];
  for (const opening of searchTargets) {
    const closing = opening === '{' ? '}' : ']';
    const startIndex = payload.indexOf(opening);
    if (startIndex === -1) {
      continue;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = startIndex; index < payload.length; index += 1) {
      const char = payload[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) {
        continue;
      }

      if (char === opening) {
        depth += 1;
      } else if (char === closing) {
        depth -= 1;
        if (depth === 0) {
          return payload.slice(startIndex, index + 1);
        }
      }
    }
  }

  return null;
};

const cleanSummaryText = (text) => {
  if (typeof text !== 'string') {
    return text;
  }

  const withoutFences = stripCodeFences(text);
  const codeIndex = withoutFences.search(/\b(javascript|import|export|function|class)\b/i);
  if (codeIndex > 0) {
    return withoutFences.slice(0, codeIndex).trim();
  }
  return withoutFences.trim();
};

const ResultsPanel = ({ result }) => {
  if (!result) {
    return <div className="text-gray-500 italic">Run a refactor to see AI insights.</div>;
  }

  let parsedResult = normalizeResultPayload(result);

  if (Array.isArray(parsedResult)) {
    parsedResult = normalizeResultPayload(parsedResult[0]);
  }

  if (parsedResult && typeof parsedResult === 'object' && typeof parsedResult.summary === 'string') {
    const embedded = normalizeResultPayload(parsedResult.summary);
    if (looksLikeRefactorObject(embedded)) {
      parsedResult = embedded;
    }
  }

  if (
    parsedResult &&
    typeof parsedResult === 'object' &&
    (!Array.isArray(parsedResult.issues) || parsedResult.issues.length === 0) &&
    typeof parsedResult.summary === 'string'
  ) {
    const nestedFragment = extractJsonFragment(parsedResult.summary);
    if (nestedFragment) {
      try {
        const nestedPayload = JSON.parse(nestedFragment);
        if (looksLikeRefactorObject(nestedPayload)) {
          parsedResult = nestedPayload;
        }
      } catch (err) {
        console.warn('[Refyne] Failed to parse JSON fragment inside summary:', err);
      }
    }
  }

  if (!parsedResult || typeof parsedResult !== 'object') {
    return (
      <div className="text-gray-500 italic">
        Refactor result is not in a recognized format.
      </div>
    );
  }

  if (Array.isArray(parsedResult) && parsedResult.length > 0) {
    parsedResult = parsedResult[0];
  }

  const {
    summary,
    issues = [],
    suggestions = [],
    refactoredFiles = []
  } = parsedResult;

  const issuesList = Array.isArray(issues) ? issues : [];
  const suggestionsList = Array.isArray(suggestions) ? suggestions : [];
  const refactorList = Array.isArray(refactoredFiles) ? refactoredFiles : [];

  const displaySummary = typeof summary === 'string' ? cleanSummaryText(summary) : summary;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border text-gray-900">
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">🧠 Summary</h3>
        <p className="text-base leading-relaxed font-medium">
          {displaySummary || 'No summary available.'}
        </p>
      </section>

      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">🚨 Issues Detected</h3>
        {issuesList.length ? (
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-800">
            {issuesList.map((issue, index) => (
              <li key={`${issue}-${index}`}>{issue}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">No issues found.</div>
        )}
      </section>

      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">💡 Recommendations</h3>
        {suggestionsList.length ? (
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-800">
            {suggestionsList.map((suggestion, index) => (
              <li key={`${suggestion}-${index}`}>{suggestion}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">No recommendations.</div>
        )}
      </section>

      <section className="mb-0">
        <h3 className="text-xl font-semibold mb-4">📄 Refactored Files</h3>
        {refactorList.length ? (
          <div className="space-y-4">
            {refactorList.map((file, index) => (
              <div
                key={`${file.filename || 'file'}-${index}`}
                className="bg-gray-50 border rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm text-gray-900">
                    {file.filename || 'Unnamed file'}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Before</h4>
                    <pre className="font-mono text-sm bg-gray-900 text-green-100 p-3 rounded-lg overflow-x-auto w-full">{file.before || '// Original code not provided.'}</pre>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">After</h4>
                    <pre className="font-mono text-sm bg-gray-900 text-green-100 p-3 rounded-lg overflow-x-auto w-full">{file.after || '// Refactored code not provided.'}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No refactored files supplied.</div>
        )}
      </section>
    </div>
  );
};

export default ResultsPanel;
