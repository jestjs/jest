/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @jest-environment jsdom
 * @flow
 */
/* eslint-env browser*/

'use strict';

const prettyFormat = require('../');
const {HTMLElement} = prettyFormat.plugins;
const toPrettyPrintTo = require('./expect_util').getPrettyPrint([HTMLElement]);

const expect: any = global.expect;
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

  test('escapes double quote in attribute value', () => {
    const parent = document.createElement('div');
    parent.setAttribute('title', '"escape"');

    expect(parent).toPrettyPrintTo('<div\n  title="\\"escape\\""\n/>');
  });

  it('supports an HTML element with a single attribute', () => {
    const parent = document.createElement('div');
    parent.setAttribute('class', 'classy');

    expect(parent).toPrettyPrintTo('<div\n  class="classy"\n/>');
  });

  it('supports an HTML element with multiple attributes', () => {
    const parent = document.createElement('div');
    // set attributes in unsorted order by name to verify sorting
    parent.setAttribute('id', '123');
    parent.setAttribute('class', 'classy');

    expect(parent).toPrettyPrintTo('<div\n  class="classy"\n  id="123"\n/>');
  });

  it('supports an HTML element with attribute and text content', () => {
    const parent = document.createElement('div');
    parent.setAttribute('style', 'color: #99424F');
    parent.innerHTML = 'Jest';

    expect(parent).toPrettyPrintTo(
      '<div\n  style="color: #99424F"\n>\n  Jest\n</div>',
    );
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
    child.setAttribute('id', '123');

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

  it('supports indentation for array of elements', () => {
    // For example, Array.prototype.slice.call(document.getElementsByTagName(…))
    const dd1 = document.createElement('dd');
    dd1.innerHTML = 'to talk in a playful manner';

    const dd2 = document.createElement('dd');
    dd2.innerHTML = 'painless JavaScript testing';
    dd2.setAttribute('style', 'color: #99424F');

    expect([dd1, dd2]).toPrettyPrintTo(
      [
        'Array [',
        '  <dd>',
        '    to talk in a playful manner',
        '  </dd>,',
        '  <dd',
        '    style="color: #99424F"',
        '  >',
        '    painless JavaScript testing',
        '  </dd>,',
        ']',
      ].join('\n'),
    );
  });

  it('supports maxDepth option', () => {
    const dt = document.createElement('dt');
    dt.innerHTML = 'jest';

    const dd1 = document.createElement('dd');
    dd1.innerHTML = 'to talk in a <em>playful</em> manner';

    const dd2 = document.createElement('dd');
    dd2.innerHTML = '<em>painless</em> JavaScript testing';
    dd2.setAttribute('style', 'color: #99424F');

    const dl = document.createElement('dl');
    dl.appendChild(dt);
    dl.appendChild(dd1);
    dl.appendChild(dd2);

    expect(dl).toPrettyPrintTo(
      [
        '<dl>',
        '  <dt>',
        '    jest',
        '  </dt>',
        '  <dd>',
        '    to talk in a ',
        '    <em … />',
        '    manner', // plugin incorrectly trims preceding space
        '  </dd>',
        '  <dd',
        '    style="color: #99424F"',
        '  >',
        '    <em … />',
        '    JavaScript testing', // plugin incorrectly trims preceding space
        '  </dd>',
        '</dl>',
      ].join('\n'),
      {maxDepth: 2},
    );
  });
});
