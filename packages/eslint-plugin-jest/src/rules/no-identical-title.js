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

import type {EslintContext, CallExpression} from './types';

const describeAliases = [
  'describe.only',
  'describe.skip',
  'describe',
  'fdescribe',
  'xdescribe',
];

const testCaseNames = [
  'fit',
  'it.only',
  'it.skip',
  'it',
  'test.only',
  'test.skip',
  'test',
  'xit',
  'xtest',
];

function getNodeName(node) {
  if (node.type === 'MemberExpression') {
    return node.object.name + '.' + node.property.name;
  }
  return node.name;
}

function isDescribe(node) {
  return node
    && node.type === 'CallExpression'
    && describeAliases.indexOf(getNodeName(node.callee)) > -1;
}

function isTestCase(node) {
  return node
    && node.type === 'CallExpression'
    && testCaseNames.indexOf(getNodeName(node.callee)) > -1;
}

function newDescribeContext() {
  return {
    describeTitles: [],
    testTitles: [],
  };
}

function handleTestCaseTitles(context, titles, node, title) {
  if (isTestCase(node)) {
    if (titles.indexOf(title) !== -1) {
      context.report({
        message: 'Test title is used multiple times in the same test suite.',
        node,
      });
    }
    titles.push(title);
  }
}

function handleTestSuiteTitles(context, titles, node, title) {
  if (!isDescribe(node)) {
    return;
  }
  if (titles.indexOf(title) !== -1) {
    context.report({
      message: 'Test suite title is used multiple times.',
      node,
    });
  }
  titles.push(title);
}

function isFirstArgLiteral(node) {
  return (
    node.arguments &&
    node.arguments[0] &&
    node.arguments[0].type === 'Literal'
  );
}

module.exports = function(context: EslintContext) {
  const contexts = [
    newDescribeContext(),
  ];
  return {
    CallExpression(node: CallExpression) {
      const currentLayer = contexts[contexts.length - 1];
      if (isDescribe(node)) {
        contexts.push(newDescribeContext());
      }
      if (!isFirstArgLiteral(node)) {
        return;
      }

      const title = node.arguments[0].value;
      handleTestCaseTitles(context, currentLayer.testTitles, node, title);
      handleTestSuiteTitles(context, currentLayer.describeTitles, node, title);
    },
    'CallExpression:exit'(node: CallExpression) {
      if (isDescribe(node)) {
        contexts.pop();
      }
    },
  };
};
