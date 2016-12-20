---
id: babel
title: Babel Integration
layout: docs
category: Guides
permalink: docs/babel.html
next: webpack
---

> **Note**: This is a placeholder.

### Babel Integration

If you'd like to use [Babel](http://babeljs.io/), it can easily be enabled: `npm install --save-dev babel-jest babel-polyfill`.

Don't forget to add a [`.babelrc`](https://babeljs.io/docs/usage/babelrc/) file in your project's root folder. For example, if you are using ES2015 and [React.js](https://facebook.github.io/react/) with the [`babel-preset-es2015`](https://babeljs.io/docs/plugins/preset-es2015/) and [`babel-preset-react`](https://babeljs.io/docs/plugins/preset-react/) presets:

```js
{
  "presets": ["es2015", "react"]
}
```

You are now set up to use all ES2015 features and React specific syntax.

*Note: If you are using a more complicated Babel configuration, using Babel's `env` option,
keep in mind that Jest will automatically define `NODE_ENV` as `test`.
It will not use `development` section like Babel does by default when no `NODE_ENV` is set.*
