<h1 align="center">
  <img src="https://jestjs.io/img/jest.png" height="150" width="150"/>
  <img src="https://jestjs.io/img/circus.png" height="150" width="150"/>
  <p align="center">jest-circus</p>
  <p align="center">The next-gen test runner for Jest</p>
</h1>

## Overview

Circus is a flux-based test runner for Jest that is fast, easy to maintain, and simple to extend.

Circus allows you to bind to events via an optional event handler on any [custom environment](https://jestjs.io/docs/en/configuration#testenvironment-string). See the [type definitions](https://github.com/facebook/jest/blob/master/packages/jest-circus/src/types.ts) for more information on the events and state data currently available.

```js
import {NodeEnvironment} from 'jest-environment-node';
import {Event, State} from 'jest-circus';

class MyCustomEnvironment extends NodeEnvironment {
  //...

  handleTestEvent(event: Event, state: State) {
    if (event.name === 'test_start') {
      // ...
    }
  }
}
```

Mutating event or state data is currently unsupported and may cause unexpected behavior or break in a future release without warning. New events, event data, and/or state data will not be considered a breaking change and may be added in any minor release.

## Installation

Install `jest-circus` using yarn:

```bash
yarn add --dev jest-circus
```

Or via npm:

```bash
npm install --save-dev jest-circus
```

## Configure

Configure Jest to use `jest-circus` via the [`testRunner`](https://jestjs.io/docs/en/configuration#testrunner-string) option:

```json
{
  "testRunner": "jest-circus/runner"
}
```

Or via CLI:

```bash
jest --testRunner='jest-circus/runner'
```
