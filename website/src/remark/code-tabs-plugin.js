/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const visit = require('unist-util-visit');

const transformTabNode = (node, options) => {
  const label = new Map([
    ['js', 'JavaScript'],
    ['ts', 'TypeScript'],
  ]);

  return [
    {
      type: 'jsx',
      value: `${
        options.first ? '<Tabs groupId="code-examples">\n' : ''
      }<TabItem value="${node.lang}" label="${label.get(node.lang)}">`,
    },
    node,
    {
      type: 'jsx',
      value: `</TabItem>${options.last ? '\n</Tabs>' : ''}`,
    },
  ];
};

const isImport = node => node.type === 'import';
const isParent = node => Array.isArray(node.children);
const isTab = node =>
  node.type === 'code' &&
  node.meta.split(' ').some(tag => tag.startsWith('tab'));

const isFirstTab = (node, index, parent) => {
  if (!isTab(node)) {
    return false;
  }

  const nextChild = parent.children[index + 1];
  const previousChild = parent.children[index - 1];

  const isNextChildTab = nextChild ? isTab(nextChild) : false;
  const isPreviousChildTab = previousChild ? isTab(previousChild) : false;

  return isNextChildTab && !isPreviousChildTab;
};

const isLastTab = (node, index, parent) => {
  if (!isTab(node)) {
    return false;
  }

  const nextChild = parent.children[index + 1];
  const previousChild = parent.children[index - 1];

  const isNextChildTab = nextChild ? isTab(nextChild) : false;
  // it should be already transformed
  const isPreviousChildTab =
    previousChild?.type === 'jsx' && previousChild?.value === '</TabItem>';

  return !isNextChildTab && isPreviousChildTab;
};

const importTabsNode = {
  type: 'import',
  value:
    "import Tabs from '@theme/Tabs';\nimport TabItem from '@theme/TabItem';",
};

const tabsPlugin = () => root => {
  let hasTabs = false;
  let hasImportTabsNode = false;

  visit(root, node => {
    if (isImport(node) && node.value.includes('@theme/Tabs')) {
      hasImportTabsNode = true;
    }

    if (isParent(node)) {
      let index = 0;
      while (index < node.children.length) {
        const child = node.children[index];

        if (isFirstTab(child, index, node)) {
          const result = transformTabNode(child, {first: true});
          node.children.splice(index, 1, ...result);

          index += result.length;
          hasTabs = true;
        } else if (isLastTab(child, index, node)) {
          const result = transformTabNode(child, {last: true});
          node.children.splice(index, 1, ...result);

          index += result.length;
          hasTabs = true;
        } else {
          index += 1;
        }
      }
    }
  });

  if (hasTabs && !hasImportTabsNode) {
    root.children.unshift(importTabsNode);
  }
};

module.exports = tabsPlugin;
