/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"Tutorial.js","id":"tutorial","title":"Tutorial","layout":"docs","category":"Quick Start","permalink":"tutorial.html","previous":"getting-started","next":"mock-functions","href":"/jest/docs/tutorial.html"}}, `---


We want to test the following function (borrowed from [this great article on testing asynchronous functions](http://martinfowler.com/articles/asyncJS.html)). It does an ajax request to get the current user as JSON, transforms this JSON into a new object and pass it to the callback. Very typical code.

\`\`\`javascript
// fetchCurrentUser.js
var $ = require('jquery');

function parseUserJson(userJson) {
  return {
    loggedIn: true,
    fullName: userJson.firstName + ' ' + userJson.lastName
  };
};

function fetchCurrentUser(callback) {
  return $.ajax({
    type: 'GET',
    url: 'http://example.com/currentUser',
    done: function(userJson) {
      callback(parseUserJson(userJson));
    }
  });
};

module.exports = fetchCurrentUser;
\`\`\`

In order to test the function we need to create a \`__tests__/\` folder where the file \`fetchCurrentUser.js\` is. In this folder, we create a file called \`fetchCurrentUser-test.js\` and put some boilerplate code in.

\`\`\`javascript
// __tests__/fetchCurrentUser-test.js
jest.dontMock('../fetchCurrentUser.js');

describe('fetchCurrentUser', function() {
  it('creates a parsed user', function() {
    var $ = require('jquery');
    var fetchCurrentUser = require('../fetchCurrentUser.js');
\`\`\`

The most important line is \`jest.dontMock('../fetchCurrentUser.js');\`. Jest by default automatically turns all the require calls into mocks, we want to make sure that we don't mock the file we are trying to test.

We want to make sure that the callback given to \`fetchCurrentUser\` is correctly executed. In order to do that, we're going to generate a mock function and make sure that it is called with the proper arguments.

\`\`\`javascript
    var fetchCallback = jest.genMockFunction();
    fetchCurrentUser(fetchCallback);

    // ... missing code ...

    expect(fetchCallback).toBeCalledWith({
      loggedIn: true,
      fullName: 'Jeff Morrison'
    });
  });
});
\`\`\`

In order to compute the result, \`fetchCurrentUser\` is calling to a dependency: \`$.ajax\`. To write a complete test, we first need to make sure that it is calling the dependency correctly.

\`\`\`javascript
    expect($.ajax).toBeCalledWith({
      type: 'GET',
      url: 'http://example.com/currentUser',
      done: jasmine.any(Function)
    });
\`\`\`

In order to generate the mock for \`$\`, it requires the real jQuery file, inspects the result and converts all the functions into mocked functions. This way, \`$.ajax\` is a mocked function that you can manipulate.

Now, we need to simulate a response for the ajax query.

\`\`\`javascript
    $.ajax.mock.calls[0/*first call*/][0/*first argument*/].done({
      firstName: 'Jeff',
      lastName: 'Morrison'
    });
\`\`\`

Mock functions have a \`.mock\` property that stores all the interactions with the function. In this case, we are reading from \`.calls\` which contains the arguments it was called with. We can traverse this list in order to find the callback and call it.

Now it is time to see if it worked

\`\`\`
> npm test
[PASS] jest/examples/__tests__/fetchCurrentUser-test.js (0.075s)
\`\`\`

And that's it, we just tested this asynchronous function. One thing to notice is that the code we've written is very synchronous. This is one of the strength of mock functions, the code you write to test synchronous or asynchronous functions looks exactly the same.


jQuery
------

Another class of functions that is usually considered hard to test is code that contains DOM manipulations. Let see how we can test this jQuery snippet that listens to a click event, fetches some data asynchronously and sets the content of a span.

\`\`\`javascript
// displayUser.js
var $ = require('jquery');
var fetchCurrentUser = require('./fetchCurrentUser.js');

$('#button').click(function() {
  fetchCurrentUser(function(user) {
    var loggedText = 'Logged ' + (user.loggedIn ? 'In' : 'Out');
    $('#username').text(user.fullName + ' - ' + loggedText);
  });
});
\`\`\`

Again, we start by creating a test file in the \`__tests__/\` folder and make sure that we don't mock the file we're about to test.

\`\`\`javascript
// __tests__/displayUser-test.js
jest
  .dontMock('../displayUser.js')
\`\`\`

This time, we don't want to test the interface between jQuery and the function but instead we want to let jQuery run as is and test the result directly in the DOM. In order to do that, we just need to tell Jest not to mock jQuery.

\`\`\`javascript
  .dontMock('jquery');
\`\`\`

The function we are testing is adding an event listener on the \`#button\` DOM element, so we need to setup our DOM correctly for the test. Jest ships with \`jsdom\` which simulates a DOM environment as if you were in the browser.

\`\`\`javascript
describe('displayUser', function() {
  it('displays a user after a click', function() {
    document.body.innerHTML =
      '<div>' +
      '  <span id="username" />' +
      '  <button id="button" />' +
      '</div>';
\`\`\`

We now require all the dependencies and make sure that they correctly interact with the function we want to test. jQuery is not mocked so we don't need to do anything. \`fetchCurrentUser\` needs to call the callback it is given to with some fake user. We use \`mockImplementation\` in order to do that.

\`\`\`javascript
    var displayUser = require('../displayUser.js');
    var $ = require('jquery');
    var fetchCurrentUser = require('../fetchCurrentUser.js');
    fetchCurrentUser.mockImplementation(function(cb) {
      cb({
        loggedIn: true,
        fullName: 'Jeff Morrison'
      });
    });
\`\`\`

Finally, we simulate a click and make sure that the dependency is called and that the DOM has been correctly updated.

\`\`\`javascript
    $('#button').click();
    expect(fetchCurrentUser).toBeCalled();
    expect($('#username').text()).toEqual('Jeff Morrison - Logged In');
  });
});
\`\`\`
`);
  }
});
