'use strict';

var describeAliases = [
  'describe',
  'xdescribe',
  'describe.only',
  'describe.skip',
  'fdescribe',
];

var testCaseNames = [
  'it',
  'it.only',
  'it.skip',
  'fit',
  'test',
  'test.only',
  'test.skip',
  'ftest',
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
    testTitles: []
  };
}

function handlTestCaseTitles(context, titles, node, title) {
  if (isTestCase(node)) {
    if (titles.indexOf(title) !== -1) {
      context.report({
        node: node,
        message: 'Test title is used multiple times in the same test suite.'
      });
    }
    titles.push(title);
  }
}

function handlTestSuiteTitles(context, titles, node, title) {
  if (!isDescribe(node)) {
    return;
  }
  if (titles.indexOf(title) !== -1) {
    context.report({
      node: node,
      message: 'Test suite title is used multiple times.'
    });
  }
  titles.push(title);
}

function isFirstArgLiteral(node) {
  return node.arguments && node.arguments[0] && node.arguments[0].type === 'Literal';
}

module.exports = function(context) {
  var contexts = [
    newDescribeContext()
  ];
  return {
    CallExpression: function(node) {
      var currentLayer = contexts[contexts.length - 1];
      if (isDescribe(node)) {
        contexts.push(newDescribeContext());
      }
      if (!isFirstArgLiteral(node)) {
        return;
      }

      var title = node.arguments[0].value;
      handlTestCaseTitles(context, currentLayer.testTitles, node, title);
      handlTestSuiteTitles(context, currentLayer.describeTitles, node, title);
    },
    'CallExpression:exit': function(node) {
      if (isDescribe(node)) {
        contexts.pop();
      }
    }
  };
};
