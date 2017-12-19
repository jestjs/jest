'use strict';

const pi = require('./pi');

module.exports.loadTest = function(callback) {
  callback(null, pi());
};
