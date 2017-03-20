/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const fs = require('fs');
const walker = require('./walker');
const {utils} = require('jest-snapshot');

type Node = any;

type SnapshotMetadata = {
  exists: true | false,
  name: string,
  node: Node,
  content?: string,
};

// create a lookup table from an array.
const lookupFromArray = array => array.reduce(
  (table: any, prop) => {
    table[prop] = true;
    return table;
  },
  Object.create(null)
);

const describeVariants = lookupFromArray([
  'describe',
  'fdescribe',
  'xdescribe',
]);
const base = lookupFromArray(['describe', 'it', 'test']);
const decorators = lookupFromArray(['only', 'skip']);

const validParents = Object.assign(
  (Object.create(null): any),
  base,
  describeVariants,
  lookupFromArray(['xtest', 'xit', 'fit'])
);

const isValidMemberExpression = node => (
  node.object && base[node.object.name] &&
  node.property && decorators[node.property.name]
);

const isDescribe = node => (
  describeVariants[node.name] || (
  isValidMemberExpression(node) && node.object.name === 'describe'
));

const isValidParent = parent => (
  parent.callee &&
  (
    validParents[parent.callee.name] ||
    isValidMemberExpression(parent.callee)
  )
);

const buildname: (
  toMatchSnapshot: Node,
  parents: Array<Node>,
  position: number,
) => string = (toMatchSnapshot, parents, position) => {

  const fullName = parents.map(parent => parent.arguments[0].value).join(' ');

  let describeLess = '';
  if (!isDescribe(parents[0].callee)) {
    // if `it` or `test` exists without a surrounding `describe`
    // then `test ` is prepended to the snapshot fullName
    describeLess = 'test ';
  }

  return utils.testNameToKey(describeLess + fullName, position);
};

module.exports = class Snapshot {
  _parser: Function;
  _parserOptions: any;

  constructor(parser: any, parserOptions: any) {
    this._parser = parser || require('babylon').parse;
    this._parserOptions = parserOptions || {
      plugins: [
        'jsx', 'flow', 'objectRestSpread', 'classProperties',
      ],
      sourceType: 'module',
    };
  }

  getMetadata(filePath: string): Array<SnapshotMetadata> {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const fileNode = this._parser(fileContent, this._parserOptions);

    const state = {
      found: [],
    };

    walker(fileNode, {
      Identifier(node, state, parents) {
        if (node.name === 'toMatchSnapshot') {
          state.found.push({node, parents});
        }
      },
    }, state);

    let lastParent = null;
    let count = 1;

    const snapshotPath = utils.getSnapshotPath(filePath);
    const snapshots = utils.getSnapshotData(snapshotPath, false).data;

    return state.found.map(toMatchSnapshot => {

      const parents = toMatchSnapshot.parents.filter(isValidParent);
      const innerAssertion = parents[parents.length - 1];

      if (lastParent !== innerAssertion) {
        lastParent = innerAssertion;
        count = 1;
      }

      const result = {
        content: undefined,
        count: count++,
        exists: false,
        name: '',
        node: toMatchSnapshot.node,
      };

      if (!innerAssertion || isDescribe(innerAssertion.callee)) {
        // an expectation inside a describe never get executed.
        return result;
      }

      result.name = buildname(toMatchSnapshot, parents, result.count);

      if (snapshots[result.name]) {
        result.exists = true;
        result.content = snapshots[result.name];
      }

      return result;
    });
  }
};
