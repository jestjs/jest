/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type Options = {
  nodeComplete: (suite: TreeNode) => void,
  nodeStart: (suite: TreeNode) => void,
  queueRunnerFactory: any,
  runnableIds: Array<string>,
  tree: TreeNode,
};

type TreeNode = {
  afterAllFns: Array<any>,
  beforeAllFns: Array<any>,
  execute: (onComplete: () => void, enabled: boolean) => void,
  id: string,
  onException: (error: Error) => void,
  sharedUserContext: () => any,
  children?: Array<TreeNode>,
};

// Try getting the real promise object from the context, if available. Someone
// could have overridden it in a test. Async functions return it implicitly.
// eslint-disable-next-line no-unused-vars
const Promise = global[Symbol.for('jest-native-promise')] || global.Promise;

export default function treeProcessor(options: Options) {
  const {
    nodeComplete,
    nodeStart,
    queueRunnerFactory,
    runnableIds,
    tree,
  } = options;

  function isEnabled(node, parentEnabled) {
    return parentEnabled || runnableIds.indexOf(node.id) !== -1;
  }

  const processTree = getNodeWithChildrenHandler(tree, isEnabled(tree, false));
  return processTree();

  function executeNode(node, parentEnabled) {
    const enabled = isEnabled(node, parentEnabled);
    if (!node.children) {
      return {
        fn(done) {
          node.execute(done, enabled);
        },
      };
    }
    return {
      fn: getNodeWithChildrenHandler(node, enabled),
    };
  }

  function mapChildren(children: TreeNode[], enabled: boolean) {
    return children.map(child => executeNode(child, enabled));
  }

  function getNodeWithChildrenHandler(node, enabled) {
    return async function fn(done) {
      nodeStart(node);
      const userContext = node.sharedUserContext();
      const onException = error => node.onException(error);
      if (node.beforeAllFns.length) {
        await queueRunnerFactory({
          onException,
          queueableFns: node.beforeAllFns,
          userContext,
        });
      }
      // Flow is pessimistic about node.children being undefined, the || [] is a no-op:
      const syncChildren = node.children || [];
      const childrenCount = syncChildren.length;
      await queueRunnerFactory({
        onException,
        queueableFns: mapChildren(node.children || [], enabled),
        userContext,
      });
      // if any new children were added during their execution, process them now:
      const asyncChildren = (node.children || []).slice(childrenCount);
      if (asyncChildren.length > 0) {
        await queueRunnerFactory({
          onException,
          queueableFns: mapChildren(asyncChildren, enabled),
          userContext,
        });
      }
      if (node.afterAllFns.length) {
        await queueRunnerFactory({
          onException: error => node.onException(error),
          queueableFns: node.afterAllFns,
          userContext: node.sharedUserContext(),
        });
      }
      nodeComplete(node);
      if (done) done();
    };
  }
}
