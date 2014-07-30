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

  it('calls the callback when $.ajax requests are finished', function() {
    var $ = require('jquery');
    var fetchCurrentUser = require('../fetchCurrentUser');

    // Create a mock function for our callback
    var callback = jest.genMockFunction();
    fetchCurrentUser(callback);

    // Now we emulate the process by which `$.ajax` would execute its own
    // callback
    $.ajax.mock.calls[0 /*first call*/][0 /*first argument*/].success({
      firstName: 'Bobby',
      lastName: '");DROP TABLE Users;--'
    });

    // And finally we assert that this emulated call by `$.ajax` incurred a
    // call back into the mock function we provided as a callback
    expect(callback.mock.calls[0/*first call*/][0/*first arg*/]).toEqual({
      loggedIn: true,
      fullName: 'Bobby ");DROP TABLE Users;--'
    });
  });
});
