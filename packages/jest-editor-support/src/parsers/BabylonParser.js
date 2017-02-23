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
const {Expect, ItBlock} = require('./ParserNodes');

const path = require('path');
const fs = require('fs');

const BABELRC_FILENAME = '.babelrc';
const cache = Object.create(null);

// This is an exact copy of babel-jest's parser
const getBabelRC = (filename, {useCache}) => {
  const paths = [];
  let directory = filename;
  while (directory !== (directory = path.dirname(directory))) {
    if (useCache && cache[directory]) {
      break;
    }

    paths.push(directory);
    const configFilePath = path.join(directory, BABELRC_FILENAME);
    if (fs.existsSync(configFilePath)) {
      cache[directory] = fs.readFileSync(configFilePath, 'utf8');
      break;
    }
  }
  paths.forEach(directoryPath => {
    cache[directoryPath] = cache[directory];
  });

  return cache[directory] || '';
};

const babylonParser = (file: string) => {
  const itBlocks: ItBlock[] = [];
  const expects: Expect[] = [];

  const data = readFileSync(file).toString();
  const babelRC = getBabelRC(file, {useCache: true});
  const babel = JSON.parse(babelRC);

  const plugins = Array.isArray(babel.plugins)
    ? babel.plugins.concat(['flow'])
    : ['flow'];

  const config = {plugins, sourceType: 'module'};
  const ast = babylon.parse(data, config);

  // An `it`/`test` was found in the AST
  // So take the AST node and create an object for us
  // to store for later usage
  const foundItNode = (node: any, file: string) => {
    const block = new ItBlock();
    block.name = node.expression.arguments[0].value;
    block.start = node.loc.start;
    block.end =  node.loc.end;

    block.start.column += 1;

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

    expect.start.column += 1;
    expect.end.column += 1;

    expect.file = file;
    expects.push(expect);
  };

  const isFunctionCall = node => {
    return (
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'CallExpression'
    );
  };

  const isFunctionDeclaration = (nodeType: string) => {
    return (
      nodeType === 'ArrowFunctionExpression' ||
      nodeType === 'FunctionExpression'
    );
  };

  // Pull out the name of a CallExpression (describe/it)
  // handle cases where it's a member expression (.only)
  const getNameForNode = node => {
    if (!isFunctionCall(node)) {
      return false;
    }
    let {name} = node.expression.callee;
    if (!name && node.expression.callee.object) {
      name = node.expression.callee.object.name;
    }
    return name;
  };

  // When given a node in the AST, does this represent
  // the start of an it/test block?
  const isAnIt = node => {
    const name = getNameForNode(node);
    return (
      name === 'it' ||
      name === 'fit' ||
      name === 'test'
    );
  };

  // When given a node in the AST, does this represent
  // the start of an expect expression?
  const isAnExpect = node => {
    if (!isFunctionCall(node)) {
      return false;
    }
    let name: string;
    let element = node.expression.callee;
    while (!name) {
      name = element.name;
      // Because expect may have acccessors taked on (.to.be) or
      // nothing (expect()) we have to check mulitple levels for the name
      element = element.object || element.callee;
    }
    return name === 'expect';
  };

  // A recursive AST parser
  const searchNodes = (root: any, file: string) => {
    // Look through the node's children
    for (const node in root.body) {
      if (!root.body.hasOwnProperty(node)) {
        return;
      }

      // Pull out the node
      const element = root.body[node];

      if (isAnIt(element)) {
        foundItNode(element, file);
      } else if (isAnExpect(element)) {
        foundExpectNode(element, file);
      } else if (element.type === 'VariableDeclaration') {
        element.declarations
          .filter(declaration => (
            declaration.init && isFunctionDeclaration(declaration.init.type))
          )
          .forEach(declaration => searchNodes(declaration.init.body, file));
      } else if (
        element.type === 'ExpressionStatement' &&
        element.expression.type === 'AssignmentExpression' &&
        isFunctionDeclaration(element.expression.right.type)
      ) {
        searchNodes(element.expression.right.body, file);
      } else if (
        element.type === 'ReturnStatement' &&
        element.argument.arguments
      ) {
        element.argument.arguments
          .filter(argument => isFunctionDeclaration(argument.type))
          .forEach(argument => searchNodes(argument.body, file));
      }

      if (isFunctionCall(element)) {
        element.expression.arguments
          .filter(argument => isFunctionDeclaration(argument.type))
          .forEach(argument => searchNodes(argument.body, file));
      }
    }
  };

  searchNodes(ast['program'], file);

  return {
    expects,
    itBlocks,
  };
};

module.exports = {
  babylonParser,
};
