  // import * as assert from 'assert';
  // import { TestReconciler, TestReconcilationState } from '../src/lib/test_reconciler';
  // import * as fs from "fs";

  // const reconcilerWithFile = (file: string): TestReconciler => {
  //   const parser = new TestReconciler();
  //   const exampleJSON = fs.readFileSync(__dirname + "/../../test/fixtures/failing_jsons/" + file);
  //   const json = JSON.parse(exampleJSON.toString());
  //   parser.updateFileWithJestStatus(json);
  //   return parser;
  // };

  // suite("Test Reconciler", () => {
  //     let parser: TestReconciler;
  //     const dangerFilePath = "/Users/orta/dev/projects/danger/danger-js/source/ci_source/_tests/_travis.test.js";

  //     suite("for a simple project", () => {
  //       test("passes a passing method", () => {
  //         parser = reconcilerWithFile("failing_jest_json.json");
  //         const status = parser.stateForTestAssertion(dangerFilePath, "does not validate without josh");
  //         expect(status.status, TestReconcilationState.KnownSuccess);
  //         expect(status.line, null);
  //       });

  //       test("fails a failing method in the same file", () => {
  //         parser = reconcilerWithFile("failing_jest_json.json");
  //         const status = parser.stateForTestAssertion(dangerFilePath, "validates when all Travis environment vars are set and Josh K says so");
  //         expect(status.status, TestReconcilationState.KnownFail);
  //         expect(status.line, 12);
  //         expect(status.terseMessage, "Expected value to be falsy, instead received true");
  //         expect(status.shortMessage, `Error: expect(received).toBeFalsy()

  // Expected value to be falsy, instead received
  //   true`);
  //       });
  //     });

  //     suite("for a non-trivial failing json", () => {
  //     });

  // });
