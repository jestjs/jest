/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const childProcess = require('child_process');

const tmpdir = path.resolve(os.tmpdir(), 'jest-changed-files-hg');
const tmpfile = path.resolve(tmpdir, Date.now() + '.js');
const tmpdirNested = path.resolve(tmpdir, 'src');
const tmpfileNested = path.resolve(tmpdirNested, Date.now() + '.js');
const options = {
  lastCommit: false,
};

describe('hg', () => {
  let hg;

  beforeEach(() => {
    jest.resetModules();

    hg = require('../hg');
    mkdirp.sync(tmpdirNested);
  });

  afterEach(() => rimraf.sync(tmpdir));

  describe('isHGRepository', () => {

    it('returns null for non hg repo folder', () =>
      hg.isHGRepository(tmpdir).then(res => {
        expect(res).toBeNull();
      }),
    );

    it('returns dirname for hg repo folder', () => {
      childProcess.spawnSync('hg', ['init', tmpdir]);

      return hg.isHGRepository(tmpdir).then(res => {
        expect(res).toContain(tmpdir);
      });
    });
  });

  describe('findChangedFiles', () => {

    beforeEach(() => {
      childProcess.spawnSync('hg', ['init', tmpdir]);
    });

    it('returns an empty array for hg repo folder without modified files', () =>
      hg.findChangedFiles(tmpdir, options).then(res => {
        expect(res).toEqual([]);
      }),
    );

    it('returns an array of modified files for hg repo folder', () => {
      fs.writeFileSync(tmpfile);
      fs.writeFileSync(tmpfileNested);
      childProcess.spawnSync('hg', ['add'], {cwd: tmpdir});

      return hg.findChangedFiles(tmpdir, options).then(res => {
        expect(res).toEqual([tmpfile, tmpfileNested]);
      });
    });
  });
});
