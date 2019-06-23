/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Profiler, Session} from 'inspector';

export type V8Coverage = ReadonlyArray<Profiler.ScriptCoverage>;

export class CoverageInstrumenter {
  private readonly session = new Session();

  async startInstrumenting() {
    this.session.connect();

    await new Promise((resolve, reject) => {
      this.session.post('Profiler.enable', err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      this.session.post(
        'Profiler.startPreciseCoverage',
        {callCount: true, detailed: true},
        err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }

  async stopInstrumenting(): Promise<V8Coverage> {
    const preciseCoverage = await new Promise<V8Coverage>((resolve, reject) => {
      this.session.post('Profiler.takePreciseCoverage', (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.result);
        }
      });
    });

    await new Promise((resolve, reject) => {
      this.session.post('Profiler.stopPreciseCoverage', err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      this.session.post('Profiler.disable', err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    return preciseCoverage;
  }
}
