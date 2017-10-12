/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import traverse from 'babel-traverse';
import {getASTfor} from './parsers/babylon_parser';
import {utils} from 'jest-snapshot';

type Node = any;

type SnapshotMetadata = {
  exists: true | false,
  name: string,
  node: Node,
  content?: string,
};

const describeVariants = Object.assign(
  (Object.create(null): {[string]: boolean}),
  {
    describe: true,
    fdescribe: true,
    xdescribe: true,
  },
);
const base = Object.assign((Object.create(null): {[string]: boolean}), {
  describe: true,
  it: true,
  test: true,
});
const decorators = Object.assign((Object.create(null): {[string]: boolean}), {
  only: true,
  skip: true,
});

const validParents = Object.assign(
  (Object.create(null): any),
  base,
  describeVariants,
  Object.assign((Object.create(null): {[string]: boolean}), {
    fit: true,
    xit: true,
    xtest: true,
  }),
);

const isValidMemberExpression = node =>
  node.object &&
  base[node.object.name] &&
  node.property &&
  decorators[node.property.name];

const isDescribe = node =>
  describeVariants[node.name] ||
  (isValidMemberExpression(node) && node.object.name === 'describe');

const isValidParent = parent =>
  parent.callee &&
  (validParents[parent.callee.name] || isValidMemberExpression(parent.callee));

const getArrayOfParents = path => {
  const result = [];
  let parent = path.parentPath;
  while (parent) {
    result.unshift(parent.node);
    parent = parent.parentPath;
  }
  return result;
};

const buildName: (
  snapshotNode: Node,
  parents: Array<Node>,
  position: number,
) => string = (snapshotNode, parents, position) => {
  const fullName = parents.map(parent => parent.arguments[0].value).join(' ');

  let describeLess = '';
  if (!isDescribe(parents[0].callee)) {
    // If `it` or `test` exists without a surrounding `describe`
    // then `test ` is prepended to the snapshot fullName.
    describeLess = 'test ';
  }

  return utils.testNameToKey(describeLess + fullName, position);
};

export default class Snapshot {
  _parser: Function;
  _matchers: Array<string>;
  constructor(parser: any, customMatchers?: Array<string>) {
    this._parser = parser || getASTfor;
    this._matchers = ['toMatchSnapshot', 'toThrowErrorMatchingSnapshot'].concat(
      customMatchers || [],
    );
  }

  getMetadata(filePath: string): Array<SnapshotMetadata> {
    const fileNode = this._parser(filePath);
    const state = {
      found: [],
    };
    const Visitors = {
      Identifier(path, state, matchers) {
        if (matchers.indexOf(path.node.name) >= 0) {
          state.found.push({
            node: path.node,
            parents: getArrayOfParents(path),
          });
        }
      },
    };

    traverse(fileNode, {
      enter: path => {
        const visitor = Visitors[path.node.type];
        if (visitor != null) {
          visitor(path, state, this._matchers);
        }
      },
    });

    const snapshotPath = utils.getSnapshotPath(filePath);
    const snapshots = utils.getSnapshotData(snapshotPath, 'none').data;
    let lastParent = null;
    let count = 1;

    return state.found.map((snapshotNode, index) => {
      const parents = snapshotNode.parents.filter(isValidParent);
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
        node: snapshotNode.node,
      };

      if (!innerAssertion || isDescribe(innerAssertion.callee)) {
        // An expectation inside describe never gets executed.
        return result;
      }

      result.name = buildName(snapshotNode, parents, result.count);

      if (snapshots[result.name]) {
        result.exists = true;
        result.content = snapshots[result.name];
      }
      return result;
    });
  }
}
