---
title: '🃏 Jest 19: Immersive Watch Mode & Test Platform Improvements'
author: Rogelio Guzman
authorURL: http://twitter.com/rogeliog
authorFBID: 511230566
---

Today we are pleased to ship version 19 of the Jest testing platform. It's the biggest Jest release we have shipped so far and we are quite excited to show you what we've built over the last two months:

## Immersive Watch Mode

We [completely rewrote the watch mode](https://github.com/jestjs/jest/pull/2362) to make it instant and more extensible. As a result, the experience of using it really is immersive: tests re-run instantly after a file change and we made it easy to select the right tests.

<!--truncate-->

## Snapshot Updates

We made a couple of changes to the snapshot format. We don't make changes like this often and only consider them if they actually improve how snapshots work. As well as introducing a snapshot version number we accumulated a number of changes we wanted to make to the format for a while:

- We dropped the “test” prefix in snapshot names from top level `test` or `it` calls.
- We improved the printing of React elements to cause less changes when the last prop in an element changes.
- We improved the character escaping mechanism to be more bulletproof.

Before:

```js
exports[`test snap 1`] = `
<header>
  <h1>
    Jest \"19\"
  </h1>
  <Subtitle
    name="Painless JavaScript Testing" />
</header>
`;
```

After (no “test” prefix, better JSX rendering, version header):

```js
// Jest Snapshot v1, https://goo.gl/fbAQLP

exports[`snap 1`] = `
<header>
  <h1>
    Jest "19"
  </h1>
  <Subtitle
    name="Painless JavaScript Testing"
  />
</header>
`;
```

We decided it's a good time to introduce versioned snapshots to ensure all developers are using a compatible version of Jest. Here's how we warn you about the need to update your snapshot:

![snapshot-version](/img/blog/19-snapshot-version.png)

Please make sure you revert any local changes before updating to make the transition smooth and to ensure you aren't including any unwanted changes from failing tests in your new snapshots.

## Improved printing of skipped tests

Skipped tests are now printed as a single line instead of showing every individual one when testing in verbose mode or a single suite. Hopefully it will let you focus on currently important tests. It also occupies far less space!

![skipped-tests](/img/blog/19-skipped-tests.png)

## New CLI arguments

Jest 19 ships with two new coverage-related arguments which you can run from CLI:

- `--collectCoverageFrom`
- `--coverageDirectory`

We now also error on invalid CLI arguments instead of ignoring them. But we've got your back with helpful error message like the one below, e.g. when you try running `jest --watc`:

![cli-error](/img/blog/19-cli-error.png)

## `expect` Improvements

- [`expect.addSnapshotSerializer`](/docs/expect#expectaddsnapshotserializerserializer)
- [`expect.stringContaining`](/docs/expect#expectstringcontainingstring)
- [`jest.spyOn`](/docs/jest-object#jestspyonobject-methodname)

We're close to almost full feature parity with the `expect` npm package. [Michael Jackson](https://twitter.com/mjackson), the author of the package, agreed to [donate](https://github.com/jestjs/jest/issues/1679) it to the Jest project, which means that `jest-matchers` will be renamed to `expect`. Since our version of `expect` is not intended to be fully compatible, [Christopher Chedeau](https://twitter.com/Vjeux) is working on a codemod to make the transition painless. Christopher also worked on a number of improvements to `jest-matchers` which enables it to be used outside of Jest and even [works inside browsers](https://github.com/jestjs/jest/pull/2795).

## [eslint-plugin-jest](https://github.com/jest-community/eslint-plugin-jest) – our very own ESLint plugin

Thanks to [Jonathan Kim](https://twitter.com/jonnykim) Jest finally has its own official ESLint plugin. It exposes three rules:

- [no-disabled-tests](https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-disabled-tests.md) - this rule prevents you from accidentally committing disabled tests.
- [no-focused-tests](https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-focused-tests.md) - this rule prevents you from committing focused tests which would disable all other tests in the same suite.
- [no-identical-title](https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/no-identical-title.md) - disallows identical titles in test names.

You can install it using `npm install --save-dev eslint-plugin-jest` or `yarn add --dev eslint eslint-plugin-jest` and it can be enabled by adding `{"plugins": ["jest"]}` to your eslint configuration.

## New public package: [jest-validate](https://github.com/jestjs/jest/tree/main/packages/jest-validate)

While we refactored the validation and normalization code for Jest's configuration, we were so happy with the new error messaging that we extracted it to its own module to share it with everyone. With Jest 19 we welcome `jest-validate` to our self-sustained packages family.

`jest-validate` is a generic configuration validation tool that helps you with warnings, errors and deprecation messages in your JavaScript tool. It's also capable of showing users friendly examples of correct configuration and it comes with a simple but powerful API. We hope it'll make a good addition to your projects!

![validate](/img/blog/19-validate.png)

We're happy to announce that `jest-validate` is validating config options of [prettier](https://github.com/jlongster/prettier) since [v0.12](https://github.com/jlongster/prettier/blob/main/CHANGELOG.md#0120). Feel free to add it to your project, try it, send us feedback and improve it by making pull requests on GitHub.

## Improved asymmetric matchers

We moved the asymmetric matchers implementation from Jasmine into Jest, which enabled us to further improve the user experience around them. As a result, asymmetric matchers are now pretty-printed nicely, we added the new [`expect.stringContaining()`](/docs/expect#expectstringcontainingstring) matcher and we also paired them with [`expect.toMatchObject()`](/docs/expect#tomatchobjectobject) so you can use the best of both:

![asymmetric-matchers](/img/blog/19-asymmetric-matchers.png)

## Better manual mocks

With the latest release, manual mocks now finally work with nested folders. For example `__mocks__/react-native/Libraries/Text/Text.js` will now work as expected and mock the correct module. We also fixed issues with virtual mocks and transitive dependencies and improved `moduleNameMapper` to not overwrite mocks when many patterns map to the same file.

## Breaking Changes

As a part of our cleanups and fixes we removed the `mocksPattern` configuration option which was never officially supported. We also renamed the `testPathDirs` configuration option to `roots` which better explains what the option can be used for. The default configuration for `roots` is `["<rootDir>"]` and can be customized to include any number of directories. The rootDir configuration option has always been used mostly as a token for other configuration options and this rename should make configuring Jest clearer.

## Revamped documentation

As you may have already seen, [Hector Ramos](https://twitter.com/hectorramos) and [Kevin Lacker](https://twitter.com/lacker) gave Jest's documentation a fresh new look. We changed the way we organize the website and it now features Docs and API as separate pages:

- Under [Docs](/docs/getting-started#content) you can find an introduction to Jest, including [Getting Started](/docs/getting-started#content) or [Testing Asynchronous Code](/docs/asynchronous#content) and handy guides like [Snapshot Testing](/docs/snapshot-testing#content), [Testing React Native App](/docs/tutorial-react-native#content), [Using with webpack](/docs/webpack#content) or [Migrating to Jest](/docs/migration-guide#content) and many more!
- The [API](/docs/api) section on the other hand lists all available methods exposed by Jest: the `expect` and `jest` objects, mock functions, globals, along with configuration options from _package.json_ and from the CLI.

The homepage was completely redesigned to be more descriptive of what Jest is about: “_Zero configuration testing platform_”. We also made sure it reads better on mobile devices. And for those using RSS – we finally provide a [feed for our blog](https://jestjs.io/blog/feed.xml).

## Community Updates

- We really loved this talk: “[Introduction to Jest](https://www.youtube.com/watch?v=tvy0bSgwtTo)“ by Vas Boroviak.
- Follow [@jestjs\_ on Twitter](http://twitter.com/jestjs_).
- The Jest Core team syncs once a week to discuss current and future issues. If you'd like to work on Jest, let us know, submit a few pull requests and join our weekly team meetings.
- The awesome engineers at Artsy wrote [about Jest as part of their 2017 frontend stack](http://artsy.github.io/blog/2017/02/05/Front-end-JavaScript-at-Artsy-2017/).
- Stephen Scott wrote a detailed article about [testing React components](https://medium.freecodecamp.com/the-right-way-to-test-react-components-548a4736ab22) in which he weighs the pros and cons of different approaches.
- [Using Jest with vue.js](https://medium.com/@kentaromiura_the_js_guy/jest-for-all-episode-1-vue-js-d616bccbe186#.r8ryxlw98) got a lot easier after reading Cristian Carlesso's blog post.
- [Michele Bertoli wrote a book about React Design Patterns and Best Practices](https://twitter.com/cpojer/status/825004258219130880) which features an entire section about Jest.
- Improved `--notify` command that shows an operating system notification which [can now also re-run tests from the notification](https://github.com/jestjs/jest/pull/2727). This is actually a Jest feature and we are just checking if you are still reading this blog post.
- Jest is now part of [react-boilerplate](https://twitter.com/mxstbr/status/820326656439177217).
- Read about the [hidden powers of Jest's matchers](https://medium.com/@boriscoder/the-hidden-power-of-jest-matchers-f3d86d8101b0#.pn10z1pzx).

Finally, we are happy to announce that the [ava](https://github.com/avajs/ava) test runner has adopted parts of the Jest platform and is now shipping with basic [snapshot support](https://github.com/avajs/ava#snapshot-testing) and is using [pretty-format](https://github.com/jestjs/jest/tree/main/packages/pretty-format). Consolidating test infrastructure makes it easier to learn how to test applications and enables us to share best practices. We are looking forward to see what we can learn from existing test libraries in the future.

The full [changelog can be found on GitHub](https://github.com/jestjs/jest/blob/main/CHANGELOG.md#jest-1900). Jest 19 was a true JavaScript community effort with [17 people who contributed](https://github.com/jestjs/jest/graphs/contributors?from=2016-12-23&to=2017-02-21&type=c) to this release. We thank each and every one of you for your help to make this project great.

_This blog post was written by [Rogelio Guzman](https://twitter.com/rogeliog) and [Michał Pierzchała](https://twitter.com/thymikee)._
