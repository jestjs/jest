---
title: JavaScript Unit Testing Performance
author: Christoph Nakazawa
authorURL: http://twitter.com/cpojer
authorFBID: 100000023028168
---

Jest is running thousands of tests at Facebook at all times, either through continuous integration or invoked by engineers manually during development. This worked well for years even as the people working on Jest moved on to other projects within Facebook.

As engineers added more and more tests though, we noticed the performance of Jest wasn't going to scale. Additionally, in the last year the JavaScript ecosystem has changed dramatically with the introduction of things like npm3 and Babel, which we hadn't anticipated. We formed a new Jest team to address all of these issues and we'll be sharing our progress and plans on this blog from now on.

<!--truncate-->

Jest is a bit different from most test runners. We designed it to work well in the context of Facebook's infrastructure:

- **Monorepo** At Facebook we have a huge monorepo that contains all of our JavaScript code. There are many reasons why this approach is advantageous for us and there is an [awesome talk](https://www.youtube.com/watch?v=W71BTkUbdqE) by a Google engineer that highlights all the benefits and drawbacks of monorepos.
- **Sandboxing** Another feature of Jest that's important to Facebook is how it virtualizes the test environment and wraps `require` in order to sandbox code execution and isolate individual tests. We're even working on making Jest more modular so we can take advantage of this functionality in other non-testing related use cases.
- **providesModule** If you've looked at any of our open source JavaScript projects before, you may have noticed that we use a `@providesModule` header to assign globally unique IDs to modules. This does require some custom tooling, but it allows us to reference modules without relative paths which has helped us move incredibly fast, has scaled well as our engineering organization has grown, and has fostered code sharing across the entire company. Check out [RelayContainer](https://github.com/facebook/relay/blob/4eae620d86ed7fce1ee463c2fca88eb690d9cbde/src/container/RelayContainer.js#L9) for an example of how this works in practice. One downside to this approach, though, is that we're forced to read and parse our entire JavaScript codebase in order to resolve a single require statement. This would obviously be prohibitively expensive without extensive caching, especially for a short-lived process like Jest.

As a result of these unique constraints, Jest may never be able to be as fast as other test runners when running on our entire suite of tests. However, engineers rarely need to run Jest on our entire test suite. Powered by static analysis in the [node-haste](https://github.com/facebook/node-haste) project – we've been able to make the default mode for running Jest at Facebook `jest --onlyChanged`, or `jest -o`. In this mode we build a reverse dependency graph to find only the affected tests that need to be run based on the modules that have been changed.

## Optimal Scheduling of a Test Run

Most of the time our static analysis determines that more than one test needs to be run. The number of affected tests can be anywhere from a couple of tests to thousands. In order to speed this process up Jest parallelizes test runs across workers. This is great because most of Facebook's development happens on remote servers with many CPU cores.

Recently we noticed Jest often seemed stuck _“Waiting for 3 tests”_ for up to a minute toward the end of a run. It turned out we had a few really slow tests in our codebase that were dominating the test runtime. While we were able to speed these individual tests up significantly, we also made a change in how Jest schedules test runs. Previously we used to schedule test runs based on file system traversal, which was actually quite random. Here is an example of 11 tests in gray blocks over two workers. The size of the block is the runtime of the test:

![perf-basic-scheduling](/img/blog/Scheduling1.png)

We were randomly running a mix of fast and slow tests, and one of our slowest tests ended up running as almost all the other tests were completed, during which the second worker sat idle.

We made a change to schedule tests based on their file size which is usually a good proxy for how long a test is going to take. A test with a few thousand lines of code likely takes longer than a test with 15 lines of code. While this sped up the entire test run by about 10%, we ended up finding a better heuristic: now Jest stores the runtime of each test in a cache and on subsequent runs, it schedules the slowest tests to run first. Overall this helped improve the runtime of all tests by about 20%.

Here is an example of the same test run from before with better scheduling:

![perf-improved-scheduling](/img/blog/Scheduling2.png)

Because we are running slow tests first, Jest can sometimes seem to take a long time to start up – we only print results after the first test has completed. For the future we are planning to run previously failed tests first, because getting that info to developers as quickly as possible matters the most.

## Inline Requires and Lazy Mocking

If you have written tests using Jasmine before, they probably look like this:

```js
const sum = require('sum');
describe('sum', () => {
  it('works', () => {
    expect(sum(5, 4)).toEqual(9);
  });
});
```

One special thing we do in Jest is reset the entire module registry after every single test (call to `it`) to make sure tests don't depend on each other. Before Jest, individual tests would depend on each other and internal module state often leaked between them. As engineers removed, reordered or refactored tests, some of them started to fail, making it hard for people to understand what was going on.

Every single test in Jest receives a fresh new copy of all modules, including new versions of all mocked dependencies which take a lot of time to generate for each test. A side effect of this is that we had to call `require` manually before every test, like this:

```js
let sum;
describe('sum', () => {
  beforeEach(() => {
    sum = require('sum');
  });
  it('works', () => {
    expect(sum(5, 4)).toEqual(9);
  });
  it('works too', () => {
    // This copy of sum is not the same as in the previous call to `it`.
    expect(sum(2, 3)).toEqual(5);
  });
});
```

We built a babel transform called [inline-requires](https://github.com/facebook/fbjs/blob/master/packages/babel-preset-fbjs/plugins/inline-requires.js) that removes top-level require statements and inlines them in code. For example, the line `const sum = require('sum');` will be removed from code, but every use of `sum` in the file will be replaced by `require('sum')`. With this transform we can write tests just like you'd expect in Jasmine and the code gets transformed into this:

```js
describe('sum', () => {
  it('works', () => {
    expect(require('sum')(5, 4)).toEqual(9);
  });
});
```

A great side-effect of inline requires is that we only require the modules that we actually use within the test itself, instead of all the modules we used in the entire file.

Which leads to another optimization: lazy mocking. The idea is to only mock modules on demand, which combined with inline requires saves us from mocking a lot of modules and all their recursive dependencies.

We were able to update all tests using a [codemod](https://github.com/cpojer/js-codemod/blob/master/transforms/outline-require.js) in no time – it was a _simple_ 50,000 line code change. Inline requires and lazy mocking improved the test runtime by 50%.

The inline-require babel plugin is not only useful for Jest but for normal JavaScript as well. It was shipped by [Bhuwan](https://twitter.com/voideanvalue) to all users of [facebook.com](http://facebook.com/) just a week ago and significantly improved startup time.

For now, if you'd like to use this transform in Jest you'll have to add it manually to your Babel configuration. We are working on ways to make this easier to opt-in.

## Repo-Sync and Caching

The open source version of Jest used to be a fork of our internal version, and we'd sync Jest out only once every couple of months. This was a painful manual process that required fixing up many tests every time. We recently upgraded Jest and brought parity to all platforms (iOS, Android and web) and then enabled our sync process. Now, every change to Jest in open source is run against all of our internal tests, and there's only a single version of Jest that's consistent everywhere.

The first feature we got to take advantage of after unforking was the preprocessor cache. If you are using Babel together with Jest, Jest has to pre-process every JavaScript file before it can execute it. We built a caching layer so that each file, when unchanged, only has to be transformed a single time. After we unforked Jest, we were able to easily fix up the open source implementation and shipped it at Facebook. This resulted in another 50% performance win. Because the cache only works on the second-run, the cold start time of Jest was unaffected.

We also realized we were doing a lot of path operations when resolving relative requires. Because the module registry is reset for every test, there were thousands of calls that could be memoized. One big optimization was to add a lot more caching, not just around a single test, but also across test files. Previously, we would generate module metadata for the automocking feature once for every test file. The object a module exports never changes however, so we now share this code across test files. Unfortunately, because JavaScript and Node.js don't have shared memory, we have to do all of this work at least once per worker process.

## Question Everything

When trying to improve performance, it's important to also dive into the systems that sit above and below your system. In the case of Jest, things like Node.js and the test files themselves, for example. One of the first things we did was to update Node.js at Facebook from the years-old 0.10 to iojs and subsequently to Node 4. The new version of V8 helped improve performance and was quite easy to upgrade to.

We noticed that the `path` module in Node.js is slow when making thousands of path operations which was [fixed in Node 5.7](https://github.com/nodejs/node/pull/5123). Until we drop support for Node 4 internally at Facebook, we'll ship our own version of the [fastpath](https://github.com/facebook/node-haste/blob/master/src/fastpath.js) module.

We next started questioning the outdated [node-haste](https://github.com/facebook/node-haste). As mentioned before, the entire project has to be parsed for `@providesModule` headers to build a dependency graph. When this system was originally built, `node_modules` didn't exist and our file system crawler wasn't excluding them properly.

In previous versions, Jest would actually read every file in `node_modules` – which contributed to the slow startup time of Jest. When we picked up Jest again we replaced the entire project with a new implementation, based on react-native's packager. The startup time of Jest is now less than a second even on large projects. The react-native team, specifically [David](https://twitter.com/void_0), [Amjad](https://twitter.com/amasad) and [Martin](https://twitter.com/martinbigio) did an outstanding job on this project.

## Adding everything up

A lot of the above changes improved the test runtime by 10% or sometimes even 50%. We started at a runtime of about 10 minutes for all tests, and without these improvements we'd probably be at around 20 minutes by now. After these improvements, though, it now consistently takes around 1 minute and 35 seconds to run all our tests!

More importantly, adding new tests causes total runtime to grow very slowly. Engineers can write and run more tests without feeling the costs.

With Jest's recent 0.9 release and performance improvements from the [node-haste2 integration](https://github.com/facebook/jest/pull/599), the runtime of the [Relay](https://github.com/facebook/relay) framework's test suite went down from 60 seconds to about 25 and the [react-native](https://github.com/facebook/react-native) test suite now finishes in less than ten seconds on a 13” MacBook Pro.

We're very happy with the wins we've seen so far, and we're going to keep working on Jest and making it better. If you are curious about contributing to Jest, feel free get in touch on GitHub, [Discord](https://jestjs.io/support.html) or Facebook :)
