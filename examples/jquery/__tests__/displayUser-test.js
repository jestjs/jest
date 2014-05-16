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

    // Tell the fetchCurrentUser mock function to automatically invoke
    // its callback with some data
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
