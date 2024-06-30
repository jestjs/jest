/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jsdom
 */

/// <reference lib="dom" />

/* eslint-env browser*/

import prettyFormat, {plugins} from '../';
import setPrettyPrint from './setPrettyPrint';

const {DOMElement} = plugins;

setPrettyPrint([DOMElement]);

describe('pretty-format', () => {
  // Test is not related to plugin but is related to jsdom testing environment.
  it('prints global window as constructor name alone', () => {
    expect(prettyFormat(window)).toBe('[Window]');
  });
});

describe('DOMElement Plugin', () => {
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
    const text = document.createTextNode('Jest');
    parent.append(text);

    expect(parent).toPrettyPrintTo(
      '<div\n  style="color: #99424F"\n>\n  Jest\n</div>',
    );
  });

  it('supports an element with text content', () => {
    const parent = document.createElement('div');
    const child = document.createTextNode('texty texty');
    parent.append(child);

    expect(parent).toPrettyPrintTo('<div>\n  texty texty\n</div>');
  });

  it('supports nested elements', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.append(child);
    expect(parent).toPrettyPrintTo('<div>\n  <span />\n</div>');
  });

  it('supports nested elements with attributes', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.append(child);

    // set attributes in sorted order by name
    child.setAttribute('class', 'classy');
    child.setAttribute('id', '123');

    expect(parent).toPrettyPrintTo(
      '<div>\n  <span\n    class="classy"\n    id="123"\n  />\n</div>',
    );
  });

  it('supports nested elements with attribute and text content', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.append(child);

    child.setAttribute('style', 'color: #99424F');
    const text = document.createTextNode('Jest');
    child.append(text);

    expect(parent).toPrettyPrintTo(
      '<div>\n  <span\n    style="color: #99424F"\n  >\n    Jest\n  </span>\n</div>',
    );
  });

  it('supports nested elements with text content', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.append(child);
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

  it('supports multiline text node in pre', () => {
    const parent = document.createElement('pre');
    parent.innerHTML = [
      // prettier-ignore
      'function sum(a, b) {',
      '  return a + b;',
      '}',
    ].join('\n');

    // Ouch. Two lines of text have same indentation for different reason:
    // First line of text node because it is at child level.
    // Second line of text node because they are in its content.
    expect(parent).toPrettyPrintTo(
      // prettier-ignore
      [
        '<pre>',
        '  function sum(a, b) {',
        '  return a + b;',
        '}',
        '</pre>'
      ].join('\n'),
    );
  });

  it('supports multiline text node preceding span in pre', () => {
    const parent = document.createElement('pre');
    parent.innerHTML = [
      '<span class="token keyword">function</span> sum(a, b) {',
      '  <span class="token keyword">return</span> a + b;',
      '}',
    ].join('\n');

    expect(parent).toPrettyPrintTo(
      [
        '<pre>',
        '  <span',
        '    class="token keyword"',
        '  >',
        '    function',
        '  </span>',
        '   sum(a, b) {',
        '  ',
        '  <span',
        '    class="token keyword"',
        '  >',
        '    return',
        '  </span>',
        '   a + b;',
        '}',
        '</pre>',
      ].join('\n'),
    );
  });

  it('supports multiline text node in textarea', () => {
    const textarea = document.createElement('textarea');
    textarea.setAttribute('name', 'tagline');
    textarea.innerHTML = `Painless.
JavaScript.
Testing.`;

    expect(textarea).toPrettyPrintTo(
      [
        '<textarea',
        '  name="tagline"',
        '>',
        '  Painless.',
        'JavaScript.',
        'Testing.',
        '</textarea>',
      ].join('\n'),
    );
  });

  it('supports empty text node', () => {
    // React 16 does not render text in comments (see below)
    const parent = document.createElement('span');
    const text = document.createTextNode('');
    parent.append(text);
    const abbr = document.createElement('abbr');
    abbr.setAttribute('title', 'meter');
    abbr.innerHTML = 'm';
    parent.append(abbr);

    expect(parent).toPrettyPrintTo(
      [
        '<span>',
        '  ',
        '  <abbr',
        '    title="meter"',
        '  >',
        '    m',
        '  </abbr>',
        '</span>',
      ].join('\n'),
    );
  });

  it('supports non-empty text node', () => {
    // React 16 does not render text in comments (see below)
    const parent = document.createElement('p');
    parent.innerHTML = [
      '<strong>Jest</strong>',
      ' means ',
      '<em>painless</em>',
      ' Javascript testing',
    ].join('');

    expect(parent).toPrettyPrintTo(
      [
        '<p>',
        '  <strong>',
        '    Jest',
        '  </strong>',
        '   means ',
        '  <em>',
        '    painless',
        '  </em>',
        '   Javascript testing',
        '</p>',
      ].join('\n'),
    );
  });

  it('supports comment node', () => {
    // React 15 does render text in comments
    const parent = document.createElement('p');
    parent.innerHTML = [
      '<strong>Jest</strong>',
      '<!-- react-text: 3 -->',
      ' means ',
      '<!-- /react-text -->',
      '<em>painless</em>',
      '<!-- react-text: 5 -->',
      ' Javascript testing',
      '<!-- /react-text -->',
    ].join('');

    expect(parent).toPrettyPrintTo(
      [
        '<p>',
        '  <strong>',
        '    Jest',
        '  </strong>',
        '  <!-- react-text: 3 -->',
        '   means ',
        '  <!-- /react-text -->',
        '  <em>',
        '    painless',
        '  </em>',
        '  <!-- react-text: 5 -->',
        '   Javascript testing',
        '  <!-- /react-text -->',
        '</p>',
      ].join('\n'),
    );
  });

  it('supports fragment node', () => {
    const fragment = document.createDocumentFragment();
    const browsers = [
      'Firefox',
      'Chrome',
      'Opera',
      'Safari',
      'Internet Explorer',
    ];

    for (const browser of browsers) {
      const li = document.createElement('li');
      li.textContent = browser;
      fragment.append(li);
    }

    expect(fragment).toPrettyPrintTo(
      [
        '<DocumentFragment>',
        '  <li>',
        '    Firefox',
        '  </li>',
        '  <li>',
        '    Chrome',
        '  </li>',
        '  <li>',
        '    Opera',
        '  </li>',
        '  <li>',
        '    Safari',
        '  </li>',
        '  <li>',
        '    Internet Explorer',
        '  </li>',
        '</DocumentFragment>',
      ].join('\n'),
    );
  });

  it('supports custom elements', () => {
    class CustomElement extends HTMLElement {}
    class CustomParagraphElement extends HTMLParagraphElement {}
    class CustomExtendedElement extends CustomElement {}

    customElements.define('custom-element', CustomElement);
    customElements.define('custom-extended-element', CustomExtendedElement);
    customElements.define('custom-paragraph', CustomParagraphElement, {
      extends: 'p',
    });
    customElements.define('anonymous-element', class extends HTMLElement {});

    const parent = document.createElement('div');
    parent.innerHTML = [
      '<custom-element></custom-element>',
      '<custom-extended-element></custom-extended-element>',
      '<p is="custom-paragraph"></p>',
      '<anonymous-element></anonymous-element>',
    ].join('');

    expect(parent).toPrettyPrintTo(
      [
        '<div>',
        '  <custom-element />',
        '  <custom-extended-element />',
        '  <p',
        '    is="custom-paragraph"',
        '  />',
        '  <anonymous-element />',
        '</div>',
      ].join('\n'),
    );
  });

  describe('matches constructor name of SVG elements', () => {
    // Too bad, so sad, element.constructor.name of SVG elements
    // is HTMLUnknownElement in jsdom v9 and v10
    // is Element in jsdom v11
    // instead of SVG…Element in browser DOM
    const expected = [
      '<svg',
      '  viewBox="0 0 1 1"',
      '>',
      '  <title>',
      '    JS community logo',
      '  </title>',
      '</svg>',
    ].join('\n');

    test('jsdom 9 and 10', () => {
      // Mock element objects to make sure the plugin really matches them.
      class SVGSVGElement {
        childNodes: Array<SVGTitleElement>;
        nodeType = 1;
        tagName = 'svg'; // lower case;

        constructor(
          public attributes: Array<Record<string, string>>,
          ...children: Array<SVGTitleElement>
        ) {
          this.childNodes = children;
        }
      }

      class SVGTitleElement {
        attributes: Array<Record<string, string>> = [];
        childNodes: Array<ChildNode>;
        nodeType = 1;
        tagName = 'title'; // lower case;

        constructor(title: string) {
          this.childNodes = [document.createTextNode(title)];
        }
      }

      const title = new SVGTitleElement('JS community logo');
      const svg = new SVGSVGElement(
        [{name: 'viewBox', value: '0 0 1 1'}],
        title,
      );

      expect(svg).toPrettyPrintTo(expected);
    });
    test('jsdom 11', () => {
      // Mock element objects to make sure the plugin really matches them.
      class Element {
        childNodes: Array<Element | string>;
        nodeType = 1;

        constructor(
          public tagName: string,
          public attributes: Array<Record<string, string>>,
          ...children: Array<Element | string>
        ) {
          this.childNodes = children;
        }
      }

      const title = new Element('title', [], 'JS community logo');
      const svg = new Element(
        'svg',
        [{name: 'viewBox', value: '0 0 1 1'}],
        title,
      );

      expect(svg).toPrettyPrintTo(expected);
    });
  });

  it('supports SVG elements', () => {
    // In jsdom v9, this is NOT a regression test. See above.
    const namespace = 'http://www.w3.org/2000/svg';

    const title = document.createElementNS(namespace, 'title');
    title.append(document.createTextNode('JS community logo'));

    const rect = document.createElementNS(namespace, 'rect');
    // printProps sorts attributes in order by name
    rect.setAttribute('width', '1');
    rect.setAttribute('height', '1');
    rect.setAttribute('fill', '#f7df1e');

    const polyline = document.createElementNS(namespace, 'polyline');
    polyline.setAttribute('id', 'J');
    polyline.setAttribute('points', '0.5,0.460 0.5,0.875 0.25,0.875');
    const comment = document.createComment('polyline for S');

    const g = document.createElementNS(namespace, 'g');
    g.setAttribute('fill', 'none');
    g.setAttribute('stroke', '#000000');
    g.setAttribute('stroke-width', '0.095');
    g.append(polyline);
    g.append(comment);

    const svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('viewBox', '0 0 1 1');
    svg.append(title);
    svg.append(rect);
    svg.append(g);

    const parent = document.createElement('div');
    parent.setAttribute('id', 'JS');
    parent.append(svg);

    expect(parent).toPrettyPrintTo(
      [
        '<div',
        '  id="JS"',
        '>',
        '  <svg',
        '    viewBox="0 0 1 1"',
        '  >',
        '    <title>',
        '      JS community logo',
        '    </title>',
        '    <rect',
        '      fill="#f7df1e"',
        '      height="1"',
        '      width="1"',
        '    />',
        '    <g',
        '      fill="none"',
        '      stroke="#000000"',
        '      stroke-width="0.095"',
        '    >',
        '      <polyline',
        '        id="J"',
        '        points="0.5,0.460 0.5,0.875 0.25,0.875"',
        '      />',
        '      <!--polyline for S-->',
        '    </g>',
        '  </svg>',
        '</div>',
      ].join('\n'),
    );
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
    dl.append(dt);
    dl.append(dd1);
    dl.append(dd2);

    expect(dl).toPrettyPrintTo(
      [
        '<dl>',
        '  <dt>',
        '    jest',
        '  </dt>',
        '  <dd>',
        '    to talk in a ',
        '    <em … />',
        '     manner',
        '  </dd>',
        '  <dd',
        '    style="color: #99424F"',
        '  >',
        '    <em … />',
        '     JavaScript testing',
        '  </dd>',
        '</dl>',
      ].join('\n'),
      {maxDepth: 2},
    );
  });

  it('handles `tagName` not being a string', () => {
    expect({
      name: 'value',
      tagName: {text: 'param'},
      type: 'string',
    }).toPrettyPrintTo(
      [
        'Object {',
        '  "name": "value",',
        '  "tagName": Object {',
        '    "text": "param",',
        '  },',
        '  "type": "string",',
        '}',
      ].join('\n'),
    );
  });

  it('handles jsdom attributes properly', () => {
    const attributes = require('jsdom/lib/jsdom/living/attributes');
    expect(DOMElement.test(attributes)).toBe(false);
  });
});
