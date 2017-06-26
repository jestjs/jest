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
const childProcess = require('child_process');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');

const tmpdir = path.resolve(os.tmpdir(), 'jest-changed-files-git');
const tmpfile = path.resolve(tmpdir, Date.now() + '.js');
const tmpdirNested = path.resolve(tmpdir, 'src');
const tmpfileNested = path.resolve(tmpdirNested, Date.now() + '.js');
const options = {
  lastCommit: false,
};

describe('git', () => {
  let git;

  beforeEach(() => {
    git = require('../git');
    mkdirp.sync(tmpdirNested);
  });

  afterEach(() => rimraf.sync(tmpdir));

  describe('isGitRepository', () => {
    it('returns null for non git repo folder', () => {
      return git.isGitRepository(tmpdir).then(res => {
        expect(res).toBeNull();
      });
    });

    it('returns dirname for git repo folder', () => {
      childProcess.spawnSync('git', ['init', tmpdir]);

      return git.isGitRepository(tmpdir).then(res => {
        if (process.platform === 'win32') {
          // Git port on Win32 returns paths with "/" rather than "\"
          res = res.replace(/\//g, '\\');
        }
        expect(res).toContain(tmpdir);
      });
    });
  });

  describe('findChangedFiles', () => {
    beforeEach(() => {
      childProcess.spawnSync('git', ['init', tmpdir]);
    });

    it('returns an empty array for git repo folder without modified files', () => {
      return git.findChangedFiles(tmpdir, options).then(res => {
        expect(res).toEqual([]);
      });
    });

    it('returns an array of modified files for git repo folder', () => {
      fs.writeFileSync(tmpfile);
      fs.writeFileSync(tmpfileNested);

      return git.findChangedFiles(tmpdir, options).then(res => {
        expect(res).toEqual([tmpfile, tmpfileNested]);
      });
    });
  });
});
