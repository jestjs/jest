'use strict';

const pi = require('./pi');

module.exports.loadTest = function() {
  return pi();
};

module.exports.empty = function() {
  // Do nothing.
};
