/* eslint-disable global-require */
/**
 * @fileoverview Eslint plugin for Jest
 * @author Jonathan Kim
 */
'use strict';

module.exports.rules = {
  'no-exclusive-tests': require('./rules/no-exclusive-tests'),
  'no-identical-title': require('./rules/no-identical-title'),
};
