jest
  .dontMock('jquery')
  .dontMock('../displayUser.js');

describe('displayUser', function() {
  it('displays a user after a click', function() {
    // Setup the DOM
    document.body.innerHTML =
      '<div>' +
      '  <span id="username" />' +
      '  <button id="button" />' +
      '</div>';

    // Include the function we are testing, which has side effects
    var displayUser = require('../displayUser.js');

    // Make sure that the dependency of displayUser is setup correctly
    var $ = require('jquery');
    var fetchCurrentUser = require('../fetchCurrentUser.js');
    fetchCurrentUser.mockImplementation(function(cb) {
      cb({
        loggedIn: true,
        fullName: 'Jeff Morrison'
      });
    });

    // Click click click
    $('#button').click();

    // Do all the assertions
    expect(fetchCurrentUser).toBeCalled();
    expect($('#username').text()).toEqual('Jeff Morrison - Logged In');
  });
});
