'use strict';

const fs = require('graceful-fs');
const path = require('path');

const pkg = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '..', '..', './package.json'), 'utf8'));

exports.VERSION = pkg.version;

// log levels
exports.LOG_DISABLE = 'OFF';
exports.LOG_ERROR = 'ERROR';
exports.LOG_WARN = 'WARN';
exports.LOG_INFO = 'INFO';
exports.LOG_DEBUG = 'DEBUG';

// Default patterns for the logger
exports.COLOR_PATTERN = '%[%d{DATE}:%p [%c]: %]%m';
exports.NO_COLOR_PATTERN = '%d{DATE}:%p [%c]: %m';

exports.MAX_WORKERS = require('os').cpus().length;

exports.GLOB_OPTS = {
  // cwd: '/',
  follow: true,
  nodir: true,
  sync: true,
};

// Default console appender
exports.CONSOLE_APPENDER = {
  type: 'console',
  layout: {
    type: 'pattern',
    pattern: exports.COLOR_PATTERN,
  },
};
