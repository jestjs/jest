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

function createTabs(nodes) {
  return [
    {
      type: 'jsx',
      value: '<Tabs groupId="code-examples">',
    },
    ...nodes,
    {
      type: 'jsx',
      value: '</Tabs>',
    },
  ];
}

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

function formatTabItems(node, index, parent) {
  const tabItems = [createTabItem(node)];

  while (index + tabItems.length <= parent.children.length) {
    const nextNode = parent.children[index + tabItems.length];

    if (is(nextNode, 'code') && typeof node.meta === 'string') {
      const nextTabMeta = parseTabMeta(nextNode.meta);
      if (!nextTabMeta) break;

      tabItems.push(createTabItem(nextNode));
    } else {
      break;
    }
  }

  if (tabItems.length === 1) return null;

  return tabItems;
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

        const tabItems = formatTabItems(node, index, parent);
        if (!tabItems) return;

        const tabs = createTabs(tabItems.flat());

        hasTabs = true;
        parent.children.splice(index, tabItems.length, ...tabs);

        // eslint-disable-next-line consistent-return
        return index + tabs.length;
      }
    });

    if (hasTabs && !includesImportTabs) {
      tree.children.unshift(...importNodes);
    }
  };
};
