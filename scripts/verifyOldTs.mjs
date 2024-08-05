/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRequire} from 'module';
import * as path from 'path';
import {fileURLToPath} from 'url';
import execa from 'execa';
import fs from 'graceful-fs';
import pico from 'picocolors';
import stripJsonComments from 'strip-json-comments';
/* eslint-disable import/order */
import tempy from 'tempy';
const require = createRequire(import.meta.url);

const rootPackageJson = require('../package.json');

const tsconfigBasePackage = Object.keys(rootPackageJson.devDependencies).find(
  packageName => packageName.startsWith('@tsconfig'),
);
/* eslint-enable import/order */

const baseTsConfig = JSON.parse(
  stripJsonComments(
    fs.readFileSync(require.resolve('../tsconfig.json'), 'utf8'),
  ),
);

/* eslint-disable sort-keys */
const tsConfig = {
  extends: baseTsConfig.extends,
  compilerOptions: {
    esModuleInterop: false,
    module: 'commonjs',
    moduleResolution: 'node',
    noEmit: true,
  },
};
/* eslint-enable sort-keys */

const tsVersion = '5.0';

function smoketest() {
  const jestDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../packages/jest',
  );

  const cwd = tempy.directory();

  try {
    fs.writeFileSync(
      path.join(cwd, '.yarnrc.yml'),
      'nodeLinker: node-modules\n',
    );
    execa.sync('yarn', ['init', '--yes'], {cwd, stdio: 'inherit'});
    execa.sync(
      'yarn',
      ['add', `typescript@~${tsVersion}`, tsconfigBasePackage],
      {cwd, stdio: 'inherit'},
    );
    fs.writeFileSync(
      path.join(cwd, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2),
    );
    fs.writeFileSync(
      path.join(cwd, 'index.ts'),
      `import jest = require('${jestDirectory}');`,
    );
    execa.sync('yarn', ['tsc', '--project', '.'], {cwd, stdio: 'inherit'});

    console.log(
      pico.inverse(
        pico.green(` Successfully compiled Jest with TypeScript ${tsVersion} `),
      ),
    );
  } finally {
    fs.rmSync(cwd, {force: true, recursive: true});
  }
}

console.log(pico.inverse(` Running smoketest using TypeScript@${tsVersion} `));
smoketest();
console.log(pico.inverse(pico.green(' Successfully ran smoketest ')));
