require('jest-runtime')
  .dontMock('jquery')
  .dontMock('../displayUser.js');

describe('displayUser', function() {
  it('displays a user after a click', function() {
    document.body.innerHTML =
      '<div>' +
      '  <span id="username" />' +
      '  <button id="button" />' +
      '</div>';

    var $ = require('jquery');
    var displayUser = require('../displayUser.js');
    var fetchCurrentUser = require('../fetchCurrentUser.js');

    fetchCurrentUser.mockImplementation(function(cb) {
      cb({
        loggedIn: true,
        fullName: 'Jeff Morrison'
      });
    });

    $('#button').click();

    expect(fetchCurrentUser).toBeCalled();
    expect($('#username').text()).toEqual('Jeff Morrison - Logged In');
  });
});
