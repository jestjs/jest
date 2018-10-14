import {wslToWindowsSync} from 'wsl-path';

export const readTestResults = (data: Buffer, workspace: ProjectWorkspace) => {
  const results = JSON.parse(data);
  if (!workspace.useWsl) {
    return results;
  }

  return Object.assign({}, results, {
    coverageMap: translateWslPathCoverateToWindowsPaths(
      results.coverageMap,
      workspace,
    ),
    testResults: translateWslTestResultsToWindowsPaths(
      results.testResults,
      workspace,
    ),
  });
};

/**
 * Return a rewritten copy a coverage map created by a jest run in wsl. All POSIX paths
 * are rewritten to Windows paths, so vscode-jest running in windows can map the coverage.
 *
 * @param coverageMap The coverage map to rewrite
 */
const translateWslPathCoverateToWindowsPaths = (
  coverageMap,
  workspace: ProjectWorkspace,
) => {
  if (!coverageMap) {
    return coverageMap;
  }
  const result = {};
  Object.keys(coverageMap).forEach(key => {
    const translatedPath = wslToWindowsSync(key, {
      wslCommand: getWslCommand(workspace),
    });
    const entry = Object.assign({}, coverageMap[key], {path: translatedPath});
    result[translatedPath] = entry;
  });
  return result;
};

/**
 * Return a rewritten copy a {@see JestFileResults} array created by a jest run in wsl. All POSIX paths
 * are rewritten to Windows paths, so vscode-jest running in windows can map the test
 * status.
 *
 * @param testResults the TestResults to rewrite
 */
const translateWslTestResultsToWindowsPaths = (
  testResults,
  workspace: ProjectWorkspace,
) => {
  if (!testResults) {
    return testResults;
  }
  return testResults.map(result =>
    Object.assign({}, result, {
      name: wslToWindowsSync(result.name, {
        wslCommand: getWslCommand(workspace),
      }),
    }),
  );
};

const getWslCommand = (workspace: ProjectWorkspace): string =>
  workspace.wslCommand === true ? 'wsl' : workspace.wslCommand;
