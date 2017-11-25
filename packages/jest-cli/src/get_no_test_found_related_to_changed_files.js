import chalk from 'chalk';
import isInteractive from './check_if_interative';

export default function getNoTestFoundRelatedToChangedFiles(globalConfig) {
  let msg = chalk.bold(
    'No tests found related to files changed since last commit.',
  );

  if (isInteractive) {
    msg += chalk.dim(
      '\n' + globalConfig.watch
        ? 'Press `a` to run all tests, or run Jest with `--watchAll`.'
        : 'Run Jest without `-o` or with `--all` to run all tests.',
    );
  }

  return msg;
}
