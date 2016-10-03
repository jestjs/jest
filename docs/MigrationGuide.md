---
id: migration-guide
title: Migration Guide
layout: docs
category: Quick Start
permalink: docs/migration-guide.html
next: api
---

So you want to try out Jest instead of your existing test runner. Let us help you out.

- If you are using Jasmine (or the test runner that are using Jasmine), Jest should be mostly compatible and easy to migrate to.
- If you are using AVA or tape, you automatically migrate with Jest Codemods (see below).
- If you like Chai, you can upgrade to Jest and continue using Chai.


### Jest Codemods

If you are using [AVA](https://github.com/avajs/ava) or [Tape](https://github.com/substack/tape), you can use the [Jest Codemods](https://github.com/skovhus/jest-codemods) to do most of the dirty migration work. It runs a code transformation on your codebase using [jscodeshift](https://github.com/facebook/jscodeshift).

Install Jest Codemods with `npm` by running:

```
npm install -g jest-codemods
```

To get transform your existing tests, navigate to the project containing the tests and run:

```
jest-codemods
```

More information can be found at https://github.com/skovhus/jest-codemods.
