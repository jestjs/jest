---
id: snapshot-testing
title: Snapshot Testing
layout: docs
category: Guides
permalink: docs/snapshot-testing.html
next: tutorial-react
---

## What is snapshot testing?

Snapshot tests are a very useful tool whenever you want to make sure your UI does not change unexpectedly.

A typical snapshot test case for a mobile app renders a UI component, takes a screenshot, then compares it to a reference image stored alongside the test. The test will fail if the two images do not match: either the change is unexpected, or the screenshot needs to be updated to the new version of the UI component.

## Snapshot Testing with Jest

A similar approach can be taken when it comes to testing your React components. Instead of rendering the graphical UI, which would require building the entire app, you can use a test renderer to quickly generate a serializable value for your React tree. Consider this [example test](https://github.com/facebook/jest/blob/master/examples/snapshot/__tests__/Link.react-test.js) for a simple [Link component](https://github.com/facebook/jest/blob/master/examples/snapshot/Link.react.js):

```javascript
import renderer from 'react-test-renderer';
test('Link renders correctly', () => {
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

The snapshot artifact should be committed alongside code changes. Jest uses [pretty-format](https://github.com/thejameskyle/pretty-format) to make snapshots human-readable during code review. On subsequent test runs Jest will simply compare the rendered output with the previous snapshot. If they match, the test will pass. If they don't match, either the implementation has changed and the snapshot needs to be updated with `jest -u`, or the test runner found a bug in your code that should be fixed.

If we change the address the Link component in our example is pointing to, Jest will print this output:

![](/jest/img/blog/snapshot.png)

Now you know that you either need to accept the changes with `jest -u` (or `jest --updateSnapshot`), or fix the component if the changes were unintentional. To try out this functionality, please clone the [snapshot example](https://github.com/facebook/jest/tree/master/examples/snapshot), modify the `Link` component, and run Jest.

More information on how snapshot testing works and why we built it can be found on the [release blog post](https://facebook.github.io/jest/blog/2016/07/27/jest-14.html).

### React, React Native and Snapshot Testing

Check out the [React tutorial](/jest/docs/tutorial-react.html) and the [React Native tutorial](/jest/docs/tutorial-react-native.html) to get started with React or React Native codebases.
