/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var colors = require('./colors');

function VerboseLogger(config, customProcess){
  this._process = customProcess || process;
  this._config = config || {};
}

VerboseLogger.prototype.verboseLog = function(testResults){
  var testTree = _createTestTree(testResults);
  this.traverseTestResults(testTree);
}


VerboseLogger.prototype.traverseTestResults = function(node, indentation){
  var indentationIncrement;
  if (typeof node === 'undefined' || node === null){ return; }

  indentationIncrement = '  ';
  indentation = indentation || '';
  if (Object.prototype.toString.call(node.testTitles) === '[object Array]'){
    this.printTestTitles(node.testTitles, indentation);
    this.traverseTestResults(node.childNodes, indentation);
  } else {
    for (var key in node){
      this.log(indentation + key);
      this.traverseTestResults(node[key], indentation + indentationIncrement);
    }
  }
}

VerboseLogger.prototype.printTestTitles = function(testTitles, indentation){
  var outputColor;

  for (var i = 0; i < testTitles.length; i++){
    outputColor = testTitles[i].failureMessages.length === 0
      ? colors.GREEN
      : colors.RED;
    this.log(this._formatMsg(indentation + testTitles[i].title, outputColor));
  }
}

VerboseLogger.prototype.log = function(str){
  this._process.stdout.write(str + '\n');
}

VerboseLogger.prototype._formatMsg = function(msg, color) {
  if (this._config.noHighlight) {
    return msg;
  }
  return colors.colorize(msg, color);
}

function _createTestNode(testResult, ancestorTitles, currentNode){
  currentNode = currentNode || { testTitles: [], childNodes: {} };
  if (ancestorTitles.length === 0) {
    currentNode.testTitles.push(testResult);
  } else {
    if(!currentNode.childNodes[ancestorTitles[0]]){
      currentNode.childNodes[ancestorTitles[0]] = {
        testTitles: [],
        childNodes: {}
      };
    }
    _createTestNode(
      testResult,
      ancestorTitles.slice(1,ancestorTitles.length),
      currentNode.childNodes[ancestorTitles[0]]
    );
  }

  return currentNode;
}

function _createTestTree(testResults){
  var tree;
  for (var i = 0; i < testResults.length; i++){
    tree = _createTestNode(testResults[i], testResults[i].ancestorTitles, tree);
  }

  return tree;
}

module.exports = VerboseLogger;
