---
title: 'Jest 20: 💖 Delightful Testing & 🏃🏽 Multi-Project-Runner'
author: Christoph Nakazawa
authorURL: http://twitter.com/cpojer
authorFBID: 100000023028168
---

A few months ago we announced [Jest 19](/blog/2017/02/21/jest-19-immersive-watch-mode-test-platform-improvements) which came with major new features and was the biggest Jest release until today. Jest 20 has twice the amount of changes compared to the previous version, features a complete rewrite of the test runner, adds new testing APIs. The new release enables a new level of customization and configuration for projects all while making it effortless to upgrade. Beyond Painless JavaScript Testing, we believe Jest is now delivering a **Delightful JavaScript Testing experience**. Let's take a look at the best new features and changes in depth:

## Multi-Project-Runner & Configuration Overhaul

Until now, Jest could only operate in one project at a time. This is often cumbersome if you are working on many smaller projects that each have their own setup and configuration. With Jest 20, we rewrote the test runner completely to run many projects at the same time within a single instance of Jest, for example if you are working on a React frontend and a node.js backend. Here is a video of Jest running tests for [React](https://github.com/facebook/react), [Relay](https://github.com/facebook/relay), [Yarn](https://github.com/yarnpkg/yarn) and Jest all at the same time:

![multi-runner](/img/blog/20-multi-runner.gif)

<!--truncate-->

Jest is now collapsing the usage guide after the first test run to save vertical space in the terminal.

Further, we completely overhauled how the configuration system works inside of Jest. You can now pass any configuration option through the CLI to overwrite the ones specified in your configuration file. Along with that, we changed Jest to look for a `jest.config.js` file by default which means you are now able to define a Jest configuration using JavaScript as well as being able to configure it through `package.json` like before. Through the addition of all these new features, you are now able to combine Jest in more powerful ways than ever before. For example, if you would like to find out which tests Jest would run given a set of changed files from a commit across multiple projects in a monorepo, you can combine cli arguments like this now:

```bash
$ jest --projects projectA projectB --listTests --findRelatedTests projectA/banana.js projectB/kiwi.js
[
  "projectA/banana.test.js",
  "projectB/kiwi.test.js",
  "projectB/pineapple.test.js",
]
```

This is especially useful for continuous integration (CI) systems where you may want to only run a subset of tests for Pull Requests to prevent Jest from running thousands of test files on every small change.

Finally, we are now properly mapping code coverage when using TypeScript and we are running code coverage for untested files in worker processes which yields significant speed ups for this feature.

## New & Improved Testing APIs

We made a number of additions and improvements to the testing APIs which will help write more effective tests. We'd like to point out that all of these improvements were made entirely by community members!

- **Better async testing:** Added new async/Promise support through resolves/rejects modifiers on expect: `expect(Promise(…)).resolves.toEqual(…)`. [See documentation](/docs/expect#resolves).
- **Expect `n` assertions:** Along with the existing `expect.assertions(n)`, the new `expect.hasAssertions()` can be used to ensure a test has at least one assertion.
- **Lint Plugin:** A `valid-expect` rule was added to `eslint-plugin-jest` to ensure that an assertion is called after invoking `expect`. This will prevent mistakes like a stray `expect(banana);` with a missing assertion call.
- **Pretty-Format Plugins:** A number of new pretty-format plugins were added to Jest. We now pretty-print [Immutable.js](https://github.com/facebook/immutable-js/) data structures and HtmlElements in assertion failures and snapshots.
- **Custom Environment:** It is now possible to add a `@jest-environment node|jsdom` annotation to the doc-block comment of a test file to use a test environment different from the default for individual tests.

Here is an example of all how all the new APIs together will make testing more delightful:

```js
/**
 * @jest-environment node
 */

test('compares apples and bananas', async () => {
  expect.hasAssertions(); // Ensure this test has at least one assertion.

  await expect(
    Promise.resolve(Immutable.Map({apples: 1, bananas: 2})),
  ).resolves.toEqual(Immutable.Map({apples: 1, bananas: 3}));

  expect('banana'); // valid-expect in eslint-plugin-jest will show an error.
});
```

This example will print a test failure similar to this:

![testing-apis](/img/blog/20-testing-apis.png)

## Breaking Changes

As with every major release, we are making a number of breaking changes to make larger changes in the future possible and to push the testing experience to a new level. This time, we tried our best to only break APIs that we don't expect to affect the majority of Jest's users:

- **Fork of Jasmine 2.5:** We finally decided to fork Jasmine itself and take ownership over Jest's own test runner. This will allow us to improve all aspects of the unit testing experience in the future but for now we are focused on incremental rewrites and reducing the API surface. If you see a test breaking as a result of a Jasmine API that is now missing, there should be an equivalent feature on the `jest` or `expect` objects. As such, we have removed many Jasmine features that aren't generally used in most codebases.
- **New Snapshots on CI:** Snapshots must always be committed along with the test and the modules they are testing. We changed Jest to not save new snapshots automatically in Continuous Integration (CI) environments or when the `--ci` flag is specified. To overwrite this behavior, which is generally not recommended, the `--updateSnapshot` flag can be used.
- **Babel-Polyfill:** Jest used to load `babel-polyfill` automatically when using babel-jest which resulted in memory leaks inside of Jest. In most versions of node, it is not necessary to load `babel-polyfill` so we removed this auto-inclusion and instead changed Jest to only include `regenerator-runtime` by default, which is commonly used to support async/await in older versions of Node.js. If you need `babel-polyfill`, you can manually require it in your setup files.

## Other Improvements

- **Documentation:** Documentation is critical to share best practices and teach everyone how to write effective tests which will lead to better software. Over the last few weeks we have also expanded Jest's documentation to include a Snapshot Testing FAQ, a guide with information about how to use Jest with common JavaScript libraries as well as we documented the new features mentioned above.
- **Translations:** We are now asking for your help to [translate the Jest documentation](https://crowdin.com/project/jest-v2) to make it easier for people to learn how to use Jest.
- **Custom Reporters:** Jest now supports custom test reporters through the `reporters` configuration option. You can finally customize the output of Jest as well as integrate it with other tools by generating reports in formats such as XML. [See documentation](/docs/configuration#reporters-array-modulename-modulename-options).
- **Codebase Health:** It was only possible iterate so quickly in Jest because we spent a significant amount of time on the health of the codebase. We were one of the early adopters of [prettier](https://github.com/prettier/prettier), we notably increased flow coverage, forked Jasmine to improve our test runner library and we rewrote and refactored significant portions of Jest itself to set up Jest for success in the future.
- **Bugfixes:** As always, we made plenty of bugfixes in Jest. The full changelog can be found in the [Jest repository](https://github.com/jestjs/jest/blob/main/CHANGELOG.md#jest-2000).

## Talks about Jest

Recently the Jest core team and other contributors started to talk more about Jest and the experience of working on Jest at conferences:

- Rogelio Guzman did a talk about [Jest Snapshots and Beyond](https://www.youtube.com/watch?time_continue=416&v=HAuXJVI_bUs) at React Conf.
- I spoke about [Building High-Quality JavaScript Tools](https://developers.facebook.com/videos/f8-2017/building-high-quality-javascript-tools/) at Facebook's F8 conference.

_As always, this release couldn't have been possible without you, the JavaScript community. We are incredibly grateful that we get the opportunity to work on improving JavaScript testing together. If you'd like to contribute to Jest, please don't hesitate to reach out to us on [GitHub](https://github.com/jestjs/jest) or on [Discord](https://discord.gg/j6FKKQQrW9)._
