/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"TimerMocks.js","id":"timer-mocks","title":"Timer mocks","layout":"docs","category":"Deep Dive","permalink":"timer-mocks.html","previous":"manual-mocks","next":"dependency-injection","href":"/jest/docs/timer-mocks.html"}}, `---

The native timer functions, i.e., \`setTimeout\`, \`setInterval\`, \`clearTimeout\`, \`clearInterval\` are not suitable for the test environment since they depend on real time to elapse. Fake timer functions are provided to make assertions about behaviors with respect to these timers.

\`\`\`javascript
// Assume module 'PlayerGames' called
//   setTimeout(callback, 1000);
require('PlayGames');
expect(setTimeout.mock.calls.length).toEqual(1);
expect(setTimeout.mock.calls[0][1]).toEqual(1000);
\`\`\`

Or if the time elapse is not really important, you just need to run the timer callbacks once:
\`\`\`javascript
// Every timer function callback will be executed once
jest.runTimersOnce();
\`\`\`

Or if you may have timers that may register other timers and don't want to manage the number of times to run or choose an arbitrary large length of time to run, you can run timers repeatedly:
\`\`\`javascript
// Every timer function callback will be executed in time order until there
// are no more.
jest.runTimersRepeatedly();
\`\`\`

To clear all timers:
\`\`\`javascript
jest.clearTimers();
\`\`\`
`);
  }
});
