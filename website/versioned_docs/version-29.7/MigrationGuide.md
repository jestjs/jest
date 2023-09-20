---
id: migration-guide
title: Migrating to Jest
---

If you'd like to try out Jest with an existing codebase, there are a number of ways to convert to Jest:

- If you are using Jasmine, or a Jasmine like API (for example [Mocha](https://mochajs.org)), Jest should be mostly compatible, which makes it less complicated to migrate to.
- If you are using AVA, Expect.js (by Automattic), Jasmine, Mocha, proxyquire, Should.js or Tape you can automatically migrate with Jest Codemods (see below).
- If you like [chai](http://chaijs.com/), you can upgrade to Jest and continue using chai. However, we recommend trying out Jest's assertions and their failure messages. Jest Codemods can migrate from chai (see below).

## jest-codemods

If you are using [AVA](https://github.com/avajs/ava), [Chai](https://github.com/chaijs/chai), [Expect.js (by Automattic)](https://github.com/Automattic/expect.js), [Jasmine](https://github.com/jasmine/jasmine), [Mocha](https://github.com/mochajs/mocha), [proxyquire](https://github.com/thlorenz/proxyquire), [Should.js](https://github.com/shouldjs/should.js), [Tape](https://github.com/substack/tape), or [Sinon](https://sinonjs.org/) you can use the third-party [jest-codemods](https://github.com/skovhus/jest-codemods) to do most of the dirty migration work. It runs a code transformation on your codebase using [jscodeshift](https://github.com/facebook/jscodeshift).

To transform your existing tests, navigate to the project containing the tests and run:

```bash
npx jest-codemods
```

More information can be found at [https://github.com/skovhus/jest-codemods](https://github.com/skovhus/jest-codemods).
