/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const visit = require('unist-util-visit');
const is = require('unist-util-is');

const importNodes = [
  {
    type: 'import',
    value: "import Tabs from '@theme/Tabs';",
  },
  {
    type: 'import',
    value: "import TabItem from '@theme/TabItem';",
  },
];

function parseTabMeta(nodeMeta) {
  const tabTag = nodeMeta.split(' ').filter(tag => tag.startsWith('tab'));
  if (tabTag.length < 1) return null;

  const tabMeta = tabTag[0].split('=')[1] || '{}';

  return JSON.parse(tabMeta);
}

const labels = new Map([
  ['js', 'JavaScript'],
  ['ts', 'TypeScript'],
]);

function createTabItem(node) {
  return [
    {
      type: 'jsx',
      value: `<TabItem value="${node.lang}" label="${labels.get(node.lang)}">`,
    },
    node,
    {
      type: 'jsx',
      value: '</TabItem>',
    },
  ];
}

function createTabs(node, index, parent, meta) {
  let tabsCount = 1;
  const tabsNode = [
    {
      type: 'jsx',
      value: '<Tabs groupId="code-examples">',
    },
    ...createTabItem(node),
  ];

  while (index + tabsCount <= parent.children.length) {
    const nextNode = parent.children[index + tabsCount];

    if (is(nextNode, 'code') && typeof node.meta === 'string') {
      const nextTabMeta = parseTabMeta(nextNode.meta);
      if (!nextTabMeta) break;

      tabsCount += 1;
      tabsNode.push(...createTabItem(nextNode));
    } else {
      break;
    }
  }

  if (tabsCount === 1) return null;

  tabsNode.push({
    type: 'jsx',
    value: '</Tabs>',
  });

  return {tabsNode, tabsCount};
}

module.exports = function tabsPlugin() {
  /** @param {import('@types/mdast').Root tree} */
  return tree => {
    let hasTabs = false;
    let includesImportTabs = false;

    visit(tree, ['code', 'import'], (node, index, parent) => {
      if (is(node, 'import') && node.value.includes('@theme/Tabs')) {
        includesImportTabs = true;
      }

      if (is(node, 'code') && typeof node.meta === 'string') {
        const tabMeta = parseTabMeta(node.meta);
        if (!tabMeta) return;

        const result = createTabs(node, index, parent, {...tabMeta});
        if (!result) return;

        hasTabs = true;
        parent.children.splice(index, result.tabsCount, ...result.tabsNode);
      }
    });

    if (hasTabs && !includesImportTabs) {
      tree.children.unshift(...importNodes);
    }
  };
};
