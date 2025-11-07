const path = require('path');
const fs = require('fs');
const fsp = fs.promises;

const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.py', '.cpp', '.cc', '.cxx']);
const SKIP_DIRECTORIES = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__']);

const normalizeLineEndings = (content) => content.replace(/\r\n?/g, '\n');

const extractDependencies = (content, ext) => {
  const deps = new Set();
  let match;

  const importRegex = /import\s+(?:.+?\s+from\s+)?['\"](.+?)['\"]/g;
  while ((match = importRegex.exec(content))) {
    deps.add(match[1]);
  }

  const requireRegex = /require\(['\"](.+?)['\"]\)/g;
  while ((match = requireRegex.exec(content))) {
    deps.add(match[1]);
  }

  const pythonImportRegex = /^\s*import\s+([\w\.]+)/gm;
  while ((match = pythonImportRegex.exec(content))) {
    deps.add(match[1]);
  }

  const pythonFromImportRegex = /^\s*from\s+([\w\.]+)\s+import\s+/gm;
  while ((match = pythonFromImportRegex.exec(content))) {
    deps.add(match[1]);
  }

  if (ext === '.cpp' || ext === '.cc' || ext === '.cxx') {
    const includeRegex = /^\s*#include\s+[<\"]([^>\"]+)[>\"]/gm;
    while ((match = includeRegex.exec(content))) {
      deps.add(match[1]);
    }
  }

  return Array.from(deps);
};

const estimateFunctionCount = (content) => {
  let count = 0;
  const patterns = [
    /function\s+[a-zA-Z0-9_]+\s*\(/g,
    /const\s+[a-zA-Z0-9_]+\s*=\s*\(/g,
    /[=:\(]\s*async\s*[a-zA-Z0-9_]*\s*\(/g,
    /=>\s*\{/g,
    /^\s*def\s+[a-zA-Z0-9_]+\s*\(/gm,
    /^\s*class\s+[A-Za-z0-9_]+\s*[:{]/gm,
    /[A-Za-z0-9_\]]+\s*::\s*[A-Za-z0-9_]+\s*\(/g
  ];

  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      count += matches.length;
    }
  }

  return count;
};

const countImports = (content) => {
  const matches = content.match(/^(?:\s*import\s|\s*from\s+.+\s+import\s|\s*#include\s+)/gm);
  return matches ? matches.length : 0;
};

const buildStructureNode = (name, fullPath) => ({
  name,
  path: fullPath,
  type: 'directory',
  children: []
});

const findOrCreateDir = (parent, segment, fullPath) => {
  let child = parent.children.find((item) => item.type === 'directory' && item.name === segment);
  if (!child) {
    child = buildStructureNode(segment, fullPath);
    parent.children.push(child);
  }
  return child;
};

const addFileToStructure = (rootNode, relativePath, metadata) => {
  const segments = relativePath.split(path.sep);
  let cursor = rootNode;

  segments.forEach((segment, index) => {
    const isFile = index === segments.length - 1;
    const currentPath = path.join(cursor.path, segment);

    if (isFile) {
      cursor.children.push({
        name: segment,
        path: currentPath,
        type: 'file',
        lines: metadata.lines,
        functions: metadata.functions,
        imports: metadata.imports
      });
    } else {
      cursor = findOrCreateDir(cursor, segment, currentPath);
    }
  });
};

const scanProject = async (rootDir) => {
  const files = [];
  const dependencySet = new Set();

  const walk = async (currentDir) => {
    const entries = await fsp.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (SKIP_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!CODE_EXTENSIONS.has(ext)) {
        continue;
      }

      const contentRaw = await fsp.readFile(fullPath, 'utf8');
      const content = normalizeLineEndings(contentRaw);
      const lines = content.split('\n').length;
      const functions = estimateFunctionCount(content);
      const imports = countImports(content);
      const dependencies = extractDependencies(content, ext);
      dependencies.forEach((dep) => dependencySet.add(dep));

      const stats = await fsp.stat(fullPath);
      const relativePath = path.relative(rootDir, fullPath);

      files.push({
        path: relativePath,
        extension: ext,
        size: stats.size,
        lines,
        functions,
        imports,
        dependencies
      });
    }
  };

  await walk(rootDir);

  const aggregate = files.reduce(
    (acc, file) => {
      acc.totalLines += file.lines;
      acc.totalFunctions += file.functions;
      acc.totalImports += file.imports;
      return acc;
    },
    { totalLines: 0, totalFunctions: 0, totalImports: 0 }
  );

  const structureRoot = buildStructureNode(path.basename(rootDir) || path.basename(path.resolve(rootDir)), path.basename(rootDir) || '.');
  files.forEach((file) => addFileToStructure(structureRoot, file.path, file));

  return {
    root: rootDir,
    files,
    structure: structureRoot,
    aggregate: {
      fileCount: files.length,
      totalLines: aggregate.totalLines,
      totalFunctions: aggregate.totalFunctions,
      totalImports: aggregate.totalImports,
      uniqueDependencies: Array.from(dependencySet),
      dependencyCount: dependencySet.size
    }
  };
};

module.exports = { scanProject };
