/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Inline concurrency limiter, replacing the `p-limit` package.

export type LimitFunction = <T>(fn: () => Promise<T>) => Promise<T>;

export default function pLimit(concurrency: number): LimitFunction {
  const queue: Array<() => void> = [];
  let active = 0;

  const next = (): void => {
    if (queue.length > 0 && active < concurrency) {
      active++;
      queue.shift()!();
    }
  };

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = (): void => {
        fn().then(
          (val: T) => {
            resolve(val);
            active--;
            next();
          },
          (error: unknown) => {
            reject(error);
            active--;
            next();
          },
        );
      };

      if (active < concurrency) {
        active++;
        run();
      } else {
        queue.push(run);
      }
    });
}
