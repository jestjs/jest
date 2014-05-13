/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"id":"getting-started","title":"Getting Started","layout":"docs","category":"Quick Start","permalink":"docs/getting-started.html","next":"tutorial-asynchronous"}}, `
Getting started with Jest is pretty simple. If you want to test the following \`sum.js\` file,

\`\`\`javascript
// sum.js
function sum(value1, value2) {
  return value1 + value2;
}
module.exports = sum;
\`\`\`

1 - Create a directory \`__tests__/\` with a file \`sum-test.js\`

\`\`\`javascript
// __tests__/sum-test.js
jest.dontMock('../sum');

describe('sum', function() {
  it('adds 1 + 2 to equal 3', function() {
    var sum = require('../sum');
    expect(sum(1, 2)).toBe(3);
  });
});
\`\`\`

2 - Run \`npm install jest-cli --save-dev\`

3 - Add the following to your \`package.json\`

\`\`\`js
{
  ...
  "scripts": {
    "test": "jest"
  }
  ...
}
\`\`\`

4 - Run \`npm test\`

\`\`\`
[PASS] __tests__/sum-test.js (0.015s)
\`\`\`
`);
  }
});
