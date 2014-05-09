/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"AutoMocks.js","id":"auto-mocks","title":"AutoMocks","layout":"docs","category":"Core Concepts","permalink":"auto-mocks.html","previous":"common-js-testing","next":"mock-functions","href":"/jest/docs/auto-mocks.html"}}, `
In order to write an effective unit test, you want to test only the module and isolate it from its dependencies. Jest makes this best practice extremely easy by creating a mocked version of all the dependencies by default.

Let's take a concrete example

\`\`\`javascript
// CurrentUser.js
var userID = 0;
module.export = {
  getID: function() {
    return userID;
  },
  setID: function(id) {
    userID = id;
  }
};
// login.js
var CurrentUser = require('./CurrentUser.js');
\`\`\`

If run \`login.js\` with node, Jest is not involved at all and it will run as you would expect. Now, if you run a unit test for the \`login.js\` file, Jest is going to modify require such that the code behaves in the following way

\`\`\`javascript
var CurrentUser = {
  getID: jest.getMockFunction(),
  setID: jest.setMockFunction()
};
\`\`\`

With this setup, you cannot accidentally rely on the implementation details of \`CurrentUser\` when testing \`login\` because all the calls are mocked. However, it makes testing a lot easier in practice because you don't have to setup mock objects for all the dependencies.

How does it work?
-----------------

Jest provides a different \`require\` function in the testing environment than in production. Jest \`require\` function loads the real module, make a mocked version of it and returns it.

In order automock the module, Jest is smart. It is going to give you an object of the same shape, but with every function being replaced by a mocked version.

\`\`\`javascript
// Single function
automock(function() { /* ... */ }) -> jest.genMockFunction();

// Object
automock({
  a: 1,
  b: function() { /* ... */ },
  c: {
    d: function() { /* ... */ }
  }
}) -> {
  b: jest.genMockFunction(),
  c: {
    d: jest.genMockFunction()
  }
}
\`\`\`

The automock is also aware of classes constructed using prototype.

\`\`\`javascript
// User.js
function User() {
  this.name = null;
}
User.prototype.setName = function(name) {
  this.name = name;
};

// createCouple.js
var User = require('./User.js');

function createCouple(nameA, nameB) {
  var userA = new User();
  userA.setName(nameA);

  var userB = new User();
  userB.setName(nameB);

  return [userA, userB];
}
module.export = createCouple;
\`\`\`

In this example, you can instantiate an automock using \`new\` and all the method will be mock functions as you would expect.

\`\`\`
// __tests__/createCouple-test.js
jest.dontMock('../createCouple.js');
var createCouple = require('../createCouple.js');

var couple = createCouple();
expect(couple[0].setName.mock.calls.length).toEqual(1);
expect(couple[1].setName.mock.calls.length).toEqual(1);
\`\`\`

An interesting detail is that while functions in the prototype are normally shared across all instances, mock functions are not.


Conclusion
----------

A good rule when designing a system is to provide an easy to use API for 90% of the use cases and leaving the ability to do something more specific in the last 10%. In this case, automocking solves the very boilerplate and rather uninteresting task of creating mocks for existing modules while allowing the developer to provide its own custom mocks in the \`__mocks__/\` folder or using \`.dontMock\` to use the real one.
`);
  }
});
