/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/*global jasmine, jasmineRequire*/

'use strict';

(function(root) {
  root.jasmine = jasmineRequire.core(jasmineRequire);

  var env = jasmine.getEnv();
  var jasmineInterface = jasmineRequire.interface(jasmine, env);

  Object.assign(root, jasmineInterface);

  env.addReporter(jasmineInterface.jsApiReporter);

  /**
   * Setting up timing functions to be able to be overridden.
   * Certain browsers (Safari, IE 8, phantomjs) require this hack.
   */
  root.setTimeout = root.setTimeout;
  root.setInterval = root.setInterval;
  root.clearTimeout = root.clearTimeout;
  root.clearInterval = root.clearInterval;
})(this);
