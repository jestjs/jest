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

type Options = {
  nodeComplete: (suite: TreeNode) => void,
  nodeStart: (suite: TreeNode) => void,
  queueRunnerFactory: any,
  runnableIds: Array<string>,
  tree: TreeNode,
};

type Stat = {
  executable: boolean,
  nodes: Array<Stat>,
  owner: TreeNode,
};

type TreeNode = {
  afterAllFns: Array<any>,
  beforeAllFns: Array<any>,
  execute: (onComplete: () => void, enabled: boolean) => void,
  id: string,
  isExecutable: () => boolean,
  onException: () => void,
  sharedUserContext: () => any,
  children?: Array<TreeNode>,
};

function treeProcessor(options: Options) {
  const {
    nodeComplete,
    nodeStart,
    queueRunnerFactory,
    runnableIds,
    tree,
  } = options;
  const stats: Map<string, Stat> = new Map();

  stats.set(tree.id, processNode(tree, false));

  return queueRunnerFactory({
    onException() {
      tree.onException.apply(tree, arguments);
    },
    queueableFns: wrapChildren(tree),
    userContext: tree.sharedUserContext(),
  });

  function executeNode(node) {
    if (!node.children) {
      return {
        fn(done) {
          const nodeStats = stats.get(node.id);
          if (!nodeStats) {
            throw new Error(`stats could not be found for ${node.id}.`);
          }
          node.execute(done, nodeStats.executable);
        },
      };
    }
    return {
      async fn(done) {
        nodeStart(node);
        await queueRunnerFactory({
          onException() {
            node.onException.apply(node, arguments);
          },
          queueableFns: wrapChildren(node),
          userContext: node.sharedUserContext(),
        });
        nodeComplete(node);
        done();
      },
    };
  }

  function processNode(node: TreeNode, parentEnabled: boolean) {
    const index = runnableIds.indexOf(node.id);
    const enabled = (parentEnabled || index !== -1) && node.isExecutable();

    if (!node.children) {
      return {
        executable: enabled,
        nodes: [],
        owner: node,
      };
    }
    const nodes = node.children.map(child => {
      const childStat = processNode(child, enabled);
      stats.set(child.id, childStat);
      return childStat;
    });
    const executable = nodes.some(child => child.executable);
    return {
      executable,
      nodes,
      owner: node,
    };
  }

  function wrapChildren(node: TreeNode) {
    const nodeStats = stats.get(node.id);
    if (!nodeStats) {
      throw new Error(`stats could not be found for ${node.id}.`);
    }
    const result = nodeStats.nodes.map(child => executeNode(child.owner));
    return [...node.beforeAllFns, ...result, ...node.afterAllFns];
  }
}

module.exports = treeProcessor;
