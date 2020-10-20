/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const vm  = require('vm');
const path = require('path');
const fs = require('fs');
const filePath = path.resolve(__dirname, '../package/vmscript.js');

test('extract coverage', () => {
  const content = fs.readFileSync(filePath, {encoding: 'utf8'});
  const result1 = vm.runInNewContext(content,{inputObject: { number: 0 },console}, {filename: filePath});
  const result2 = vm.runInNewContext(content,{inputObject: { number: 7 },console}, {filename: filePath});
  expect(result1).toBe(false)
  expect(result2).toBe(true)
});
