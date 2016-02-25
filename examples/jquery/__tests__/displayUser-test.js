'use strict';

jest
  .unmock('../displayUser.js')
  .unmock('jquery');

describe('displayUser', () => {
  it('displays a user after a click', () => {
    // Set up our document body
    document.body.innerHTML =
      '<div>' +
      '  <span id="username" />' +
      '  <button id="button" />' +
      '</div>';

    // This module has a side-effect
    require('../displayUser');

    const $ = require('jquery');
    const fetchCurrentUser = require('../fetchCurrentUser');

    // Tell the fetchCurrentUser mock function to automatically invoke
    // its callback with some data
    fetchCurrentUser.mockImplementation((cb) =>  {
      cb({
        loggedIn: true,
        fullName: 'Johnny Cash',
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
