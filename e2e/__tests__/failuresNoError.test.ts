/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 import * as path from 'path';
 import {wrap} from 'jest-snapshot-serializer-raw';
 import {extractSummary, runYarnInstall} from '../Utils';
 import runJest from '../runJest';
 
 const dir = path.resolve(__dirname, '../failures');
 
 function cleanStderr(stderr: string) {
   const {rest} = extractSummary(stderr);
   return rest
     .replace(/.*(jest-jasmine2|jest-circus).*\n/g, '')
     .replace(new RegExp('Failed: Object {', 'g'), 'thrown: Object {');
 }
 
 const nodeMajorVersion = Number(process.versions.node.split('.')[0]);
 
 beforeAll(() => {
   runYarnInstall(dir);
 });
 
 test('not throwing Error objects', () => {
   let stderr;
   stderr = runJest(dir, ['throwNumber.test.js']).stderr;
   expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
   stderr = runJest(dir, ['throwString.test.js']).stderr;
   expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
   stderr = runJest(dir, ['throwObject.test.js']).stderr;
   expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
   stderr = runJest(dir, ['assertionCount.test.js']).stderr;
   expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
   stderr = runJest(dir, ['duringTests.test.js']).stderr;
 
   if (nodeMajorVersion < 12) {
     const lineEntry = '(__tests__/duringTests.test.js:43:8)';
 
     expect(stderr).toContain(`at Object.<anonymous>.done ${lineEntry}`);
 
     stderr = stderr.replace(
       `at Object.<anonymous>.done ${lineEntry}`,
       `at Object.<anonymous> ${lineEntry}`,
     );
   }
 
   expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
   stderr = runJest(dir, ['throwObjectWithStackProp.test.js']).stderr;
   expect(wrap(cleanStderr(stderr))).toMatchSnapshot();
 });