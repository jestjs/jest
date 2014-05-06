jest.dontMock('../fetchCurrentUser.js');

describe('fetchCurrentUser', function() {
  it('creates a parsed user', function() {
    var $ = require('jquery');
    var fetchCurrentUser = require('../fetchCurrentUser.js');

    // Setup the mock callback that we want the tested function to call
    var fetchCallback = jest.genMockFunction();

    // Execute the tested function
    fetchCurrentUser(fetchCallback);

    // Make sure that $.ajax has been called with the correct arguments
    expect($.ajax).toBeCalledWith({
      type: 'GET',
      url: 'http://example.com/currentUser',
      done: jasmine.any(Function)
    });

    // Simulate the response from $.ajax
    $.ajax.mock.calls[0/*first call*/][0/*first argument*/].done({
      firstName: 'Tomas',
      lastName: 'Jakobsen'
    });

    // Make sure that our callback is called with the right value
    expect(fetchCallback).toBeCalledWith({
      loggedIn: true,
      fullName: 'Tomas Jakobsen'
    });
  });
});
