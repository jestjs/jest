/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"ManualMocks.js","id":"manual-mocks","title":"Manual mocks","layout":"docs","category":"Deep Dive","permalink":"manual-mocks.html","previous":"auto-mocks-and-manual-mocks","next":"timer-mocks","href":"/jest/docs/manual-mocks.html"}}, `---

Although autogeneration of mocks is convenient, there are behaviors it misses, such as fluent interfaces. Furthermore, providing useful helpers on mock versions of a module, especially a core module, promotes reuse and can help to hide implementation details.

Mocks are defined by writing a module in a \`__mocks__/\` subdirectory. The file name will be interpreted as the mocked module name. Although it's sometimes necessary to write a mock by hand to workaround missing DOM APIs, this should be avoided. If a module can't be mocked, the best fix is to implement the missing functionality in the test framework's DOM simulation.

Assuming that the module can be loaded by the automocker, it's best to build on the automocked API. This makes it harder for mock APIs to get out of sync with real ones. For instance, let's say we're working on an \`Indicator\` that uses a \`Poller\`.

\`\`\`javascript
var Poller = require('Poller');
var Indicator = function() {
  this.poller = new Poller().setInterval(2000);
}
\`\`\`

In the test for \`Indicator\`, instances will have undefined values for their \`poller\` member unless we carefully \`mockReturnThis\` for \`Poller.prototype.setInterval\`. Let's make it easier for people to use our module by enhancing the mock for \`Poller\`

\`\`\`javascript
var PollerMock = mockModules.generateMock('Poller');
PollerMock.prototype.setInterval.mockReturnThis();
module.exports = PollerMock;
\`\`\`

Finally, it's often helpful to include a method that's intended to be called from a test that simulates behavior of mocked class, like \`mockInform\` in an hypothetical \`EventBus\` class. By convention, these helper methods should be prefixed with the word "mock" to make them clearly distinguishable from public APIs.

Testing mocks
-------------

It's generally an anti-pattern to implement an elaborate, stateful mock for a module. Before going down this route, consider covering the original module completely with tests and then whitelisting it, so that requiring it always provides the actual implementation, rather than the mock current list of whitelisted modules.

In cases where this kind of mock is unavoidable, it's best to write a test that
ensures that the mock and the actual implementation are in sync. Luckily, this
is relatively easy to do with the API provided by \`jest-runtime\`, which allows you to explicitly require both the actual and mock implementations of the same module in a single test.
`);
  }
});
