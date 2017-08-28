import chalk from 'chalk';

const getNoTestFoundRelatedToChangedFiles = globalConfig => {
  return (
    chalk.bold('No tests found related to files changed since last commit.\n') +
    chalk.dim(
      globalConfig.watch
        ? 'Press `a` to run all tests, or run Jest with `--watchAll`.'
        : 'Run Jest without `-o` or with `--all` to run all tests.',
    )
  );
};

module.exports = getNoTestFoundRelatedToChangedFiles;
