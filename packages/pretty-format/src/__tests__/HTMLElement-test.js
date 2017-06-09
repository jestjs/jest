/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @jest-environment jsdom
 */
/* eslint-env browser*/

'use strict';

const HTMLElementPlugin = require('../plugins/HTMLElement');
const toPrettyPrintTo = require('./expect-util').getPrettyPrint([
  HTMLElementPlugin,
]);

expect.extend({toPrettyPrintTo});

describe('HTMLElement Plugin', () => {
  it('supports a single HTML element', () => {
    expect(document.createElement('div')).toPrettyPrintTo('<div />');
  });

  it('supports an HTML element with a class property', () => {
    const parent = document.createElement('div');
    parent.className = 'classy';

    expect(parent).toPrettyPrintTo('<div\n  class="classy"\n/>');
  });

  it('supports an HTML element with a title property', () => {
    const parent = document.createElement('div');
    parent.title = 'title text';

    expect(parent).toPrettyPrintTo('<div\n  title="title text"\n/>');
  });

  it('supports an HTML element with a single attribute', () => {
    const parent = document.createElement('div');
    parent.setAttribute('class', 'classy');

    expect(parent).toPrettyPrintTo('<div\n  class="classy"\n/>');
  });

  it('supports an HTML element with multiple attributes', () => {
    const parent = document.createElement('div');
    // set attributes in unsorted order by name to verify sorting
    parent.setAttribute('id', 123);
    parent.setAttribute('class', 'classy');

    expect(parent).toPrettyPrintTo('<div\n  class="classy"\n  id="123"\n/>');
  });

  it('supports an element with text content', () => {
    const parent = document.createElement('div');
    parent.innerHTML = 'texty texty';

    expect(parent).toPrettyPrintTo('<div>\n  texty texty\n</div>');
  });

  it('supports nested elements', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    expect(parent).toPrettyPrintTo('<div>\n  <span />\n</div>');
  });

  it('supports nested elements with attributes', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);

    // set attributes in sorted order by name
    child.setAttribute('class', 'classy');
    child.setAttribute('id', 123);

    expect(parent).toPrettyPrintTo(
      '<div>\n  <span\n    class="classy"\n    id="123"\n  />\n</div>',
    );
  });

  it('supports nested elements with text content', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    child.textContent = 'texty texty';

    expect(parent).toPrettyPrintTo(
      '<div>\n  <span>\n    texty texty\n  </span>\n</div>',
    );
  });

  it('supports siblings', () => {
    const parent = document.createElement('div');
    parent.innerHTML = '<span>some </span><span>text</span>';

    expect(parent).toPrettyPrintTo(
      [
        '<div>',
        '  <span>',
        '    some ',
        '  </span>',
        '  <span>',
        '    text',
        '  </span>',
        '</div>',
      ].join('\n'),
    );
  });

  it('trims unnecessary whitespace', () => {
    const parent = document.createElement('div');
    parent.innerHTML = `
       <span>
         some
         apple
         pseudo-multilne text
                </span>
    <span>text</span>
    `;

    expect(parent).toPrettyPrintTo(
      [
        '<div>',
        '  <span>',
        '    some apple pseudo-multilne text',
        '  </span>',
        '  <span>',
        '    text',
        '  </span>',
        '</div>',
      ].join('\n'),
    );
  });

  it('supports text node', () => {
    const parent = document.createElement('div');
    parent.innerHTML = 'some <span>text</span>';

    // prettier-ignore
    expect(parent).toPrettyPrintTo([
      '<div>',
      '  some ',
      '  <span>',
      '    text',
      '  </span>',
      '</div>',
    ].join('\n'));
  });

  it('supports comment node', () => {
    const parent = document.createElement('div');
    parent.innerHTML = 'some <!-- comments -->';

    // prettier-ignore
    expect(parent).toPrettyPrintTo([
      '<div>',
      '  some ',
      '  <!-- comments -->',
      '</div>',
    ].join('\n'));
  });
});
