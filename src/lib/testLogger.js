/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

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
