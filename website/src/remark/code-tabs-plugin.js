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

  return {span: 1, ...JSON.parse(tabMeta)};
}

const labels = new Map([
  ['js', 'JavaScript'],
  ['ts', 'TypeScript'],
]);

function formatTabItem(nodes) {
  return [
    {
      type: 'jsx',
      value: `<TabItem value="${nodes[0].lang}" label="${labels.get(
        nodes[0].lang
      )}">`,
    },
    ...nodes,
    {
      type: 'jsx',
      value: '</TabItem>',
    },
  ];
}

function formatTabs(tabNodes) {
  return [
    {
      type: 'jsx',
      value: '<Tabs groupId="code-examples">',
    },
    ...tabNodes.map(node => formatTabItem(node)),
    {
      type: 'jsx',
      value: '</Tabs>',
    },
  ].flat();
}

function collectTabNodes(parent, index) {
  let nodeIndex = index;
  const tabNodes = [];

  do {
    const node = parent.children[nodeIndex];

    if (is(node, 'code') && typeof node.meta === 'string') {
      const tabMeta = parseTabMeta(node.meta);
      if (!tabMeta) break;

      tabNodes.push(parent.children.slice(nodeIndex, nodeIndex + tabMeta.span));
      nodeIndex += tabMeta.span;
    } else {
      break;
    }
  } while (nodeIndex <= parent.children.length);

  if (tabNodes.length <= 1) return null;

  return tabNodes;
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

      const tabNodes = collectTabNodes(parent, index);
      if (!tabNodes) return;

      hasTabs = true;
      const tabs = formatTabs(tabNodes);

      parent.children.splice(index, tabNodes.flat().length, ...tabs);

      // eslint-disable-next-line consistent-return
      return index + tabs.length;
    });

    if (hasTabs && !includesImportTabs) {
      tree.children.unshift(...importNodes);
    }
  };
};
