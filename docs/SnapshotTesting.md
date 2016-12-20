---
id: snapshot-testing
title: Snapshot Testing
layout: docs
category: Guides
permalink: docs/getting-started.html
next: tutorial-jquery
---

> **Note**: This is a placeholder.

### React, React Native and Snapshot Testing

Check out the [React tutorial](/jest/docs/tutorial-react.html) and the [React Native tutorial](/jest/docs/tutorial-react-native.html) to get started with React or React Native codebases. You can use React's test renderer (`yarn add -D react-test-renderer`) to capture snapshots with Jest's snapshot feature and the `toMatchSnapshot` matcher:

```js
import renderer from 'react-test-renderer';
test('Link renders correctly', () => {
  const tree = renderer.create(
    <Link page="http://www.facebook.com">Facebook</Link>
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
```

and it will produce a snapshot like this:

```js
exports[`Link renders correctly 1`] = `
<a
  className="normal"
  href="http://www.facebook.com"
  onMouseEnter={[Function]}
  onMouseLeave={[Function]}>
  Facebook
</a>
`;
```

On subsequent test runs, Jest will compare the stored snapshot with the rendered output and highlight differences. If there are differences, Jest will ask you to fix your mistake and can be re-run with `-u` or `--updateSnapshot` to update an outdated snapshot.
