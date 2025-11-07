const path = require('path');

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const countDirectories = (node) => {
  if (!node || !Array.isArray(node.children)) {
    return 0;
  }
  return node.children.reduce((acc, child) => {
    if (child.type === 'directory') {
      return acc + 1 + countDirectories(child);
    }
    return acc;
  }, 0);
};

const summarize = (stats) => {
  const highlights = [];
  if (stats.modularityScore > 70) {
    highlights.push('Strong modular structure detected.');
  } else if (stats.modularityScore < 40) {
    highlights.push('Project may benefit from additional modular boundaries.');
  }

  if (stats.functionDensity > 8) {
    highlights.push('High function density could indicate complex files.');
  }

  if (stats.dependencyCount > stats.fileCount * 1.5) {
    highlights.push('Heavy dependency usage relative to file count.');
  }

  if (highlights.length === 0) {
    highlights.push('Architecture health looks balanced for the current scale.');
  }

  return {
    headline: stats.architectureScore > 70 ? 'Architecture looks healthy overall.' : 'Architecture needs attention.',
    highlights
  };
};

const analyzeProject = (scan) => {
  const { files, structure, aggregate } = scan;
  const fileCount = aggregate.fileCount || 0;
  const totalLines = aggregate.totalLines || 0;
  const totalFunctions = aggregate.totalFunctions || 0;
  const totalImports = aggregate.totalImports || 0;
  const dependencyCount = aggregate.dependencyCount || 0;

  const directories = countDirectories(structure);
  const averageLinesPerFile = fileCount ? totalLines / fileCount : 0;
  const averageFunctionsPerFile = fileCount ? totalFunctions / fileCount : 0;
  const functionDensity = fileCount ? totalFunctions / Math.max(fileCount, 1) : 0;
  const dependencyRatio = fileCount ? dependencyCount / fileCount : 0;

  const modularityScore = clamp(Math.round((directories / Math.max(fileCount, 1)) * 120), 10, 95);
  const complexityPenalty = clamp(averageLinesPerFile / 40, 0, 40);
  const dependencyPenalty = clamp(dependencyRatio * 10, 0, 25);
  const rawScore = 85 + (modularityScore - 60) - complexityPenalty - dependencyPenalty;
  const architectureScore = clamp(Math.round(rawScore), 5, 95);

  const stats = {
    fileCount,
    totalLines,
    totalFunctions,
    totalImports,
    dependencyCount,
    averageLinesPerFile: Number(averageLinesPerFile.toFixed(2)),
    averageFunctionsPerFile: Number(averageFunctionsPerFile.toFixed(2)),
    functionDensity: Number(functionDensity.toFixed(2)),
    dependencyRatio: Number(dependencyRatio.toFixed(2)),
    modularityScore,
    architectureScore
  };

  const summary = summarize(stats);

  return {
    summary,
    stats,
    structureMap: structure,
    recommendations: [
      'Review high-density files for potential extraction into smaller modules.',
      'Evaluate frequently imported modules to ensure dependency boundaries are intentional.',
      'Use the upcoming Gemini refactor flow to pilot targeted improvements.'
    ]
  };
};

module.exports = { analyzeProject };
