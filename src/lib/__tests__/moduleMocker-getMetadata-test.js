/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();

describe('moduleMocker-getMetadata', function() {
  var moduleMocker;

  beforeEach(function() {
    moduleMocker = require('../moduleMocker');
  });

  it('mocks functions that begin with underscores', function () {
    var component = {
      foo: function() {},
      _bar: function() {},
      _: function() {}
    };

    var members = Object.keys(moduleMocker.getMetadata(component).members);
    expect(members).toContain('foo');
    expect(members).toContain('_bar');
    expect(members).toContain('_');
  });
});
