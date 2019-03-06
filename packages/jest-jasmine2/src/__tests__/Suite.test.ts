/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import Suite, {Attributes} from '../jasmine/Suite';

describe('Suite', () => {
  let suite: Suite;

  beforeEach(() => {
    suite = new Suite({
      getTestPath: () => '',
    } as Attributes);
  });

  it("doesn't throw on addExpectationResult when there are no children", () => {
    expect(() => {
      // @ts-ignore
      suite.addExpectationResult();
    }).not.toThrow();
  });
});
