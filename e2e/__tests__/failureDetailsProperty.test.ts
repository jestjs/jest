/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isJestCircusRun} from '@jest/test-utils';
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
  expect(stderr).toStrictEqual('');

  const output = JSON.parse(removeStackTraces(stdout));

  if (isJestCircusRun()) {
    expect(output).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "matcherResult": Object {
              "actual": true,
              "expected": false,
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
              "name": "toBe",
              "pass": false,
            },
          },
        ],
        Array [
          Object {
            "matcherResult": Object {
              "actual": "Object {
        \\"p1\\": \\"hello\\",
        \\"p2\\": \\"world\\",
      }",
              "expected": "Object {
        \\"p1\\": \\"hello\\",
        \\"p2\\": \\"sunshine\\",
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
            "message": "expect(received).rejects.toThrowError()

      Received promise resolved instead of rejected
      Resolved to value: 1",
          },
        ],
      ]
    `);
  } else {
    expect(output).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "actual": "",
            "error": Object {
              "matcherResult": Object {
                "actual": true,
                "expected": false,
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
                "actual": "Object {
        \\"p1\\": \\"hello\\",
        \\"p2\\": \\"world\\",
      }",
                "expected": "Object {
        \\"p1\\": \\"hello\\",
        \\"p2\\": \\"sunshine\\",
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

        Object {
          \\"p1\\": \\"hello\\",
      -   \\"p2\\": \\"sunshine\\",
      +   \\"p2\\": \\"world\\",
        }",
            "passed": false,
            "stack": "Error: expect(received).toMatchInlineSnapshot(snapshot)

      Snapshot name: \`my test a snapshot failure 1\`

      - Snapshot  - 1
      + Received  + 1

        Object {
          \\"p1\\": \\"hello\\",
      -   \\"p2\\": \\"sunshine\\",
      +   \\"p2\\": \\"world\\",
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
              "message": "expect(received).rejects.toThrowError()

      Received promise resolved instead of rejected
      Resolved to value: 1",
            },
            "expected": "",
            "matcherName": "",
            "message": "Error: expect(received).rejects.toThrowError()

      Received promise resolved instead of rejected
      Resolved to value: 1",
            "passed": false,
            "stack": "Error: expect(received).rejects.toThrowError()

      Received promise resolved instead of rejected
      Resolved to value: 1
          at <stacktrace>",
          },
        ],
      ]
    `);
  }
});
