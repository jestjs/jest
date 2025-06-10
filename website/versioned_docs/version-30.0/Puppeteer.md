---
id: puppeteer
title: Using with puppeteer
---

With the [Global Setup/Teardown](Configuration.md#globalsetup-string) and [Async Test Environment](Configuration.md#testenvironment-string) APIs, Jest can work smoothly with [puppeteer](https://github.com/GoogleChrome/puppeteer).

:::note

Generating code coverage for test files using Puppeteer is currently not possible if your test uses `page.$eval`, `page.$$eval` or `page.evaluate` as the passed function is executed outside of Jest's scope. Check out [issue #7962](https://github.com/jestjs/jest/issues/7962#issuecomment-495272339) on GitHub for a workaround.

:::

## Use jest-puppeteer Preset

[Jest Puppeteer](https://github.com/smooth-code/jest-puppeteer) provides all required configuration to run your tests using Puppeteer.

1.  First, install `jest-puppeteer`

```bash npm2yarn
npm install --save-dev jest-puppeteer
```

2.  Specify preset in your [Jest configuration](Configuration.md):

```json
{
  "preset": "jest-puppeteer"
}
```

3.  Write your test

```js
describe('Google', () => {
  beforeAll(async () => {
    await page.goto('https://google.com');
  });

  it('should be titled "Google"', async () => {
    await expect(page.title()).resolves.toMatch('Google');
  });
});
```

There's no need to load any dependencies. Puppeteer's `page` and `browser` classes will automatically be exposed

See [documentation](https://github.com/smooth-code/jest-puppeteer).

## Custom example without jest-puppeteer preset

You can also hook up puppeteer from scratch. The basic idea is to:

1.  launch & file the websocket endpoint of puppeteer with Global Setup
2.  connect to puppeteer from each Test Environment
3.  close puppeteer with Global Teardown

Here's an example of the GlobalSetup script

```js title="setup.js"
const {mkdir, writeFile} = require('fs').promises;
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');

module.exports = async function () {
  const browser = await puppeteer.launch();
  // store the browser instance so we can teardown it later
  // this global is only available in the teardown but not in TestEnvironments
  globalThis.__BROWSER_GLOBAL__ = browser;

  // use the file system to expose the wsEndpoint for TestEnvironments
  await mkdir(DIR, {recursive: true});
  await writeFile(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint());
};
```

Then we need a custom Test Environment for puppeteer

```js title="puppeteer_environment.js"
const {readFile} = require('fs').promises;
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');
const NodeEnvironment = require('jest-environment-node').TestEnvironment;

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');

class PuppeteerEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);
  }

  async setup() {
    await super.setup();
    // get the wsEndpoint
    const wsEndpoint = await readFile(path.join(DIR, 'wsEndpoint'), 'utf8');
    if (!wsEndpoint) {
      throw new Error('wsEndpoint not found');
    }

    // connect to puppeteer
    this.global.__BROWSER_GLOBAL__ = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
    });
  }

  async teardown() {
    if (this.global.__BROWSER_GLOBAL__) {
      this.global.__BROWSER_GLOBAL__.disconnect();
    }
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = PuppeteerEnvironment;
```

Finally, we can close the puppeteer instance and clean-up the file

```js title="teardown.js"
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');
module.exports = async function () {
  // close the browser instance
  await globalThis.__BROWSER_GLOBAL__.close();

  // clean-up the wsEndpoint file
  await fs.rm(DIR, {recursive: true, force: true});
};
```

With all the things set up, we can now write our tests like this:

```js title="test.js"
const timeout = 5000;

describe(
  '/ (Home Page)',
  () => {
    let page;
    beforeAll(async () => {
      page = await globalThis.__BROWSER_GLOBAL__.newPage();
      await page.goto('https://google.com');
    }, timeout);

    it('should load without error', async () => {
      const text = await page.evaluate(() => document.body.textContent);
      expect(text).toContain('google');
    });
  },
  timeout,
);
```

Finally, set `jest.config.js` to read from these files. (The `jest-puppeteer` preset does something like this under the hood.)

```js
module.exports = {
  globalSetup: './setup.js',
  globalTeardown: './teardown.js',
  testEnvironment: './puppeteer_environment.js',
};
```

Here's the code of [full working example](https://github.com/xfumihiro/jest-puppeteer-example).
