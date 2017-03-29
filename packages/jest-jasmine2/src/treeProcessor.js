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
  finish: () => void,
  nodeComplete: (suite: any, result: any) => void,
  nodeStart: (suite: any) => void,
  queueRunnerFactory: any,
  runnableIds: Array<string>,
  tree: any,
};

const defaultMin = Infinity;
const startingMin = (min: number) => min === -1 ? defaultMin : min;

function treeProcessor(options: Options) {
  const {finish, nodeComplete, nodeStart, queueRunnerFactory, runnableIds, tree} = options;
  const stats: Map<string, object> = new Map();

  stats.set(tree.id, processNode(tree, false));

  queueRunnerFactory({
    onComplete: finish,
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
          node.execute(done, stats.get(node.id).executable);
        },
      };
    }
    return {
      fn(done) {
        nodeStart(node);
        queueRunnerFactory({
          onComplete() {
            nodeComplete(node, node.getResult());
            done();
          },
          onException() {
            node.onException.apply(node, arguments);
          },
          queueableFns: wrapChildren(node),
          userContext: node.sharedUserContext(),
        });
      },
    };
  }

  function processNode(node, parentEnabled) {
    const executableIndex = runnableIds.indexOf(node.id);
    parentEnabled = (parentEnabled || executableIndex !== -1) && node.isExecutable();

    if (!node.children) {
      return {
        executable: parentEnabled,
        min: startingMin(executableIndex),
        owner: node,
        nodes: [node],
      };
    }
    const nodes = node.children.map(child => {
      const childStat = processNode(child, parentEnabled);
      stats.set(child.id, childStat);
      return childStat;
    });
    const executable = nodes.some(child => child.executable);
    const min = Math.min(startingMin(executableIndex), ...nodes.map(node => node.min));
    return {
      executable,
      min,
      nodes,
      owner: node,
    };
  }

  function wrapChildren(node) {
    const result = stats.get(node.id).nodes.map(child => executeNode(child.owner));
    return [...node.beforeAllFns, ...result, ...node.afterAllFns];
  }
}

module.exports = treeProcessor;
