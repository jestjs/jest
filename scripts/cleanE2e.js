'use strict';

const {normalize, resolve} = require('path');
const {sync: glob} = require('glob');
const {sync: rimraf} = require('rimraf');

const blacklist = [
  'e2e/global-setup-node-modules/node_modules/',
  'e2e/presets/js/node_modules/',
  'e2e/presets/json/node_modules/',
].map(dir => normalize(dir));

const e2eNodeModules = glob('e2e/*/node_modules/')
  .concat(glob('e2e/*/*/node_modules/'))
  .filter(dir => !blacklist.includes(dir))
  .map(dir => resolve(__dirname, '..', dir))
  .sort();

e2eNodeModules.forEach(dir => {
  rimraf(dir, {glob: false});
});
