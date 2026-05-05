/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

type State = 'loading' | 'inTest' | 'betweenTests' | 'tornDown';

export class TestState {
  private state: State = 'loading';
  private readonly logFormattedReferenceError: (message: string) => void;

  constructor(logFormattedReferenceError: (message: string) => void) {
    this.logFormattedReferenceError = logFormattedReferenceError;
  }

  isTornDown(): boolean {
    return this.state === 'tornDown';
  }

  isBetweenTests(): boolean {
    return this.state === 'betweenTests';
  }

  /**
   * Logs a post-teardown reference error and sets `process.exitCode = 1` if
   * the runtime has been torn down. Returns `true` if the caller should bail
   * out (i.e. it was torn down), `false` otherwise.
   */
  bailIfTornDown(message: string): boolean {
    if (this.state !== 'tornDown') return false;
    this.logFormattedReferenceError(message);
    process.exitCode = 1;
    return true;
  }

  /**
   * Like {@link bailIfTornDown}, but throws a `ReferenceError` with the same
   * `message` instead of returning a flag. Use at call sites that can't bail
   * with `return` (e.g. inside an `async` function whose return type does not
   * allow `void`/`null`).
   */
  throwIfTornDown(message: string): void {
    if (this.bailIfTornDown(message)) {
      throw new ReferenceError(message);
    }
  }

  throwIfBetweenTests(message: string): void {
    if (this.state === 'betweenTests') {
      throw new ReferenceError(message);
    }
  }

  enterTestCode(): void {
    this.state = 'inTest';
  }

  leaveTestCode(): void {
    this.state = 'betweenTests';
  }

  teardown(): void {
    this.state = 'tornDown';
  }
}
