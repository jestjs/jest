'use strict';

const pi = require('./pi');

module.exports.loadTest = function(callback) {
  callback(null, pi());
};

module.exports.empty = function(callback) {
  // Do nothing.
  callback();
};
