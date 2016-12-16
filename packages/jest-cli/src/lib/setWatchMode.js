const buildTestPathPatternInfo = require('./buildTestPathPatternInfo');

const setWatchMode = (argv, mode: 'watch' | 'watchAll', options) => {
  if (mode === 'watch') {
    argv.watch = true;
    argv.watchAll = false;
  } else if (mode === 'watchAll') {
    argv.watch = false;
    argv.watchAll = true;
  }

  // Reset before setting these to the new values
  argv._ = (options && options.pattern) || '';
  argv.onlyChanged = false;
  argv.onlyChanged =
    buildTestPathPatternInfo(argv).input === '' && !argv.watchAll;

  if (options && options.noSCM) {
    argv.noSCM = true;
  }
};

module.exports = setWatchMode;
