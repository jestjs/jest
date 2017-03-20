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

// properties we can safely ignore.
const ignoreList = Object.assign(
  (Object.create(null): any),
  {
    'loc': true,
    'tokens': true,
  }
);
const byIgnoreList = key => !ignoreList[key];

type Node = any;

const keys = node => Object.keys(node).filter(byIgnoreList);

const walker = (
  node: Node,
  visitors: any,
  state:any,
  parents: Array<Node> = []
) => {
  if (typeof node !== 'object') {
    return;
  }
  keys(node).forEach(key => {
    let nextCallback = null;
    const visitNode = node[key];
    if (!visitNode) {
      return;
    }
    const nextParents = parents.slice().concat(node);

    if (Array.isArray(visitNode)) {
      visitNode.forEach(child => walker(child, visitors, state, nextParents));
    } else {
      if (nextCallback = visitors[visitNode.type]) {
        nextCallback(visitNode, state, nextParents);
      }
      walker(visitNode, visitors, state, nextParents);
    }
  });
};

module.exports = walker;
