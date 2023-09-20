/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isJestJasmineRun} from '@jest/test-utils';
import runJest from '../runJest';

const removeStackTraces = (stdout: string) =>
  stdout.replace(
    /at (new Promise \(<anonymous>\)|.+:\d+:\d+\)?)/g,
    'at <stacktrace>',
  );

test('that the failureDetails property is set', () => {
  const {stdout, stderr} = runJest('failureDetails-property', [
    'tests.test.js',
  ]);

  // safety check: if the reporter errors it'll show up here
  expect(stderr).toBe('');

  const output = JSON.parse(removeStackTraces(stdout));

  if (isJestJasmineRun()) {
    expect(output).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "actual": "",
            "error": Object {
              "matcherResult": Object {
                "actual": true,
                "expected": false,
                "message": "expect(received).toBe(expected) // Object.is equality

      Expected: false
      Received: true",
                "name": "toBe",
                "pass": false,
              },
            },
            "expected": "",
            "matcherName": "",
            "message": "Error: expect(received).toBe(expected) // Object.is equality

      Expected: false
      Received: true",
            "passed": false,
            "stack": "Error: expect(received).toBe(expected) // Object.is equality

      Expected: false
      Received: true
          at <stacktrace>",
          },
        ],
        Array [
          Object {
            "actual": "",
            "error": Object {
              "matcherResult": Object {
                "actual": true,
                "expected": false,
                "message": "expect(received).toBe(expected) // Object.is equality

      Expected: false
      Received: true",
                "name": "toBe",
                "pass": false,
              },
            },
            "expected": "",
            "matcherName": "",
            "message": "Error: expect(received).toBe(expected) // Object.is equality

      Expected: false
      Received: true",
            "passed": false,
            "stack": "Error: expect(received).toBe(expected) // Object.is equality

      Expected: false
      Received: true
          at <stacktrace>",
          },
        ],
        Array [
          Object {
            "actual": "",
            "error": Object {
              "matcherResult": Object {
                "actual": "{
        "p1": "hello",
        "p2": "world",
      }",
                "expected": "{
        "p1": "hello",
        "p2": "sunshine",
      }",
                "message": "expect(received).toMatchInlineSnapshot(snapshot)

      Snapshot name: \`my test a snapshot failure 1\`

      - Snapshot  - 1
      + Received  + 1

        {
          "p1": "hello",
      -   "p2": "sunshine",
      +   "p2": "world",
        }",
                "name": "toMatchInlineSnapshot",
                "pass": false,
              },
            },
            "expected": "",
            "matcherName": "",
            "message": "expect(received).toMatchInlineSnapshot(snapshot)

      Snapshot name: \`my test a snapshot failure 1\`

      - Snapshot  - 1
      + Received  + 1

        {
          "p1": "hello",
      -   "p2": "sunshine",
      +   "p2": "world",
        }",
            "passed": false,
            "stack": "Error: expect(received).toMatchInlineSnapshot(snapshot)

      Snapshot name: \`my test a snapshot failure 1\`

      - Snapshot  - 1
      + Received  + 1

        {
          "p1": "hello",
      -   "p2": "sunshine",
      +   "p2": "world",
        }
          at <stacktrace>",
          },
        ],
        Array [
          Object {
            "actual": "",
            "error": Object {},
            "expected": "",
            "matcherName": "",
            "message": "Error",
            "passed": false,
            "stack": "Error: 
          at <stacktrace>",
          },
        ],
        Array [
          Object {
            "actual": "",
            "error": Object {
              "message": "expect(received).rejects.toThrow()

      Received promise resolved instead of rejected
      Resolved to value: 1",
            },
            "expected": "",
            "matcherName": "",
            "message": "Error: expect(received).rejects.toThrow()

      Received promise resolved instead of rejected
      Resolved to value: 1",
            "passed": false,
            "stack": "Error: expect(received).rejects.toThrow()

      Received promise resolved instead of rejected
      Resolved to value: 1
          at <stacktrace>",
          },
        ],
      ]
    `);
  } else {
    expect(output).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "matcherResult": Object {
              "actual": true,
              "expected": false,
              "message": "expect(received).toBe(expected) // Object.is equality

      Expected: false
      Received: true",
              "name": "toBe",
              "pass": false,
            },
          },
        ],
        Array [
          Object {
            "matcherResult": Object {
              "actual": true,
              "expected": false,
              "message": "expect(received).toBe(expected) // Object.is equality

      Expected: false
      Received: true",
              "name": "toBe",
              "pass": false,
            },
          },
        ],
        Array [
          Object {
            "matcherResult": Object {
              "actual": "{
        "p1": "hello",
        "p2": "world",
      }",
              "expected": "{
        "p1": "hello",
        "p2": "sunshine",
      }",
              "message": "expect(received).toMatchInlineSnapshot(snapshot)

      Snapshot name: \`my test a snapshot failure 1\`

      - Snapshot  - 1
      + Received  + 1

        {
          "p1": "hello",
      -   "p2": "sunshine",
      +   "p2": "world",
        }",
              "name": "toMatchInlineSnapshot",
              "pass": false,
            },
          },
        ],
        Array [
          Object {},
        ],
        Array [
          Object {
            "message": "expect(received).rejects.toThrow()

      Received promise resolved instead of rejected
      Resolved to value: 1",
          },
        ],
      ]
    `);
  }
});
