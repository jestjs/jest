'use strict';

require('core-js/proposals/reflect-metadata');
require('zone.js/dist/zone.js');
require('zone.js/dist/proxy.js');
require('zone.js/dist/sync-test');
require('zone.js/dist/async-test');
require('zone.js/dist/fake-async-test');
// eslint-disable-next-line import/no-extraneous-dependencies
require('jest-zone-patch');

const {getTestBed} = require('@angular/core/testing');
const testingModule = require('@angular/platform-browser-dynamic/testing');

getTestBed().initTestEnvironment(
  testingModule.BrowserDynamicTestingModule,
  testingModule.platformBrowserDynamicTesting(),
);
