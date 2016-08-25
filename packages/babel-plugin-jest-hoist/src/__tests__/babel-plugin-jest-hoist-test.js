const fs = require('fs');
const path = require('path');
const babel = require('babel-core');

const rootDir = path.resolve(__dirname);
const options = {plugins: [rootDir + '/../index']};

describe('babel-plugin-jest-hoist', () => {

  // Read all test dirs
  fs.readdirSync(rootDir).forEach(suiteName => {
    const filePath = rootDir + '/' + suiteName;

    if (fs.statSync(filePath).isDirectory()) {

      // Run test case with fixtures
      it(suiteName.replace(/-/g, ' '), () => {
        const expected = fs.readFileSync(filePath + '/expected.js').toString();
        const actual = fs.readFileSync(filePath + '/actual.js').toString();
        const code = babel.transform(actual, options).code;
        expect(code.trim()).toEqual(expected.trim());
      });
    }
  });
});
