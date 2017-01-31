---
id: snapshot-testing
title: Snapshot Testing
layout: docs
category: Guides
permalink: docs/snapshot-testing.html
next: tutorial-react
---

Snapshot tests are a very useful tool whenever you want to make sure your UI does not change unexpectedly.

A typical snapshot test case for a mobile app renders a UI component, takes a screenshot, then compares it to a reference image stored alongside the test. The test will fail if the two images do not match: either the change is unexpected, or the screenshot needs to be updated to the new version of the UI component.

## Snapshot Testing with Jest

A similar approach can be taken when it comes to testing your React components. Instead of rendering the graphical UI, which would require building the entire app, you can use a test renderer to quickly generate a serializable value for your React tree. Consider this [example test](https://github.com/facebook/jest/blob/master/examples/snapshot/__tests__/Link.react-test.js) for a simple [Link component](https://github.com/facebook/jest/blob/master/examples/snapshot/Link.react.js):

```javascript
import React from 'react';
import Link from '../Link.react';
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  const tree = renderer.create(
    <Link page="http://www.facebook.com">Facebook</Link>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
```

The first time this test is run, Jest creates a [snapshot file](https://github.com/facebook/jest/blob/master/examples/snapshot/__tests__/__snapshots__/Link.react-test.js.snap) that looks like this:

```json
exports[`Link renders correctly 1`] = `
<a
  className="normal"
  href="http://www.facebook.com"
  onMouseEnter={[Function bound _onMouseEnter]}
  onMouseLeave={[Function bound _onMouseLeave]}>
  Facebook
</a>
`;
```

The snapshot artifact should be committed alongside code changes. Jest uses [pretty-format](https://github.com/facebook/jest/tree/master/packages/pretty-format) to make snapshots human-readable during code review. On subsequent test runs Jest will simply compare the rendered output with the previous snapshot. If they match, the test will pass. If they don't match, either the test runner found a bug in your code that should be fixed, or the implementation has changed and the snapshot needs to be updated.

More information on how snapshot testing works and why we built it can be found on the [release blog post](https://facebook.github.io/jest/blog/2016/07/27/jest-14.html). We recommend reading [this blog post](http://benmccormick.org/2016/09/19/testing-with-jest-snapshots-first-impressions/) to get a good sense of when you should use snapshot testing. We also recommend watching this [this egghead video](https://egghead.io/lessons/javascript-use-jest-s-snapshot-testing-feature?pl=testing-javascript-with-jest-a36c4074) on Snapshot Testing with Jest.

### Updating Snapshots

It's straightforward to spot when a snapshot test fails after a bug has been introduced. When that happens, go ahead and fix the issue and make sure your snapshot tests are passing again. Now, let's talk about the case when a snapshot test is failing due to an intentional implementation change.

One such situation can arise if we intentionally change the address the Link component in our example is pointing to.

```javascript
// Updated test case with a Link to a different address
it('renders correctly', () => {
  const tree = renderer.create(
    <Link page="https://facebook.github.io/jest/">Jest</Link>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
```

In that case, Jest will print this output:

![](/jest/img/content/failedSnapshotTest.png)

Since we just updated our component to point to a different address, it's reasonable to expect changes in the snapshot for this component. Our snapshot test case is failing because the snapshot for our updated component no longer matches the snapshot artifact for this test case.

To resolve this, we will need to update our snapshot artifacts. You can run Jest with a flag that will tell it to re-generate snapshots:

```
jest --updateSnapshot
```

Go ahead and accept the changes by running the above command. You may also use the equivalent single-character `-u` flag to re-generate snapshots if you prefer. This will re-generate snapshot artifacts for all failing snapshot tests. If we had any additional failing snapshot tests due to an unintentional bug, we would need to fix the bug before re-generating snapshots to avoid recording snapshots of the buggy behavior.

If you'd like to limit which snapshot test cases get re-generated, you can pass an additional `--testNamePattern` flag to re-record snapshots only for those tests that match the pattern.

You can try out this functionality by cloning the [snapshot example](https://github.com/facebook/jest/tree/master/examples/snapshot), modifying the `Link` component, and running Jest.

### Tests Should Be Deterministic

Your tests should be deterministic. That is, running the same tests multiple times on a component that has not changed should produce the same results every time. You're responsible for making sure your generated snapshots do not include platform specific or other non-deterministic data.

For example, if you have a [Clock](https://github.com/facebook/jest/blob/master/examples/snapshot/Clock.react.js) component that uses `Date.now()`, the snapshot generated from this component will be different every time the test case is run. In this case we can [mock the Date.now() method](/jest/docs/mock-functions.html) to return a consistent value every time the test is run:

```
Date.now = jest.fn(() => 1482363367071);
```

Now, every time the snapshot test case runs, `Date.now()` will return `1482363367071` consistently. This will result in the same snapshot being generated for this component regardless of when the test is run.

## React, React Native and Snapshot Testing

As you've learned, snapshot testing was built to make it easier to write tests for React and React Native. Check out the [React tutorial](/jest/docs/tutorial-react.html) and the [React Native tutorial](/jest/docs/tutorial-react-native.html) to get started with snapshot testing on your React or React Native application.

## Additional Uses

Snapshots can capture any serializable value. Common examples are [snapshotting CLI output](https://github.com/facebook/jest/blob/master/integration_tests/__tests__/console-test.js
) or API responses.
