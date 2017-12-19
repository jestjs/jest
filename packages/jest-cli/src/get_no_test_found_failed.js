import chalk from 'chalk';

export default function getNoTestFoundFailed() {
  return (
    chalk.bold('No failed test found.\n') +
    chalk.dim('Press `f` to run all tests.')
  );
}
