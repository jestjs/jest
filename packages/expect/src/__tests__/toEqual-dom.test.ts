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

import {expect} from '@jest/globals';

describe('toEqual', () => {
  describe('duck type', () => {
    // https://github.com/jestjs/jest/issues/7786

    const createElement = (name: string, ...childNodes: Array<unknown>) => ({
      childNodes,
      nodeType: 1,
      tagName: name.toUpperCase(),
    });

    const createTextNode = (data: unknown) => ({
      data,
      nodeType: 3,
    });

    const createDocumentFragment = (...children: Array<unknown>) => ({
      children,
      nodeType: 11,
    });

    describe('Text', () => {
      test('isNot false', () => {
        const data = 'deep equal';

        const a = createTextNode(data);
        const b = createTextNode(data);

        expect(a).toEqual(b);
        expect(b).toEqual(a);
      });

      test('isNot true', () => {
        const a = createTextNode('not deep equal a');
        const b = createTextNode('not deep equal b');

        expect(a).not.toEqual(b);
        expect(b).not.toEqual(a);
      });
    });

    describe('Element', () => {
      test('isNot false', () => {
        const name = 'span';
        const data = 'deep equal';

        const a = createElement(name, createTextNode(data));
        const b = createElement(name, createTextNode(data));

        expect(a).toEqual(b);
        expect(b).toEqual(a);
      });

      test('isNot true', () => {
        const data = 'not deep equal';

        const a = createElement('strong', createTextNode(data));
        const b = createElement('span', createTextNode(data));

        expect(a).not.toEqual(b);
        expect(b).not.toEqual(a);
      });
    });

    describe('Fragment', () => {
      test('isNot false', () => {
        const name1 = 'strong';
        const name2 = 'span';
        const data1 = 'deep';
        const data2 = 'equal';

        const a = createDocumentFragment(
          createElement(name1, createTextNode(data1)),
          createElement(name2, createTextNode(data2)),
        );
        const b = createDocumentFragment(
          createElement(name1, createTextNode(data1)),
          createElement(name2, createTextNode(data2)),
        );

        expect(a).toEqual(b);
        expect(b).toEqual(a);
      });

      test('isNot true', () => {
        const name = 'span';
        const data1 = 'not';
        const data2 = 'deep equal';

        const a = createDocumentFragment(
          createElement('strong', createTextNode(data1)),
          createElement(name, createTextNode(data2)),
        );
        const b = createDocumentFragment(
          createElement(name, createTextNode(data1)),
          createElement(name, createTextNode(data2)),
        );

        expect(a).not.toEqual(b);
        expect(b).not.toEqual(a);
      });
    });
  });

  describe('document', () => {
    describe('createTextNode', () => {
      test('isNot false', () => {
        const data = 'deep equal';

        const a = document.createTextNode(data);
        const b = document.createTextNode(data);

        expect(a).toEqual(b);
        expect(b).toEqual(a);
      });

      test('isNot true', () => {
        const a = document.createTextNode('not deep equal a');
        const b = document.createTextNode('not deep equal b');

        expect(a).not.toEqual(b);
        expect(b).not.toEqual(a);
      });
    });

    describe('createElement', () => {
      test('isNot false', () => {
        const name = 'span';
        const data = 'deep equal';

        const a = document.createElement(name);
        const b = document.createElement(name);
        a.appendChild(document.createTextNode(data));
        b.appendChild(document.createTextNode(data));

        expect(a).toEqual(b);
        expect(b).toEqual(a);
      });

      test('isNot true', () => {
        const data = 'not deep equal';

        const a = document.createElement('strong');
        const b = document.createElement('span');
        a.appendChild(document.createTextNode(data));
        b.appendChild(document.createTextNode(data));

        expect(a).not.toEqual(b);
        expect(b).not.toEqual(a);
      });
    });

    describe('createDocumentFragment', () => {
      test('isNot false', () => {
        const name1 = 'strong';
        const name2 = 'span';
        const data1 = 'deep';
        const data2 = 'equal';

        const aSpan1 = document.createElement(name1);
        const bSpan1 = document.createElement(name1);
        aSpan1.appendChild(document.createTextNode(data1));
        bSpan1.appendChild(document.createTextNode(data1));

        const aSpan2 = document.createElement(name2);
        const bSpan2 = document.createElement(name2);
        aSpan2.appendChild(document.createTextNode(data2));
        bSpan2.appendChild(document.createTextNode(data2));

        const a = document.createDocumentFragment();
        const b = document.createDocumentFragment();
        a.appendChild(aSpan1);
        a.appendChild(aSpan2);
        b.appendChild(bSpan1);
        b.appendChild(bSpan2);

        expect(a).toEqual(b);
        expect(b).toEqual(a);
      });

      test('isNot true', () => {
        const name = 'span';
        const data1 = 'not';
        const data2 = 'deep equal';

        const aSpan1 = document.createElement('strong');
        const bSpan1 = document.createElement(name);
        aSpan1.appendChild(document.createTextNode(data1));
        bSpan1.appendChild(document.createTextNode(data1));

        const aSpan2 = document.createElement(name);
        const bSpan2 = document.createElement(name);
        aSpan2.appendChild(document.createTextNode(data2));
        bSpan2.appendChild(document.createTextNode(data2));

        const a = document.createDocumentFragment();
        const b = document.createDocumentFragment();
        a.appendChild(aSpan1);
        a.appendChild(aSpan2);
        b.appendChild(bSpan1);
        b.appendChild(bSpan2);

        expect(a).not.toEqual(b);
        expect(b).not.toEqual(a);
      });
    });
  });
});
