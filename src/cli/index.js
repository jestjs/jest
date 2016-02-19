'use strict';

const fs = require('fs');
const getJest = require('./getJest');
const path = require('path');
const processArgs = require('./processArgs');
const optimist = require('optimist');

function packageRoot() {
  const cwd = process.cwd();

  // Is the cwd somewhere within an npm package?
  let cwdPackageRoot = cwd;
  while (!fs.existsSync(path.join(cwdPackageRoot, 'package.json'))) {
    if (cwdPackageRoot === '/' || cwdPackageRoot.match(/^[A-Z]:\\/)) {
      cwdPackageRoot = cwd;
      break;
    }
    cwdPackageRoot = path.resolve(cwdPackageRoot, '..');
  }

  return cwdPackageRoot;
}

function Run() {
  const argv = processArgs();

  if (argv.help) {
    optimist.showHelp();

    process.on('exit', function() {
      process.exit(1);
    });

    return;
  }

  const cwdPackageRoot = packageRoot();
  const jest = getJest(cwdPackageRoot);

  jest.runCLI(argv, cwdPackageRoot, function(success) {
    process.on('exit', function() {
      process.exit(success ? 0 : 1);
    });
  });
}

exports.Run = Run;