/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"AutoMocksAndManualMocks.js","id":"automatically-generated-mocks","title":"Automatically generated mocks","layout":"docs","category":"Deep Dive","permalink":"automatically-generated-mocks.html","previous":"mock-functions","next":"manual-mocks","href":"/jest/docs/automatically-generated-mocks.html"}}, `---

In order to isolate the code under test, required modules are mocked in unit tests. Mocks are generated automatically, unless an explicit mock is provided manually. For this reason, the first line in your unit test should be like:

\`\`\`javascript
jest.dontMock('MyModule');
\`\`\`

This tells the test dependency system to load the real implementation of \`MyModule\` when it is imported using \`require()\`

Automocks
---------

The \`jest\` built-in object provides convenient features for building mock module implementations. The main features of the library are mock functions and special handling to make it easier to work with function prototypes.

The test environment defines its own \`require\` function. As such, when you write
\`require('MyModule')\`, this function defers to jest's custom module loader on whether to return the actual implementation of \`MyModule\` or a mock for it. If the system decides to return a mock, it will first look for a file in a \`__mocks__/\` directory which defines the module. If no file is found, it will attempt to autogenerate a mock for the module.

Autogeneration is done as follows: the module is loaded in a new context. If the file can be evaluated, the mocking system recurses over the members of the module's \`exports\` and serializes it's type information. When a module that is being mocked requires another module, the system recursively generates a mock for it. If //that// file cannot be evaluated, an exception is thrown and the mock generation stack is printed.

The mock system has special handling for function prototypes. Given a module that looks like this:

\`\`\`javascript
function Poller(callback) {
  this.callback = callback;
}

Poller.prototype.setInterval = function(interval) {
  // set interval
};
\`\`\`

We don't want to have to write code to test it that looks like this:

\`\`\`javascript
// COUNTER EXAMPLE !!
var Poller = require('Poller');
var poller1 = new Poller();
var poller2 = new Poller();
poller1.setInterval(1);
poller2.setInterval(2);
// poller1 and poller2 share setInterval slot
expect(poller1.setInterval.mock.calls.length).toEqual(2);
\`\`\`

Instead, we want the different instances to each have their own version of \`setInterval\`, so they can be tested independently. The mocks system handles this by copying prototype methods to the instance. This may be incompatible with some class definition strategies, but in this regard the test framework encourages delegation over inheritance.


Manual mocks
------------

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

PollerMock.prototype.setInterval.mockReturnThis()

module.exports = PollerMock;
\`\`\`

Finally, it's often helpful to include a method that's intended to be called from a test that simulates behavior of mocked class, like \`mockInform\` in an hypothetical \`EventBus\` class. By convention, these helper methods should be prefixed with the word "mock" to make them clearly distinguishable from public APIs (See Fakes, special mocks).

Testing mocks
-------------

It's generally an anti-pattern to implement an elaborate, stateful mock for a module. Before going down this route, consider covering the original module completely with tests and then whitelisting it, so that requiring it always provides the actual implementation, rather than the mock current list of whitelisted modules.

In cases where this kind of mock is unavoidable, it's best to write a test that
ensures that the mock and the actual implementation are in sync. Luckily, this
is relatively easy to do with the API provided by the \`jest\` object, which allows you to explicitly require both the actual and mock implementations of the same module in a single test.
`);
  }
});
