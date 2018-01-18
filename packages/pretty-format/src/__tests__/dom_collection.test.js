/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jsdom
 * @flow
 */
/* eslint-env browser*/

'use strict';

const prettyFormat = require('../');
const {DOMCollection} = prettyFormat.plugins;
const toPrettyPrintTo = require('./expect_util').getPrettyPrint([
  DOMCollection,
]);

const expect: any = global.expect;
expect.extend({toPrettyPrintTo});

describe('DOMCollection Plugin', () => {
  it('supports a DOMStringMap', () => {
    const el = document.createElement('div');
    el.dataset.foo = 'bar';

    expect(el.dataset).toPrettyPrintTo('DOMStringMap {\n  "foo": "bar",\n}');
  });

  it('supports a NamedNodeMap', () => {
    const el = document.createElement('div');
    el.setAttribute('foo', 'bar');

    expect(el.attributes).toPrettyPrintTo('NamedNodeMap {\n  "foo": "bar",\n}');
  });
});
