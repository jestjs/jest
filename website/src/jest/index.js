/**
 * @jsx React.DOM
 */

var React = require('React');
var Site = require('Site');
var Prism = require('Prism');
var Marked = require('Marked');
var unindent = require('unindent');

var index = React.createClass({
  render: function() {
    return (
      <Site>
        <div className="hero">
          <div className="wrap">
            <div className="text"><strong>Jest</strong></div>
            <div className="minitext">
              Painless JavaScript Unit Testing
            </div>
          </div>
        </div>

        <section className="content wrap">
          <p></p>
          <section className="light home-section">
            <div className="marketing-row">
              <div className="marketing-col">
                <h3>Familiar</h3>
                <p>
                  Built on top of Jasmine test framework, a familiar BDD testing environment.
                </p>
              </div>
              <div className="marketing-col">
                <h3>Mock by Default</h3>
                <p>
                  <Marked>
                    Automatically mocks CommonJS modules returned by `require()`, making most existing code testable.
                  </Marked>
                </p>
              </div>
              <div className="marketing-col">
                <h3>Fast</h3>
                <p>
                  Tests run in parallel, DOM APIs are mocked, and it{"'"}s easy to run a subset of your tests.
                </p>
              </div>
            </div>
          </section>
          <hr className="home-divider" />
          <section className="home-section home-getting-started">

            <h3>Getting Started</h3>
            <Marked>{/*generated_getting_started*/`
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
  it('adds 1 + 1 to equal 2', function() {
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
`/*generated_getting_started_end*/}</Marked>

          </section>
          <hr className="home-divider" />
          <section className="home-bottom-section">
            <div className="buttons-unit">
              <a href="docs/tutorial-asynchronous.html" className="button">Check out Jest</a>
            </div>
          </section>
          <p></p>
        </section>
      </Site>
    );
  }
});

module.exports = index;
