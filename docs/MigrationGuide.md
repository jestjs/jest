---
id: migration-guide
title: Migrating to Jest
layout: docs
category: Guides
permalink: docs/migration-guide.html
next: troubleshooting
---

If you'd like to try out Jest with an existing codebase, there are a number of ways to convert to Jest:

* If you are using Jasmine, or a Jasmine like API (for example [Mocha](https://mochajs.org)), Jest should be mostly compatible and easy to migrate to.
* If you are using Mocha, AVA or Tape, you can automatically migrate with Jest Codemods (see below).
* If you like [chai](http://chaijs.com/), you can upgrade to Jest and continue using chai. However, we recommend trying out Jest's assertions and their failure messages. Jest Codemods can migrate from chai (see below).

### jest-codemods

If you are using [Mocha](https://mochajs.org), [AVA](https://github.com/avajs/ava), [chai](http://chaijs.com/) or [Tape](https://github.com/substack/tape), you can use the third-party [jest-codemods](https://github.com/skovhus/jest-codemods) to do most of the dirty migration work. It runs a code transformation on your codebase using [jscodeshift](https://github.com/facebook/jscodeshift).

Install Jest Codemods with `npm` by running:

```
npm install -g jest-codemods
```

To transform your existing tests, navigate to the project containing the tests and run:

```
jest-codemods
```

More information can be found at https://github.com/skovhus/jest-codemods.
