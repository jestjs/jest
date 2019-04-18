<h1 align="center">
  <img src="https://jestjs.io/img/jest.png" height="150" width="150"/>
  <img src="https://jestjs.io/img/circus.png" height="150" width="150"/>
  <p align="center">jest-circus</p>
  <p align="center">The next-gen test runner for Jest</p>
</h1>

## Overview

Circus is a flux-based test runner for Jest that is fast, easy to maintain, and simple to extend.

## API

Circus exposes a public API for interacting with the flux store via imports from `jest-circus`. See the [type definitions](https://github.com/facebook/jest/blob/master/packages/jest-circus/src/types.ts) for more information on the events and state data currently available.

Mutating event or state data is currently unsupported and may cause unexpected behavior or break in a future release without warning.

New events, event data, and/or state data will not be considered a breaking change and may be added in any minor release.

### addEventHandler

`addEventHandler` can be used to listen for parts of the test lifecycle.

```js
import { addEventHandler } from 'jest-circus';

addEventHandler((event, state) => {
    if (event.name === '...') {
        ...
    }
});
```

### getState

`getState` returns the current state.

```js
import {getState} from 'jest-circus';

const state = getState();
```

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
