import chalk from 'chalk';
import pluralize from './pluralize';

const getNoTestFound = (testRunData, globalConfig): string => {
  const testFiles = testRunData.reduce(
    (current, testRun) => (current += testRun.matches.total),
    0,
  );
  return (
    chalk.bold('No tests found') +
    '\n' +
    `In ${chalk.bold(process.cwd())}` +
    '\n' +
    `  ${pluralize('file', testFiles, 's')} checked across ${pluralize(
      'project',
      testRunData.length,
      's',
    )}. for more details run with \`--verbose\`` +
    '\n' +
    `Pattern: ${chalk.yellow(globalConfig.testPathPattern)} - 0 matches`
  );
};

module.exports = getNoTestFound;
