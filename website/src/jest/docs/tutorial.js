/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"Tutorial.js","id":"tutorial","title":"Tutorial","layout":"docs","category":"Quick Start","permalink":"tutorial.html","previous":"getting-started","next":"common-js-testing","href":"/jest/docs/tutorial.html"}}, `

To begin, let's see how we might test the following function (borrowed from [this great article on testing asynchronous functions](http://martinfowler.com/articles/asyncJS.html)). It does an ajax request to get the current user as JSON, transforms this JSON into a new object and pass it to the callback. Very typical code.

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

In order to write a test for this module, we need to create a \`__tests__/\`
directory where the file \`fetchCurrentUser.js\` is. In this folder, we create a
file called \`fetchCurrentUser-test.js\` and we write our test in it:

\`\`\`javascript
// __tests__/fetchCurrentUser-test.js
jest.dontMock('../fetchCurrentUser.js');

describe('fetchCurrentUser', function() {
  it('calls into $.ajax with the correct params', function() {
    var $ = require('jquery');
    var fetchCurrentUser = require('../fetchCurrentUser');

    // Call into the function we want to test
    function dummyCallback() {}
    fetchCurrentUser(dummyCallback);

    // Now make sure that $.ajax was properly called during the previous
    // 2 lines
    expect($.ajax).toBeCalledWith({
      type: 'GET',
      url: 'http://example.com/currentUser',
      done: jasmine.any(Function)
    });
  });
});
\`\`\`

The first line is very important: \`jest.dontMock('../fetchCurrentUser.js');\`.
By default, jest automatically makes all calls to \`require()\` return a mocked
version of the real module -- so we need to tell jest not to mock the file we 
want to test.

Moving along into our first test, we want to confirm that calling 
\`fetchCurrentUser()\` properly incurs a call into \`$.ajax()\` with the parameters
we expect. To do this, we just call \`fetchCurrentUser()\` with a dummy callback
function, and then simply inspect the \`$.ajax\` mock to verify that it was called
with the correct parameters.

Woohoo! We've written our first test. But we're not quite done: We would still
like to test that the callback we are passing in is indeed called back when the
\`$.ajax\` request has completed. For this we do the following:

\`\`\`javascript
  it('calls the callback when $.ajax requests are finished', function() {
    var $ = require('jquery');
    var fetchCurrentUser = require('../fetchCurrentUser');

    // Create a mock function for our callback
    var callback = jest.genMockFunction();
    fetchCurrentUser(callback);

    // Now we emulate the process by which \`$.ajax\` would execute its own
    // callback
    $.ajax.mock.calls[0 /*first call*/][0 /*first argument*/].done({
      firstName: 'Bobby',
      lastName: '");DROP TABLE Users;--'
    });

    // And finally we assert that this emulated call by \`$.ajax\` incurred a 
    // call back into the mock function we provided as a callback
    expect(callback.mock.calls[0/*first call*/][0/*first arg*/]).toEqual({
      loggedIn: true,
      fullName: 'Bobby ");DROP TABLE Users;--'
    });
  });
\`\`\`

In order for \`fetchCurrentUser\` to compute the result to be passed in to the 
callback, \`fetchCurrentUser\` will call in to one of it's dependencies: \`$.ajax\`.
Since jest has mocked this dependency for us, it's very easy to inspect all of
the interactions with \`$.ajax\` that occurred during our test.

At this point, you might be wondering how jest was able to decide what the mock
for the \`jQuery\` module should look like. The answer is plain and simple: jest
secretly requires the real module, inspects what it looks like, and then builds 
a mocked version of what it saw. This is how jest knew that there should be an
\`ajax\` property, and that that property should be a mock function.

In jest, all mock functions have a \`.mock\` property that stores all the 
interactions with the function. In the above case, we are reading from 
\`mock.calls\`, which is an array that contains information about each time the 
function was called, and what arguments each of those calls had. 

Now it is time to see if it worked:

\`\`\`
> npm test
[PASS] jest/examples/__tests__/fetchCurrentUser-test.js (0.075s)
\`\`\`

Woohoo! That's it, we just tested this asynchronous function. One thing to 
notice is that the code we've written is entirely synchronous. This is one of 
the strengths of using mock functions in this way: The code you write in tests 
is always straightfoward and imperative, no matter if the code under test is
synchronous or asynchronous.


jQuery
------

Another class of functions that is usually considered hard to test is code that
directly manipulates the DOM. Let's see how we can test the following snippet of
jQuery code that listens to a click event, fetches some data asynchronously and
sets the content of a span.

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

Again, we create a test file in the \`__tests__/\` folder:

\`\`\`javascript
// __tests__/displayUser-test.js
jest
  .dontMock('../displayUser.js')
  .dontMock('jquery');

describe('displayUser', function() {
  it('displays a user after a click', function() {
    // Set up our document body
    document.body.innerHTML =
      '<div>' +
      '  <span id="username" />' +
      '  <button id="button" />' +
      '</div>';

    var displayUser = require('../displayUser');
    var $ = require('jquery');
    var fetchCurrentUser = require('../fetchCurrentUser');

    // Tell the fetchCurrentUser mock function to automatically it's
    // callback with some data
    fetchCurrentUser.mockImplementation(function(cb) {
      cb({
        loggedIn: true,
        fullName: 'Johnny Cash'
      });
    });

    // Use jquery to emulate a click on our button
    $('#button').click();

    // Assert that the fetchCurrentUser function was called, and that the 
    // #username span's innter text was updated as we'd it expect.
    expect(fetchCurrentUser).toBeCalled();
    expect($('#username').text()).toEqual('Johnny Cash - Logged In');
  });
});
\`\`\`

The function under test adds an event listener on the \`#button\` DOM element, so 
we need to setup our DOM correctly for the test. jest ships with \`jsdom\` which 
simulates a DOM environment as if you were in the browser. This means that every
DOM API that we call can be observed in the same way it would be observed in a
browser!

Since we are interested in testing that \`displayUser.js\` makes specific changes
to the DOM, we tell jest not to mock our \`jquery\` dependency. This lets
\`displayUser.js\` actually mutate the DOM, and it gives us an easy means of
querying the DOM in our test.
`);
  }
});
