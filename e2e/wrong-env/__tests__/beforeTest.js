/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 *
 */

/* eslint-env browser */

const div = document.createElement('div');

console.log(div);

test('stub', () => expect(1).toBe(1));
