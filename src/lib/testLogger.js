/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var q = require('q');


function verboseLog(testResults, customProcess, config){
  var logSequence;

  logSequence = q();
  logSequence.then(function(){
    return 'something';
  })
  .then(function(text){
    console.log(text);
  });
}
function verboseLog(testResults){
  var tree = createTestTree(testResults)
  traverseTestResults(tree)
}

module.exports.verboseLog = verboseLog;


function createTestNode(testResult, ancestorTitles, currentNode){
  currentNode = currentNode || { testTitles: [], childNodes: {} };
  if (ancestorTitles.length === 0) {
    currentNode.testTitles.push(testResult);
  } else {
    if(!currentNode.childNodes[ancestorTitles[0]]){
      currentNode.childNodes[ancestorTitles[0]] = { testTitles: [], childNodes: {} };
    }
    createTestNode(
      testResult,
      ancestorTitles.slice(1,ancestorTitles.length),
      currentNode.childNodes[ancestorTitles[0]]
    );
  }

  return currentNode;
}

function createTestTree(testResults){
  var tree;
  for (var i = 0; i < testResults.length; i++){
    tree = createTestNode(testResults[i], testResults[i].ancestorTitles, tree);
  }

  return tree;
}

function traverseTestResults(node, indentation){
  var indentationIncrement;
  if (typeof node === 'undefined' || node === null){ return; }

  indentationIncrement = '  ';
  indentation = indentation || '';

  if (Object.prototype.toString.call(node.testTitles) === '[object Array]'){
    printTestTitles(node.testTitles, indentation);
    traverseTestResults(node.childNodes, indentation);
  } else {
    for (var key in node){
      log(indentation + key);
      traverseTestResults(node[key], indentation + indentationIncrement);
    }
  }
}

function printTestTitles(testTitles, indentation){
  var outputColor;

  for (var i = 0; i < testTitles.length; i++){
    outputColor = testTitles[i].failureMessages.length === 0
      ? colors.GREEN
      : colors.RED;
    log(_formatMsg(indentation + testTitles[i].title, outputColor));
  }
}

function log(str){
  _process.stdout.write(str + '\n');
}

function _formatMsg(msg, color) {
  if (_config.noHighlight) {
    return msg;
  }
  return colors.colorize(msg, color);
};

function verboseLog(testResults){
  var tree = createTestTree(testResults)
  traverseTestResults(tree)
}
