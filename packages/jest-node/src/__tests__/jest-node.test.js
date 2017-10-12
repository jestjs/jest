// NOTE: Jest will write info about his tests into stderr (cannot be supressed)

const mocha = require('mocha');
const expect = require('expect');
const path = require('path');

const jestNode = require('jest-node').default;

// helper method for asserting response from jest
function assertResult(expected, actual) {
  expect(actual).not.toBeUndefined();
  expect(actual.numFailedTestSuites).toBe(expected.numFailedTestSuites);
  expect(actual.numFailedTests).toBe(expected.numFailedTests);
  expect(actual.numPassedTestSuites).toBe(expected.numPassedTestSuites);
  expect(actual.numPassedTests).toBe(expected.numPassedTests);
  expect(actual.numPendingTestSuites).toBe(expected.numPendingTestSuites);
  expect(actual.numPendingTests).toBe(expected.numPendingTests);
  expect(actual.numRuntimeErrorTestSuites).toBe(expected.numRuntimeErrorTestSuites);
  expect(actual.numTotalTestSuites).toBe(expected.numTotalTestSuites);
  expect(actual.numTotalTests).toBe(expected.numTotalTests);

  const testResults = Object.keys(expected.testResults);
  expect(actual.testResults.length).toBe(testResults.length);
  
  testResults.forEach(key => {
    const expectedResults = expected.testResults[key];
    
    const actualResults = actual.testResults.find(o => o.testFilePath === key);
    expect(actualResults).not.toBeUndefined();
    expect(actualResults.numFailingTests).toBe(expectedResults.numFailingTests);
    expect(actualResults.numPassingTests).toBe(expectedResults.numPassingTests);
    expect(actualResults.numPendingTests).toBe(expectedResults.numPendingTests);
    
    const tests = Object.keys(expectedResults.testResults);
    expect(actualResults.testResults.length).toBe(tests.length);
    
    tests.forEach(test => {
      const expectedTestResult = expectedResults.testResults[test];
      
      const actualTest = actualResults.testResults.find(o => o.fullName === test);
      expect(actualTest).not.toBeUndefined();
      expect(actualTest.status).toBe(expectedTestResult);
    });
  });
}

describe('jest-node', function() {
  it('should call all tests', function() {
    const options = {};
    const projects = [path.resolve(__dirname, 'testProject')];
    const expected = {
      "numFailedTestSuites": 2,
      "numFailedTests": 2,
      "numPassedTestSuites": 0,
      "numPassedTests": 2,
      "numPendingTestSuites": 0,
      "numPendingTests": 0,
      "numRuntimeErrorTestSuites": 0,
      "numTotalTestSuites": 2,
      "numTotalTests": 4,
      "testResults": {
        [path.resolve(__dirname, 'testProject/first.js')]: {
          "numFailingTests": 1,
          "numPassingTests": 1,
          "numPendingTests": 0,
          "testResults": {
            "first should succeed": "passed",
            "first should fail": "failed",
          }
        },
        [path.resolve(__dirname, 'testProject/second.js')]: {
          "numFailingTests": 1,
          "numPassingTests": 1,
          "numPendingTests": 0,
          "testResults": {
            "second should succeed": "passed",
            "second should fail": "failed",
          }
        },
      }
    };
  
    return jestNode(options, projects)
      .then(result => assertResult(expected, result.results));
  });
  
  it('should call only tests in first file', function() {
    const options = {
      testPathPattern: 'first',
    };
    const projects = [path.resolve(__dirname, 'testProject')];
    const expected = {
      "numFailedTestSuites": 1,
      "numFailedTests": 1,
      "numPassedTestSuites": 0,
      "numPassedTests": 1,
      "numPendingTestSuites": 0,
      "numPendingTests": 0,
      "numRuntimeErrorTestSuites": 0,
      "numTotalTestSuites": 1,
      "numTotalTests": 2,
      "testResults": {
        [path.resolve(__dirname, 'testProject/first.js')]: {
          "numFailingTests": 1,
          "numPassingTests": 1,
          "numPendingTests": 0,
          "testResults": {
            "first should succeed": "passed",
            "first should fail": "failed",
          }
        }
      }
    };
    
    return jestNode(options, projects)
      .then(result => assertResult(expected, result.results));
  });
  
  it('should call only first test in first file', function() {
    const options = {
      testPathPattern: 'first',
      testNamePattern: 'succeed',
    };
    const projects = [path.resolve(__dirname, 'testProject')];
    const expected = {
      "numFailedTestSuites": 0,
      "numFailedTests": 0,
      "numPassedTestSuites": 1,
      "numPassedTests": 1,
      "numPendingTestSuites": 0,
      "numPendingTests": 1,
      "numRuntimeErrorTestSuites": 0,
      "numTotalTestSuites": 1,
      "numTotalTests": 2,
      "testResults": {
        [path.resolve(__dirname, 'testProject/first.js')]: {
          "numFailingTests": 0,
          "numPassingTests": 1,
          "numPendingTests": 1,
          "testResults": {
            "first should succeed": "passed",
            "first should fail": "pending",
          }
        }
      }
    };
    
    return jestNode(options, projects)
      .then(result => assertResult(expected, result.results));
  });
});