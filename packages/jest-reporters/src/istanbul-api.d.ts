/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module 'istanbul-api' {
  class Reporter {
    constructor(config?: object, options?: object);
    add(format: string): void;
    addAll(formats: Array<string>): void;
    write(coverageMap: object, options: object): void;
    config: object;
    dir: string;
    reports: object;
    summarizer: string;
  }

  function createReporter(config?: object, options?: object): Reporter;
}
