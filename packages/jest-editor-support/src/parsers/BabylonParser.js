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

const {readFileSync} = require('fs');
const babylon = require('babylon');
const {Expect, ItBlock} = require('../ScriptParser');

function babylonParser(file: string) {
  const itBlocks: ItBlock[] = [];
  const expects: Expect[] = [];

  const data = readFileSync(file).toString();
  const plugins: babylon.PluginName[] = [
    'jsx', 
    'flow', 
    'asyncFunctions', 
    'classConstructorCall', 
    'doExpressions',
    'trailingFunctionCommas', 
    'objectRestSpread', 
    'decorators', 
    'classProperties', 
    'exportExtensions',
    'exponentiationOperator', 
    'asyncGenerators', 
    'functionBind', 
    'functionSent',
  ];

  const ast = babylon.parse(data, {plugins, sourceType: 'module'});

  // An `it`/`test` was found in the AST
  // So take the AST node and create an object for us
  // to store for later usage
  const foundItNode = (node: any, file: string) => {
    const block = new ItBlock();
    block.name = node.expression.arguments[0].value;
    block.start = node.loc.start;
    block.end =  node.loc.end;
    
    // This makes it consistent with TypeScript's parser output
    block.start.line -= 1;
    block.end.line -= 1;
    block.end.column -= 1;

    block.file = file;
    itBlocks.push(block);
  };

  // An `expect` was found in the AST
  // So take the AST node and create an object for us
  // to store for later usage 
  const foundExpectNode = (node: any, file: string) => {
    const expect = new Expect();
    expect.start = node.loc.start;
    expect.end =  node.loc.end;
    expect.file = file;
    expects.push(expect);
  };

  // When given a node in the AST, does this represent
  // the start of an it/test block?
  const isAnIt = node => {
    return (
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'CallExpression'
    )
    &&
    (
      node.expression.callee.name === 'it' ||
      node.expression.callee.name === 'fit' ||
      node.expression.callee.name === 'test'
    );
  };

  // When given a node in the AST, does this represent
  // the start of an expect expression?
  const isAnExpect = node => {
    return (
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'CallExpression' &&
      node.expression.callee &&
      node.expression.callee.object &&
      node.expression.callee.object.callee
    )
    &&
    (
      node.expression.callee.object.callee.name === 'expect'
    );
  };

  // We know that its/expects can go inside a describe, so recurse through
  // these when we see them. 
  const isADescribe = node => {
    return (
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'CallExpression')
    && (
      node.expression.callee.name === 'describe' ||
      node.expression.callee.name === 'fdescribe'
    );      
  };

    // A recursive AST parser
  const findItBlocksInBody = (root: any, file: string) => {
    // Look through the node's children
    for (const node in root.body) {
      if (root.body.hasOwnProperty(node)) {
        
        // Pull out the node
        const element = root.body[node];

        // if it's a describe dig deeper
        if (isADescribe(element)) {
          if (element.expression.arguments.length === 2) {
            const newBody = element.expression.arguments[1].body;
            findItBlocksInBody(newBody, file);
          }
        }

        // if it's an it/test dig deeper
        if (isAnIt(element)) {
          foundItNode(element, file);
          if (element.expression.arguments.length === 2) {
            const newBody = element.expression.arguments[1].body;
            findItBlocksInBody(newBody, file);
          }
        }

        // if it's an expect store it
        if (isAnExpect(element)) {
          foundExpectNode(element, file);
        }
      }
    }
  };

  findItBlocksInBody(ast['program'], file);

  return {
    expects,
    itBlocks,
  };
}

module.exports = {
  babylonParser,
};
