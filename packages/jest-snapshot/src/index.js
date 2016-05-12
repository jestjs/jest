/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const common = require('./common');

const patchAttr = (attr, filePath) => {
  attr.onStart = function(onStart) {
    return function(context) {
      if (onStart) {
        onStart(context);
      }
      common.setLastTest(context.getFullName(), filePath);
    };
  }(attr.onStart);
};

const patchJasmine = (jasmine, filePath) => {
  jasmine.Spec = (realSpec => {
    const Spec = function Spec(attr) {
      patchAttr(attr, filePath);
      realSpec.call(this, attr);
    };
    Spec.prototype = realSpec.prototype;
    for (const statics in realSpec) {
      if (realSpec.hasOwnProperty(statics)) {
        Spec[statics] = realSpec[statics];
      }
    }
    return Spec;
  })(jasmine.Spec);
};

module.exports = {
  getMatchers: require('./getMatchers'),
  initialize: (jasmine, filePath, options) => {
    patchJasmine(jasmine, filePath);
    common.setJasmine(jasmine);
  },
};
