// @flow
'use strict';

const readFile = require('fs').readFile;
const babylon = require('babylon');

import type {Location} from './types';

class Expect {
  start: Location;
  end: Location;
  file: string;

  updateWithNode(node: any) {
    this.start = node.loc.start;
    this.end = node.loc.end;
  }
}

class ItBlock {
  name: string;
  file: string;
  start: Location;
  end: Location;

  updateWithNode(node: any) {
    this.start = node.loc.start;
    this.end = node.loc.end;
    this.name = node.expression.arguments[0].value;
  }
}

class TestFileParser {
  itBlocks: ItBlock[];
  expects: Expect[];

  run(file: string): Promise<any> {
    this.itBlocks = [];
    this.expects = [];

    return this.generateAST(file).then(data => {
      this.findItBlocksInBody(data['program'], file);
      return data;
    });
  }

  // When we want to show an inline assertion, the only bit of
  // data to work with is the line number from the stack trace.
  
  // So we need to be able to go from that to the real
  // expect data.
  expectAtLine(line: number): ?Expect {
    return this.expects.find(e => e.start.line === line);
  }

  // An `it`/`test` was found in the AST
  // So take the AST node and create an object for us
  // to store for later usage
  foundItNode(node: any, file: string) {
    const it = new ItBlock();
    it.updateWithNode(node);
    it.file = file;
    this.itBlocks.push(it);
  }

  // An `expect` was found in the AST
  // So take the AST node and create an object for us
  // to store for later usage 
  foundExpectNode(node: any, file: string) {
    const expect = new Expect();
    expect.updateWithNode(node);
    expect.file = file;
    this.expects.push(expect);
  }

  // When given a node in the AST, does this represent
  // the start of an it/test block?
  isAnIt(node: any) {
    return (
            node.type === 'ExpressionStatement' &&
            node.expression.type === 'CallExpression'
        ) 
        &&
        (
            node.expression.callee.name === 'it' ||
            node.expression.callee.name === 'test'
        ); 
  }
    
  // When given a node in the AST, does this represent
  // the start of an expect expression?
  isAnExpect(node: any) {
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
  }

    // We know that its/expects can go inside a describe, so recurse through
    // these when we see them. 
  isADescribe(node: any) {
    return node.type === 'ExpressionStatement' &&
        node.expression.type === 'CallExpression' &&
        node.expression.callee.name === 'describe';
  }

  // A recursive AST parser
  findItBlocksInBody(root: any, file: string) {
    // Look through the node's children
    for (const node in root.body) {
      if (root.body.hasOwnProperty(node)) {
        // Pull out the node
        const element = root.body[node];
        // if it's a describe dig deeper
        if (this.isADescribe(element)) {
          if (element.expression.arguments.length === 2) {
            const newBody = element.expression.arguments[1].body;
            this.findItBlocksInBody(newBody, file);
          }
        }
        // if it's an it/test dig deeper
        if (this.isAnIt(element)) {
          this.foundItNode(element, file);
          if (element.expression.arguments.length === 2) {
            const newBody = element.expression.arguments[1].body;
            this.findItBlocksInBody(newBody, file);
          }
        }
        // if it's an expect store it
        if (this.isAnExpect(element)) {
          this.foundExpectNode(element, file);
        }
      }
    }
  }

  generateAST(file: string): Promise<babylon.Node> {
    return new Promise((resolve, reject) => {
      readFile(file, 'utf8', (err, data) => {
        if (err) { 
          reject(err.message); 
          return;
        }

        try {
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
          const parsed = babylon.parse(data, {plugins, sourceType:'module'});
          resolve(parsed);
        } catch (error) {
          reject(error);   
        }
      });
    });
  }
}

module.exports = {
  Expect,
  ItBlock,
  TestFileParser,
};
