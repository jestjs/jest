/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 * 
 * @jest-environment jsdom
 */
/* eslint-disable max-len */
/* eslint-env browser*/

'use strict';

const HTMLElementPlugin = require('../plugins/HTMLElement');
const toPrettyPrintTo = require('./expect-util').getPrettyPrint([
  HTMLElementPlugin,
]);

expect.extend({toPrettyPrintTo});

describe('HTMLElement Plugin', () => {
  it('supports a single HTML element', () => {
    expect(document.createElement('div')).toPrettyPrintTo('<HTMLDivElement />');
  });

  it('supports an HTML element with a class property', () => {
    const parent = document.createElement('div');
    parent.className = 'classy';

    expect(parent).toPrettyPrintTo('<HTMLDivElement\n  class="classy"\n/>');
  });

  it('supports an HTML element with a title property', () => {
    const parent = document.createElement('div');
    parent.title = 'title text';

    expect(parent).toPrettyPrintTo('<HTMLDivElement\n  title="title text"\n/>');
  });

  it('supports an HTML element with a single attribute', () => {
    const parent = document.createElement('div');
    parent.setAttribute('class', 'classy');

    expect(parent).toPrettyPrintTo('<HTMLDivElement\n  class="classy"\n/>');
  });

  it('supports an HTML element with multiple attributes', () => {
    const parent = document.createElement('div');
    parent.setAttribute('id', 123);
    parent.setAttribute('class', 'classy');

    expect(
      parent,
    ).toPrettyPrintTo('<HTMLDivElement\n  id="123"\n  class="classy"\n/>', {});
  });

  it('supports an element with text content', () => {
    const parent = document.createElement('div');
    parent.innerHTML = 'texty texty';

    expect(parent).toPrettyPrintTo(
      '<HTMLDivElement>\n  texty texty\n</HTMLDivElement>',
    );
  });

  it('supports nested elements', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    expect(parent).toPrettyPrintTo(
      '<HTMLDivElement>\n  <HTMLSpanElement />\n</HTMLDivElement>',
    );
  });

  it('supports nested elements with attributes', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);

    child.setAttribute('id', 123);
    child.setAttribute('class', 'classy');

    expect(parent).toPrettyPrintTo(
      '<HTMLDivElement>\n  <HTMLSpanElement\n    id="123"\n    class="classy"\n  />\n</HTMLDivElement>',
    );
  });

  it('supports nested elements with text content', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    child.textContent = 'texty texty';

    expect(parent).toPrettyPrintTo(
      '<HTMLDivElement>\n  <HTMLSpanElement>\n    texty texty\n  </HTMLSpanElement>\n</HTMLDivElement>',
    );
  });
});
