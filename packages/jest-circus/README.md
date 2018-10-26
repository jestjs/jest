<h1 align="center">
  <img src="https://jestjs.io/img/jest.png" height="150" width="150"/>
  <img src="https://jestjs.io/img/circus.png" height="150" width="150"/>
  <p align="center">jest-circus</p>
  <p align="center">The next-gen test runner for Jest</p>
</h1>

## Overview

Circus is a flux-based test runner for Jest that is fast, easy to maintain, and simple to extend.

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
